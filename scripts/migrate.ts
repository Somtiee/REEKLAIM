import pg from 'pg';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
export async function migrate(connectionString: string) {
 const client=new pg.Client({connectionString});await client.connect();
 try {await client.query("SELECT pg_advisory_lock(318719241)");await client.query('CREATE SCHEMA IF NOT EXISTS rk_meta; REVOKE ALL ON SCHEMA rk_meta FROM PUBLIC; CREATE TABLE IF NOT EXISTS rk_meta.migrations(name text PRIMARY KEY, sha256 text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())');
 for(const name of (await readdir('database/migrations')).filter(n=>n.endsWith('.sql')).sort()) {
  const sql=await readFile('database/migrations/'+name,'utf8');const hash=createHash('sha256').update(sql).digest('hex');const previous=await client.query('SELECT sha256 FROM rk_meta.migrations WHERE name=$1',[name]);
  if(previous.rowCount){if(previous.rows[0].sha256!==hash)throw new Error('Applied migration checksum changed: '+name);continue;}
  await client.query('BEGIN');try{await client.query(sql);await client.query('INSERT INTO rk_meta.migrations(name,sha256) VALUES($1,$2)',[name,hash]);await client.query('COMMIT');}catch(error){await client.query('ROLLBACK');throw error;}
 }
 }finally{await client.query('SELECT pg_advisory_unlock(318719241)').catch(()=>{});await client.end();}
}
