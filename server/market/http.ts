import type { IncomingMessage, ServerResponse } from 'node:http';
import { z } from 'zod';
import { directoryQuery, listingInput, reportFields } from '../../src/market/domain.ts';
import type { AuthService, Session } from '../auth/service.ts';
import { digest, HttpError, requireCsrf, readJson, readBody } from '../auth/security.ts';
import { validateUpload } from '../auth/storage.ts';

const projection = 'id,kind,title,description,category,country,city,occurred_on::text,reward,verified,status,brand,model,colour,photo IS NOT NULL AS has_photo';
const missing = () => new HttpError(404,'LISTING','Report unavailable.');
let uploads = 0;

export async function marketRoute(req:IncomingMessage,res:ServerResponse,url:URL,auth:AuthService,session:Session|null,sessionToken:string|null,preToken:string|null) {
  const {db, config}=auth;
  const reply=(status:number,data:unknown)=>{res.statusCode=status;res.end(JSON.stringify(data));};
  const path=url.pathname;
  const suffix=path.slice('/api/market'.length);
  const match=/^\/([a-f0-9-]{36})(?:\/(photo|preview-photo|abuse|edit|publish|close|archive))?$/.exec(suffix);
  const id=match?z.uuid().parse(match[1]):null;
  const action=match?.[2];
  if (req.method==='GET' && suffix==='') {
    const entries=[...url.searchParams.entries()];
    if(new Set(entries.map(([key])=>key)).size!==entries.length) throw new HttpError(400,'QUERY','Repeated filter.');
    const query=directoryQuery.parse(Object.fromEntries(entries));
    const values:unknown[]=[query.kind];
    const conditions=["status='open'",'kind=$1'];
    const add=(expression:string,value:unknown)=>{
      values.push(value);conditions.push(expression.replaceAll('?', '$'+values.length));
    };
    if(query.q) add("(to_tsvector('simple',title||' '||description||' '||city||' '||category) @@ plainto_tsquery('simple',?) OR to_tsvector('english',title||' '||description||' '||city||' '||category) @@ plainto_tsquery('english',?) OR strpos(lower(title),lower(?))>0)",query.q);
    if(query.category) add('category=?',query.category);
    if(query.country) add('country=?',query.country);
    if(query.city) add('lower(city)=lower(?)',query.city);
    if(query.since) add('occurred_on>=?::date',query.since);
    if(query.until) add('occurred_on<=?::date',query.until);
    if(query.reward) add('(reward>0)=?',query.reward==='yes');
    if(query.verified) add('verified=?',query.verified==='yes');
    const orders={recent:'occurred_on DESC,id',oldest:'occurred_on,id',reward:'reward DESC,occurred_on DESC,id'};
    const offset=values.push((query.page-1)*12);
    const rows=(await db.auth.query('SELECT '+projection+' FROM reeklaim.market_reports WHERE '+conditions.join(' AND ')+' ORDER BY '+orders[query.sort]+' LIMIT 13 OFFSET $'+offset,values)).rows;
    return reply(200,{items:rows.slice(0,12),more:rows.length>12&&query.page<100,page:query.page});
  }
  if(url.search) throw new HttpError(400,'QUERY','Unexpected query.');
  if (id && req.method==='GET' && (!action||action==='photo')) {
    const result=await db.auth.query('SELECT '+(action?'photo':projection)+" FROM reeklaim.market_reports WHERE id=$1 AND status='open'",[id]);
    const entry=result.rows[0];
    if(!entry || (action&&!entry.photo)) throw missing();
    if(action){res.setHeader('Content-Type','image/png');res.setHeader('Content-Security-Policy',"default-src 'none'; sandbox");res.end(entry.photo);return;}
    return reply(200,entry);
  }
  if(suffix==='/finder-status'&&req.method==='POST'){
    requireCsrf(req,config,session?sessionToken:preToken);
    if(!session&&!await auth.pre(preToken))throw new HttpError(401,'PRE','Refresh the page.');
    await auth.limit('finder-status:'+req.socket.remoteAddress,20,3600);
    const {token}=z.object({token:z.string().regex(/^[A-Za-z0-9_-]{43}$/)}).strict().parse(await readJson(req));
    if(!(await db.auth.query('SELECT received_at FROM reeklaim.finder_acknowledgements WHERE token_digest=$1',[digest(token)])).rowCount)throw missing();
    return reply(200,{received:true});
  }
  if(id && action==='abuse' && req.method==='POST'){
    requireCsrf(req,config,session?sessionToken:preToken);
    if(!session&&!await auth.pre(preToken)) throw new HttpError(401,'PRE','Refresh the page.');
    await auth.limit('market-flag-ip:'+req.socket.remoteAddress,8,3600);
    await auth.limit('market-flag:'+id+':'+(session?.account_id??req.socket.remoteAddress),1,3600);
    const {reason}=z.object({reason:z.enum(['privacy','spam','unsafe','other'])}).strict().parse(await readJson(req));
    if(!(await db.auth.query("SELECT id FROM reeklaim.market_reports WHERE id=$1 AND status='open'",[id])).rowCount) throw missing();
    await db.auth.query('INSERT INTO reeklaim.market_flags(listing_id,reason) VALUES($1,$2)',[id,reason]);
    return reply(201,{received:true});
  }
  if(!session) throw new HttpError(401,'AUTH_REQUIRED','Sign in with QoreX to manage reports.');
  const actor=session.account_id;
  if(req.method==='GET' && suffix==='/mine'){
    return reply(200,{items:(await db.actor(actor,c=>c.query('SELECT '+projection+',revision,item_id FROM reeklaim.market_reports ORDER BY created_at DESC LIMIT 100'))).rows});
  }
  if(req.method==='GET'&&id&&action==='preview-photo'){
    const row=(await db.actor(actor,c=>c.query('SELECT photo FROM reeklaim.market_reports WHERE id=$1',[id]))).rows[0];
    if(!row?.photo)throw missing();
    res.setHeader('Content-Type','image/png');res.setHeader('Content-Security-Policy',"default-src 'none'; sandbox");res.end(row.photo);return;
  }
  if(req.method!=='POST') throw missing();
  requireCsrf(req,config,sessionToken);
  await auth.limit('market-write:'+actor,25,600);
  if(suffix===''){
    const input=listingInput.parse(await readJson(req,8192));
    if(input.kind==='found'&&(input.itemId||input.reward)) throw new HttpError(400,'FOUND','Found listings cannot attach a private item or offer a reward.');
    const created=await db.actor(actor,async c=>{
      await c.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',['market:'+actor]);
      if(Number((await c.query('SELECT count(*) FROM reeklaim.market_reports')).rows[0].count)>=100) throw new HttpError(409,'LIMIT','Report limit reached.');
      if(input.itemId){
        const item=(await c.query('SELECT status FROM reeklaim.items WHERE id=$1 FOR UPDATE',[input.itemId])).rows[0];
        if(!item || !['registered','missing'].includes(item.status)) throw missing();
        if((await c.query("SELECT id FROM reeklaim.market_reports WHERE item_id=$1 AND status IN ('draft','open','held','claim_pending','recovery_in_progress')",[input.itemId])).rowCount)
          throw new HttpError(409,'DUPLICATE','Manage the existing report for this item.');
      }
      const values=[actor,input.itemId,input.kind,input.title,input.description,input.category,input.country,input.city,input.occurred_on,input.reward,input.brand,input.model,input.colour];
      return (await c.query(`INSERT INTO reeklaim.market_reports(owner_id,item_id,kind,title,description,category,country,city,occurred_on,reward,brand,model,colour,verified)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,EXISTS(SELECT 1 FROM reeklaim.registration_intents i JOIN reeklaim.chain_receipts r ON r.registration_id=i.id WHERE i.item_id=$2 AND i.state='confirmed'))
        RETURNING id`,values)).rows[0];
    });
    return reply(201,created);
  }
  if(!id || !action) throw missing();
  if(!(await db.actor(actor,c=>c.query('SELECT id FROM reeklaim.market_reports WHERE id=$1',[id]))).rowCount) throw missing();
  let photo:Buffer|undefined;
  if(action==='photo'){
    await auth.limit('market-photo:'+actor,8,3600);
    const mime=req.headers['content-type']??'';
    if(!['image/jpeg','image/png','image/webp'].includes(mime))throw new HttpError(415,'PHOTO','Choose a PNG, JPEG or WebP image.');
    if(uploads>=2)throw new HttpError(429,'BUSY','Try the upload again shortly.');
    uploads++;
    try{photo=(await validateUpload(await readBody(req,4194304),mime)).bytes;}finally{uploads--;}
  }
  const edit=action==='edit'?z.object({revision:z.number().int().positive(),fields:reportFields,removePhoto:z.boolean().default(false)}).strict().parse(await readJson(req,8192)):null;
  const approval=action==='publish'?z.object({revision:z.number().int().positive(),approved:z.literal(true)}).strict().parse(await readJson(req)):null;
  await db.actor(actor,async c=>{
    // Match item-archive lock order before locking the listing.
    const parent=(await c.query('SELECT item_id FROM reeklaim.market_reports WHERE id=$1',[id])).rows[0];
    const item=parent?.item_id?(await c.query('SELECT status FROM reeklaim.items WHERE id=$1 FOR UPDATE',[parent.item_id])).rows[0]:null;
    const row=(await c.query('SELECT status,kind,item_id,revision FROM reeklaim.market_reports WHERE id=$1 FOR UPDATE',[id])).rows[0];
    if(!row)throw missing();
    const valid:Record<string,string[]>={photo:['draft'],edit:['draft','open'],publish:['draft'],close:['open'],archive:['draft','open','closed','held','recovered']};
    if(!valid[action]?.includes(row.status)||((approval??edit)&& (approval??edit)!.revision!==row.revision))throw new HttpError(409,'STATE','Report changed or action is unavailable. Reload your reports.');
    if(photo) await c.query('UPDATE reeklaim.market_reports SET photo=$2,revision=revision+1 WHERE id=$1',[id,photo]);
    else if(edit){
      const f=edit.fields;
      if(row.kind==='found'&&f.reward)throw new HttpError(400,'REWARD','Found reports cannot offer a reward.');
      await c.query("UPDATE reeklaim.market_reports SET title=$2,description=$3,category=$4,country=$5,city=$6,occurred_on=$7,reward=$8,status='draft',revision=revision+1,photo=CASE WHEN $9 THEN NULL ELSE photo END,brand=$10,model=$11,colour=$12 WHERE id=$1",[id,f.title,f.description,f.category,f.country,f.city,f.occurred_on,f.reward,edit.removePhoto,f.brand,f.model,f.colour]);
    }else{
      const status=action==='publish'?'open':action==='close'?'closed':'archived';
      if(approval && row.item_id){
        if(!item || !['registered','missing'].includes(item.status))throw new HttpError(409,'ITEM','Linked item is unavailable.');
        await c.query("UPDATE reeklaim.items SET status='missing' WHERE id=$1",[row.item_id]);
        await c.query("UPDATE reeklaim.recovery_public SET status='missing' WHERE item_id=$1",[row.item_id]);
      }
      await c.query('UPDATE reeklaim.market_reports SET status=$2,revision=revision+1 WHERE id=$1',[id,status]);
    }
  });
  return reply(200,{saved:true});
}
