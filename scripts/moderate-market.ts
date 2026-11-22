import pg from 'pg';
import { readFile } from 'node:fs/promises';
import { z } from 'zod';

const [action, rawId]=process.argv.slice(2);
if(!action||!['queue','hold','restore','dismiss','purge-acknowledgements'].includes(action))
  throw new Error('Use queue, hold <listing UUID>, restore <listing UUID>, dismiss <listing UUID>, or purge-acknowledgements.');
const id=['hold','restore','dismiss'].includes(action)?z.uuid().parse(rawId):undefined;
const config=process.env.MIGRATION_DATABASE_URL??(process.env.NODE_ENV!=='production'?JSON.parse(await readFile('.local/admin.json','utf8')).adminUrl:undefined);
if(!config)throw new Error('Use the existing server-only operator database connection.');
const client=new pg.Client({connectionString:config});
await client.connect();
try{
  if(action==='queue'){
    const result=await client.query(`SELECT r.id,r.title,r.status,f.reason,f.created_at
      FROM reeklaim.market_flags f JOIN reeklaim.market_reports r ON r.id=f.listing_id
      WHERE f.resolved_at IS NULL ORDER BY f.created_at LIMIT 100`);
    console.table(result.rows);
  }else if(action==='purge-acknowledgements'){
    const result=await client.query('DELETE FROM reeklaim.finder_acknowledgements WHERE expires_at<=now()');
    console.log('Expired acknowledgements removed:',result.rowCount);
  }else{
    await client.query('BEGIN');
    try{
      if(action!=='dismiss'){
        const result=await client.query('UPDATE reeklaim.market_reports SET status=$2,revision=revision+1 WHERE id=$1 AND status=$3',[id,action==='hold'?'held':'open',action==='hold'?'open':'held']);
        if(!result.rowCount)throw new Error('The listing is unavailable for that moderation transition.');
      }
      await client.query('UPDATE reeklaim.market_flags SET resolved_at=now() WHERE listing_id=$1 AND resolved_at IS NULL',[id]);
      await client.query('COMMIT');
      console.log('Moderation action saved.');
    }catch(error){await client.query('ROLLBACK');throw error;}
  }
}finally{await client.end();}
