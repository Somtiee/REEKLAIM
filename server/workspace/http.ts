import type {IncomingMessage,ServerResponse} from 'node:http';
import type {AuthService,Session} from '../auth/service.ts';
import {HttpError,readJson,requireCsrf} from '../auth/security.ts';
import {z} from 'zod';
import { organizationRoute } from './organizations.ts';

const preferences=z.object({notifications:z.boolean(),match_alerts:z.boolean(),hide_balance:z.boolean()}).strict();
const defaultPreferences={notifications:true,match_alerts:true,hide_balance:false};
const missing=()=>new HttpError(404,'WORKSPACE','Workspace record unavailable.');
export async function workspaceRoute(req:IncomingMessage,res:ServerResponse,url:URL,auth:AuthService,session:Session,token:string|null){
  const {db,config}=auth, actor=session.account_id;
  const path=url.pathname.slice('/api/workspace'.length);
  const send=(status:number,data:unknown)=>{res.statusCode=status;res.end(JSON.stringify(data));};
  if(url.search)throw missing();
  if(req.method==='POST'){
    requireCsrf(req,config,token);
    await auth.limit('workspace:'+actor,100,600);
  }else if(req.method!=='GET')throw missing();
  if(path==='/organizations'||path.startsWith('/organizations/'))return organizationRoute(req,path,auth,actor,send);
  if(req.method==='GET'&&path==='/overview'){
    return send(200,await db.actor(actor,async c=>{
      const counts=(await c.query(`SELECT
       (SELECT count(*)::int FROM reeklaim.items WHERE owner_id=$1 AND commitment IS NOT NULL AND status NOT IN ('draft','archived')) registered,
       (SELECT count(*)::int FROM reeklaim.items WHERE owner_id=$1 AND status='missing') missing,
       (SELECT count(*)::int FROM reeklaim.market_reports WHERE owner_id=$1 AND kind='found' AND status NOT IN ('draft','archived')) found,
       (SELECT count(*)::int FROM reeklaim.claims WHERE $1 IN (claimant_id,reviewer_id) AND state NOT IN ('rejected','withdrawn','resolved','returned')) claims,
       (SELECT count(*)::int FROM reeklaim.recovery_cases r JOIN reeklaim.claims c ON c.id=r.claim_id WHERE $1 IN(c.claimant_id,c.reviewer_id)) recoveries,
       (SELECT count(*)::int FROM reeklaim.claims WHERE $1 IN(claimant_id,reviewer_id) AND state='resolved') successful,
       (SELECT count(*)::int FROM reeklaim.notifications WHERE account_id=$1 AND read_at IS NULL) unread`,[actor])).rows[0];
      const activity=(await c.query(`SELECT kind,safe_message AS label,href,created_at FROM reeklaim.notifications WHERE account_id=$1
        UNION ALL SELECT action,action,NULL,created_at FROM reeklaim.audit_events WHERE actor_id=$1 ORDER BY created_at DESC LIMIT 12`,[actor])).rows;
      const prefs=(await c.query('SELECT notifications,match_alerts,hide_balance FROM reeklaim.account_settings WHERE account_id=$1',[actor])).rows[0]??defaultPreferences;
      return {counts,activity,preferences:prefs};
    }));
  }
  if(req.method==='GET'&&path==='/notifications'){
    return send(200,await db.actor(actor,async c=>({
      unread:(await c.query('SELECT count(*)::int AS total FROM reeklaim.notifications WHERE account_id=$1 AND read_at IS NULL',[actor])).rows[0].total,
      items:(await c.query('SELECT id,kind,safe_message,href,created_at,read_at FROM reeklaim.notifications WHERE account_id=$1 ORDER BY created_at DESC,id LIMIT 50',[actor])).rows,
    })));
  }
  if(req.method==='POST'&&path==='/notifications/read'){
    const {id}=z.object({id:z.union([z.uuid(),z.literal('all')])}).strict().parse(await readJson(req));
    const result=await db.actor(actor,c=>c.query("UPDATE reeklaim.notifications SET read_at=now() WHERE account_id=$1 AND ($2='all' OR id::text=$2) AND read_at IS NULL",[actor,id]));
    if(id!=='all'&&!result.rowCount&&!(await db.actor(actor,c=>c.query('SELECT 1 FROM reeklaim.notifications WHERE account_id=$1 AND id=$2',[actor,id]))).rowCount)throw missing();
    return send(200,{saved:true});
  }
  if(req.method==='GET'&&path==='/settings'){
    const settings=await db.actor(actor,async c=>({
      preferences:(await c.query('SELECT notifications,match_alerts,hide_balance FROM reeklaim.account_settings WHERE account_id=$1',[actor])).rows[0]??defaultPreferences,
      deletion:(await c.query('SELECT requested_at FROM reeklaim.account_deletion_requests WHERE account_id=$1',[actor])).rows[0]?.requested_at??null,
    }));
    const sessions=(await db.auth.query('SELECT receipt_id AS id,created_at,expires_at,(digest=$2) AS current FROM reeklaim.sessions WHERE account_id=$1 AND revoked_at IS NULL AND expires_at>now() AND last_active_at>now()-interval \'30 minutes\' ORDER BY created_at DESC LIMIT 30',[actor,session.digest])).rows;
    return send(200,{...settings,sessions});
  }
  if(req.method==='POST'&&path==='/settings'){
    const prefs=preferences.parse(await readJson(req));
    await db.actor(actor,c=>c.query(`INSERT INTO reeklaim.account_settings(account_id,notifications,match_alerts,hide_balance) VALUES($1,$2,$3,$4)
     ON CONFLICT(account_id) DO UPDATE SET notifications=excluded.notifications,match_alerts=excluded.match_alerts,hide_balance=excluded.hide_balance`,[actor,prefs.notifications,prefs.match_alerts,prefs.hide_balance]));
    return send(200,{saved:true});
  }
  if(req.method==='POST'&&path==='/sessions/revoke'){
    const {id}=z.object({id:z.union([z.uuid(),z.literal('others')])}).strict().parse(await readJson(req));
    const result=await db.auth.query("UPDATE reeklaim.sessions SET revoked_at=now() WHERE account_id=$1 AND digest<>$2 AND revoked_at IS NULL AND ($3='others' OR receipt_id::text=$3)",[actor,session.digest,id]);
    if(id!=='others'&&!result.rowCount)throw missing();
    return send(200,{revoked:result.rowCount});
  }
  if(req.method==='POST'&&path==='/deletion'){
    z.object({confirm:z.literal('REQUEST DELETION')}).strict().parse(await readJson(req));
    await db.actor(actor,c=>c.query('INSERT INTO reeklaim.account_deletion_requests(account_id) VALUES($1) ON CONFLICT DO NOTHING',[actor]));
    return send(202,{requested:true});
  }
  if(req.method==='POST'&&path==='/export'){
    z.object({}).strict().parse(await readJson(req));
    await auth.limit('export:'+actor,3,3600);
    const data=await db.actor(actor,async c=>({
      profile:(await c.query('SELECT display_name,wallet_address,created_at FROM reeklaim.accounts WHERE id=$1',[actor])).rows[0],
      preferences:(await c.query('SELECT notifications,match_alerts,hide_balance FROM reeklaim.account_settings WHERE account_id=$1',[actor])).rows[0]??defaultPreferences,
      items:(await c.query('SELECT id,name,category,status,commitment,version FROM reeklaim.items WHERE owner_id=$1',[actor])).rows,
      listings:(await c.query('SELECT id,title,description,country,city,kind,status,reward FROM reeklaim.market_reports WHERE owner_id=$1',[actor])).rows,
      cases:(await c.query('SELECT id,state,updated_at FROM reeklaim.claims WHERE $1 IN(claimant_id,reviewer_id) ORDER BY updated_at DESC LIMIT 100',[actor])).rows,
      payments:(await c.query('SELECT p.id,p.purpose,p.state,p.sends,r.tx_hash,r.height FROM reeklaim.payment_operations p LEFT JOIN reeklaim.chain_receipts r ON r.payment_id=p.id WHERE $1 IN(p.payer_id,p.recipient_id) LIMIT 100',[actor])).rows,
      notifications:(await c.query('SELECT kind,safe_message,created_at,read_at FROM reeklaim.notifications WHERE account_id=$1 ORDER BY created_at DESC LIMIT 500',[actor])).rows,
    }));
    return send(200,{exportedAt:new Date().toISOString(),...data});
  }
  throw missing();
}
