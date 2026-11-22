import type { Send } from '../../src/payments/domain.ts';
import { createHash } from 'node:crypto';
import { TxRaw,TxBody,AuthInfo } from 'cosmjs-types/cosmos/tx/v1beta1/tx';
import { MsgSend } from 'cosmjs-types/cosmos/bank/v1beta1/tx';
import { qorechainTypes,ETHSECP256K1_PUBKEY_TYPE,parseEthPubkeyAny,validateClassicalKeyForSender,hybridSignBytes,pqcVerify,fetchPqcStatus,pqcStatusPublicKey,resolveSignBytesVersion } from '@qorechain/sdk';
import { z } from 'zod';
import { DIANA,assertDiana } from '../../src/lib/network.ts';
import { base64Bytes } from '../../src/lib/receipt.ts';
import { nativeNetwork,readJson } from '../chain.ts';
export type Challenge={id:string;pre_digest:string;wallet_address:string;chain_id:string;origin:string;memo:string;min_height:string;issued_at:Date;expires_at:Date;state:string;candidate_hash:string|null};
export type AuthReceipt={hash:string;height:string;timestamp:string;signer:string;memo:string;verifierVersion:'rk-auth-1';localPqcVerified:true};
const extensionSchema=z.object({'@type':z.string(),algorithm_id:z.union([z.number(),z.string()]),pqc_signature:z.string()});
const restSchema=z.object({
 tx:z.object({
  body:z.object({memo:z.string(),messages:z.array(z.object({'@type':z.string(),from_address:z.string(),to_address:z.string(),amount:z.array(z.object({denom:z.string(),amount:z.string()}))})),extension_options:z.array(extensionSchema).optional(),non_critical_extension_options:z.array(extensionSchema).optional()}),
  auth_info:z.object({signer_infos:z.array(z.object({public_key:z.object({'@type':z.string(),key:z.string()})}))}),
  signatures:z.array(z.string())
 }),
 tx_response:z.object({txhash:z.string(),code:z.union([z.number(),z.string()]),height:z.string().regex(/^[1-9][0-9]*$/),timestamp:z.string().datetime({offset:true}),events:z.array(z.object({type:z.string(),attributes:z.array(z.object({key:z.string(),value:z.string()}))}))})
});
const rpcSchema=z.object({result:z.object({hash:z.string(),height:z.string(),tx:z.string(),tx_result:z.object({code:z.union([z.number(),z.string()])})})});
export class ConfirmedTransactionFailure extends Error {}
function inspectNativeReceipt(receipt:unknown,rpc:unknown,challenge:Challenge,expectedHash:string,chainId:unknown,blockTime:string,pqKey:Uint8Array,version:'v1'|'v2',payment?:{sends:Send[];purpose:'reg'|'pay'}):AuthReceipt{
 assertDiana(chainId);assertDiana(challenge.chain_id);if(!/^[A-F0-9]{64}$/.test(expectedHash)||!(payment?.purpose==='pay'?/^rk:pay:v1:[A-Za-z0-9_-]{43}$/:payment?/^rk:reg:v1:[A-Za-z0-9_-]{43}$/:/^rk:auth:v1:[A-Za-z0-9_-]{43}$/).test(challenge.memo))throw new Error('Invalid authentication intent.');
 const rest=restSchema.parse(receipt);const raw=rpcSchema.parse(rpc).result;const tx=rest.tx;const response=rest.tx_response;
 if(response.txhash.toUpperCase()!==expectedHash||raw.hash.toUpperCase()!==expectedHash||response.height!==raw.height||(!payment&&(BigInt(response.code)!==0n||BigInt(raw.tx_result.code)!==0n))||BigInt(response.code)!==BigInt(raw.tx_result.code)||BigInt(response.height)<=BigInt(challenge.min_height))throw new Error('Uncommitted, failed, old or inconsistent authentication receipt.');
 const time=Date.parse(blockTime);
 const restTime=Date.parse(response.timestamp);
 // Diana's REST transaction response can omit the block header's fractional seconds.
 const sameTime=restTime===time||(!response.timestamp.includes('.')&&restTime===Math.floor(time/1000)*1000);
 if(!Number.isFinite(time)||!sameTime||time<challenge.issued_at.getTime()-15000||time>challenge.expires_at.getTime())throw new Error('Receipt is outside the challenge time window.');
 const bytes=base64Bytes(raw.tx);if(createHash('sha256').update(bytes).digest('hex').toUpperCase()!==expectedHash)throw new Error('Canonical raw transaction hash mismatch.');
 const rawTx=TxRaw.decode(bytes);const body=TxBody.decode(rawTx.bodyBytes);const auth=AuthInfo.decode(rawTx.authInfoBytes);
 const expected=payment?.sends??[{recipient:challenge.wallet_address,amount:'1'}];
 if(body.messages.length!==expected.length||tx.body.messages.length!==expected.length)throw new Error('Unexpected payment message count.');
 for(const [index,send] of expected.entries()){
  const rawMessage=body.messages[index],restMessage=tx.body.messages[index];
  if(rawMessage.typeUrl!=='/cosmos.bank.v1beta1.MsgSend'||restMessage['@type']!==rawMessage.typeUrl)throw new Error('Unexpected payment message type.');
  const decoded=MsgSend.decode(rawMessage.value);
  for(const actual of [{from:decoded.fromAddress,to:decoded.toAddress,amount:decoded.amount},{from:restMessage.from_address,to:restMessage.to_address,amount:restMessage.amount}]){
   if(actual.from!==challenge.wallet_address||actual.to!==send.recipient||actual.amount.length!==1||actual.amount[0].denom!=='uqor'||actual.amount[0].amount!==send.amount)throw new Error('Exact payment message mismatch.');
  }
 }
 if(body.memo!==challenge.memo||tx.body.memo!==challenge.memo||auth.signerInfos.length!==1||tx.auth_info.signer_infos.length!==1||rawTx.signatures.length!==1||rawTx.signatures[0].length!==64||tx.signatures.length!==1||!Buffer.from(rawTx.signatures[0]).equals(Buffer.from(base64Bytes(tx.signatures[0]))))throw new Error('Unexpected memo or signatures.');
 if(auth.tip||!auth.fee||auth.fee.granter||(auth.fee.payer&&auth.fee.payer!==challenge.wallet_address)||auth.signerInfos[0].modeInfo?.single?.mode!==1)throw new Error('Unsupported fee delegation or signing mode.');
 const pk=auth.signerInfos[0].publicKey;const restPk=tx.auth_info.signer_infos[0].public_key;
 if(!pk||restPk['@type']!==pk.typeUrl)throw new Error('Signer key type mismatch.');
 const key=parseEthPubkeyAny(pk);
 const derivation=pk.typeUrl===ETHSECP256K1_PUBKEY_TYPE?'eth':'cosmos';
 if(validateClassicalKeyForSender(challenge.wallet_address,key)!==derivation||!Buffer.from(key).equals(Buffer.from(base64Bytes(restPk.key))))throw new Error('Signer identity mismatch.');
 if(payment&&BigInt(response.code)!==0n)throw new ConfirmedTransactionFailure('The exact registration transaction was committed with a nonzero result.');
 const extensions=[...body.extensionOptions,...body.nonCriticalExtensionOptions];const restExt=[...(tx.body.extension_options??[]),...(tx.body.non_critical_extension_options??[])];
 if(extensions.length!==1||extensions[0].typeUrl!=='/qorechain.pqc.v1.PQCHybridSignature'||restExt.length!==1||restExt[0]['@type']!==extensions[0].typeUrl||String(restExt[0].algorithm_id)!=='1')throw new Error('Missing or unexpected hybrid extension.');
 const hybrid=qorechainTypes.pqcHybrid.PQCHybridSignature.decode(extensions[0].value);
 if(hybrid.algorithmId!==1||hybrid.pqcSignature.length!==4627||pqKey.length!==2592||!Buffer.from(hybrid.pqcSignature).equals(Buffer.from(base64Bytes(restExt[0].pqc_signature)))||(hybrid.pqcPublicKey.length&&!Buffer.from(hybrid.pqcPublicKey).equals(Buffer.from(pqKey))))throw new Error('Hybrid key/signature mismatch.');
 const events=response.events.filter(e=>e.type==='pqc_hybrid_verify');if(events.length!==1||new Set(events[0].attributes.map(a=>a.key)).size!==events[0].attributes.length)throw new Error('Missing or ambiguous hybrid verification event.');
 const event=Object.fromEntries(events[0].attributes.map(a=>[a.key,a.value]));if(event.status!=='verified'||event.address!==challenge.wallet_address||!['1','dilithium5'].includes(event.algorithm_id))throw new Error('Hybrid chain verification did not match the signer.');
 body.extensionOptions=[];body.nonCriticalExtensionOptions=[];const b0=TxBody.encode(body).finish();if(!pqcVerify(pqKey,hybridSignBytes(version,DIANA.chainId,b0,rawTx.authInfoBytes),hybrid.pqcSignature))throw new Error('Independent ML-DSA-87 verification failed.');
 return {hash:expectedHash,height:response.height,timestamp:blockTime,signer:challenge.wallet_address,memo:challenge.memo,verifierVersion:'rk-auth-1',localPqcVerified:true};
}
export type RegistrationChallenge=Challenge&{recipient:string;amount_uqor:'100000'};
export type RegistrationReceipt=Omit<AuthReceipt,'verifierVersion'>&{verifierVersion:'rk-reg-1'};
export function inspectAuthReceipt(receipt:unknown,rpc:unknown,challenge:Challenge,hash:string,chain:unknown,time:string,key:Uint8Array,version:'v1'|'v2'):AuthReceipt {return inspectNativeReceipt(receipt,rpc,challenge,hash,chain,time,key,version);}
export function inspectRegistrationReceipt(receipt:unknown,rpc:unknown,intent:RegistrationChallenge,hash:string,chain:unknown,time:string,key:Uint8Array,version:'v1'|'v2'):RegistrationReceipt {
 if(intent.amount_uqor!=='100000')throw new Error('Incorrect registration fee.');
 const result=inspectNativeReceipt(receipt,rpc,intent,hash,chain,time,key,version,{sends:[{recipient:intent.recipient,amount:'100000'}],purpose:'reg'});return {...result,verifierVersion:'rk-reg-1'};
}
export function inspectPaymentReceipt(receipt:unknown,rpc:unknown,intent:Challenge,sends:Send[],hash:string,chain:unknown,time:string,key:Uint8Array,version:'v1'|'v2'){
 if(sends.length<1||sends.length>2)throw new Error('Invalid payment intent.');
 return inspectNativeReceipt(receipt,rpc,intent,hash,chain,time,key,version,{sends,purpose:'pay'});
}
export class CanonicalVerifier{
 constructor(readonly fetcher:typeof fetch=fetch){}
 async network(){return nativeNetwork(this.fetcher);}
 async verify(challenge:Challenge,hash:string):Promise<AuthReceipt>{return this.load(challenge,hash,(...args)=>inspectAuthReceipt(...args));}
 async verifyRegistration(intent:RegistrationChallenge,hash:string):Promise<RegistrationReceipt>{return this.load(intent,hash,(receipt,raw,challenge,hash,chain,time,key,version)=>inspectRegistrationReceipt(receipt,raw,challenge as RegistrationChallenge,hash,chain,time,key,version));}
 async verifyPayment(intent:Challenge,sends:Send[],hash:string){return this.load(intent,hash,(receipt,raw,challenge,hash,chain,time,key,version)=>inspectPaymentReceipt(receipt,raw,challenge,sends,hash,chain,time,key,version));}
 private async load<T>(challenge:Challenge,hash:string,inspect:(receipt:unknown,raw:unknown,challenge:Challenge,hash:string,chain:unknown,time:string,key:Uint8Array,version:'v1'|'v2')=>T):Promise<T>{
  const context=await this.network();const boundedSdkFetch:typeof fetch=async(input,init)=>{const url=new URL(typeof input==='string'?input:input instanceof URL?input.toString():input.url);if(url.origin!==DIANA.rest||url.username||url.password||(init?.method&&init.method!=='GET'))throw new Error('Only fixed Diana SDK reads are allowed.');return Response.json(await readJson(url.toString(),init??{},this.fetcher));};const [receipt,raw,pqc,version]=await Promise.all([readJson(`${DIANA.rest}/cosmos/tx/v1beta1/txs/${hash}`,{},this.fetcher),readJson(`${DIANA.rpc}/tx?hash=0x${hash}&prove=false`,{},this.fetcher),fetchPqcStatus({rest:DIANA.rest,address:challenge.wallet_address,fetch:boundedSdkFetch}),resolveSignBytesVersion({chainId:DIANA.chainId,rest:DIANA.rest,fetch:boundedSdkFetch,forceRefresh:true})]);
  const height=rpcSchema.parse(raw).result.height;if(!/^[1-9][0-9]*$/.test(height)||BigInt(height)>BigInt(context.height))throw new Error('Invalid receipt height.');
  const block=z.object({result:z.object({block:z.object({header:z.object({chain_id:z.literal(DIANA.chainId),height:z.literal(height),time:z.string()})})})}).parse(await readJson(`${DIANA.rpc}/block?height=${height}`,{},this.fetcher));
  const key=pqcStatusPublicKey(pqc);if(!pqc.registered||pqc.algorithmId!==1||pqc.possessionProven!==true||!key)throw new Error('A registered, possession-proven ML-DSA-87 key is required.');
  return inspect(receipt,raw,challenge,hash,context.chainId,block.result.block.header.time,key,version);
 }
}
