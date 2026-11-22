import pg from 'pg';
import { TLSSocket } from 'node:tls';

export async function checkMigrationTarget(connectionString: string, env: NodeJS.ProcessEnv) {
 const target = new URL(connectionString);
 const { MIGRATION_EXPECTED_HOST: host, MIGRATION_EXPECTED_DATABASE: database, MIGRATION_EXPECTED_ROLE: role } = env;
 if (!host || !database || !role || !['postgres:', 'postgresql:'].includes(target.protocol) ||
   target.hostname !== host || decodeURIComponent(target.pathname.slice(1)) !== database ||
   target.searchParams.has('host') || target.searchParams.getAll('sslmode').join(',') !== 'verify-full' ||
   env.NODE_TLS_REJECT_UNAUTHORIZED === '0') {
  throw new Error('Production migration requires a matching approved host, database and role, with certificate verification.');
 }
 const client = new pg.Client({connectionString, connectionTimeoutMillis: 5000, query_timeout: 10000});
 try {
  await client.connect();
  const socket = client.connection.stream;
  if (!(socket instanceof TLSSocket) || !socket.authorized) {
   throw Object.assign(new Error('The migration client did not verify the endpoint certificate.'), { code: 'TLS_NOT_VERIFIED' });
  }
  const result = await client.query<{database:string;role:string}>(
   'SELECT current_database() AS database, current_user AS role',
  );
  const actual = result.rows[0];
  if (!actual || actual.database !== database || actual.role !== role ||
   ['reeklaim_auth','reeklaim_runtime'].includes(actual.role)) {
   throw Object.assign(new Error('Unexpected migration database identity or role.'), { code: 'TARGET_IDENTITY' });
  }
 } finally {
  await client.end();
 }
}
