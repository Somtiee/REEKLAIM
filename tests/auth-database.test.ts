// @vitest-environment node
// Real isolated PostgreSQL. Chain verifier is an explicitly injected test double, never live evidence.
import { describe,it,expect,beforeAll,beforeEach,afterAll,vi } from 'vitest';
import { existsSync,readFileSync } from 'node:fs';
import { mkdtemp,readFile,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash,randomBytes } from 'node:crypto';
import { createServer,type Server } from 'node:http';
import pg from 'pg';
import { Database } from '../server/auth/db.ts';
import { AuthService,type Verifier } from '../server/auth/service.ts';
import { PrivateStorage } from '../server/auth/storage.ts';
import { digest,opaque } from '../server/auth/security.ts';
import { createAuthMiddleware } from '../server/auth/http.ts';
import type { AuthConfig } from '../server/auth/config.ts';
import { migrate } from '../scripts/migrate.ts';
import { address } from './fixtures.ts';
import { bytesToBech32 } from '@qorechain/sdk';
const configured=existsSync('.local/admin.json')&&existsSync('.local/runtime.json');
describe.skipIf(!configured)('PostgreSQL-backed auth, RLS and private storage',()=>{
 let admin:pg.Client;let db:Database;let service:AuthService;let config:AuthConfig;let storage:PrivateStorage;let directory:string;let rejectChain=false;let overrideHash:string|null=null;
 const verifier:Verifier={network:async()=>({chainId:'qorechain-diana',height:'100',blockTime:new Date().toISOString(),checkedAt:new Date().toISOString()}),verify:async(challenge,hash)=>{if(rejectChain)throw new Error('Offline');return {hash:overrideHash??hash,height:'101',timestamp:new Date().toISOString(),signer:challenge.wallet_address,memo:challenge.memo,verifierVersion:'rk-auth-1',localPqcVerified:true};}};
 const hash=()=>createHash('sha256').update(randomBytes(32)).digest('hex').toUpperCase();
 beforeAll(async()=>{
 const local=JSON.parse(readFileSync('.local/admin.json','utf8'));const base=new URL(local.adminUrl);if(base.hostname!=='127.0.0.1'||base.port!=='55439'||base.pathname!=='/postgres')throw new Error('Tests require the dedicated isolated local cluster.');const owner=new pg.Client({connectionString:base.toString()});await owner.connect();if(!(await owner.query("SELECT 1 FROM pg_database WHERE datname='reeklaim_phase3_tests'")).rowCount)await owner.query('CREATE DATABASE reeklaim_phase3_tests');await owner.end();base.pathname='/reeklaim_phase3_tests';await migrate(base.toString());admin=new pg.Client({connectionString:base.toString()});await admin.connect();
 directory=await mkdtemp(join(tmpdir(),'reeklaim-private-test-'));const runtime=JSON.parse(readFileSync('.local/runtime.json','utf8'));const useTestDb=(url:string)=>{const next=new URL(url);next.pathname='/reeklaim_phase3_tests';return next.toString();};config={...runtime,authDatabaseUrl:useTestDb(runtime.authDatabaseUrl),databaseUrl:useTestDb(runtime.databaseUrl),storageDirectory:directory};db=new Database(config);await db.checkRoles();service=new AuthService(db,config,verifier);storage=new PrivateStorage(db,config);
 },30000);
 beforeEach(async()=>{const names=(await admin.query("SELECT tablename FROM pg_tables WHERE schemaname='reeklaim'")).rows.map(row=>'reeklaim.'+row.tablename);await admin.query('TRUNCATE '+names.join(',')+' CASCADE');rejectChain=false;overrideHash=null;});
 afterAll(async()=>{await db?.close();await admin?.end();if(directory)await rm(directory,{recursive:true,force:true});});
 async function login(wallet=address){const pre=await service.createPre();const challenge=await service.issue(pre,wallet);const signedHash=hash();const result=await service.verify(pre,challenge.id,signedHash);return {...result,pre,challenge,hash:signedHash};}
 it('atomically consumes a challenge, rotates the token and persists a minimal wallet account',async()=>{const result=await login();expect(result.token).not.toBe(result.pre);expect(await service.pre(result.pre)).toBeNull();expect((await service.session(result.token))?.wallet_address).toBe(address);expect(await service.session(result.pre)).toBeNull();expect((await admin.query('SELECT count(*)::int AS n FROM reeklaim.chain_receipts')).rows[0].n).toBe(1);const rows=(await admin.query('SELECT digest FROM reeklaim.sessions')).rows;expect(rows[0].digest).toBe(digest(result.token));expect(rows[0].digest).not.toContain(result.token);});
 it('rejects a new hash after the signing window',async()=>{const pre=await service.createPre();const challenge=await service.issue(pre,address);await admin.query("UPDATE reeklaim.auth_challenges SET issued_at=now()-interval '10 minutes',expires_at=now()-interval '1 minute' WHERE id=$1",[challenge.id]);await expect(service.verify(pre,challenge.id,hash())).rejects.toMatchObject({code:'CHALLENGE'});expect((await admin.query('SELECT count(*)::int AS n FROM reeklaim.sessions')).rows[0].n).toBe(0);});
 it('rejects nonce replay after successful use',async()=>{const result=await login();await expect(service.verify(result.pre,result.challenge.id,result.hash)).rejects.toThrow();});
 it('prevents another browser from claiming a publicly visible hash',async()=>{const pre=await service.createPre();const other=await service.createPre();const challenge=await service.issue(pre,address);await expect(service.verify(other,challenge.id,hash())).rejects.toMatchObject({code:'CHALLENGE'});expect((await admin.query('SELECT count(*)::int AS n FROM reeklaim.sessions')).rows[0].n).toBe(0);});
 it('allows exactly one concurrent challenge consumption',async()=>{const pre=await service.createPre();const challenge=await service.issue(pre,address);const tx=hash();const results=await Promise.allSettled([service.verify(pre,challenge.id,tx),service.verify(pre,challenge.id,tx)]);expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);expect((await admin.query('SELECT count(*)::int AS n FROM reeklaim.sessions')).rows[0].n).toBe(1);});
 it('rejects a reused hash and rolls back its account/session transaction',async()=>{const first=await login();const pre=await service.createPre();const challenge=await service.issue(pre,address);await expect(service.verify(pre,challenge.id,first.hash)).rejects.toThrow(/already used/);expect((await admin.query('SELECT count(*)::int AS n FROM reeklaim.sessions')).rows[0].n).toBe(1);expect((await admin.query('SELECT state FROM reeklaim.auth_challenges WHERE id=$1',[challenge.id])).rows[0].state).toBe('pending');});
 it('fails closed during chain outage and retries only the bound hash after the signing window',async()=>{
  const pre=await service.createPre();const challenge=await service.issue(pre,address);const tx=hash();rejectChain=true;
  await expect(service.verify(pre,challenge.id,tx)).rejects.toMatchObject({code:'RECEIPT_NOT_VERIFIED'});
  expect((await admin.query('SELECT count(*)::int AS n FROM reeklaim.sessions')).rows[0].n).toBe(0);
  await expect(service.verify(pre,challenge.id,hash())).rejects.toMatchObject({code:'HASH_BOUND'});
  await admin.query("UPDATE reeklaim.auth_challenges SET issued_at=now()-interval '10 minutes',expires_at=now()-interval '1 minute' WHERE id=$1",[challenge.id]);
  expect((await service.pending(pre))?.candidateHash).toBe(tx);
  await expect(service.verify(pre,challenge.id,hash())).rejects.toMatchObject({code:'CHALLENGE'});
  await expect(service.verify(await service.createPre(),challenge.id,tx)).rejects.toMatchObject({code:'CHALLENGE'});
  rejectChain=false;expect((await service.verify(pre,challenge.id,tx)).token).toBeTruthy();
 });
 it('does not trust verifier data bound to a different hash',async()=>{const pre=await service.createPre();const challenge=await service.issue(pre,address);overrideHash=hash();await expect(service.verify(pre,challenge.id,hash())).rejects.toThrow(/does not match/);});
 it('invalidates challenges from replaced requests and rejects a wrong configured origin',async()=>{const pre=await service.createPre();const first=await service.issue(pre,address);const second=await service.issue(pre,address);await expect(service.verify(pre,first.id,hash())).rejects.toThrow();await admin.query("UPDATE reeklaim.auth_challenges SET origin='https://evil.example' WHERE id=$1",[second.id]);await expect(service.verify(pre,second.id,hash())).rejects.toThrow(/binding/);});
 it('expires idle/absolute sessions and revokes logout server-side',async()=>{const first=await login();await service.logout(first.token,null);expect(await service.session(first.token)).toBeNull();const next=await login();await admin.query("UPDATE reeklaim.sessions SET last_active_at=now()-interval '31 minutes' WHERE digest=$1",[digest(next.token)]);expect(await service.session(next.token)).toBeNull();const third=await login();await admin.query("UPDATE reeklaim.sessions SET created_at=now()-interval '14 hours',expires_at=now()-interval '1 hour' WHERE digest=$1",[digest(third.token)]);expect(await service.session(third.token)).toBeNull();});
 it('enforces RLS with absent/wrong actor and resets pooled transaction identity',async()=>{const first=await login();const other=await login(bytesToBech32(new Uint8Array(20).fill(9),'qor'));await admin.query("INSERT INTO reeklaim.items(owner_id,category,name) VALUES($1,'Keys','Synthetic private item')",[first.accountId]);expect((await db.runtime.query('SELECT * FROM reeklaim.items')).rowCount).toBe(0);expect((await db.actor(first.accountId,c=>c.query('SELECT * FROM reeklaim.items'))).rowCount).toBe(1);expect((await db.actor(other.accountId,c=>c.query('SELECT * FROM reeklaim.items'))).rowCount).toBe(0);expect((await db.runtime.query('SELECT * FROM reeklaim.items')).rowCount).toBe(0);await expect(db.auth.query('SELECT * FROM reeklaim.evidence')).rejects.toThrow(/permission/);await expect(db.runtime.query('SELECT * FROM reeklaim.sessions')).rejects.toThrow(/permission/);});
 it('prevents privilege escalation, arbitrary owner modification and private organization reads',async()=>{const first=await login();await expect(db.actor(first.accountId,c=>c.query('UPDATE reeklaim.items SET owner_id=$1',[first.accountId]))).rejects.toThrow(/permission/);await expect(db.runtime.query('SET ROLE reeklaim_auth')).rejects.toThrow(/permission/);expect((await db.runtime.query('SELECT * FROM reeklaim.memberships')).rows).toEqual([]);});
 it('encrypts private synthetic documents and requires actor plus session-bound expiring downloads',async()=>{const first=await login();const other=await login(bytesToBech32(new Uint8Array(20).fill(8),'qor'));const plain=Buffer.from('Synthetic test document. No personal information.');const uploaded=await storage.upload(first.accountId,plain,'text/plain');const row=(await admin.query('SELECT object_key FROM reeklaim.evidence WHERE id=$1',[uploaded.id])).rows[0];expect((await readFile(join(directory,row.object_key))).includes(plain)).toBe(false);await expect(storage.downloadLink(other.accountId,digest(other.token),uploaded.id)).rejects.toThrow(/not found/);const signed=await storage.downloadLink(first.accountId,digest(first.token),uploaded.id);const link=new URL(signed.url,config.origin);const expires=Number(link.searchParams.get('expires'));const signature=link.searchParams.get('signature')!;expect((await storage.download(first.accountId,digest(first.token),uploaded.id,expires,signature)).bytes.equals(plain)).toBe(true);await expect(storage.download(other.accountId,digest(other.token),uploaded.id,expires,signature)).rejects.toThrow();await expect(storage.download(first.accountId,digest(opaque()),uploaded.id,expires,signature)).rejects.toThrow();await expect(storage.download(first.accountId,digest(first.token),uploaded.id,expires-120,signature)).rejects.toThrow();});
 it('rejects a raw cross-owner evidence insert through forced RLS',async()=>{const first=await login();const other=await login(bytesToBech32(new Uint8Array(20).fill(6),'qor'));await expect(db.actor(first.accountId,c=>c.query("INSERT INTO reeklaim.evidence(owner_id,object_key,mime,bytes,sha256) VALUES($1,$2,'text/plain',1,$3)",[other.accountId,'e'.repeat(64),'f'.repeat(64)]))).rejects.toThrow(/row-level security/);});
 it('persists rate limits across service instances',async()=>{
  const clock=vi.spyOn(Date,'now').mockReturnValue(Date.parse('2026-01-01T00:00:30Z'));
  try{
   await service.limit('synthetic-limit',1,60);
   await expect(new AuthService(db,config,verifier).limit('synthetic-limit',1,60)).rejects.toThrow(/Too many/);
  }finally{clock.mockRestore();}
 });
 it('enforces cookie/origin/CSRF and protected HTTP routes without browser-supplied identity',async()=>{
  let server:Server|undefined;try{server=createServer();await new Promise<void>(resolve=>server!.listen(0,'127.0.0.1',resolve));const address=server.address();if(!address||typeof address==='string')throw new Error();const origin='http://127.0.0.1:'+address.port;const httpConfig={...config,origin};const httpService=new AuthService(db,httpConfig,verifier);const middleware=createAuthMiddleware(httpConfig,{db,service:httpService,storage:new PrivateStorage(db,httpConfig)});server.on('request',(req,res)=>void middleware(req,res,()=>{res.statusCode=404;res.end();}));
  const initial=await fetch(origin+'/api/auth/session');const body=await initial.json() as {csrf:string};const cookie=initial.headers.getSetCookie().find(value=>value.startsWith('rk_dev_pre='))!.split(';')[0];
  expect((await fetch(origin+'/api/dashboard')).status).toBe(401);expect((await fetch(origin+'/api/auth/challenge',{method:'POST',headers:{origin,'content-type':'application/json',cookie},body:JSON.stringify({address:bytesToBech32(new Uint8Array(20).fill(5),'qor')})})).status).toBe(403);
  expect((await fetch(origin+'/api/auth/logout',{method:'POST',headers:{origin:'https://evil.example',cookie,'x-csrf-token':body.csrf}})).status).toBe(403);
  const issued=await fetch(origin+'/api/auth/challenge',{method:'POST',headers:{origin,'content-type':'application/json',cookie,'x-csrf-token':body.csrf},body:JSON.stringify({address:bytesToBech32(new Uint8Array(20).fill(5),'qor')})});expect(issued.status).toBe(201);const challenge=await issued.json() as {id:string};const confirmed=await fetch(origin+'/api/auth/verify',{method:'POST',headers:{origin,'content-type':'application/json',cookie,'x-csrf-token':body.csrf},body:JSON.stringify({challengeId:challenge.id,hash:hash()})});expect(confirmed.status).toBe(200);const sessionCookie=confirmed.headers.getSetCookie().find(value=>value.startsWith('rk_dev_session='))!.split(';')[0];expect(sessionCookie).not.toBe(cookie);expect((await fetch(origin+'/api/dashboard?account_id='+opaque(),{headers:{cookie:sessionCookie}})).status).toBe(400);const current=await fetch(origin+'/api/auth/session',{headers:{cookie:sessionCookie}});const currentBody=await current.json() as {csrf:string};expect((await fetch(origin+'/api/private/evidence',{method:'POST',headers:{origin,'content-type':'text/plain'},body:'synthetic'})).status).toBe(401);
  const profile=(input:{displayName:string;acceptTerms?:boolean})=>fetch(origin+'/api/account/profile',{
   method:'POST',
   headers:{origin,'content-type':'application/json',cookie:sessionCookie,'x-csrf-token':currentBody.csrf},
   body:JSON.stringify(input),
  });
  const refusedProfile=await profile({displayName:'Synthetic alias'});
  expect(refusedProfile.status).toBe(400);
  expect(await refusedProfile.json()).toMatchObject({code:'TERMS_REQUIRED'});
  expect((await profile({displayName:'Synthetic alias',acceptTerms:true})).status).toBe(200);
  const verifiedProfile=await fetch(origin+'/api/auth/session',{headers:{cookie:sessionCookie}}).then(r=>r.json());
  expect(verifiedProfile.user).toMatchObject({displayName:'Synthetic alias',onboardedAt:expect.any(String)});
  expect((await profile({displayName:'Revised synthetic alias'})).status).toBe(200);
  const revisedProfile=await fetch(origin+'/api/auth/session',{headers:{cookie:sessionCookie}}).then(r=>r.json());
  expect(revisedProfile.user).toMatchObject({displayName:'Revised synthetic alias',onboardedAt:verifiedProfile.user.onboardedAt});
  const uploaded=await fetch(origin+'/api/private/evidence',{method:'POST',headers:{origin,'content-type':'text/plain',cookie:sessionCookie,'x-csrf-token':currentBody.csrf},body:'Synthetic private fixture'});expect(uploaded.status).toBe(201);const file=await uploaded.json() as {id:string};const linkResponse=await fetch(origin+'/api/private/evidence/'+file.id+'/link',{method:'POST',headers:{origin,cookie:sessionCookie,'x-csrf-token':currentBody.csrf}});const download=await linkResponse.json() as {url:string};expect((await fetch(origin+download.url)).status).toBe(401);await fetch(origin+'/api/auth/logout',{method:'POST',headers:{origin,cookie:sessionCookie,'x-csrf-token':currentBody.csrf}});expect((await fetch(origin+download.url,{headers:{cookie:sessionCookie}})).status).toBe(401);
  }finally{if(server)await new Promise<void>(resolve=>server!.close(()=>resolve()));}
 });
});
