import type { IncomingMessage,ServerResponse } from 'node:http';
import { resolve,relative } from 'node:path';
export function denyPrivateFiles(storageDirectory?:string){
 const absolute=storageDirectory?.replaceAll('\\','/').toLowerCase();const local=storageDirectory?relative(resolve('.'),storageDirectory).replaceAll('\\','/').toLowerCase():null;
 return (req:IncomingMessage,res:ServerResponse,next:()=>void)=>{let path:string;try{path=decodeURIComponent(req.url??'/').replaceAll('\\','/').toLowerCase().split('?')[0];}catch{res.statusCode=400;res.end();return;}
 const sensitive=/(?:^|\/)(?:\.local|\.git|\.env(?:\.[^/]*)?|private-storage)(?:\/|$)/.test(path)||path.startsWith('/server/')||path.startsWith('/database/')||path.startsWith('/scripts/')||path.startsWith('/tests/')||!!(absolute&&path.includes(absolute))||!!(local&&!local.startsWith('..')&&path.startsWith('/'+local));
 if(sensitive){res.statusCode=403;res.setHeader('Cache-Control','no-store');res.end('Private server file.');return;}next();};
}
