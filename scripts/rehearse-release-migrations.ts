import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import pg from 'pg';
import { Database } from '../server/auth/db.ts';
import { loadAuthConfig } from '../server/auth/config.ts';
import { migrate } from './migrate.ts';

const runtime = loadAuthConfig();
if (!runtime) throw new Error('Set up the dedicated local database first.');
const { adminUrl } = JSON.parse(await readFile('.local/admin.json', 'utf8')) as { adminUrl: string };
const admin = new URL(adminUrl);
const assertLocal = (url: URL) => {
  if (url.hostname !== '127.0.0.1' || url.port !== '55439' || url.pathname !== '/postgres' || url.searchParams.has('host')) {
    throw new Error('Migration rehearsal requires the dedicated loopback cluster.');
  }
};
assertLocal(admin);
const name = 'reeklaim_release_rehearsal_' + randomBytes(8).toString('hex');
const connectToRehearsal = (connection: string) => {
  const url = new URL(connection);
  assertLocal(url);
  url.pathname = '/' + name;
  return url.toString();
};
const owner = new pg.Client({ connectionString: admin.toString() });
const db = new Database({
  authDatabaseUrl: connectToRehearsal(runtime.authDatabaseUrl),
  databaseUrl: connectToRehearsal(runtime.databaseUrl),
});
await owner.connect();
try {
  await owner.query('CREATE DATABASE ' + name);
  try {
    const connectionString = connectToRehearsal(adminUrl);
    await migrate(connectionString);
    await migrate(connectionString);
    const client = new pg.Client({ connectionString });
    await client.connect();
    try {
      await db.checkRoles();
      const { rows: [counts] } = await client.query(`
        SELECT
          (SELECT count(*)::int FROM rk_meta.migrations) AS migrations,
          (SELECT count(*)::int FROM pg_tables WHERE schemaname='reeklaim') AS tables,
          (SELECT count(*)::int FROM pg_indexes WHERE schemaname='reeklaim') AS indexes,
          (SELECT count(*)::int FROM pg_constraint
            WHERE connamespace='reeklaim'::regnamespace AND contype='f') AS foreign_keys
      `);
      console.log(JSON.stringify({ ...counts, rerun: 'passed', runtimeRoleChecks: 'passed' }, null, 2));
    } finally {
      await client.end();
    }
  } finally {
    await db.close();
    await owner.query('DROP DATABASE ' + name);
  }
} finally {
  await owner.end();
}
