import { createServer } from 'node:http';
import { readFile,stat } from 'node:fs/promises';
import { resolve,extname,sep } from 'node:path';
import { createHash } from 'node:crypto';
import { loadAuthConfig } from './auth/config.ts';
import { createAuthMiddleware } from './auth/http.ts';
import { createChainMiddleware } from './chain.ts';
const config=loadAuthConfig();const auth=createAuthMiddleware(config);const chain=createChainMiddleware(false,undefined,config?.origin);const root=resolve('dist');const html=await readFile(resolve(root,'index.html'),'utf8');const bootstrap=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];const scriptHash=bootstrap?" 'sha256-"+createHash('sha256').update(bootstrap).digest('base64')+"'":'';
const types:Record<string,string>={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2','.txt':'text/plain; charset=utf-8'};
const server=createServer((req,res)=>{
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Frame-Options','DENY');res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');if(config?.origin.startsWith('https:'))res.setHeader('Strict-Transport-Security','max-age=31536000');
 void auth(req,res,()=>void chain(req,res,()=>{void(async()=>{
  if(!['GET','HEAD'].includes(req.method??'')){res.statusCode=405;res.end();return;}
  const path=new URL(req.url??'/',config?.origin??'http://127.0.0.1').pathname;if(path.startsWith('/api/')){res.statusCode=404;res.setHeader('Cache-Control','no-store');res.end();return;}
  let decodedPath: string;
  try { decodedPath=decodeURIComponent(path); }
  catch { res.statusCode=400;res.end();return; }
  const invalidCharacter = Array.from(decodedPath).some(character =>
    character === '\\' || character === ':' || character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127,
  );
  if(invalidCharacter || decodedPath.split('/').some(segment=>segment.startsWith('.'))){res.statusCode=404;res.end();return;}
  const candidate=resolve(root,'.'+decodedPath);if(candidate!==root&&!candidate.startsWith(root+sep)){res.statusCode=404;res.end();return;}
  let file=candidate;try{if(!(await stat(file)).isFile())file=resolve(root,'index.html');}catch{if(extname(path)){res.statusCode=404;res.end();return;}file=resolve(root,'index.html');}
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'"+scriptHash+"; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'");
  res.setHeader('Content-Type',types[extname(file)]??'application/octet-stream');res.setHeader('Cache-Control',file.includes(sep+'assets'+sep)?'public, max-age=31536000, immutable':'no-cache');const bytes=await readFile(file);res.setHeader('Content-Length',bytes.length);res.end(req.method==='HEAD'?undefined:bytes);
 })().catch(()=>{res.statusCode=500;res.end('Request unavailable.');});}));
});
const port=Number(process.env.PORT??(config?new URL(config.origin).port||3000:3000));if(!Number.isInteger(port)||port<1||port>65535)throw new Error('Invalid server port.');server.requestTimeout=30000;server.headersTimeout=10000;server.listen(port,process.env.BIND_HOST??'127.0.0.1',()=>console.log('ReeKlaim server listening on port '+port+'. Authentication '+(config?'configured; live approval still required.':'disabled until securely configured.')));
