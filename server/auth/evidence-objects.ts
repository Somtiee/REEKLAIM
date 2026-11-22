import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { AuthConfig } from './config.ts';

const envelopeLimit = 4_194_304 + 29;

export interface EvidenceObjects {
  put(key: string, ciphertext: Buffer): Promise<void>;
  get(key: string): Promise<Buffer>;
  remove(key: string): Promise<void>;
}

function objectKey(key: string) {
  if (!/^[a-f0-9]{64}$/.test(key)) throw new Error('Invalid evidence object identifier.');
  return key;
}

export function evidenceObjects(config: AuthConfig, fetcher: typeof fetch = fetch): EvidenceObjects {
  const remote = config.objectStorage;
  if (!remote) {
    const path = (key: string) => resolve(config.storageDirectory, objectKey(key));
    return {
      async put(key, ciphertext) {
        await mkdir(config.storageDirectory, { recursive: true, mode: 0o700 });
        await writeFile(path(key), ciphertext, { flag: 'wx', mode: 0o600 });
      },
      get: key => readFile(path(key)),
      remove: key => unlink(path(key)),
    };
  }
  const base = remote.origin + '/storage/v1/object';
  const headers = { apikey: remote.apiKey, ...(!remote.apiKey.startsWith('sb_secret_') && { Authorization: 'Bearer ' + remote.apiKey }) };
  const request = (path: string, init: RequestInit) => fetcher(base + path, {
    ...init, redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(12_000),
    headers: { ...headers, ...init.headers },
  });
  const path = (key: string) => '/' + remote.bucket + '/' + objectKey(key);
  return {
    async put(key, ciphertext) {
      const response = await request(path(key), {
        method: 'POST', body: new Uint8Array(ciphertext),
        headers: { 'Content-Type': 'application/octet-stream', 'x-upsert': 'false' },
      });
      await response.body?.cancel();
      if (!response.ok) throw new Error('Private object upload failed.');
    },
    async get(key) {
      const response = await request('/authenticated' + path(key), { method: 'GET' });
      if (!response.ok || !response.body) {
        await response.body?.cancel();
        throw new Error('Private object unavailable.');
      }
      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let length = 0;
      try {
        for (;;) {
          const next = await reader.read();
          if (next.done) break;
          length += next.value.length;
          if (length > envelopeLimit) {
            await reader.cancel();
            throw new Error('Private object exceeds the evidence size limit.');
          }
          chunks.push(next.value);
        }
      } finally {
        reader.releaseLock();
      }
      return Buffer.concat(chunks, length);
    },
    async remove(key) {
      const response = await request('/' + remote.bucket, {
        method: 'DELETE', body: JSON.stringify({ prefixes: [objectKey(key)] }),
        headers: { 'Content-Type': 'application/json' },
      });
      await response.body?.cancel();
      if (!response.ok) throw new Error('Private object cleanup failed.');
    },
  };
}
