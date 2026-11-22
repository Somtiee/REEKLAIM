import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile, access, unlink } from 'node:fs/promises';
import { resolve, resolve as resolvePath } from 'node:path';
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { randomBytes } from 'node:crypto';
import pg from 'pg';
import { migrate } from './migrate.ts';
const run=promisify(execFile);const control=(args:string[])=>new Promise<void>((resolve,reject)=>{const child=spawn(resolvePath(binary,'pg_ctl.exe'),args,{windowsHide:true,stdio:'ignore'});child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(new Error('PostgreSQL control failed')));});const local=resolve('.local');await mkdir(local,{recursive:true});
const binary=process.env.POSTGRES_BIN??(existsSync('.local/postgres-18.7-tools/pgsql/bin/postgres.exe')?resolve('.local/postgres-18.7-tools/pgsql/bin'):'C:/Program Files/PostgreSQL/18/bin');const data=resolve('.local/postgres');const port=55439;
let config:{adminUrl:string;authPassword:string;runtimePassword:string};
try{config=JSON.parse(await readFile(resolve(local,'admin.json'),'utf8'));}catch{const password=randomBytes(32).toString('hex');config={adminUrl:`postgresql://rk_migrator:${password}@127.0.0.1:${port}/postgres`,authPassword:randomBytes(32).toString('hex'),runtimePassword:randomBytes(32).toString('hex')};await writeFile(resolve(local,'admin.json'),JSON.stringify(config),{mode:0o600,flag:'wx'});}
try{await access(resolve(data,'PG_VERSION'));}catch{
 const passwordFile=resolve(local,'init-password');await writeFile(passwordFile,new URL(config.adminUrl).password,{mode:0o600});
 try{await run(resolve(binary,'initdb.exe'),['-D',data,'-U','rk_migrator','--auth=scram-sha-256','--encoding=UTF8','--locale=C','--pwfile='+passwordFile],{windowsHide:true});}finally{await unlink(passwordFile).catch(()=>{});}
}
try{await control(['status','-D',data]);}catch{await control(['start','-D',data,'-l',resolve(local,'postgres.log'),'-o',`-h 127.0.0.1 -p ${port}`,'-w']);}
await migrate(config.adminUrl);const client=new pg.Client({connectionString:config.adminUrl});await client.connect();
try{for(const [role,password] of [['reeklaim_auth',config.authPassword],['reeklaim_runtime',config.runtimePassword]]){if(!/^[a-f0-9]{64}$/.test(password))throw new Error('Invalid local password');await client.query(`ALTER ROLE ${role} LOGIN PASSWORD '${password}'`);}}finally{await client.end();}
try{await access(resolve(local,'runtime.json'));}catch{await writeFile(resolve(local,'runtime.json'),JSON.stringify({origin:'http://127.0.0.1:5173',authDatabaseUrl:config.adminUrl.replace(/rk_migrator:[^@]+@/,`reeklaim_auth:${config.authPassword}@`),databaseUrl:config.adminUrl.replace(/rk_migrator:[^@]+@/,`reeklaim_runtime:${config.runtimePassword}@`),csrfSecret:randomBytes(32).toString('hex'),storageKey:randomBytes(32).toString('hex'),storageDirectory:resolve(local,'private-evidence')},null,2),{mode:0o600,flag:'wx'});}
console.log('Dedicated PostgreSQL is ready on loopback port '+port+'. Secrets stay in ignored .local files. No existing cluster was changed.');
