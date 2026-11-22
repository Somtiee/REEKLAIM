import { createCipheriv,createDecipheriv,randomBytes,createHmac,randomUUID } from 'node:crypto';
import { evidenceObjects, type EvidenceObjects } from './evidence-objects.ts';
import sharp from 'sharp';
import type { AuthConfig } from './config.ts';
import { Database } from './db.ts';
import type { IncomingMessage } from 'node:http';
import { digest,equal,HttpError,readBody } from './security.ts';
import { ownedEvidence } from './service.ts';
export async function validateUpload(input:Buffer,mime:string):Promise<{bytes:Buffer;mime:string}>{
 if(!input.length||input.length>4194304)throw new HttpError(413,'UPLOAD_SIZE','Use a nonempty document smaller than 4 MiB.');
 if(mime==='text/plain'){try{const text=new TextDecoder('utf-8',{fatal:true}).decode(input);if(Array.from(text).some(char=>{const code=char.charCodeAt(0);return code<32&&![9,10,13].includes(code);}))throw new Error();return {bytes:Buffer.from(text,'utf8'),mime};}catch{throw new HttpError(415,'UPLOAD_TYPE','Plain text must be valid UTF-8 without binary controls.');}}
 const format:Record<string,string>={'image/png':'png','image/jpeg':'jpeg','image/webp':'webp'};if(!format[mime])throw new HttpError(415,'UPLOAD_TYPE','Only PNG, JPEG, WebP and plain text are accepted. SVG, PDF and archives are not accepted.');
 try{const image=sharp(input,{limitInputPixels:16000000,animated:false,failOn:'warning'});const metadata=await image.metadata();if(metadata.format!==format[mime]||(metadata.pages??1)>1||!metadata.width||!metadata.height||metadata.width>8000||metadata.height>8000)throw new Error();const bytes=await image.rotate().png().toBuffer();if(bytes.length>4194304)throw new Error();return {bytes,mime:'image/png'};}catch{throw new HttpError(415,'UPLOAD_DECODE','Image content is invalid, animated or too large.');}
}
sharp.cache({memory:16,files:0,items:10});
sharp.concurrency(2);
export class PrivateStorage{
 constructor(readonly db:Database,readonly config:AuthConfig,private readonly objects:EvidenceObjects=evidenceObjects(config)){}
 private activeUploads=0;
 private async slot<T>(operation:()=>Promise<T>):Promise<T>{if(this.activeUploads>=2)throw new HttpError(429,'UPLOAD_BUSY','Private upload processing is busy. Retry shortly.');this.activeUploads++;try{return await operation();}finally{this.activeUploads--;}}
 async upload(actor:string,input:Buffer,mime:string){return this.slot(()=>this.save(actor,input,mime));}
 async uploadRequest(actor:string,request:IncomingMessage,mime:string){return this.slot(async()=>this.save(actor,await readBody(request,4194304),mime));}
 private async save(actor:string,input:Buffer,mime:string){const validated=await validateUpload(input,mime);const key=randomBytes(32).toString('hex');const id=randomUUID();const iv=randomBytes(12);const cipher=createCipheriv('aes-256-gcm',Buffer.from(this.config.storageKey,'hex'),iv);cipher.setAAD(Buffer.from('rk:evidence:v1:'+key));const encrypted=Buffer.concat([Buffer.from([1]),iv,cipher.update(validated.bytes),cipher.final(),cipher.getAuthTag()]);await this.objects.put(key,encrypted);
 try{await this.db.actor(actor,async client=>{await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[actor]);const used=await client.query('SELECT count(*)::int AS count,coalesce(sum(bytes),0)::bigint AS bytes FROM reeklaim.evidence WHERE owner_id=$1 AND deleted_at IS NULL',[actor]);if(used.rows[0].count>=100||BigInt(used.rows[0].bytes)+BigInt(validated.bytes.length)>20971520n)throw new HttpError(413,'QUOTA','Private storage quota reached: 100 documents or 20 MiB.');await client.query('INSERT INTO reeklaim.evidence(id,owner_id,object_key,mime,bytes,sha256) VALUES($1,$2,$3,$4,$5,$6)',[id,actor,key,validated.mime,validated.bytes.length,digest(validated.bytes)]);await client.query("INSERT INTO reeklaim.audit_events(actor_id,action,resource_id) VALUES($1,'evidence.upload',$2)",[actor,id]);});}catch(error){await this.objects.remove(key).catch(()=>{});throw error;}return {id,mime:validated.mime,bytes:validated.bytes.length};
 }
 signature(id:string,actor:string,sessionDigest:string,expires:number){return createHmac('sha256',Buffer.from(this.config.csrfSecret,'hex')).update(JSON.stringify(['rk:download:v1',id,actor,sessionDigest,expires])).digest('base64url');}
 private async authorizedEvidence(actor:string,id:string,claimId?:string){
  return this.db.actor(actor,async client=>{
   if(!claimId)return ownedEvidence(client,id,actor);
   const row=(await client.query('SELECT e.* FROM reeklaim.claim_attachments a JOIN reeklaim.evidence e ON e.id=a.evidence_id WHERE a.claim_id=$1 AND a.evidence_id=$2',[claimId,id])).rows[0];
   if(!row)throw new HttpError(404,'EVIDENCE','Private document not found.');
   return row as Awaited<ReturnType<typeof ownedEvidence>>;
  });
 }
 async downloadLink(actor:string,sessionDigest:string,id:string,claimId?:string){await this.authorizedEvidence(actor,id,claimId);const expires=Math.floor(Date.now()/1000)+60;return {url:`${claimId?"/api/claims/"+claimId+"/files/"+id:"/api/private/evidence/"+id}/download?expires=${expires}&signature=${this.signature(claimId?claimId+":"+id:id,actor,sessionDigest,expires)}`,expiresAt:new Date(expires*1000).toISOString()};}
 async download(actor:string,sessionDigest:string,id:string,expires:number,signature:string,claimId?:string){const now=Math.floor(Date.now()/1000);if(!Number.isSafeInteger(expires)||expires<now||expires>now+60||!equal(signature,this.signature(claimId?claimId+":"+id:id,actor,sessionDigest,expires)))throw new HttpError(403,'DOWNLOAD_EXPIRED','This private link has expired or belongs to another session.');const row=await this.authorizedEvidence(actor,id,claimId);if(!/^[a-f0-9]{64}$/.test(row.object_key))throw new HttpError(404,'EVIDENCE','Document unavailable.');const data=await this.objects.get(row.object_key);if(data.length<30||data[0]!==1)throw new Error('Invalid private storage envelope');const decipher=createDecipheriv('aes-256-gcm',Buffer.from(this.config.storageKey,'hex'),data.subarray(1,13));decipher.setAAD(Buffer.from('rk:evidence:v1:'+row.object_key));decipher.setAuthTag(data.subarray(-16));const bytes=Buffer.concat([decipher.update(data.subarray(13,-16)),decipher.final()]);if(bytes.length!==row.bytes||digest(bytes)!==row.sha256)throw new Error('Private document integrity check failed.');return {bytes,mime:row.mime};}
}
