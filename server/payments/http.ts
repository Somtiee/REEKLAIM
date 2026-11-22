import {createHash,randomUUID,randomBytes} from 'node:crypto';
import type {IncomingMessage,ServerResponse} from 'node:http';
import type pg from 'pg';
import {z} from 'zod';
import {nativeAddress} from '../../src/lib/amounts.ts';
import {emptyItem} from '../../src/items/domain.ts';
import {rewardQuote,TRANSFER_FEE,type Send} from '../../src/payments/domain.ts';
import type {AuthService,Session} from '../auth/service.ts';
import {HttpError,readJson,requireCsrf} from '../auth/security.ts';
import {CanonicalVerifier,ConfirmedTransactionFailure,type Challenge} from '../auth/receipt.ts';
import {seal} from '../items/crypto.ts';

const absent=()=>new HttpError(404,'PAYMENT','Payment or associated record unavailable.');
const conflict=()=>new HttpError(409,'PAYMENT_STATE','This action is unavailable. Reconcile any existing payment before proceeding.');
type Operation=Omit<Challenge,'wallet_address'|'pre_digest'>&{
 purpose:'transfer'|'reward'; payer_id:string;recipient_id:string; payer:string;recipient:string;treasury:string;
 item_id:string|null;claim_id:string|null;item_version:number|null;sends:Send[];accepted_at:Date|null;approval_started:boolean;
};
export async function paymentRoute(req:IncomingMessage,res:ServerResponse,url:URL,auth:AuthService,session:Session,token:string|null){
  const {db,config}=auth;
  const actor=session.account_id;
  const verifier=new CanonicalVerifier();
  const respond=(status:number,body:unknown)=>{res.statusCode=status;res.end(JSON.stringify(body));};
  const [, , ,id, action,...rest]=url.pathname.split('/');
  if(rest.length||url.search)throw absent();
  if(req.method==='GET'&&!id){
    return respond(200,await db.actor(actor,async c=>{
      const operations=(await c.query(`SELECT p.id,p.purpose,p.payer,p.recipient,p.treasury,p.state,p.sends,p.memo,p.origin,p.expires_at,p.candidate_hash,
        p.approval_started,p.created_at,(p.payer_id=$1) AS "canPay",(p.recipient_id=$1) AS "canAccept",p.chain_id AS "chainId",
        r.tx_hash AS receipt_hash,r.height FROM reeklaim.payment_operations p LEFT JOIN reeklaim.chain_receipts r ON r.payment_id=p.id
        ORDER BY p.created_at DESC LIMIT 100`,[actor])).rows;
      const registrations=(await c.query(`SELECT i.id,i.state,i.recipient,i.wallet_address AS payer,i.amount_uqor::text AS amount,i.issued_at AS at,
        r.tx_hash AS hash,r.height FROM reeklaim.registration_intents i LEFT JOIN reeklaim.chain_receipts r ON r.registration_id=i.id
        WHERE i.actor_id=$1 ORDER BY i.issued_at DESC LIMIT 100`,[actor])).rows;
      const authentication=(await db.auth.query("SELECT r.tx_hash AS hash,r.height,r.block_time AS at FROM reeklaim.sessions s JOIN reeklaim.chain_receipts r ON r.id=s.receipt_id WHERE s.account_id=$1 ORDER BY r.block_time DESC LIMIT 30",[actor])).rows;
      return {operations,registrations,authentication,collectionEnabled:!!config.treasuryAddress&&(process.env.NODE_ENV!=='production'||process.env.DIANA_PAYMENT_COLLECTION_APPROVED==='yes'),
        atomicRewardsEnabled:process.env.DIANA_ATOMIC_REWARDS_VERIFIED==='yes'};
    }));
  }
  if(req.method!=='POST')throw absent();
  requireCsrf(req,config,token);
  await auth.limit('payment:'+actor,30,300);
  const treasury=()=>{
    if(!config.treasuryAddress||(process.env.NODE_ENV==='production'&&process.env.DIANA_PAYMENT_COLLECTION_APPROVED!=='yes'))
      throw new HttpError(503,'COLLECTION_DISABLED','Diana collection requires verified operator configuration.');
    return nativeAddress(config.treasuryAddress);
  };
  const get=async(c:pg.PoolClient,lock=false):Promise<Operation>=>{
    const row=(await c.query('SELECT * FROM reeklaim.payment_operations WHERE id=$1'+(lock?' FOR UPDATE':''),[id])).rows[0];
    if(!row)throw absent();return row;
  };
  if(!id){
    const input=z.discriminatedUnion('purpose',[
      z.object({purpose:z.literal('transfer'),item:z.uuid(),recipient:z.string().max(90)}).strict(),
      z.object({purpose:z.literal('reward'),claim:z.uuid(),amount:z.string().regex(/^[1-9][0-9]{0,8}$/).refine(v=>BigInt(v)<=100000000n)}).strict(),
    ]).parse(await readJson(req));
    const receiver=input.purpose==='transfer'?input.recipient:null;
    if(receiver!==null){try{nativeAddress(receiver);}catch{throw new HttpError(400,'ADDRESS','Enter the recipient’s verified Diana native wallet address.');}}
    const feeAddress=treasury();
    const created=await db.actor(actor,async c=>{
      const payer=(await c.query('SELECT wallet_address FROM reeklaim.accounts WHERE id=$1',[actor])).rows[0]?.wallet_address;
      const item=input.purpose==='transfer'?(await c.query("SELECT id,version FROM reeklaim.items WHERE id=$1 AND owner_id=$2 AND commitment IS NOT NULL AND status IN ('registered','returned') FOR UPDATE",[input.item,actor])).rows[0]:null;
      const claim=input.purpose==='reward'?(await c.query("SELECT id,reviewer_id FROM reeklaim.claims WHERE id=$1 AND claimant_id=$2 AND state='resolved' FOR UPDATE",[input.claim,actor])).rows[0]:null;
      if(input.purpose==='transfer'?!item:!claim)throw absent();
      const target=(await db.auth.query('SELECT id,wallet_address FROM reeklaim.accounts WHERE '+(receiver?'wallet_address=$1':'id=$1'),[receiver??claim.reviewer_id])).rows[0];
      if(!target||target.id===actor||!payer||payer===feeAddress||target.wallet_address===feeAddress)throw absent();
      const existing=(await c.query(`SELECT id FROM reeklaim.payment_operations WHERE payer_id=$1 AND
         ((claim_id=$2 AND purpose='reward') OR (item_id=$3 AND purpose='transfer' AND state IN ('offered','accepted','pending','failed')))`,
         [actor,claim?.id??null,item?.id??null])).rows[0];
      if(existing)return existing;
      let sends:Send[]=[{recipient:feeAddress,amount:TRANSFER_FEE}];
      if(input.purpose==='reward'){
        const quote=rewardQuote(input.amount);
        if(quote.fee!=='0'&&process.env.DIANA_ATOMIC_REWARDS_VERIFIED!=='yes')
          throw new HttpError(503,'ATOMIC_UNVERIFIED','Combined reward and platform-fee collection awaits an explicitly approved live atomic wallet test.');
        sends=[{recipient:target.wallet_address,amount:quote.reward}];
        if(quote.fee!=='0')sends.push({recipient:feeAddress,amount:quote.fee});
      }
      const operation=randomUUID();
      await c.query(`INSERT INTO reeklaim.payment_operations(id,purpose,payer_id,recipient_id,item_id,claim_id,item_version,payer,recipient,treasury,sends,state,accepted_at)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,CASE WHEN $12='accepted' THEN now() ELSE NULL END)`,
        [operation,input.purpose,actor,target.id,item?.id??null,claim?.id??null,item?.version??null,payer,target.wallet_address,feeAddress,JSON.stringify(sends),item?'offered':'accepted']);
      return {id:operation};
    });
    return respond(201,created);
  }
  z.uuid().parse(id);
  if(action==='accept'||action==='cancel'){
    await db.actor(actor,async c=>{
      const row=await get(c,true);
      if(action==='accept'){
        if(row.purpose!=='transfer'||row.recipient_id!==actor||row.state!=='offered')throw conflict();
        await c.query("UPDATE reeklaim.payment_operations SET state='accepted',accepted_at=now() WHERE id=$1",[id]);
      }else{
        if(row.payer_id!==actor||row.purpose!=='transfer'||!['offered','accepted','pending'].includes(row.state)||row.approval_started||row.candidate_hash)throw conflict();
        await c.query("UPDATE reeklaim.payment_operations SET state='cancelled' WHERE id=$1",[id]);
      }
    });
    return respond(200,{saved:true});
  }
  if(action==='prepare'){
    const address=treasury();
    const context=await verifier.network();
    if(context.chainId!=='qorechain-diana')throw conflict();
    await db.actor(actor,async c=>{
      const row=await get(c,true);
      if(row.payer_id!==actor||!row.accepted_at||row.treasury!==address)throw conflict();
      if(row.state==='pending')return;
      if(row.state!=='accepted')throw conflict();
      if(row.sends.length>1&&process.env.DIANA_ATOMIC_REWARDS_VERIFIED!=='yes')throw conflict();
      if(row.item_id&&!(await c.query("SELECT id FROM reeklaim.items WHERE id=$1 AND owner_id=$2 AND version=$3 AND status IN ('registered','returned') FOR UPDATE",[row.item_id,actor,row.item_version])).rowCount)throw conflict();
      const issued=new Date(), expires=new Date(issued.getTime()+900000);
      const memo='rk:pay:v1:'+createHash('sha256').update(JSON.stringify(['rk:pay:v1',id,row.purpose,actor,row.recipient_id,row.payer,row.recipient,row.treasury,row.item_id,row.claim_id,row.item_version,'qorechain-diana',config.origin,'uqor',row.sends,expires.toISOString(),randomBytes(32).toString('hex')])).digest('base64url');
      await c.query("UPDATE reeklaim.payment_operations SET state='pending',memo=$2,origin=$3,min_height=$4,issued_at=$5,expires_at=$6 WHERE id=$1",[id,memo,config.origin,context.height,issued,expires]);
    });
    return respond(200,{saved:true});
  }
  if(action==='approval'){
    const address=treasury();
    await db.actor(actor,async c=>{
      const row=await get(c,true);
      if(row.payer_id!==actor||row.state!=='pending'||row.approval_started||row.candidate_hash||row.expires_at.getTime()<=Date.now()||row.treasury!==address||row.origin!==config.origin||
        (row.sends.length>1&&process.env.DIANA_ATOMIC_REWARDS_VERIFIED!=='yes'))throw conflict();
      await c.query('UPDATE reeklaim.payment_operations SET approval_started=true WHERE id=$1',[id]);
    });
    return respond(200,{saved:true});
  }
  if(action!=='verify')throw absent();
  const {hash}=z.object({hash:z.string().regex(/^[0-9a-fA-F]{64}$/).transform(s=>s.toUpperCase())}).strict().parse(await readJson(req));
  const row=await db.actor(actor,async c=>{
    const current=await get(c,true);
    if(current.payer_id!==actor||!current.approval_started||!['pending','confirmed'].includes(current.state)||
      (current.candidate_hash&&current.candidate_hash!==hash))throw conflict();
    if(current.state==='pending')await c.query('UPDATE reeklaim.payment_operations SET candidate_hash=$2 WHERE id=$1',[id,hash]);
    return current;
  });
  if(row.state==='confirmed')return respond(200,{confirmed:true});
  let receipt;
  try{receipt=await verifier.verifyPayment({...row,wallet_address:row.payer,pre_digest:''},row.sends,hash);}
  catch(error){
    if(error instanceof ConfirmedTransactionFailure){
      await db.actor(actor,c=>c.query("UPDATE reeklaim.payment_operations SET state='failed' WHERE id=$1 AND state='pending' AND candidate_hash=$2",[id,hash]));
      throw new HttpError(422,'FAILED','The transaction failed on Diana. Do not pay again automatically.');
    }
    throw new HttpError(422,'UNVERIFIED','Receipt not verified. Keep this hash and reconcile after indexing. Do not pay again.');
  }
  try{await db.actor(actor,async c=>{
    const current=await get(c,true);
    if(current.state==='confirmed')return;
    if(current.state!=='pending'||current.candidate_hash!==hash||receipt.hash!==hash||receipt.memo!==current.memo||receipt.signer!==current.payer||!receipt.localPqcVerified)throw conflict();
    await c.query(`INSERT INTO reeklaim.chain_receipts(chain_id,tx_hash,signer,height,block_time,memo,payment_id,verifier_version)
      VALUES('qorechain-diana',$1,$2,$3,$4,$5,$6,'rk-pay-1')`,[hash,receipt.signer,receipt.height,receipt.timestamp,receipt.memo,id]);
    if(current.item_id){
      const item=(await c.query('SELECT name,category FROM reeklaim.items WHERE id=$1',[current.item_id])).rows[0];
      if(!item)throw conflict();
      const metadata=seal(config.storageKey,'rk:item:v1:'+current.item_id,{...emptyItem,name:item.name,category:item.category});
      await c.query('SELECT reeklaim.apply_paid_transfer($1,$2)',[id,metadata]);
    }
    await c.query("UPDATE reeklaim.payment_operations SET state='confirmed' WHERE id=$1",[id]);
    await c.query('INSERT INTO reeklaim.audit_events(actor_id,action,resource_id) VALUES($1,$2,$3)',[actor,'payment.'+current.purpose,id]);
  });}catch(error){if((error as {code?:string}).code==='23505')throw conflict();throw error;}
  return respond(200,{confirmed:true});
}
