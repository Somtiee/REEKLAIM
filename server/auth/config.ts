import { readFileSync } from 'node:fs';
import { resolve, isAbsolute } from 'node:path';
import { z } from 'zod';
import { nativeAddress } from '../../src/lib/amounts.ts';
export const configSchema=z.object({treasuryAddress:z.string().optional(),origin:z.string().url(),authDatabaseUrl:z.string().min(1),databaseUrl:z.string().min(1),csrfSecret:z.string().regex(/^[a-f0-9]{64}$/),storageKey:z.string().regex(/^[a-f0-9]{64}$/),storageDirectory:z.string().min(1),objectStorage:z.object({origin:z.string().regex(/^https:\/\/[a-z0-9]+\.supabase\.co$/),bucket:z.string().regex(/^[a-z0-9][a-z0-9-]{0,62}$/),apiKey:z.string().min(20)}).strict().optional()}).strict();
export type AuthConfig=z.infer<typeof configSchema>;
export function validateConfig(input:unknown,production=process.env.NODE_ENV==='production'):AuthConfig {
 const value=configSchema.parse(input);if(value.treasuryAddress)nativeAddress(value.treasuryAddress);const url=new URL(value.origin);
 if(url.origin!==value.origin||url.username||url.password||(!['https:','http:'].includes(url.protocol)))throw new Error('APP_ORIGIN must be an exact origin.');
 if(url.protocol!=='https:'&&(production||!['127.0.0.1','localhost'].includes(url.hostname)))throw new Error('HTTPS is required outside local development.');
 if(!isAbsolute(value.storageDirectory)||[resolve('public'),resolve('dist'),resolve('src')].some(path=>resolve(value.storageDirectory).toLowerCase().startsWith(path.toLowerCase())))throw new Error('Storage must be absolute and outside web/source roots.');
 for(const connection of [value.databaseUrl,value.authDatabaseUrl]){
  let db: URL;
  try { db=new URL(connection); }
  catch { throw new Error('Invalid PostgreSQL connection URL.'); }
  if(!['postgres:','postgresql:'].includes(db.protocol)||!db.hostname||db.searchParams.has('host'))throw new Error('Use a PostgreSQL URL with a single host in the authority.');
  const tlsModes=db.searchParams.getAll('sslmode');
  if(tlsModes.length>1)throw new Error('Specify sslmode at most once.');
  if(production&&!['localhost','127.0.0.1'].includes(db.hostname)&&tlsModes[0]!=='verify-full')throw new Error('Remote PostgreSQL requires sslmode=verify-full and a trusted CA.');
 }
 if(value.storageKey===value.csrfSecret)throw new Error('Use independent storage and CSRF keys.');return value;
}
export function loadAuthConfig(env:NodeJS.ProcessEnv=process.env):AuthConfig|null {
 if(env.AUTH_DATABASE_URL||env.DATABASE_URL){
  const production=env.NODE_ENV==='production';
  const objectStorage=env.PRIVATE_OBJECT_ORIGIN||env.PRIVATE_OBJECT_BUCKET||env.PRIVATE_OBJECT_KEY?{origin:env.PRIVATE_OBJECT_ORIGIN,bucket:env.PRIVATE_OBJECT_BUCKET,apiKey:env.PRIVATE_OBJECT_KEY}:undefined;
  if(production&&env.NODE_TLS_REJECT_UNAUTHORIZED==='0')throw new Error('Certificate verification is required in production.');
  try{
   return validateConfig({treasuryAddress:env.REGISTRATION_TREASURY,origin:env.APP_ORIGIN,authDatabaseUrl:env.AUTH_DATABASE_URL,databaseUrl:env.DATABASE_URL,csrfSecret:env.AUTH_CSRF_SECRET,storageKey:env.PRIVATE_STORAGE_KEY,storageDirectory:env.PRIVATE_STORAGE_DIRECTORY,objectStorage},production);
  }catch{
   throw new Error('Invalid server authentication configuration. Check the configured origin, database URLs, storage directory and independent keys.');
  }
 }
 if(env.NODE_ENV==='production')return null;
 // Configuration parse errors can quote secret values, so do not propagate their cause.
 // eslint-disable-next-line preserve-caught-error
 try{const config=JSON.parse(readFileSync('.local/runtime.json','utf8'));return validateConfig({...config,treasuryAddress:env.REGISTRATION_TREASURY??config.treasuryAddress,origin:env.APP_ORIGIN??config.origin});}catch(error){if((error as NodeJS.ErrnoException).code==='ENOENT')return null;throw new Error('Invalid local authentication configuration.',{cause:new Error('Configuration details redacted.')});}
}
