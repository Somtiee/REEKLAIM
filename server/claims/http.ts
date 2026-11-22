import { z } from 'zod';
import { randomUUID,createHash } from 'node:crypto';
import type { IncomingMessage,ServerResponse } from 'node:http';
import type pg from 'pg';
import type { AuthService,Session } from '../auth/service.ts';
import { ownedEvidence } from '../auth/service.ts';
import { HttpError, readJson, requireCsrf } from '../auth/security.ts';
import { CanonicalVerifier,type RegistrationChallenge } from '../auth/receipt.ts';
import { commitment,open,seal } from '../items/crypto.ts';
import type { ItemInput } from '../../src/items/domain.ts';
import type { PrivateStorage } from '../auth/storage.ts';
import { compareReports,type MatchFields } from '../../src/claims/matching.ts';

const uuid=z.uuid();
const pair=z.object({lost:uuid,found:uuid});
const safeText=(min:number,max:number)=>z.string().trim().min(min).max(max);
const submission=pair.extend({
  relationship:z.enum(['owner','authorized_representative']),
  explanation:safeText(20,1000), distinguishing:safeText(10,700),
  serial:safeText(0,100).default(''), additional:safeText(0,500).default(''),
  files:z.array(uuid).max(3).default([]),
}).strict();
const actionSchema=z.object({
  action:z.enum(['review','request','approve','reject','withdraw','dispute','start','resolve','message','attach','abuse']),
  version:z.number().int().positive(), text:safeText(0,1000).default(''), files:z.array(uuid).max(3).default([]),
}).strict();
const publicFields='id,title,description,category,country,city,occurred_on::text,brand,model,colour';
const notFound=()=>new HttpError(404,'CLAIM','Claim or report unavailable.');
const locked=()=>new HttpError(409,'TRANSITION','This action is unavailable or the claim changed. Reload and review.');
type ClaimRow={id:string;claimant_id:string;reviewer_id:string;found_listing_id:string;lost_listing_id:string;state:string;version:number;narrative:Buffer;verification:string;serial_agrees:boolean|null;updated_at:Date};
type Registration=RegistrationChallenge&{version:number;item_id:string;commitment:string;envelope_cipher:Buffer;snapshot_cipher:Buffer;tx_hash:string};
type Snapshot={input:ItemInput;salt:string;evidence:string|null;photo:string|null;publicPhoto:string|null};

export function transition(state:string,role:'reviewer'|'claimant',action:string){
  const reviewable=['submitted','under_review','more_information'];
  const reviewer:Record<string,[string[],string]>={
    review:[['submitted'],'under_review'],request:[['submitted','under_review'],'more_information'],
    approve:[reviewable,'approved'],reject:[reviewable,'rejected'],
  };
  const claimant:Record<string,[string[],string]>={withdraw:[reviewable,'withdrawn'],attach:[['more_information'],'under_review']};
  const shared:Record<string,[string[],string]>={
    dispute:[['approved','recovery_in_progress'],'disputed'],start:[['approved'],'recovery_in_progress'],
    resolve:[['recovery_in_progress'],'resolved'],
  };
  const rule=(role==='reviewer'?reviewer:claimant)[action]??shared[action];
  return rule?.[0].includes(state)?rule[1]:null;
}

