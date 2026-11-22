import { describe,it,expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadAuthConfig, validateConfig } from '../server/auth/config.ts';
import { csrf,setCookie,cookieNames,requireOrigin,requireCsrf,opaque } from '../server/auth/security.ts';
import { validateUpload } from '../server/auth/storage.ts';
import type { IncomingMessage } from 'node:http';
const config={origin:'http://127.0.0.1:5173',authDatabaseUrl:'postgresql://auth:example@127.0.0.1/db',databaseUrl:'postgresql://runtime:example@127.0.0.1/db',csrfSecret:'a'.repeat(64),storageKey:'b'.repeat(64),storageDirectory:resolve('.local/test-storage')};
describe('secure configuration and cookies',()=>{
 it('uses a separate HTTP-only local cookie and secure host-only production cookie',()=>{expect(setCookie(config,cookieNames(config).session,opaque(),43200)).toContain('HttpOnly; SameSite=Lax');const secure={...config,origin:'https://reeklaim.example'};expect(setCookie(secure,cookieNames(secure).session,opaque(),43200)).toMatch(/^__Host-rk_session=.*; Secure$/);});
 it('refuses HTTP production and remote HTTP origins',()=>{expect(()=>validateConfig(config,true)).toThrow();expect(()=>validateConfig({...config,origin:'http://evil.example'},false)).toThrow();});
 it('refuses public storage roots and shared cryptographic keys',()=>{expect(()=>validateConfig({...config,storageDirectory:resolve('public/private')},false)).toThrow();expect(()=>validateConfig({...config,storageKey:config.csrfSecret},false)).toThrow();});
 it('requires authenticated TLS for a remote database',()=>{expect(()=>validateConfig({...config,origin:'https://example.test',databaseUrl:'postgresql://runtime:example@remote/db'},true)).toThrow();});
 it('requires unambiguous PostgreSQL routing and TLS settings',()=>{
  const origin='https://example.test';
  const databaseUrl='postgresql://runtime:synthetic@db.example.test/reeklaim?sslmode=verify-full';
  expect(()=>validateConfig({...config,origin,databaseUrl},true)).not.toThrow();
  expect(()=>validateConfig({...config,origin,databaseUrl:databaseUrl+'&sslmode=verify-full'},true)).toThrow('Specify sslmode at most once.');
  expect(()=>validateConfig({...config,origin,databaseUrl:databaseUrl+'&host=db.example.test'},true)).toThrow('single host');
 });
 it('does not retain malformed configuration values in errors',()=>{
  const value='synthetic credential that must not appear';
  expect(()=>validateConfig({...config,databaseUrl:value})).toThrow(/^Invalid PostgreSQL connection URL\.$/);
  expect(()=>loadAuthConfig({AUTH_DATABASE_URL:value})).toThrow(/Invalid server authentication configuration.*APP_ORIGIN/);
  expect(()=>loadAuthConfig({AUTH_DATABASE_URL:value,DATABASE_URL:config.databaseUrl,APP_ORIGIN:config.origin,
   AUTH_CSRF_SECRET:config.csrfSecret,PRIVATE_STORAGE_KEY:config.storageKey,PRIVATE_STORAGE_DIRECTORY:config.storageDirectory}))
   .toThrow(new Error('Invalid server authentication configuration. Check: AUTH_DATABASE_URL.'));
  expect(()=>loadAuthConfig({NODE_ENV:'production',AUTH_DATABASE_URL:value,NODE_TLS_REJECT_UNAUTHORIZED:'0'})).toThrow('Certificate verification is required');
 });
 it('rejects hostile origin and omitted CSRF',()=>{const request={headers:{host:'127.0.0.1:5173',origin:'https://evil.example'}} as unknown as IncomingMessage;expect(()=>requireOrigin(request,config,true)).toThrow();expect(()=>requireCsrf(request,config,opaque())).toThrow();});
 it('binds CSRF to an individual cookie',()=>{const token=opaque();const request={headers:{'x-csrf-token':csrf(config,token)}} as unknown as IncomingMessage;expect(()=>requireCsrf(request,config,token)).not.toThrow();expect(()=>requireCsrf(request,config,opaque())).toThrow();});
});
describe('private ingestion validation',()=>{
 it('accepts a synthetic UTF-8 document',async()=>{expect((await validateUpload(Buffer.from('Synthetic test evidence only'),'text/plain')).mime).toBe('text/plain');});
 it('rejects SVG, PDF, malformed image and binary/plain mismatch',async()=>{for(const [data,mime] of [[Buffer.from('<svg/>'),'image/svg+xml'],[Buffer.from('%PDF-1'),'application/pdf'],[Buffer.from('not png'),'image/png'],[Buffer.from([0,255]),'text/plain']] as const)await expect(validateUpload(data,mime)).rejects.toThrow();});
 it('rejects empty and oversized content',async()=>{await expect(validateUpload(Buffer.alloc(0),'text/plain')).rejects.toThrow();await expect(validateUpload(Buffer.alloc(4194305),'text/plain')).rejects.toThrow();});
 it('decodes and re-encodes a real image, stripping metadata',async()=>{const image=readFileSync('public/images/backpack.jpg');const result=await validateUpload(image,'image/jpeg');expect(result.mime).toBe('image/png');expect(result.bytes.subarray(1,4).toString()).toBe('PNG');});
});
