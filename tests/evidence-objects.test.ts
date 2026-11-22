// @vitest-environment node
import { expect, test, vi } from 'vitest';
import { evidenceObjects } from '../server/auth/evidence-objects.ts';
import type { AuthConfig } from '../server/auth/config.ts';

const key = 'a'.repeat(64);
const config = {
  objectStorage: { origin: 'https://synthetic.supabase.co', bucket: 'evidence', apiKey: 'sb_secret_fixture_not_a_real_key' },
} as AuthConfig;

test('durable adapter stores opaque bytes, reads the private endpoint and uses scoped deletion', async () => {
  const ciphertext = Buffer.from('synthetic encrypted envelope');
  const fetcher = vi.fn<typeof fetch>()
    .mockResolvedValueOnce(new Response(null, { status: 201 }))
    .mockResolvedValueOnce(new Response(ciphertext))
    .mockResolvedValueOnce(new Response(null, { status: 200 }));
  const objects = evidenceObjects(config, fetcher);
  await objects.put(key, ciphertext);
  expect(await objects.get(key)).toEqual(ciphertext);
  await objects.remove(key);
  expect(fetcher.mock.calls.map(([url, init]) => [url, init?.method, init?.redirect])).toEqual([
    [config.objectStorage!.origin + '/storage/v1/object/evidence/' + key, 'POST', 'error'],
    [config.objectStorage!.origin + '/storage/v1/object/authenticated/evidence/' + key, 'GET', 'error'],
    [config.objectStorage!.origin + '/storage/v1/object/evidence', 'DELETE', 'error'],
  ]);
  expect(fetcher.mock.calls[0][1]?.headers).toMatchObject({ 'x-upsert': 'false' });
  expect(fetcher.mock.calls[2][1]?.body).toBe(JSON.stringify({ prefixes: [key] }));
});

test('invalid object keys and oversized upstream responses fail closed', async () => {
  const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(new Uint8Array(4_194_334)));
  const objects = evidenceObjects(config, fetcher);
  await expect(objects.get('invalid')).rejects.toThrow('Invalid evidence object identifier');
  expect(fetcher).not.toHaveBeenCalled();
  await expect(objects.get(key)).rejects.toThrow('evidence size limit');
});
