import { createCipheriv,createDecipheriv,randomBytes,createHash } from 'node:crypto';
import type { ItemInput } from '../../src/items/domain.ts';
export function seal(key:string,domain:string,value:unknown){const iv=randomBytes(12);const cipher=createCipheriv('aes-256-gcm',Buffer.from(key,'hex'),iv);cipher.setAAD(Buffer.from(domain));return Buffer.concat([iv,cipher.update(JSON.stringify(value),'utf8'),cipher.final(),cipher.getAuthTag()]);}
export function open<T>(key:string,domain:string,bytes:Buffer):T{const decipher=createDecipheriv('aes-256-gcm',Buffer.from(key,'hex'),bytes.subarray(0,12));decipher.setAAD(Buffer.from(domain));decipher.setAuthTag(bytes.subarray(-16));return JSON.parse(Buffer.concat([decipher.update(bytes.subarray(12,-16)),decipher.final()]).toString('utf8')) as T;}
// Fixed-order arrays, explicit purpose/version and a fresh private 256-bit salt.
export function commitment(itemId:string,version:number,input:ItemInput,evidence:string|null,photo:string|null,publicPhoto:string|null,salt=randomBytes(32).toString('hex')){
 const canonical=JSON.stringify(['ReeKlaim item registration',1,itemId,version,salt,input.name,input.category,input.description,input.brand,input.model,input.serial,input.country,input.city,input.showName,input.showDescription,input.showPhoto,evidence,photo,publicPhoto]);
 return {salt,hash:createHash('sha256').update(canonical).digest('hex')};
}
