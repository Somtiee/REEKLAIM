import { workspaceRoute } from '../workspace/http.ts';
import { paymentRoute } from '../payments/http.ts';
import { claimRoute } from '../claims/http.ts';
import { marketRoute } from '../market/http.ts';
import type { IncomingMessage,ServerResponse } from 'node:http';
import { createHmac } from 'node:crypto';
import { z } from 'zod';
import type { AuthConfig } from './config.ts';
import { Database } from './db.ts';
import { AuthService } from './service.ts';
import { PrivateStorage } from './storage.ts';
import { HttpError,cookieNames,csrf,readCookie,requireOrigin,requireCsrf,setCookie,readJson } from './security.ts';
import { ItemService } from '../items/service.ts';
import { itemRoute } from '../items/http.ts';
const uuid=z.string().uuid();const challengeBody=z.object({address:z.string().max(90)}).strict();const verifyBody=z.object({challengeId:uuid,hash:z.string().regex(/^[a-fA-F0-9]{64}$/)}).strict();
export function createAuthMiddleware(config:AuthConfig|null,provided?:{db:Database;service:AuthService;storage:PrivateStorage}){
 const db=provided?.db??(config?new Database(config):null);const service=provided?.service??(db&&config?new AuthService(db,config):null);const storage=provided?.storage??(db&&config?new PrivateStorage(db,config):null);const items=db&&config?new ItemService(db,config):null;let ready:Promise<void>|null=null;
 return async(req:IncomingMessage,res:ServerResponse,next:()=>void)=>{
 if(!/^\/api\/workspace(?:[/?]|$)/.test(req.url??'')&&!/^\/api\/payments(?:[/?]|$)/.test(req.url??'')&&!/^\/api\/claims(?:[/?]|$)/.test(req.url??'')&&!/^\/api\/market(?:[/?]|$)/.test(req.url??'')&&!req.url?.startsWith('/api/items')&&!req.url?.startsWith('/api/recover/')&&!req.url?.startsWith('/api/auth/')&&!req.url?.startsWith('/api/private/')&&!['/api/me','/api/dashboard','/api/account/profile'].includes(req.url?.split('?')[0]??''))return next();
 res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store, private');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Cross-Origin-Resource-Policy','same-origin');res.setHeader('Vary','Cookie');
 const reply=(status:number,value:unknown)=>{res.statusCode=status;res.end(JSON.stringify(value));};
 if(!config||!db||!service||!storage)return reply(503,{authenticated:false,available:false,code:'NOT_CONFIGURED',error:'Secure sign-in is not configured on this server. Public browsing remains available.'});
 try{
 requireOrigin(req,config,req.method!=='GET');if(!ready)ready=db.checkRoles().catch(error=>{ready=null;throw error;});try{await ready;}catch{throw new HttpError(503,'DATABASE_UNAVAILABLE','Secure records are temporarily unavailable. Retry after the application database is running.');}
 const url=new URL(req.url??'/',config.origin);const names=cookieNames(config);const sessionToken=readCookie(req,names.session);const preToken=readCookie(req,names.pre);
 if(req.method==='GET'&&url.pathname==='/api/auth/session'){
  if(url.search)throw new HttpError(400,'QUERY','Unexpected query.');const session=await service.session(sessionToken,false);
  if(session&&sessionToken)return reply(200,{available:true,authenticated:true,csrf:csrf(config,sessionToken),user:{id:session.account_id,walletAddress:session.wallet_address,displayName:session.display_name,onboardedAt:session.onboarded_at,createdAt:session.created_at,expiresAt:session.expires_at}});
  let token=preToken;if(!await service.pre(token)){const ip=createHmac('sha256',Buffer.from(config.csrfSecret,'hex')).update(req.socket.remoteAddress??'unknown').digest('hex');await service.limit('bootstrap:'+ip,60,60);token=await service.createPre();res.setHeader('Set-Cookie',[setCookie(config,names.pre,token,1800),setCookie(config,names.session,'',0)]);}
  return reply(200,{available:true,authenticated:false,csrf:csrf(config,token!),pending:await service.pending(token!)});
 }
 if(req.method==='POST'&&url.pathname==='/api/auth/challenge'){
  requireCsrf(req,config,preToken);const input=challengeBody.parse(await readJson(req));return reply(201,await service.issue(preToken!,input.address));
 }
 if(req.method==='POST'&&url.pathname==='/api/auth/verify'){
  requireCsrf(req,config,preToken);const input=verifyBody.parse(await readJson(req));const result=await service.verify(preToken!,input.challengeId,input.hash.toUpperCase());res.setHeader('Set-Cookie',[setCookie(config,names.session,result.token,43200),setCookie(config,names.pre,'',0)]);return reply(200,{authenticated:true});
 }
 if(req.method==='POST'&&url.pathname==='/api/auth/logout'){
  requireCsrf(req,config,sessionToken??preToken);await service.logout(sessionToken,preToken);res.setHeader('Set-Cookie',[setCookie(config,names.session,'',0),setCookie(config,names.pre,'',0)]);return reply(200,{authenticated:false});
 }
 const session=await service.session(sessionToken,url.pathname!=='/api/workspace/notifications');if(url.pathname==='/api/market'||url.pathname.startsWith('/api/market/'))return await marketRoute(req,res,url,service,session,sessionToken,preToken);if((url.pathname==='/api/items'||url.pathname.startsWith('/api/items/')||url.pathname.startsWith('/api/recover/'))&&items)return await itemRoute(req,res,url,items,service,session,sessionToken,preToken);if(!session)throw new HttpError(401,'AUTH_REQUIRED','Sign in with QoreX to access this account.');
 if(url.pathname.startsWith('/api/workspace/'))return await workspaceRoute(req,res,url,service,session,sessionToken);
 if(url.pathname==='/api/payments'||url.pathname.startsWith('/api/payments/'))return await paymentRoute(req,res,url,service,session,sessionToken);
 if(url.pathname==='/api/claims'||url.pathname.startsWith('/api/claims/'))return await claimRoute(req,res,url,service,session,sessionToken,storage);
 if(req.method!=='GET')requireCsrf(req,config,sessionToken);
 if(req.method==='GET'&&['/api/me','/api/dashboard'].includes(url.pathname)){if(url.search)throw new HttpError(400,'QUERY','User IDs are not accepted.');return reply(200,await service.dashboard(session.account_id));}
 if(req.method==='POST'&&url.pathname==='/api/account/profile'){const input=z.object({acceptTerms:z.literal(true).optional(),displayName:z.string().trim().min(1).max(60).refine(value=>Array.from(value).every(char=>char.charCodeAt(0)>=32&&char.charCodeAt(0)!==127&&!['<','>'].includes(char)))}).strict().parse(await readJson(req));if(!session.onboarded_at&&!input.acceptTerms)throw new HttpError(400,'TERMS_REQUIRED','Accept the ReeKlaim terms to finish setting up your account.');await service.profile(session.account_id,input.displayName);return reply(200,{saved:true});}
 if(req.method==='POST'&&url.pathname==='/api/private/evidence'){
  if(url.search)throw new HttpError(400,'QUERY','Claim attachments are not enabled.');await service.limit('upload:'+session.account_id,20,3600);return reply(201,await storage.uploadRequest(session.account_id,req,req.headers['content-type']??''));
 }
 const match=/^\/api\/private\/evidence\/([a-f0-9-]{36})\/(link|download)$/.exec(url.pathname);
 if(match){const id=uuid.parse(match[1]);if(match[2]==='link'&&req.method==='POST'){if(url.search)throw new HttpError(400,'QUERY','Unexpected query.');return reply(200,await storage.downloadLink(session.account_id,session.digest,id));}
  if(match[2]==='download'&&req.method==='GET'){if([...url.searchParams.keys()].some(k=>!['expires','signature'].includes(k))||url.searchParams.getAll('expires').length!==1||url.searchParams.getAll('signature').length!==1)throw new HttpError(400,'QUERY','Invalid private link.');const expires=z.coerce.number().int().positive().parse(url.searchParams.get('expires'));const signature=z.string().regex(/^[A-Za-z0-9_-]{43}$/).parse(url.searchParams.get('signature'));const result=await storage.download(session.account_id,session.digest,id,expires,signature);res.setHeader('Content-Type',result.mime);res.setHeader('Content-Disposition',`attachment; filename="private-document.${result.mime==='text/plain'?'txt':'png'}"`);res.setHeader('Content-Security-Policy',"default-src 'none'; sandbox");res.end(result.bytes);return;}
 }
 return reply(404,{code:'NOT_FOUND',error:'Secure route not found.'});
 }catch(error){if(error instanceof HttpError)return reply(error.status,{code:error.code,error:error.message});if(error instanceof z.ZodError)return reply(400,{code:'INPUT',error:'Request fields are missing or invalid.'});return reply(503,{code:'UNAVAILABLE',error:'Secure verification or storage is temporarily unavailable. No new authentication was granted.'});}
 };
}
