// @vitest-environment node
// Real isolated PostgreSQL; injected verifier results are SYNTHETIC, never live evidence.
import { describe,it,expect,beforeAll,beforeEach,afterAll,vi } from 'vitest';
import { existsSync,readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { createServer,type Server } from 'node:http';
import pg from 'pg';
import { bytesToBech32 } from '@qorechain/sdk';
import { Database } from '../server/auth/db.ts';
import { AuthService } from '../server/auth/service.ts';
import type { AuthConfig } from '../server/auth/config.ts';
import { PrivateStorage } from '../server/auth/storage.ts';
import { createAuthMiddleware } from '../server/auth/http.ts';
import { ItemService,type RegistrationVerifier } from '../server/items/service.ts';
import { CanonicalVerifier,ConfirmedTransactionFailure } from '../server/auth/receipt.ts';
import { seal,open,commitment } from '../server/items/crypto.ts';
import { emptyItem } from '../src/items/domain.ts';
import { migrate } from '../scripts/migrate.ts';
import { address } from './fixtures.ts';
import { csrf } from '../server/auth/security.ts';
import sharp from 'sharp';
const treasury='qor1ez7wqp5ala5ph5nx95n6tdedrccsacqndfjgx3';
const input={...emptyItem,name:'Synthetic camera',description:'A generic camera. No personal details.',serial:'PRIVATE-SYNTHETIC-SERIAL',showName:true};
const hash=()=>randomBytes(32).toString('hex').toUpperCase();
describe.skipIf(!existsSync('.local/admin.json'))('item service / real PostgreSQL / synthetic chain',()=>{
 let admin:pg.Client,db:Database,config:AuthConfig,items:ItemService,actor:string,other:string;let offline=false;let failed=false;
 const verifier:RegistrationVerifier={network:async()=>({chainId:'qorechain-diana',height:'100',blockTime:new Date().toISOString(),checkedAt:new Date().toISOString()}),verifyRegistration:async(intent,hash)=>{if(offline)throw new Error('Index offline');if(failed)throw new ConfirmedTransactionFailure('Fixture failure');return {hash,height:'101',timestamp:new Date().toISOString(),signer:intent.wallet_address,memo:intent.memo,verifierVersion:'rk-reg-1',localPqcVerified:true};}};
 beforeAll(async()=>{const local=JSON.parse(readFileSync('.local/admin.json','utf8'));const base=new URL(local.adminUrl);if(base.hostname!=='127.0.0.1'||base.port!=='55439'||base.pathname!=='/postgres')throw new Error('Only dedicated local test cluster permitted.');const owner=new pg.Client({connectionString:base.toString()});await owner.connect();if(!(await owner.query("SELECT 1 FROM pg_database WHERE datname='reeklaim_phase4_tests'")).rowCount)await owner.query('CREATE DATABASE reeklaim_phase4_tests');await owner.end();base.pathname='/reeklaim_phase4_tests';await migrate(base.toString());admin=new pg.Client({connectionString:base.toString()});await admin.connect();const runtime=JSON.parse(readFileSync('.local/runtime.json','utf8'));const testUrl=(s:string)=>{const url=new URL(s);url.pathname='/reeklaim_phase4_tests';return url.toString();};config={...runtime,treasuryAddress:treasury,authDatabaseUrl:testUrl(runtime.authDatabaseUrl),databaseUrl:testUrl(runtime.databaseUrl)};db=new Database(config);await db.checkRoles();items=new ItemService(db,config,verifier);},30000);
 beforeEach(async()=>{const names=(await admin.query("SELECT tablename FROM pg_tables WHERE schemaname='reeklaim'")).rows.map(r=>'reeklaim.'+r.tablename);await admin.query('TRUNCATE '+names.join(',')+' CASCADE');actor=(await admin.query('INSERT INTO reeklaim.accounts(wallet_address) VALUES($1) RETURNING id',[address])).rows[0].id;other=(await admin.query('INSERT INTO reeklaim.accounts(wallet_address) VALUES($1) RETURNING id',[bytesToBech32(new Uint8Array(20).fill(6),'qor')])).rows[0].id;offline=false;failed=false;});
 afterAll(async()=>{await db?.close();await admin?.end();});
 async function registered(){const {id}=await items.create(actor,input);await items.intent(actor,id);const tx=hash();await items.verify(actor,id,tx);return {id,tx,item:await items.detail(actor,id)};}
  it('publishes only approved reports and enforces ownership, filters, and transitions over HTTP',async()=>{
    const server=createServer();
    await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
    try{
      const addr=server.address();if(!addr||typeof addr==='string')throw new Error('Missing test port');
      const origin='http://127.0.0.1:'+addr.port;
      const cfg={...config,origin};
      const auth=new AuthService(db,cfg,{network:verifier.network,verify:async(challenge,hash)=>({hash,height:'101',timestamp:new Date().toISOString(),signer:challenge.wallet_address,memo:challenge.memo,verifierVersion:'rk-auth-1',localPqcVerified:true})});
      const middleware=createAuthMiddleware(cfg,{db,service:auth,storage:new PrivateStorage(db,cfg)});
      server.on('request',(req,res)=>void middleware(req,res,()=>{res.statusCode=404;res.end();}));
      async function login(wallet:string){
        const pre=await auth.createPre();const challenge=await auth.issue(pre,wallet);const session=await auth.verify(pre,challenge.id,hash());
        return {origin,cookie:'rk_dev_session='+session.token,'x-csrf-token':csrf(cfg,session.token),'content-type':'application/json'};
      }
      const owner=await login(address), stranger=await login(bytesToBech32(new Uint8Array(20).fill(6),'qor'));
      const market=origin+'/api/market';
      const post=(suffix:string,body:unknown,headers=owner)=>fetch(market+suffix,{method:'POST',headers,body:JSON.stringify(body)});
      const fields={title:'Travel cameras',description:'Small camera in a black fabric case',category:'electronics',country:'NG',city:'Lagos',occurred_on:'2026-01-01',reward:10000};
      const linked=await registered();
      const payload={...fields,kind:'lost',itemId:linked.id};
      expect((await post('',payload,{origin,cookie:'','x-csrf-token':'','content-type':'application/json'})).status).toBe(401);
      expect((await post('',payload,stranger)).status).toBe(404);
      expect((await post('',{...payload,title:'Call 08012345678'})).status).toBe(400);
      const created=await post('',payload);expect(created.status).toBe(201);
      const {id}=await created.json() as {id:string};
      expect((await fetch(market+'/'+id)).status).toBe(404);
      expect((await post('/'+id+'/publish',{approved:true,revision:1},stranger)).status).toBe(404);
      expect((await post('/'+id+'/close',{})).status).toBe(409);
      expect((await fetch(market+'/'+id+'/photo',{method:'POST',headers:{...owner,'content-type':'image/png'},body:'invalid image'})).status).toBe(415);
      expect((await post('/'+id+'/publish',{approved:true,revision:1})).status).toBe(200);
      const detail=await (await fetch(market+'/'+id)).json();
      expect(detail).toMatchObject({verified:true,title:fields.title});
      expect(detail).not.toHaveProperty('item_id');expect(detail).not.toHaveProperty('owner_id');
      expect(JSON.stringify(detail)).not.toContain('PRIVATE-SYNTHETIC-SERIAL');
      const listed=await fetch(market+'?q=camera&country=NG&city=lagos&reward=yes&verified=yes');
      expect(listed.status).toBe(200);expect((await listed.json()).items).toHaveLength(1);
      expect((await fetch(market+'?page=101')).status).toBe(400);
      expect((await fetch(market+'?kind=lost&kind=found')).status).toBe(400);
      expect((await items.detail(actor,linked.id)).status).toBe('missing');
      const scanToken=linked.item.recoveryUrl!.split('/').pop()!;
      const guest=await auth.createPre();const anonymous={origin,cookie:'rk_dev_pre='+guest,'x-csrf-token':csrf(cfg,guest),'content-type':'application/json'};
      const scan=await fetch(origin+'/api/recover/'+scanToken+'/contact',{method:'POST',headers:anonymous,body:JSON.stringify({message:'Left at the staffed desk.'})});
      expect(scan.status).toBe(201);
      const {followUpToken}=await scan.json() as {followUpToken:string};
      expect(followUpToken).toMatch(/^[A-Za-z0-9_-]{43}$/);
      expect(await (await post('/finder-status',{token:followUpToken},anonymous)).json()).toEqual({received:true});
      expect((await post('/finder-status',{token:scanToken},anonymous)).status).toBe(404);
      expect((await post('/'+id+'/abuse',{reason:'privacy'},anonymous)).status).toBe(201);
      expect((await post('/'+id+'/abuse',{reason:'privacy'},anonymous)).status).toBe(429);
      const claim=(await admin.query("INSERT INTO reeklaim.claims(item_id,claimant_id,reviewer_id) VALUES($1,$2,$3) RETURNING id",[linked.id,other,actor])).rows[0].id;
      const ownStatus=async()=>((await (await fetch(market+'/mine',{headers:owner})).json()).items.find((row:{id:string})=>row.id===id)).status;
      expect(await ownStatus()).toBe('claim_pending');
      const recovery=(await admin.query("INSERT INTO reeklaim.recovery_cases(claim_id) VALUES($1) RETURNING id",[claim])).rows[0].id;
      expect(await ownStatus()).toBe('recovery_in_progress');
      await admin.query("UPDATE reeklaim.recovery_cases SET state='returned' WHERE id=$1",[recovery]);
      expect(await ownStatus()).toBe('recovered');
      await items.action(actor,linked.id,'archive');
      expect((await fetch(market+'/'+id)).status).toBe(404);
      const unregistered=await post('',{...fields,kind:'lost',itemId:null});expect(unregistered.status).toBe(201);
      const found=await post('',{...fields,kind:'found',itemId:null,reward:0});expect(found.status).toBe(201);
      const foundId=(await found.json()).id;
      expect((await post('/'+foundId+'/publish',{approved:true,revision:1})).status).toBe(200);
      expect((await (await fetch(market+'/'+foundId)).json()).verified).toBe(false);
      expect((await post('/'+foundId+'/edit',{fields:{...fields,reward:0},revision:2})).status).toBe(200);
      expect((await fetch(market+'/'+foundId)).status).toBe(404);
      expect((await post('/'+foundId+'/publish',{approved:true,revision:2})).status).toBe(409);
      expect((await post('/'+foundId+'/publish',{approved:true,revision:3})).status).toBe(200);
      expect((await post('/'+foundId+'/close',{})).status).toBe(200);
      expect((await fetch(market+'/'+foundId)).status).toBe(404);
      await admin.query(`INSERT INTO reeklaim.market_reports(owner_id,kind,title,description,category,country,city,occurred_on,reward,status)
        SELECT $1,'lost','Headphones '||i,'Black headset','electronics','NG','Lagos','2026-01-01',0,'open' FROM generate_series(1,13) i`,[actor]);
      const first=await (await fetch(market+'?page=1')).json(),second=await (await fetch(market+'?page=2')).json();
      expect(first.items).toHaveLength(12);expect(first.more).toBe(true);expect(second.items).toHaveLength(1);expect(second.more).toBe(false);
      expect(first.items.some((row:{id:string})=>row.id===second.items[0].id)).toBe(false);
    }finally{await new Promise<void>(resolve=>server.close(()=>resolve()));}
  },20000);
  it('keeps competing claims and evidence isolated and commits only one concurrent approval',async()=>{
    const server=createServer();
    await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
    try{
      const addr=server.address();if(!addr||typeof addr==='string')throw new Error('Missing test port');
      const origin='http://127.0.0.1:'+addr.port;
      const cfg={...config,origin};
      const auth=new AuthService(db,cfg,{network:verifier.network,verify:async(challenge,hash)=>({hash,height:'101',timestamp:new Date().toISOString(),signer:challenge.wallet_address,memo:challenge.memo,verifierVersion:'rk-auth-1',localPqcVerified:true})});
      const storage=new PrivateStorage(db,cfg);
      const middleware=createAuthMiddleware(cfg,{db,service:auth,storage});
      server.on('request',(req,res)=>void middleware(req,res,()=>{res.statusCode=404;res.end();}));
      async function login(wallet:string){
        const pre=await auth.createPre();const challenge=await auth.issue(pre,wallet);const session=await auth.verify(pre,challenge.id,hash());
        return {account:session.accountId,headers:{origin,cookie:'rk_dev_session='+session.token,'x-csrf-token':csrf(cfg,session.token),'content-type':'application/json'}};
      }
      const owner=await login(address), finder=await login(bytesToBech32(new Uint8Array(20).fill(6),'qor'));
      const competitor=await login(bytesToBech32(new Uint8Array(20).fill(7),'qor'));
      const outsider=await login(bytesToBech32(new Uint8Array(20).fill(8),'qor'));
      async function report(account:string,kind:string,item:string|null=null){
        return (await admin.query(`INSERT INTO reeklaim.market_reports(owner_id,kind,title,description,category,country,city,occurred_on,reward,status,item_id,brand,model)
          VALUES($1,$2,'Travel camera','Camera in black travel case','electronics','NG','Lagos','2026-01-01',0,'open',$3,'Canon','R5') RETURNING id`,[account,kind,item])).rows[0].id as string;
      }
      const linked=await registered();
      await admin.query("UPDATE reeklaim.registration_intents SET envelope_cipher=$2 WHERE item_id=$1",[linked.id,Buffer.alloc(40)]);
      const lost=await report(actor,'lost',linked.id),found=await report(finder.account,'found'),lostOther=await report(competitor.account,'lost');
      const uploaded=await storage.upload(actor,Buffer.from('Synthetic proof of purchase'),'text/plain');
      const api=origin+'/api/claims';
      const post=(suffix:string,body:unknown,who=owner)=>fetch(api+suffix,{method:'POST',headers:who.headers,body:JSON.stringify(body)});
      const get=(suffix:string,who=owner)=>fetch(api+suffix,{headers:who.headers});
      const draft={lost,found,relationship:'owner',explanation:'I purchased this travel camera last spring.',distinguishing:'The internal case lining has a loose seam.',serial:'PRIVATE-SERIAL-FIXTURE'};
      expect((await post('',{...draft,explanation:''})).status).toBe(400);
      expect((await post('',draft,outsider)).status).toBe(404);
      expect((await (await get('/matches')).json()).matches[0].found.id).toBe(found);
      expect((await (await get('/matches')).json()).matches[0].found.id).toBe(found);
      expect((await admin.query("SELECT count(*)::int AS count FROM reeklaim.notifications WHERE account_id=$1 AND kind='match'",[actor])).rows[0].count).toBe(1);

      expect((await post('/dismiss',{lost,found})).status).toBe(200);
      expect((await (await get('/matches')).json()).matches).toEqual([]);
      const first=await post('',{...draft,files:[uploaded.id]});expect(first.status).toBe(201);
      const a=(await first.json()).id;
      const second=await post('',{...draft,lost:lostOther},competitor);expect(second.status).toBe(201);
      const b=(await second.json()).id;
      const detail=await (await get('/'+a,finder)).json();
      expect(detail.verification).toBe('unavailable');
      expect(detail.serialAgrees).toBeNull();
      expect(detail.files[0].id).toBe(uploaded.id);
      expect((await get('/'+a,outsider)).status).toBe(404);
      expect((await post('/'+a+'/actions',{action:'approve',version:1})).status).toBe(409);
      expect((await post('/'+a+'/files/'+uploaded.id+'/link',{},outsider)).status).toBe(404);
      const link=await (await post('/'+a+'/files/'+uploaded.id+'/link',{},finder)).json();
      expect((await fetch(origin+link.url,{headers:finder.headers})).status).toBe(200);
      expect((await fetch(origin+link.url,{headers:outsider.headers})).status).toBe(403);
      const expired=new URL(origin+link.url);expired.searchParams.set('expires','1');
      expect((await fetch(expired,{headers:finder.headers})).status).toBe(403);
      expect((await post('/'+a+'/actions',{action:'message',version:1,text:'Meet at the staffed desk.'})).status).toBe(200);
      expect((await post('/'+a+'/actions',{action:'message',version:1,text:'Duplicate request.'})).status).toBe(409);
      expect((await get('/'+a,competitor)).status).toBe(404);
      const approvals=await Promise.all([
        post('/'+a+'/actions',{action:'approve',version:2},finder),
        post('/'+b+'/actions',{action:'approve',version:1},finder),
      ]);
      expect(approvals.map(response=>response.status).sort()).toEqual([200,409]);
      const winner=approvals[0].ok?a:b;
      const claimant=winner===a?owner:competitor;
      const version=(await (await get('/'+winner,finder)).json()).version;
      expect((await post('/'+winner+'/actions',{action:'start',version},finder)).status).toBe(200);
      expect((await post('/'+winner+'/actions',{action:'resolve',version:version+1},finder)).status).toBe(200);
      expect((await (await get('/'+winner,finder)).json()).state).toBe('recovery_in_progress');
      expect((await post('/'+winner+'/actions',{action:'resolve',version:version+2},claimant)).status).toBe(200);
      expect((await (await get('/'+winner,finder)).json()).state).toBe('resolved');
      expect(JSON.stringify(await (await fetch(origin+'/api/market?kind=found')).json())).not.toContain('PRIVATE-SERIAL-FIXTURE');
      expect((await admin.query('SELECT count(*)::int AS count FROM reeklaim.recovery_cases')).rows[0].count).toBe(1);
      const rewardApi=origin+'/api/payments';
      const reward=(who:typeof owner,amount:string)=>fetch(rewardApi,{method:'POST',headers:who.headers,body:JSON.stringify({purpose:'reward',claim:winner,amount})});
      expect((await reward(outsider,'10')).status).toBe(404);
      vi.stubEnv('DIANA_ATOMIC_REWARDS_VERIFIED','');
      try{
        expect((await reward(claimant,'5000000')).status).toBe(503);
        const firstReward=await reward(claimant,'10'), duplicateReward=await reward(claimant,'20');
        expect(firstReward.status).toBe(201);
        expect(await duplicateReward.json()).toEqual(await firstReward.json());
        expect((await admin.query("SELECT sends FROM reeklaim.payment_operations WHERE claim_id=$1",[winner])).rows[0].sends).toEqual([{recipient:bytesToBech32(new Uint8Array(20).fill(6),'qor'),amount:'10'}]);
      }finally{vi.unstubAllEnvs();}

    }finally{await new Promise<void>(resolve=>server.close(()=>resolve()));}
  },30000);
  it('binds transfer consent and finalizes a single verified receipt after an indexing timeout',async()=>{
    const server=createServer();
    await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
    const network=vi.spyOn(CanonicalVerifier.prototype,'network').mockImplementation(verifier.network);
    const payments=vi.spyOn(CanonicalVerifier.prototype,'verifyPayment');
    try{
      const addr=server.address();if(!addr||typeof addr==='string')throw new Error('Missing test port');
      const origin='http://127.0.0.1:'+addr.port;
      const cfg={...config,origin};
      const auth=new AuthService(db,cfg,{network:verifier.network,verify:async(challenge,hash)=>({hash,height:'101',timestamp:new Date().toISOString(),signer:challenge.wallet_address,memo:challenge.memo,verifierVersion:'rk-auth-1',localPqcVerified:true})});
      const middleware=createAuthMiddleware(cfg,{db,service:auth,storage:new PrivateStorage(db,cfg)});
      server.on('request',(req,res)=>void middleware(req,res,()=>{res.statusCode=404;res.end();}));
      async function login(wallet:string){
        const pre=await auth.createPre();const challenge=await auth.issue(pre,wallet);const session=await auth.verify(pre,challenge.id,hash());
        return {account:session.accountId,headers:{origin,cookie:'rk_dev_session='+session.token,'x-csrf-token':csrf(cfg,session.token),'content-type':'application/json'}};
      }
      const wallet=bytesToBech32(new Uint8Array(20).fill(6),'qor');
      const owner=await login(address),recipient=await login(wallet);
      const outsider=await login(bytesToBech32(new Uint8Array(20).fill(9),'qor'));
      const registeredItem=await registered();
      const item=registeredItem.id;
      const oldTag=registeredItem.item.recoveryUrl!.split('/').pop();
      const api=origin+'/api/payments';
      const post=(suffix:string,body:unknown={},who=owner)=>fetch(api+suffix,{method:'POST',headers:who.headers,body:JSON.stringify(body)});
      expect((await post('',{purpose:'transfer',item,recipient:wallet},outsider)).status).toBe(404);
      const offer=await post('',{purpose:'transfer',item,recipient:wallet});
      expect(offer.status).toBe(201);
      const op='/'+(await offer.json()).id;
      expect((await post(op+'/prepare')).status).toBe(409);
      expect((await post(op+'/accept')).status).toBe(409);
      expect((await post(op+'/accept',{},outsider)).status).toBe(404);
      expect((await post(op+'/accept',{},recipient)).status).toBe(200);
      expect((await post(op+'/prepare')).status).toBe(200);
      expect((await post(op+'/approval')).status).toBe(200);
      expect((await post(op+'/approval')).status).toBe(409);
      const tx=hash();
      payments.mockRejectedValueOnce(new Error('Synthetic indexing timeout'));
      expect((await post(op+'/verify',{hash:tx})).status).toBe(422);
      expect((await post(op+'/verify',{hash:hash()})).status).toBe(409);
      expect((await post(op+'/cancel')).status).toBe(409);
      payments.mockImplementation(async(intent,_sends,hash)=>({hash,height:'101',timestamp:new Date().toISOString(),signer:intent.wallet_address,memo:intent.memo,verifierVersion:'rk-auth-1',localPqcVerified:true}));
      expect((await Promise.all([post(op+'/verify',{hash:tx}),post(op+'/verify',{hash:tx})])).map(r=>r.status)).toEqual([200,200]);
      expect((await post(op+'/verify',{hash:tx})).status).toBe(200);
      expect((await admin.query('SELECT count(*)::int AS count FROM reeklaim.chain_receipts WHERE payment_id IS NOT NULL')).rows[0].count).toBe(1);
      const receipt=await (await fetch(api,{headers:recipient.headers})).json();
      expect(receipt.operations[0]).toMatchObject({state:'confirmed',receipt_hash:tx,sends:[{recipient:treasury,amount:'50000'}]});
      expect((await admin.query('SELECT owner_id FROM reeklaim.items WHERE id=$1',[item])).rows[0].owner_id).toBe(recipient.account);
      expect((await fetch(origin+'/api/items/'+item,{headers:owner.headers})).status).toBe(404);
      const newItem=await (await fetch(origin+'/api/items/'+item,{headers:recipient.headers})).json();
      expect(newItem.input.serial).toBe('');
      expect(newItem.recoveryUrl).toBeNull();
      expect((await fetch(origin+'/api/recover/'+oldTag)).status).toBe(404);
    }finally{
      network.mockRestore();payments.mockRestore();
      await new Promise<void>(resolve=>server.close(()=>resolve()));
    }
  },30000);
  it('isolates workspace metrics, notifications, exports and organization membership and permissions',async()=>{
    const server=createServer();
    await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
    try{
      const addr=server.address();if(!addr||typeof addr==='string')throw new Error('Missing test port');
      const origin='http://127.0.0.1:'+addr.port;
      const cfg={...config,origin};
      const auth=new AuthService(db,cfg,{network:verifier.network,verify:async(challenge,hash)=>({hash,height:'101',timestamp:new Date().toISOString(),signer:challenge.wallet_address,memo:challenge.memo,verifierVersion:'rk-auth-1',localPqcVerified:true})});
      const middleware=createAuthMiddleware(cfg,{db,service:auth,storage:new PrivateStorage(db,cfg)});
      server.on('request',(req,res)=>void middleware(req,res,()=>{res.statusCode=404;res.end();}));
      async function login(wallet:string){
        const pre=await auth.createPre();const challenge=await auth.issue(pre,wallet);const session=await auth.verify(pre,challenge.id,hash());
        return {account:session.accountId,headers:{origin,cookie:'rk_dev_session='+session.token,'x-csrf-token':csrf(cfg,session.token),'content-type':'application/json'}};
      }
      const staffWallet=bytesToBech32(new Uint8Array(20).fill(6),'qor');
      const owner=await login(address),staff=await login(staffWallet),stranger=await login(bytesToBech32(new Uint8Array(20).fill(9),'qor'));
      const base=origin+'/api/workspace';
      const get=(path:string,who=owner)=>fetch(base+path,{headers:who.headers});
      const post=(path:string,body:unknown={},who=owner)=>fetch(base+path,{method:'POST',headers:who.headers,body:JSON.stringify(body)});
      expect((await fetch(base+'/overview')).status).toBe(401);
      const linked=await registered();
      await items.action(actor,linked.id,'missing');
      const token=linked.item.recoveryUrl!.split('/').pop()!;
      await items.contact(token,'This private message must not appear in notifications.');
      const ownerStats=await (await get('/overview')).json(),staffStats=await (await get('/overview',staff)).json();
      expect(ownerStats.counts).toMatchObject({registered:1,missing:1,unread:1});
      expect(staffStats.counts).toMatchObject({registered:0,missing:0,unread:0});
      const alerts=await (await get('/notifications')).json();
      const notice=alerts.items[0];
      expect(notice.href).toBe('/app/items/'+linked.id);
      expect(notice.safe_message).not.toContain('private message');
      expect((await post('/notifications/read',{id:notice.id},staff)).status).toBe(404);
      expect((await post('/notifications/read',{id:notice.id})).status).toBe(200);
      expect((await post('/notifications/read',{id:notice.id})).status).toBe(200);
      expect((await (await get('/notifications')).json()).unread).toBe(0);
      expect((await post('/settings',{notifications:false,match_alerts:false,hide_balance:true})).status).toBe(200);
      expect((await (await get('/settings')).json()).preferences.hide_balance).toBe(true);
      await items.contact(token,'No second alert should be produced while disabled.');
      expect((await (await get('/notifications')).json()).items).toHaveLength(1);
      const orgs='/organizations';
      const profile={name:'Synthetic Airport Desk',kind:'airport',description:'Isolated test organization'};
      const created=await post(orgs,profile);expect(created.status).toBe(201);
      const org=(await created.json()).id;
      const tenant=orgs+'/'+org;
      const second=await post(orgs,{...profile,name:'Another Synthetic Workspace'},stranger);expect(second.status).toBe(201);
      expect((await get(tenant,stranger)).status).toBe(404);
      expect((await post(tenant+'/invite',{address:staffWallet,role:'staff'})).status).toBe(200);
      expect((await get(tenant,staff)).status).toBe(404);
      const invites=await (await get(orgs,staff)).json();
      expect(invites.invitations).toHaveLength(1);
      const invite=orgs+'/'+invites.invitations[0].id+'/accept';
      expect((await post(invite,{},stranger)).status).toBe(404);
      expect((await post(invite,{},staff)).status).toBe(200);
      expect((await post(invite,{},staff)).status).toBe(404);
      const inventory={title:'Synthetic found umbrella',notes:'Held at desk',kind:'found',registeredItem:null};
      expect((await post(tenant+'/inventory',inventory,stranger)).status).toBe(404);
      expect((await post(tenant+'/inventory',inventory,staff)).status).toBe(200);
      const desk=await (await get(tenant,staff)).json();
      expect(desk.organization.role).toBe('staff');
      expect(desk.counts).toEqual([{kind:'found',status:'held',total:1}]);
      const review={inventory:desk.inventory[0].id,version:1,status:'review',notes:'Manual review in progress'};
      expect((await post(tenant+'/review',review,staff)).status).toBe(403);
      expect((await post(tenant+'/member',{account:staff.account,role:'admin'})).status).toBe(200);
      expect((await post(tenant+'/review',review,staff)).status).toBe(200);
      expect((await post(tenant+'/review',review,staff)).status).toBe(409);
      expect((await post(tenant+'/member',{account:owner.account,role:'remove'},staff)).status).toBe(403);
      expect((await post(tenant+'/inventory',{...inventory,kind:'asset',registeredItem:linked.id},staff)).status).toBe(404);
      expect((await post('/export',{account:staff.account})).status).toBe(400);
      const exported=await (await post('/export',{},staff)).json();
      expect(exported.items).toEqual([]);
      expect(JSON.stringify(exported)).not.toContain(linked.id);
      expect((await post('/deletion',{confirm:'REQUEST DELETION',account:staff.account})).status).toBe(400);
      expect((await post('/deletion',{confirm:'REQUEST DELETION'})).status).toBe(202);
      expect((await (await get('/settings',staff)).json()).deletion).toBeNull();
    }finally{await new Promise<void>(resolve=>server.close(()=>resolve()));}
  },30000);
 it('creates a private encrypted draft with no public tag or receipt',async()=>{const {id}=await items.create(actor,input);const detail=await items.detail(actor,id);expect(detail.input.serial).toBe(input.serial);expect(detail.recoveryUrl).toBeNull();expect(detail.receipt).toBeNull();const row=(await admin.query('SELECT metadata_cipher FROM reeklaim.items WHERE id=$1',[id])).rows[0];expect(row.metadata_cipher.includes(Buffer.from(input.serial))).toBe(false);expect(detail.versions).toHaveLength(1);});
 it('requires the configured treasury before starting a registration payment and preserves reconciliation',async()=>{
  const {id}=await items.create(actor,input);
  const unconfigured=new ItemService(db,{...config,treasuryAddress:undefined},verifier);
  await expect(unconfigured.intent(actor,id)).rejects.toMatchObject({code:'TREASURY'});
  await items.intent(actor,id);
  await expect(unconfigured.beginApproval(actor,id)).rejects.toMatchObject({code:'TREASURY'});
  const changedTreasury=new ItemService(db,{...config,treasuryAddress:address},verifier);
  await expect(changedTreasury.beginApproval(actor,id)).rejects.toMatchObject({code:'APPROVAL_STARTED'});
  expect((await items.detail(actor,id)).intent?.approvalStarted).toBe(false);
  await unconfigured.verify(actor,id,hash());
  expect((await items.detail(actor,id)).status).toBe('registered');
 });
 it('reports paid registration as unavailable when production collection is disabled',async()=>{
  const {id}=await items.create(actor,input);
  vi.stubEnv('NODE_ENV','production');
  vi.stubEnv('DIANA_PAYMENT_COLLECTION_APPROVED','');
  try {
   expect((await items.list(actor)).registrationAvailable).toBe(false);
   expect((await items.detail(actor,id)).registrationAvailable).toBe(false);
   await expect(items.intent(actor,id)).rejects.toMatchObject({code:'COLLECTION_DISABLED'});
  }finally{vi.unstubAllEnvs();}
 });
 it('enforces cross-account reads, writes, intents, verification and empty actor RLS',async()=>{const {id}=await items.create(actor,input);await expect(items.detail(other,id)).rejects.toThrow(/not found/);await expect(items.edit(other,id,input,1)).rejects.toThrow(/not found/);await expect(items.intent(other,id)).rejects.toThrow(/not found/);await expect(items.verify(other,id,hash())).rejects.toThrow(/not found/);expect((await db.runtime.query('SELECT * FROM reeklaim.items')).rowCount).toBe(0);});
 it('binds an idempotent exact fee intent to the immutable snapshot and owner',async()=>{const {id}=await items.create(actor,input);const first=await items.intent(actor,id);const again=await items.intent(actor,id);expect(again).toEqual(first);expect(first.amountUqor).toBe('100000');expect(first.recipient).toBe(treasury);expect(first.address).toBe(address);expect(Buffer.byteLength(first.memo)).toBeLessThanOrEqual(256);expect(first.memo).not.toContain(input.serial);await expect(items.edit(actor,id,input,1)).rejects.toThrow(/Reconcile/);});
 it('retains one durable approval reservation across page reloads',async()=>{const {id}=await items.create(actor,input);await items.intent(actor,id);await items.beginApproval(actor,id);await expect(items.beginApproval(actor,id)).rejects.toThrow(/already started/);expect((await items.detail(actor,id)).intent?.approvalStarted).toBe(true);});
 it('finalizes once atomically and treats same-hash retry idempotently',async()=>{const {id}=await items.create(actor,input);await items.intent(actor,id);const tx=hash();await Promise.all([items.verify(actor,id,tx),items.verify(actor,id,tx)]);const detail=await items.detail(actor,id);expect(detail.status).toBe('registered');expect(detail.receipt?.tx_hash).toBe(tx);expect(detail.recoveryUrl).toMatch(/\/recover\/[A-Za-z0-9_-]{43}$/);expect((await admin.query('SELECT count(*)::int AS n FROM reeklaim.chain_receipts')).rows[0].n).toBe(1);});
 it('preserves a candidate hash across indexing failure and reconciles without another intent',async()=>{const {id}=await items.create(actor,input);const intent=await items.intent(actor,id);const tx=hash();offline=true;await expect(items.verify(actor,id,tx)).rejects.toThrow(/do not pay again/);expect((await items.detail(actor,id)).recoveryUrl).toBeNull();expect((await items.intent(actor,id)).id).toBe(intent.id);await expect(items.verify(actor,id,hash())).rejects.toThrow(/existing transaction/);offline=false;await items.verify(actor,id,tx);expect((await items.detail(actor,id)).status).toBe('registered');});
 it('reconciles an expired intent when its exact transaction committed within the original window',async()=>{const {id}=await items.create(actor,input);await items.intent(actor,id);await admin.query("UPDATE reeklaim.registration_intents SET issued_at=now()-interval '20 minutes',expires_at=now()-interval '5 minutes' WHERE item_id=$1",[id]);await expect(items.beginApproval(actor,id)).rejects.toThrow(/expired/);await items.verify(actor,id,hash());expect((await items.detail(actor,id)).status).toBe('registered');});
 it('records conclusively failed transactions without issuing a tag or permitting a second payment',async()=>{const {id}=await items.create(actor,input);const intent=await items.intent(actor,id);failed=true;await expect(items.verify(actor,id,hash())).rejects.toThrow(/failed on chain/);const detail=await items.detail(actor,id);expect(detail.intent?.state).toBe('failed');expect(detail.recoveryUrl).toBeNull();expect((await items.intent(actor,id)).id).toBe(intent.id);});
 it('rejects duplicate receipt use across items with complete rollback',async()=>{const first=await registered();const second=await items.create(actor,input);await items.intent(actor,second.id);await expect(items.verify(actor,second.id,first.tx)).rejects.toThrow(/already recorded/);expect((await items.detail(actor,second.id)).status).toBe('draft');expect((await items.detail(actor,second.id)).recoveryUrl).toBeNull();});
 it('shares transaction replay protection with authentication receipts',async()=>{const auth=new AuthService(db,config,{network:verifier.network,verify:async(challenge,hash)=>({hash,height:'101',timestamp:new Date().toISOString(),signer:challenge.wallet_address,memo:challenge.memo,verifierVersion:'rk-auth-1',localPqcVerified:true})});const pre=await auth.createPre();const challenge=await auth.issue(pre,address);const tx=hash();await auth.verify(pre,challenge.id,tx);const {id}=await items.create(actor,input);await items.intent(actor,id);await expect(items.verify(actor,id,tx)).rejects.toThrow(/already recorded/);expect((await items.detail(actor,id)).recoveryUrl).toBeNull();});
 it('keeps snapshot salts private and preserves the exact canonical anchoring envelope',async()=>{const {id}=await items.create(actor,input);const intent=await items.intent(actor,id);const detail=await items.detail(actor,id);const snapshot=(await admin.query('SELECT snapshot_cipher FROM reeklaim.item_versions WHERE item_id=$1',[id])).rows[0];const decoded=open<{input:typeof input;salt:string}>(config.storageKey,`rk:snapshot:v1:${id}:1`,snapshot.snapshot_cipher);expect(commitment(id,1,decoded.input,null,null,null,decoded.salt).hash).toBe(intent.commitment);expect(digestEnvelope(detail.anchoringEnvelope!)).toBe(intent.memo);await expect(db.actor(actor,c=>c.query('UPDATE reeklaim.items SET commitment=$2 WHERE id=$1',[id,'f'.repeat(64)]))).rejects.toThrow(/immutable/);});
 it('publishes an allowlist only and uses high entropy tokens separate from UUIDs',async()=>{const {id,item}=await registered();const token=item.recoveryUrl!.split('/').pop()!;expect(Buffer.from(token,'base64url')).toHaveLength(32);expect(token).not.toContain(id);const json=JSON.stringify(await items.publicRead(token));expect(JSON.parse(json)).toEqual({name:input.name,description:null,status:'registered',hasPhoto:false});for(const secret of [input.serial,actor,address,id,treasury,item.originalCommitment!])expect(json).not.toContain(secret);});
 it('rotates and revokes old QR tokens atomically and archives the projection',async()=>{const {id,item}=await registered();const before=item.recoveryUrl!.split('/').pop()!;await items.action(actor,id,'rotate');const after=(await items.detail(actor,id)).recoveryUrl!.split('/').pop()!;expect(after).not.toBe(before);await expect(items.publicRead(before)).rejects.toThrow(/revoked/);await items.publicRead(after);await items.action(actor,id,'archive');await expect(items.publicRead(after)).rejects.toThrow(/revoked/);expect((await items.detail(actor,id)).recoveryUrl).toBeNull();});
 it('preserves the original immutable commitment when metadata changes',async()=>{const {id,item}=await registered();await items.edit(actor,id,{...input,name:'New safe label',showName:false},1);const next=await items.detail(actor,id);expect(next.originalCommitment).toBe(item.originalCommitment);expect(next.version).toBe(2);expect(next.versions).toHaveLength(2);expect(next.versions[1].commitment).not.toBe(next.versions[0].commitment);expect((await items.publicRead(next.recoveryUrl!.split('/').pop()!)).name).toBeNull();await expect(items.edit(actor,id,input,1)).rejects.toThrow(/changed/);await expect(db.actor(actor,c=>c.query("UPDATE reeklaim.item_versions SET commitment=$1 WHERE item_id=$2",['a'.repeat(64),id]))).rejects.toThrow(/permission/);});
 it('marks missing without changing ownership and accepts a private anonymous one-way request',async()=>{const {id,item}=await registered();const token=item.recoveryUrl!.split('/').pop()!;await items.action(actor,id,'missing');expect((await items.publicRead(token)).status).toBe('missing');await items.contact(token,'Synthetic finder: left at a staffed desk.');const detail=await items.detail(actor,id);expect(detail.requests[0].message).toContain('staffed desk');expect((await items.list(other)).items).toHaveLength(0);expect(JSON.stringify(await items.publicRead(token))).not.toContain('staffed desk');});
 it('rejects extra owner/commitment fields and foreign evidence references',async()=>{await expect(items.create(actor,{...input,owner_id:other})).rejects.toThrow();const foreign=(await admin.query("INSERT INTO reeklaim.evidence(owner_id,object_key,mime,bytes,sha256) VALUES($1,$2,'text/plain',1,$3) RETURNING id",[other,'a'.repeat(64),'b'.repeat(64)])).rows[0].id;await expect(items.create(actor,{...input,evidenceId:foreign})).rejects.toThrow(/own private/);expect((await items.list(actor)).items).toHaveLength(0);});
 it('exposes neither anonymous item access nor CSRF-free contact mutations over HTTP',async()=>{let server:Server|undefined;try{server=createServer();await new Promise<void>(resolve=>server!.listen(0,'127.0.0.1',resolve));const addr=server.address();if(!addr||typeof addr==='string')throw new Error();const origin='http://127.0.0.1:'+addr.port;const cfg={...config,origin};const auth=new AuthService(db,cfg);const middleware=createAuthMiddleware(cfg,{db,service:auth,storage:new PrivateStorage(db,cfg)});server.on('request',(req,res)=>void middleware(req,res,()=>{res.statusCode=404;res.end();}));expect((await fetch(origin+'/api/items')).status).toBe(401);expect((await fetch(origin+'/api/items',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(input)})).status).toBe(401);const {item}=await registered();const token=item.recoveryUrl!.split('/').pop()!;expect((await fetch(origin+'/api/recover/'+token)).status).toBe(200);expect((await fetch(origin+'/api/recover/'+token+'/contact',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify({message:'Synthetic public request'})})).status).toBe(403);}finally{if(server)await new Promise<void>(resolve=>server!.close(()=>resolve()));}});
 it('authorizes real HTTP drafts and sanitized public photos, rejecting malicious uploads and accepting a CSRF-bound anonymous request',async()=>{let server:Server|undefined;try{server=createServer();await new Promise<void>(resolve=>server!.listen(0,'127.0.0.1',resolve));const addr=server.address();if(!addr||typeof addr==='string')throw new Error();const origin='http://127.0.0.1:'+addr.port;const cfg={...config,origin};const auth=new AuthService(db,cfg,{network:verifier.network,verify:async(challenge,hash)=>({hash,height:'101',timestamp:new Date().toISOString(),signer:challenge.wallet_address,memo:challenge.memo,verifierVersion:'rk-auth-1',localPqcVerified:true})});const pre=await auth.createPre();const challenge=await auth.issue(pre,address);const login=await auth.verify(pre,challenge.id,hash());const headers={origin,cookie:'rk_dev_session='+login.token,'x-csrf-token':csrf(cfg,login.token),'content-type':'application/json'};const middleware=createAuthMiddleware(cfg,{db,service:auth,storage:new PrivateStorage(db,cfg)});server.on('request',(req,res)=>void middleware(req,res,()=>{res.statusCode=404;res.end();}));const saved=await fetch(origin+'/api/items',{method:'POST',headers,body:JSON.stringify({...input,showPhoto:true})});expect(saved.status).toBe(201);const {id}=await saved.json() as {id:string};for(const [mime,body] of [['image/svg+xml','<svg onload="alert(1)"></svg>'],['image/png','not an image']])expect((await fetch(origin+'/api/items/'+id+'/photo',{method:'POST',headers:{...headers,'content-type':mime},body})).status).toBe(415);const png=await sharp({create:{width:40,height:40,channels:3,background:'#7c3aed'}}).png().withMetadata({exif:{IFD0:{Artist:'SYNTHETIC PRIVATE METADATA'}}}).toBuffer();const uploaded=await fetch(origin+'/api/items/'+id+'/photo',{method:'POST',headers:{...headers,'content-type':'image/png'},body:new Uint8Array(png)});expect(uploaded.status).toBe(200);await items.intent(actor,id);await items.verify(actor,id,hash());const detail=await items.detail(actor,id);const token=detail.recoveryUrl!.split('/').pop()!;const photo=await fetch(origin+'/api/recover/'+token+'/photo');expect(photo.status).toBe(200);expect((await sharp(Buffer.from(await photo.arrayBuffer())).metadata()).exif).toBeUndefined();const initial=await fetch(origin+'/api/auth/session');const guest=await initial.json() as {csrf:string};const cookie=initial.headers.getSetCookie().find(c=>c.startsWith('rk_dev_pre='))!.split(';')[0];const contact=await fetch(origin+'/api/recover/'+token+'/contact',{method:'POST',headers:{origin,cookie,'x-csrf-token':guest.csrf,'content-type':'application/json'},body:JSON.stringify({message:'Synthetic anonymous request at a staffed desk.'})});expect(contact.status).toBe(201);expect((await items.detail(actor,id)).requests).toHaveLength(1);await items.action(actor,id,'rotate');expect((await fetch(origin+'/api/recover/'+token+'/photo')).status).toBe(404);}finally{if(server)await new Promise<void>(resolve=>server!.close(()=>resolve()));}});
});
import { createHash } from 'node:crypto';
const digestEnvelope=(value:string)=>'rk:reg:v1:'+createHash('sha256').update(value).digest('base64url');
describe('registration commitment and encryption primitives',()=>{
 it('uses a fresh salt, explicit domain, version and canonical field order',()=>{const a=commitment('synthetic',1,input,null,null,null);const b=commitment('synthetic',1,input,null,null,null);expect(a.hash).not.toBe(b.hash);expect(commitment('synthetic',1,{...input},null,null,null,a.salt).hash).toBe(a.hash);expect(commitment('synthetic',2,input,null,null,null,a.salt).hash).not.toBe(a.hash);expect(a.salt).toHaveLength(64);});
 it('authenticates ciphertext purpose and detects tampering',()=>{const key=randomBytes(32).toString('hex');const bytes=seal(key,'purpose-a',input);expect(open(key,'purpose-a',bytes)).toEqual(input);expect(()=>open(key,'purpose-b',bytes)).toThrow();bytes[20]^=1;expect(()=>open(key,'purpose-a',bytes)).toThrow();});
});
