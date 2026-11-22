import { z } from 'zod';
export const categories=['electronics','luggage','wallets','keys','documents','bags','bicycles','pets','business assets','other'] as const;
const text=(max:number)=>z.string().trim().max(max).refine(s=>Array.from(s).every(char=>char.charCodeAt(0)>=32&&char.charCodeAt(0)!==127&&!['<','>'].includes(char)),'Use plain text without control characters or markup.');
export const itemInput=z.object({name:text(120).min(1),category:z.enum(categories),description:text(1500),brand:text(80),model:text(80),serial:text(200),country:text(80),city:text(80),showName:z.boolean(),showDescription:z.boolean(),showPhoto:z.boolean(),evidenceId:z.string().uuid().nullable(),privatePhotoId:z.string().uuid().nullable()}).strict();
export type ItemInput=z.infer<typeof itemInput>;
export const emptyItem:ItemInput={name:'',category:'electronics',description:'',brand:'',model:'',serial:'',country:'',city:'',showName:false,showDescription:false,showPhoto:false,evidenceId:null,privatePhotoId:null};
export type RegistrationIntent={id:string;address:string;recipient:string;chainId:'qorechain-diana';origin:string;amountUqor:'100000';memo:string;commitment:string;issuedAt:string;expiresAt:string;state:'pending'|'confirmed'|'failed';candidateHash:string|null;approvalStarted:boolean};
