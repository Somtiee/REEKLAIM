import { readdir, readFile } from 'node:fs/promises';
import { relative, resolve } from 'node:path';
import { loadAuthConfig } from '../server/auth/config.ts';

const root = resolve('dist');
const config = loadAuthConfig();
if (!config) throw new Error('Configure the isolated local runtime before scanning its release bundle.');

const secrets = [config.csrfSecret, config.storageKey];
for (const connection of [config.databaseUrl, config.authDatabaseUrl]) {
  const password = new URL(connection).password;
  if (password) secrets.push(password, decodeURIComponent(password));
}

const files = await readdir(root, { recursive: true, withFileTypes: true });
const scanned = [];
const failures = [];
for (const file of files) {
  if (!file.isFile() || !/\.(?:js|mjs|html|css|json|map)$/.test(file.name)) continue;
  const path = resolve(file.parentPath, file.name);
  const name = relative(root, path);
  const source = await readFile(path, 'utf8');
  scanned.push(name);
  if (secrets.some(secret => source.includes(secret))) failures.push({ file: name, check: 'local runtime secret' });
  if (/__qorexMock|@qorechain\/qorex-wallet-mock|-----BEGIN (?:[A-Z]+ )?PRIVATE KEY-----/.test(source)) {
    failures.push({ file: name, check: 'wallet fixture or private key marker' });
  }
}
if (!scanned.includes('index.html') || !scanned.some(file => file.endsWith('.js'))) {
  throw new Error('Build the application before scanning the release bundle.');
}
console.log(JSON.stringify({ scannedFiles: scanned.length, failures }, null, 2));
if (failures.length) process.exitCode = 1;
