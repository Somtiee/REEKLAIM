import { readFile } from 'node:fs/promises';
import { migrate } from './migrate.ts';
import { checkMigrationTarget } from './check-migration-target.ts';
let url=process.env.MIGRATION_DATABASE_URL;if(!url&&process.env.NODE_ENV!=='production')url=JSON.parse(await readFile('.local/admin.json','utf8')).adminUrl;
if(!url)throw new Error('Set server-only MIGRATION_DATABASE_URL in the migration shell, never in VITE_ variables.');
const checkOnly=process.argv.includes('--check');
if(process.env.MIGRATION_DATABASE_URL||process.env.NODE_ENV==='production'||checkOnly){
 try{await checkMigrationTarget(url,process.env);}
 catch(error){
  const code=(error as NodeJS.ErrnoException).code;
  const diagnostic=code&&/^[A-Z0-9_]{1,50}$/.test(code)?' ('+code+')':'';
  console.error('Migration target verification failed'+diagnostic+'. No migrations ran.');
  process.exit(1);
 }
 console.log('Migration database identity and TLS verified.');
}
if(!checkOnly){await migrate(url);console.log('Versioned PostgreSQL migrations applied.');}
