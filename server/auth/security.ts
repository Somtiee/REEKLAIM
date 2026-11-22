import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import type { AuthConfig } from './config.ts';
export class HttpError extends Error{constructor(readonly status:number,readonly code:string,message:string){super(message);}}
export const opaque=()=>randomBytes(32).toString('base64url');
export const digest=(value:string|Uint8Array)=>createHash('sha256').update(value).digest('hex');
export function equal(a:string,b:string){const left=Buffer.from(a);const right=Buffer.from(b);return left.length===right.length&&timingSafeEqual(left,right);}
export function cookieNames(config:AuthConfig){const prefix=config.origin.startsWith('https:')?'__Host-rk_':'rk_dev_';return {pre:prefix+'pre',session:prefix+'session'};}
export function readCookie(req:IncomingMessage,name:string){const matches=(req.headers.cookie??'').split(';').map(v=>v.trim()).filter(v=>v.startsWith(name+'='));if(matches.length!==1)return null;const value=matches[0].slice(name.length+1);return /^[A-Za-z0-9_-]{43}$/.test(value)?value:null;}
export function setCookie(config:AuthConfig,name:string,value:string,maxAge:number){return `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${config.origin.startsWith('https:')?'; Secure':''}`;}
export function csrf(config:AuthConfig,token:string){return createHmac('sha256',Buffer.from(config.csrfSecret,'hex')).update('rk:csrf:v1:'+token).digest('base64url');}
export function requireOrigin(req:IncomingMessage,config:AuthConfig,mutation=false){if(req.headers.host!==new URL(config.origin).host||req.headers['sec-fetch-site']==='cross-site'||(req.headers.origin&&req.headers.origin!==config.origin)||(mutation&&req.headers.origin!==config.origin))throw new HttpError(403,'ORIGIN','Use the configured application origin.');}
export function requireCsrf(req:IncomingMessage,config:AuthConfig,token:string|null){if(!token||typeof req.headers['x-csrf-token']!=='string'||!equal(req.headers['x-csrf-token'],csrf(config,token)))throw new HttpError(403,'CSRF','Refresh the sign-in page before continuing.');}
export async function readBody(req:IncomingMessage,max=4096):Promise<Buffer>{let size=0;const parts:Buffer[]=[];for await(const chunk of req){const bytes=Buffer.from(chunk);size+=bytes.length;if(size>max)throw new HttpError(413,'BODY_LIMIT','Request exceeds the allowed size.');parts.push(bytes);}return Buffer.concat(parts);}
export async function readJson(req:IncomingMessage,max=4096){if(req.headers['content-type']?.split(';')[0]!=='application/json')throw new HttpError(415,'CONTENT_TYPE','JSON is required.');try{return JSON.parse((await readBody(req,max)).toString('utf8')) as unknown;}catch(error){if(error instanceof HttpError)throw error;throw new HttpError(400,'JSON','Invalid JSON.');}}
