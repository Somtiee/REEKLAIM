// All transactions/signatures below are synthetic local fixtures, never chain evidence.
import { describe,it,expect } from 'vitest';
import { TxRaw,TxBody,AuthInfo } from 'cosmjs-types/cosmos/tx/v1beta1/tx';
import { MsgSend } from 'cosmjs-types/cosmos/bank/v1beta1/tx';
import { PubKey } from 'cosmjs-types/cosmos/crypto/secp256k1/keys';
import { generatePqcKeypair,pqcSign,hybridSignBytes,qorechainTypes } from '@qorechain/sdk';
import { createHash,randomUUID } from 'node:crypto';
import { inspectRegistrationReceipt,type RegistrationChallenge } from '../server/auth/receipt.ts';
import { address,publicKey,syntheticReceipt } from './fixtures.ts';
const pq=generatePqcKeypair(new Uint8Array(32).fill(7));
function fixture(){
 const issued=new Date('2026-11-17T14:00:00Z');const challenge:RegistrationChallenge={recipient:'qor1ez7wqp5ala5ph5nx95n6tdedrccsacqndfjgx3',amount_uqor:'100000',id:randomUUID(),pre_digest:'f'.repeat(64),wallet_address:address,chain_id:'qorechain-diana',origin:'http://127.0.0.1:5173',memo:'rk:reg:v1:'+'a'.repeat(43),min_height:'100',issued_at:issued,expires_at:new Date(issued.getTime()+300000),state:'pending',candidate_hash:null};
 const body=TxBody.fromPartial({memo:challenge.memo,messages:[{typeUrl:'/cosmos.bank.v1beta1.MsgSend',value:MsgSend.encode({fromAddress:address,toAddress:challenge.recipient,amount:[{denom:'uqor',amount:'100000'}]}).finish()}]});
 const auth=AuthInfo.encode(AuthInfo.fromPartial({signerInfos:[{publicKey:{typeUrl:'/cosmos.crypto.secp256k1.PubKey',value:PubKey.encode({key:publicKey}).finish()},modeInfo:{single:{mode:1}},sequence:1n}],fee:{amount:[{denom:'uqor',amount:'10'}],gasLimit:400000n}})).finish();
 const signature=pqcSign(pq.secretKey,hybridSignBytes('v2','qorechain-diana',TxBody.encode(body).finish(),auth));
 body.extensionOptions=[{typeUrl:'/qorechain.pqc.v1.PQCHybridSignature',value:qorechainTypes.pqcHybrid.PQCHybridSignature.encode({algorithmId:1,pqcSignature:signature,pqcPublicKey:new Uint8Array()}).finish()}];
 const raw=TxRaw.encode({bodyBytes:TxBody.encode(body).finish(),authInfoBytes:auth,signatures:[new Uint8Array(64).fill(1)]}).finish();const hash=createHash('sha256').update(raw).digest('hex').toUpperCase();
 const receipt=syntheticReceipt();receipt.tx.body.memo=challenge.memo;receipt.tx.body.messages[0].to_address=challenge.recipient;receipt.tx.body.messages[0].amount[0].amount='100000';receipt.tx.body.extension_options[0].pqc_signature=Buffer.from(signature).toString('base64');receipt.tx_response.txhash=hash;receipt.tx_response.timestamp='2026-11-17T14:00:10Z';
 const rpc={result:{hash,height:'123',tx:Buffer.from(raw).toString('base64'),tx_result:{code:0}}};
 return {receipt,rpc,challenge,hash,run(){return inspectRegistrationReceipt(receipt,rpc,challenge,hash,'qorechain-diana',receipt.tx_response.timestamp,pq.publicKey,'v2');}};
}
describe('canonical registration receipt (synthetic)',()=>{
 it('requires both raw consistency, chain verdict and actual ML-DSA verification',()=>{expect(fixture().run().localPqcVerified).toBe(true);});
 for(const [name,change] of Object.entries({
 'wrong wallet':(f:ReturnType<typeof fixture>)=>{f.challenge.wallet_address='qor1'+'a'.repeat(38);},
 'wrong chain':(f:ReturnType<typeof fixture>)=>{f.challenge.chain_id='qorechain-vladi';},
 'incorrect memo':(f:ReturnType<typeof fixture>)=>{f.receipt.tx.body.memo+='x';},
 'incorrect amount':(f:ReturnType<typeof fixture>)=>{f.receipt.tx.body.messages[0].amount[0].amount='2';},
 'incorrect recipient':(f:ReturnType<typeof fixture>)=>{f.receipt.tx.body.messages[0].to_address='qor1'+'b'.repeat(38);},
 'failed transaction':(f:ReturnType<typeof fixture>)=>{f.receipt.tx_response.code=5;},
 'extra message':(f:ReturnType<typeof fixture>)=>{f.receipt.tx.body.messages.push(f.receipt.tx.body.messages[0]);},
 'missing hybrid event':(f:ReturnType<typeof fixture>)=>{f.receipt.tx_response.events=[];},
 'unverified hybrid event':(f:ReturnType<typeof fixture>)=>{f.receipt.tx_response.events[0].attributes[0].value='failed';},
 'missing extension':(f:ReturnType<typeof fixture>)=>{f.receipt.tx.body.extension_options=[];},
 'forged signature':(f:ReturnType<typeof fixture>)=>{f.receipt.tx.body.extension_options[0].pqc_signature=Buffer.alloc(4627,2).toString('base64');},
 'raw hash mismatch':(f:ReturnType<typeof fixture>)=>{f.rpc.result.tx=Buffer.alloc(40).toString('base64');},
 'duplicate event attribute':(f:ReturnType<typeof fixture>)=>{f.receipt.tx_response.events[0].attributes.push({key:'status',value:'verified'});},
 'pre-challenge block':(f:ReturnType<typeof fixture>)=>{f.challenge.min_height='123';},
 'late block time':(f:ReturnType<typeof fixture>)=>{f.receipt.tx_response.timestamp='2026-11-17T14:06:00Z';},
 'wrong signer public key':(f:ReturnType<typeof fixture>)=>{f.receipt.tx.auth_info.signer_infos[0].public_key.key=Buffer.alloc(33,2).toString('base64');},
 }))it('rejects '+name,()=>{const f=fixture();change(f);expect(()=>f.run()).toThrow();});
 it('rejects a wrong PQ key despite valid signature lengths and a verified event',()=>{const f=fixture();expect(()=>inspectRegistrationReceipt(f.receipt,f.rpc,f.challenge,f.hash,'qorechain-diana',f.receipt.tx_response.timestamp,new Uint8Array(2592).fill(9),'v2')).toThrow('verification failed');});
 it('rejects inconsistent independent block time',()=>{const f=fixture();expect(()=>inspectRegistrationReceipt(f.receipt,f.rpc,f.challenge,f.hash,'qorechain-diana','2026-11-17T14:01:00Z',pq.publicKey,'v2')).toThrow();});
});
