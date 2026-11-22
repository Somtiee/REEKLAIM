import { readFile } from 'node:fs/promises';
import { migrate } from './migrate.ts';
import { checkMigrationTarget } from './check-migration-target.ts';
let url=process.env.MIGRATION_DATABASE_URL;if(!url&&process.env.NODE_ENV!=='production')url=JSON.parse(await readFile('.local/admin.json','utf8')).adminUrl;
if(!url)throw new Error('Set server-only MIGRATION_DATABASE_URL in the migration shell, never in VITE_ variables.');
const checkOnly=process.argv.includes('--check');
if(process.env.MIGRATION_DATABASE_URL||process.env.NODE_ENV==='production'||checkOnly){
 try{await checkMigrationTarget(url,process.env);}
 catch{console.error('Migration target verification failed. Check the approved host, database, role and TLS configuration. No migrations ran.');process.exit(1);}
 console.log('Migration database identity and TLS verified.');
}
if(!checkOnly){await migrate(url);console.log('Versioned PostgreSQL migrations applied.');}
