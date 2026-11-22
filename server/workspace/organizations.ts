import {z} from 'zod';
import type {IncomingMessage} from 'node:http';
import type {AuthService} from '../auth/service.ts';
import {HttpError,readJson} from '../auth/security.ts';
import {nativeAddress} from '../../src/lib/amounts.ts';
const profile=z.object({name:z.string().trim().min(2).max(100),kind:z.enum(['university','hotel','airport','transport','business','venue']),description:z.string().trim().max(500)}).strict();
const roles=z.enum(['admin','staff']);
const unavailable=()=>new HttpError(404,'ORG','Organization record unavailable.');
const forbidden=()=>new HttpError(403,'ORG_ROLE','Your organization role cannot perform this action.');
export async function organizationRoute(req:IncomingMessage,path:string,auth:AuthService,actor:string,send:(status:number,data:unknown)=>void){
  const db=auth.db;
  const [, ,id,action,...rest]=path.split('/');
  if(rest.length)throw unavailable();
  if(req.method==='GET'&&!id){
    return send(200,await db.actor(actor,async c=>({
      organizations:(await c.query('SELECT id,name,kind,description,reeklaim.org_role(id) AS role FROM reeklaim.organizations ORDER BY created_at DESC LIMIT 100')).rows,
      invitations:(await c.query('SELECT id,org_name,role,expires_at FROM reeklaim.organization_invites WHERE invitee=$1 AND accepted_at IS NULL AND revoked_at IS NULL AND expires_at>now() ORDER BY expires_at LIMIT 100',[actor])).rows,
    })));
  }
  if(req.method==='POST'&&!id){
    const data=profile.parse(await readJson(req));
    return send(201,await db.actor(actor,async c=>(await c.query('SELECT reeklaim.create_workspace_org($1,$2,$3) AS id',[data.name,data.kind,data.description])).rows[0]));
  }
  z.uuid().parse(id);
  if(req.method==='POST'&&action==='accept'){
    const row=await db.actor(actor,async c=>(await c.query('SELECT reeklaim.accept_workspace_invite($1) AS id',[id])).rows[0]);
    if(!row.id)throw unavailable();
    return send(200,row);
  }
  if(req.method==='GET'&&!action){
    return send(200,await db.actor(actor,async c=>{
      const organization=(await c.query('SELECT id,name,kind,description,reeklaim.org_role(id) AS role FROM reeklaim.organizations WHERE id=$1',[id])).rows[0];
      if(!organization)throw unavailable();
      const inventory=(await c.query('SELECT id,title,notes,kind,status,version,created_at FROM reeklaim.organization_inventory WHERE org_id=$1 ORDER BY created_at DESC LIMIT 100',[id])).rows;
      const members=(await c.query('SELECT account_id,role,created_at FROM reeklaim.memberships WHERE organization_id=$1 ORDER BY created_at LIMIT 100',[id])).rows;
      const invitations=(await c.query('SELECT id,role,expires_at FROM reeklaim.organization_invites WHERE org_id=$1 AND accepted_at IS NULL AND revoked_at IS NULL AND expires_at>now() ORDER BY expires_at LIMIT 100',[id])).rows;
      const activity=(await c.query('SELECT id,action,at FROM reeklaim.organization_activity WHERE org_id=$1 ORDER BY at DESC LIMIT 20',[id])).rows;
      const counts=(await c.query('SELECT kind,status,count(*)::int AS total FROM reeklaim.organization_inventory WHERE org_id=$1 GROUP BY kind,status',[id])).rows;
      return {organization,inventory,members,invitations,activity,counts,actor};
    }));
  }
  if(req.method!=='POST')throw unavailable();
  const body=await readJson(req,8192);
  await db.actor(actor,async c=>{
    await c.query('SELECT pg_advisory_xact_lock(hashtextextended($1,832))',[id]);
    const org=(await c.query('SELECT name,reeklaim.org_role(id) AS role FROM reeklaim.organizations WHERE id=$1',[id])).rows[0];
    if(!org)throw unavailable();
    const manager=['owner','admin'].includes(org.role);
    if(action==='profile'){
      if(!manager)throw forbidden();
      const data=profile.parse(body);
      await c.query('UPDATE reeklaim.organizations SET name=$2,kind=$3,description=$4 WHERE id=$1',[id,data.name,data.kind,data.description]);
    }else if(action==='invite'){
      const data=z.object({address:z.string().max(90),role:roles}).strict().parse(body);
      if(!manager||(org.role!=='owner'&&data.role!=='staff'))throw forbidden();
      let address;
      try{address=nativeAddress(data.address);}catch{throw new HttpError(400,'ORG_ADDRESS','Enter a valid Diana native wallet address.');}
      const target=(await db.auth.query('SELECT id FROM reeklaim.accounts WHERE wallet_address=$1',[address])).rows[0]?.id;
      if(!target||target===actor)throw unavailable();
      if((await c.query('SELECT 1 FROM reeklaim.memberships WHERE organization_id=$1 AND account_id=$2',[id,target])).rowCount)throw new HttpError(409,'ORG_MEMBER','This account is already a member.');
      if(Number((await c.query('SELECT count(*) FROM reeklaim.organization_invites WHERE org_id=$1 AND accepted_at IS NULL AND revoked_at IS NULL AND expires_at>now()',[id])).rows[0].count)>=50)throw new HttpError(409,'ORG_INVITES','Invitation limit reached.');
      await c.query('UPDATE reeklaim.organization_invites SET revoked_at=now() WHERE org_id=$1 AND invitee=$2 AND expires_at<=now() AND accepted_at IS NULL AND revoked_at IS NULL',[id,target]);
      await c.query(`INSERT INTO reeklaim.organization_invites(org_id,org_name,invitee,role) VALUES($1,$2,$3,$4)
        ON CONFLICT(org_id,invitee) WHERE accepted_at IS NULL AND revoked_at IS NULL DO NOTHING`,[id,org.name,target,data.role]);
    }else if(action==='revoke'){
      if(!manager)throw forbidden();
      const {invite}=z.object({invite:z.uuid()}).strict().parse(body);
      if(!(await c.query('UPDATE reeklaim.organization_invites SET revoked_at=now() WHERE id=$1 AND org_id=$2 AND accepted_at IS NULL AND revoked_at IS NULL',[invite,id])).rowCount)throw unavailable();
    }else if(action==='member'){
      if(org.role!=='owner')throw forbidden();
      const data=z.object({account:z.uuid(),role:z.union([roles,z.literal('remove')])}).strict().parse(body);
      const r=data.role==='remove'?await c.query("DELETE FROM reeklaim.memberships WHERE organization_id=$1 AND account_id=$2 AND role<>'owner'",[id,data.account]):
        await c.query("UPDATE reeklaim.memberships SET role=$3 WHERE organization_id=$1 AND account_id=$2 AND role<>'owner'",[id,data.account,data.role]);
      if(!r.rowCount)throw unavailable();
    }else if(action==='inventory'){
      const data=z.object({title:z.string().trim().min(2).max(100),notes:z.string().trim().max(800),kind:z.enum(['found','asset']),registeredItem:z.uuid().nullable()}).strict().parse(body);
      if(data.kind==='asset'&&!manager)throw forbidden();
      if((data.kind==='asset')!==!!data.registeredItem)throw unavailable();
      if(data.registeredItem&&!(await c.query("SELECT 1 FROM reeklaim.items WHERE id=$1 AND owner_id=$2 AND commitment IS NOT NULL AND status IN ('registered','returned') FOR UPDATE",[data.registeredItem,actor])).rowCount)throw unavailable();
      if(Number((await c.query('SELECT count(*) FROM reeklaim.organization_inventory WHERE org_id=$1',[id])).rows[0].count)>=1000)throw new HttpError(409,'ORG_CAPACITY','Inventory limit reached.');
      await c.query(`INSERT INTO reeklaim.organization_inventory(org_id,title,notes,kind,registered_item) VALUES($1,$2,$3,$4,$5)
        ON CONFLICT(org_id,registered_item) WHERE registered_item IS NOT NULL DO NOTHING`,[id,data.title,data.notes,data.kind,data.registeredItem]);
    }else if(action==='review'){
      if(!manager)throw forbidden();
      const data=z.object({inventory:z.uuid(),version:z.number().int().positive(),status:z.enum(['held','review','approved','recovered','closed']),notes:z.string().trim().max(800)}).strict().parse(body);
      const row=(await c.query('SELECT status,kind,version FROM reeklaim.organization_inventory WHERE id=$1 AND org_id=$2 FOR UPDATE',[data.inventory,id])).rows[0];
      if(!row)throw unavailable();
      const next:Record<string,string[]>={held:['review','closed'],review:['approved','held','closed'],approved:['recovered','review'],recovered:['closed']};
      const valid=row.kind==='asset'?row.status==='held'&&data.status==='closed':next[row.status]?.includes(data.status);
      if(row.version!==data.version||!valid)throw new HttpError(409,'ORG_STATE','Inventory changed or that transition is unavailable.');
      await c.query('UPDATE reeklaim.organization_inventory SET status=$3,notes=$4,version=version+1 WHERE id=$1 AND org_id=$2',[data.inventory,id,data.status,data.notes]);
    }else throw unavailable();
    await c.query('INSERT INTO reeklaim.organization_activity(org_id,actor_id,action) VALUES($1,$2,$3)',[id,actor,'organization.'+action]);
  });
  return send(200,{saved:true});
}
