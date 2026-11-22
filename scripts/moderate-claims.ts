import pg from 'pg';
import {readFile} from 'node:fs/promises';
import {z} from 'zod';
const [action,raw]=process.argv.slice(2);
if(!action||!['queue','freeze','resume'].includes(action))throw new Error('Use queue, freeze <claim UUID> or resume <claim UUID>.');
const url=process.env.MIGRATION_DATABASE_URL??(process.env.NODE_ENV==='production'?undefined:JSON.parse(await readFile('.local/admin.json','utf8')).adminUrl);
if(!url)throw new Error('Use the server-only operator connection.');
const db=new pg.Client({connectionString:url});
await db.connect();
try{
  if(action==='queue'){
    console.table((await db.query(`SELECT c.id,c.state,c.updated_at,count(e.id)::int reports
      FROM reeklaim.claims c LEFT JOIN reeklaim.claim_events e ON e.claim_id=c.id AND e.kind='abuse'
      WHERE c.found_listing_id IS NOT NULL AND (c.state='disputed' OR e.id IS NOT NULL)
      GROUP BY c.id ORDER BY c.updated_at DESC LIMIT 100`)).rows);
  }else{
    const id=z.uuid().parse(raw);
    await db.query('BEGIN');
    try{
      const result=await db.query(`UPDATE reeklaim.claims SET state=$2,version=version+1,updated_at=clock_timestamp()
        WHERE id=$1 AND found_listing_id IS NOT NULL AND state=ANY($3) RETURNING reviewer_id`,
        [id,action==='freeze'?'disputed':'recovery_in_progress',action==='freeze'?['approved','recovery_in_progress']:['disputed']]);
      if(!result.rowCount)throw new Error('No eligible claim.');
      await db.query('UPDATE reeklaim.recovery_cases SET state=$2 WHERE claim_id=$1',[id,action==='freeze'?'disputed':'open']);
      await db.query('INSERT INTO reeklaim.claim_events(claim_id,actor_id,kind) VALUES($1,NULL,$2)',[id,'moderator_'+action]);
      await db.query('COMMIT');
    }catch(error){await db.query('ROLLBACK');throw error;}
  }
}finally{await db.end();}