async function registration(auth:AuthService,actor:string,lost:string,serial:string){
  const row:Registration|null=await auth.db.actor(actor,async c=>(await c.query(`
    SELECT i.*,r.tx_hash,v.snapshot_cipher FROM reeklaim.market_reports l
    JOIN reeklaim.registration_intents i ON i.item_id=l.item_id AND i.state='confirmed'
    JOIN reeklaim.chain_receipts r ON r.registration_id=i.id
    JOIN reeklaim.item_versions v ON v.item_id=i.item_id AND v.version=i.version
    WHERE l.id=$1 AND l.owner_id=$2 AND l.status='open'`,[lost,actor])).rows[0]??null);
  if(!row)return {label:'none',agrees:null};
  try{
    const key=auth.config.storageKey;
    const snapshot=open<Snapshot>(key,`rk:snapshot:v1:${row.item_id}:${row.version}`,row.snapshot_cipher);
    const envelope=open<string>(key,'rk:intent:v1:'+row.id,row.envelope_cipher);
    const proof=commitment(row.item_id,row.version,snapshot.input,snapshot.evidence,snapshot.photo,snapshot.publicPhoto,snapshot.salt);
    if(proof.hash!==row.commitment||'rk:reg:v1:'+createHash('sha256').update(envelope).digest('base64url')!==row.memo) return {label:'unavailable',agrees:null};
    const decoded=JSON.parse(envelope) as unknown[];
    if(decoded[2]!==row.id||decoded[3]!==row.item_id||decoded[4]!==row.version||decoded[5]!==proof.hash||decoded[7]!==actor||decoded[8]!==row.wallet_address||decoded[9]!==row.chain_id||decoded[11]!==row.recipient||decoded[13]!==row.amount_uqor)return {label:'unavailable',agrees:null};
    const verified=await new CanonicalVerifier().verifyRegistration(row,row.tx_hash);
    if(verified.hash!==row.tx_hash||verified.memo!==row.memo||verified.signer!==row.wallet_address||!verified.localPqcVerified)return {label:'unavailable',agrees:null};
    const normalize=(value:string)=>value.normalize('NFKC').trim().toUpperCase();
    return {label:'confirmed',agrees:serial&&snapshot.input.serial?normalize(serial)===normalize(snapshot.input.serial):null};
  }catch{return {label:'unavailable',agrees:null};}
}
async function selectPair(auth:AuthService,actor:string,lost:string,found:string){
  const own=(await auth.db.actor(actor,c=>c.query('SELECT '+publicFields+" FROM reeklaim.market_reports WHERE id=$1 AND owner_id=$2 AND kind='lost' AND status='open'",[lost,actor]))).rows[0] as MatchFields|undefined;
  const target=(await auth.db.auth.query('SELECT '+publicFields+" FROM reeklaim.market_reports WHERE id=$1 AND kind='found' AND status='open'",[found])).rows[0] as MatchFields|undefined;
  if(!own||!target)throw notFound();
  return {lost:own,found:target};
}
async function append(c:pg.PoolClient,key:string,id:string,actor:string,kind:string,text?:string){
  const event=randomUUID();
  await c.query('INSERT INTO reeklaim.claim_events(id,claim_id,actor_id,kind,payload) VALUES($1,$2,$3,$4,$5)',
    [event,id,actor,kind,text?seal(key,'rk:claim-event:v1:'+event,text):null]);
}
async function attach(c:pg.PoolClient,id:string,actor:string,files:string[]){
  for(const file of new Set(files)){
    await ownedEvidence(c,file,actor);
    await c.query('INSERT INTO reeklaim.claim_attachments(claim_id,evidence_id,owner_id) VALUES($1,$2,$3) ON CONFLICT DO NOTHING',[id,file,actor]);
  }
}
export async function claimRoute(req:IncomingMessage,res:ServerResponse,url:URL,auth:AuthService,session:Session,token:string|null,storage:PrivateStorage){
  const actor=session.account_id;
  const {db,config}=auth;
  const route=url.pathname.slice('/api/claims'.length);
  const send=(status:number,body:unknown)=>{res.statusCode=status;res.end(JSON.stringify(body));};
  if(req.method!=='GET'){requireCsrf(req,config,token);await auth.limit('claims-write:'+actor,35,600);}
  if(req.method==='GET'&&route==='/matches'){
    await auth.limit('matches:'+actor,20,60);
    const {lost,dismissals,ownFound}=await db.actor(actor,async c=>({
      lost:(await c.query('SELECT '+publicFields+" FROM reeklaim.market_reports WHERE owner_id=$1 AND status='open' AND kind='lost' ORDER BY occurred_on DESC LIMIT 20",[actor])).rows as MatchFields[],
      ownFound:new Set((await c.query("SELECT id FROM reeklaim.market_reports WHERE owner_id=$1 AND kind='found'",[actor])).rows.map(r=>r.id)),
      dismissals:new Set((await c.query('SELECT lost_id,found_id FROM reeklaim.match_dismissals WHERE actor_id=$1',[actor])).rows.map(r=>r.lost_id+':'+r.found_id)),
    }));
    const matches=[];
    for(const entry of lost){
      const candidates=(await db.auth.query('SELECT '+publicFields+` FROM reeklaim.market_reports WHERE status='open' AND kind='found' AND category=$1 AND country=$2
        AND occurred_on BETWEEN $3::date AND $3::date+60 ORDER BY occurred_on,id LIMIT 60`,[entry.category,entry.country,entry.occurred_on])).rows as MatchFields[];
      for(const found of candidates){
        if(ownFound.has(found.id)||dismissals.has(entry.id+':'+found.id))continue;
        const match=compareReports(entry,found);
        if(match)matches.push({lost:entry,found,...match});
      }
    }
    matches.sort((a,b)=>b.score-a.score||a.found.id.localeCompare(b.found.id));
    const visible=matches.slice(0,30);
    if(visible.length)await db.actor(actor,async c=>{
      const setting=(await c.query('SELECT notifications,match_alerts FROM reeklaim.account_settings WHERE account_id=$1',[actor])).rows[0];
      if(setting&&(!setting.notifications||!setting.match_alerts))return;
      const keys=visible.map(match=>'match:'+match.lost.id+':'+match.found.id);
      await c.query(`INSERT INTO reeklaim.notifications(account_id,kind,safe_message,event_key,href)
        SELECT $1,'match','A possible match was found for one of your reports.',key,'/app/claims/matches'
        FROM unnest($2::text[]) key ON CONFLICT(account_id,event_key) DO NOTHING`,[actor,keys]);
    });
    return send(200,{matches:visible});
  }
  if(req.method==='POST'&&route==='/dismiss'){
    const {lost,found}=pair.strict().parse(await readJson(req));
    await selectPair(auth,actor,lost,found);
    await db.actor(actor,c=>c.query('INSERT INTO reeklaim.match_dismissals(actor_id,lost_id,found_id) VALUES($1,$2,$3) ON CONFLICT DO NOTHING',[actor,lost,found]));
    return send(200,{saved:true});
  }
  if(req.method==='GET'&&!route){
    const listings=(await db.actor(actor,c=>c.query(`SELECT c.id,c.state,c.version,c.updated_at,c.lost_listing_id,c.found_listing_id,(c.reviewer_id=$1) AS reviewer,
      (SELECT count(*)::int FROM reeklaim.claim_events e WHERE e.claim_id=c.id AND e.actor_id IS DISTINCT FROM $1 AND e.created_at>now()-interval '7 days') AS recent_updates
      FROM reeklaim.claims c ORDER BY updated_at DESC LIMIT 100`,[actor]))).rows;
    return send(200,{claims:listings});
  }
  if(req.method==='POST'&&!route){
    const input=submission.parse(await readJson(req,12288));
    const listings=await selectPair(auth,actor,input.lost,input.found);
    if(listings.lost.category!==listings.found.category)throw new HttpError(422,'CATEGORY','Choose reports in the same item category.');
    await auth.limit('claims-submit:'+actor,6,3600);
    await auth.limit('claim-inbox:'+input.found,25,3600);
    const verified=await registration(auth,actor,input.lost,input.serial);
    const id=randomUUID();
    try{await db.actor(actor,async c=>{
      const lost=(await c.query("SELECT item_id FROM reeklaim.market_reports WHERE id=$1 AND owner_id=$2 AND status='open' AND kind='lost' FOR UPDATE",[input.lost,actor])).rows[0];
      const reviewer=(await c.query('SELECT reeklaim.claim_target($1) AS id',[input.found])).rows[0].id;
      if(!lost||!reviewer||reviewer===actor)throw notFound();
      const {relationship,explanation,distinguishing,serial,additional}=input;
      const narrative=seal(config.storageKey,'rk:claim:v1:'+id,{relationship,explanation,distinguishing,serial,additional,lost:listings.lost,found:listings.found});
      await c.query(`INSERT INTO reeklaim.claims(id,item_id,claimant_id,reviewer_id,lost_listing_id,found_listing_id,narrative,verification,serial_agrees)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,[id,lost.item_id,actor,reviewer,input.lost,input.found,narrative,verified.label,verified.agrees]);
      await attach(c,id,actor,input.files);
      await append(c,config.storageKey,id,actor,'submitted');
    });}catch(error){if((error as {code?:string}).code==='23505')throw locked();throw error;}
    return send(201,{id});
  }
  const [empty,rawId,section,fileId,fileAction,...rest]=route.split('/');
  if(empty!==''||!rawId||rest.length)throw notFound();
  const id=uuid.parse(rawId);
  const getClaim=async(c:pg.PoolClient,lock=false):Promise<ClaimRow>=>{
    const row=(await c.query('SELECT * FROM reeklaim.claims WHERE id=$1'+(lock?' FOR UPDATE':''),[id])).rows[0];
    if(!row)throw notFound();
    return row;
  };
  if(req.method==='GET'&&!section){
    return send(200,await db.actor(actor,async c=>{
      const row=await getClaim(c);
      const events=(await c.query('SELECT * FROM (SELECT id,actor_id,kind,payload,created_at FROM reeklaim.claim_events WHERE claim_id=$1 ORDER BY created_at DESC,id DESC LIMIT 200) recent ORDER BY created_at,id',[id])).rows;
      const files=(await c.query('SELECT e.id,e.mime,e.bytes FROM reeklaim.claim_attachments a JOIN reeklaim.evidence e ON e.id=a.evidence_id WHERE a.claim_id=$1',[id])).rows;
      const reward=(await c.query("SELECT p.state,r.tx_hash,r.height FROM reeklaim.payment_operations p LEFT JOIN reeklaim.chain_receipts r ON r.payment_id=p.id WHERE p.claim_id=$1 AND p.purpose='reward'",[id])).rows[0]??null;
      return {id,state:row.state,version:row.version,reward,role:row.reviewer_id===actor?'reviewer':'claimant',verification:row.verification,serialAgrees:row.serial_agrees,
        narrative:open(config.storageKey,'rk:claim:v1:'+id,row.narrative),files,
        events:events.map(e=>({id:e.id,kind:e.kind,at:e.created_at,author:!e.actor_id?'Moderator':e.actor_id===actor?'You':e.actor_id===row.reviewer_id?'Finder':'Claimant',text:e.kind!=='abuse'&&e.payload?open(config.storageKey,'rk:claim-event:v1:'+e.id,e.payload):null}))};
    }));
  }
  if(section==='files'){
    const file=uuid.parse(fileId);const link=fileAction;
    if(link==='link'&&req.method==='POST')return send(200,await storage.downloadLink(actor,session.digest,file,id));
    if(link==='download'&&req.method==='GET'){
      const query=z.object({expires:z.coerce.number().int().positive(),signature:z.string().regex(/^[A-Za-z0-9_-]{43}$/)}).strict().parse(Object.fromEntries(url.searchParams));
      const result=await storage.download(actor,session.digest,file,query.expires,query.signature,id);
      res.setHeader('Content-Type',result.mime);
      res.setHeader('Content-Security-Policy',"default-src 'none'; sandbox");
      res.setHeader('Content-Disposition',result.mime==='image/png'?'inline':'attachment; filename="private-evidence.txt"');
      res.end(result.bytes);return;
    }
  }
  if(req.method!=='POST'||section!=='actions'||fileId)throw notFound();
  const input=actionSchema.parse(await readJson(req,8192));
  try{await db.actor(actor,async c=>{
    const initial=await getClaim(c);
    await c.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',['claim-found:'+initial.found_listing_id]);
    const row=await getClaim(c,true);
    if(row.version!==input.version)throw locked();
    const role=row.reviewer_id===actor?'reviewer':'claimant';
    const next=transition(row.state,role,input.action);
    if(!next&&!['message','abuse'].includes(input.action))throw locked();
    if(input.action==='message'&&['rejected','withdrawn','resolved','disputed'].includes(row.state))throw locked();
    if(['request','message','abuse','dispute'].includes(input.action)&&input.text.length<5)throw new HttpError(422,'TEXT','Add a brief reason or message.');
    if(input.action==='resolve'){
      const previous=(await c.query("SELECT id FROM reeklaim.claim_events WHERE claim_id=$1 AND actor_id=$2 AND kind='return_confirmed' AND created_at>COALESCE((SELECT max(created_at) FROM reeklaim.claim_events WHERE claim_id=$1 AND kind='moderator_resume'),'-infinity') LIMIT 1",[id,actor])).rowCount;
      if(previous)throw locked();
      await append(c,config.storageKey,id,actor,'return_confirmed',input.text);
      const other=(await c.query("SELECT id FROM reeklaim.claim_events WHERE claim_id=$1 AND actor_id<>$2 AND kind='return_confirmed' AND created_at>COALESCE((SELECT max(created_at) FROM reeklaim.claim_events WHERE claim_id=$1 AND kind='moderator_resume'),'-infinity') LIMIT 1",[id,actor])).rowCount;
      if(!other){await c.query('UPDATE reeklaim.claims SET version=version+1,updated_at=clock_timestamp() WHERE id=$1',[id]);return;}
    }
    if(input.action==='attach'){
      if(!input.files.length&&!input.text)throw new HttpError(422,'EVIDENCE','Attach a file or explain the additional evidence.');
      if(Number((await c.query('SELECT count(*) FROM reeklaim.claim_attachments WHERE claim_id=$1',[id])).rows[0].count)+input.files.length>12)throw locked();
      await attach(c,id,actor,input.files);
    }
    if(input.action==='approve'){
      const found=(await c.query("UPDATE reeklaim.market_reports SET status='recovery_in_progress',revision=revision+1 WHERE id=$1 AND owner_id=$2 AND status='open' RETURNING id",[row.found_listing_id,actor])).rowCount;
      if(!found)throw locked();
      await c.query("INSERT INTO reeklaim.recovery_cases(claim_id,state) VALUES($1,'open')",[id]);
    }
    if(input.action==='dispute'||input.action==='resolve')
      await c.query('UPDATE reeklaim.recovery_cases SET state=$2 WHERE claim_id=$1',[id,input.action==='resolve'?'returned':'disputed']);
    await c.query('UPDATE reeklaim.claims SET state=$2,version=version+1,updated_at=clock_timestamp() WHERE id=$1',[id,next??row.state]);
    await append(c,config.storageKey,id,actor,next??input.action,input.text);
  });}catch(error){if((error as {code?:string}).code==='23505')throw locked();throw error;}
  return send(200,{saved:true});
}
