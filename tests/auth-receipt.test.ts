// @vitest-environment node
// All transactions/signatures below are synthetic local fixtures, never chain evidence.
import { describe,it,expect } from 'vitest';
import { TxRaw,TxBody,AuthInfo } from 'cosmjs-types/cosmos/tx/v1beta1/tx';
import { MsgSend } from 'cosmjs-types/cosmos/bank/v1beta1/tx';
import { PubKey } from 'cosmjs-types/cosmos/crypto/secp256k1/keys';
import { generatePqcKeypair,pqcSign,hybridSignBytes,qorechainTypes,ETHSECP256K1_PUBKEY_TYPE,bytesToBech32,keccak256 } from '@qorechain/sdk';
import { createHash,randomUUID,ECDH } from 'node:crypto';
import { inspectAuthReceipt,inspectPaymentReceipt,type Challenge } from '../server/auth/receipt.ts';
import { address,publicKey,syntheticReceipt } from './fixtures.ts';
const pq=generatePqcKeypair(new Uint8Array(32).fill(7));
function fixture(sends=[{recipient:address,amount:'1'}],payment=false,ethereumKey=false){
 const keyType=ethereumKey?ETHSECP256K1_PUBKEY_TYPE:'/cosmos.crypto.secp256k1.PubKey';
 const signer=ethereumKey?bytesToBech32(keccak256(ECDH.convertKey(publicKey,'secp256k1',undefined,undefined,'uncompressed').subarray(1)).subarray(-20),'qor'):address;
 if(ethereumKey)sends=[{recipient:signer,amount:'1'}];
 const issued=new Date('2026-11-17T14:00:00Z');const challenge:Challenge={id:randomUUID(),pre_digest:'f'.repeat(64),wallet_address:address,chain_id:'qorechain-diana',origin:'http://127.0.0.1:5173',memo:(payment?'rk:pay:v1:':'rk:auth:v1:')+'a'.repeat(43),min_height:'100',issued_at:issued,expires_at:new Date(issued.getTime()+300000),state:'pending',candidate_hash:null};
 challenge.wallet_address=signer;
 const body=TxBody.fromPartial({memo:challenge.memo,messages:sends.map(send=>({typeUrl:'/cosmos.bank.v1beta1.MsgSend',value:MsgSend.encode({fromAddress:signer,toAddress:send.recipient,amount:[{denom:'uqor',amount:send.amount}]}).finish()}))});
 const auth=AuthInfo.encode(AuthInfo.fromPartial({signerInfos:[{publicKey:{typeUrl:keyType,value:PubKey.encode({key:publicKey}).finish()},modeInfo:{single:{mode:1}},sequence:1n}],fee:{amount:[{denom:'uqor',amount:'10'}],gasLimit:400000n}})).finish();
 const signature=pqcSign(pq.secretKey,hybridSignBytes('v2','qorechain-diana',TxBody.encode(body).finish(),auth));
 body.extensionOptions=[{typeUrl:'/qorechain.pqc.v1.PQCHybridSignature',value:qorechainTypes.pqcHybrid.PQCHybridSignature.encode({algorithmId:1,pqcSignature:signature,pqcPublicKey:new Uint8Array()}).finish()}];
 const raw=TxRaw.encode({bodyBytes:TxBody.encode(body).finish(),authInfoBytes:auth,signatures:[new Uint8Array(64).fill(1)]}).finish();const hash=createHash('sha256').update(raw).digest('hex').toUpperCase();
 const receipt=syntheticReceipt();receipt.tx.body.memo=challenge.memo;receipt.tx.body.messages=sends.map(send=>({'@type':'/cosmos.bank.v1beta1.MsgSend',from_address:signer,to_address:send.recipient,amount:[{denom:'uqor',amount:send.amount}]}));receipt.tx.body.extension_options[0].pqc_signature=Buffer.from(signature).toString('base64');receipt.tx_response.txhash=hash;receipt.tx_response.timestamp='2026-11-17T14:00:10Z';
 receipt.tx.auth_info.signer_infos[0].public_key['@type']=keyType;
 receipt.tx_response.events[0].attributes.find(attribute=>attribute.key==='address')!.value=signer;
 const rpc={result:{hash,height:'123',tx:Buffer.from(raw).toString('base64'),tx_result:{code:0}}};
 return {receipt,rpc,challenge,hash,run(){return inspectAuthReceipt(receipt,rpc,challenge,hash,'qorechain-diana',receipt.tx_response.timestamp,pq.publicKey,'v2');}};
}
describe('canonical authentication receipt (synthetic)',()=>{
 it('requires both raw consistency, chain verdict and actual ML-DSA verification',()=>{expect(fixture().run().localPqcVerified).toBe(true);});
 it('verifies a native receipt signed by the QoreX unified key',()=>{expect(fixture(undefined,false,true).run().localPqcVerified).toBe(true);});
 it('accepts the Diana event alias and second-precision REST time while checking the actual block time',()=>{
  const f=fixture();
  f.receipt.tx_response.events[0].attributes.find(attribute=>attribute.key==='algorithm_id')!.value='dilithium5';
  const blockTime='2026-11-17T14:00:10.192276278Z';
  const verify=()=>inspectAuthReceipt(f.receipt,f.rpc,f.challenge,f.hash,'qorechain-diana',blockTime,pq.publicKey,'v2');
  expect(verify().timestamp).toBe(blockTime);
  f.challenge.expires_at=new Date(f.receipt.tx_response.timestamp);
  expect(verify).toThrow('time window');
 });
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
 it('rejects a wrong PQ key despite valid signature lengths and a verified event',()=>{const f=fixture();expect(()=>inspectAuthReceipt(f.receipt,f.rpc,f.challenge,f.hash,'qorechain-diana',f.receipt.tx_response.timestamp,new Uint8Array(2592).fill(9),'v2')).toThrow('verification failed');});
 it('rejects inconsistent independent block time',()=>{const f=fixture();expect(()=>inspectAuthReceipt(f.receipt,f.rpc,f.challenge,f.hash,'qorechain-diana','2026-11-17T14:01:00Z',pq.publicKey,'v2')).toThrow();});
});

describe('canonical payment receipts (synthetic)',()=>{
 const reward=[{recipient:'qor1-finder-fixture',amount:'5000000'},{recipient:'qor1-treasury-fixture',amount:'100000'}];
 const verify=(f:ReturnType<typeof fixture>,sends=reward,chain='qorechain-diana')=>inspectPaymentReceipt(f.receipt,f.rpc,f.challenge,sends,f.hash,chain,f.receipt.tx_response.timestamp,pq.publicKey,'v2');
 it('accepts exactly the two committed reward sends and hybrid proof',()=>expect(verify(fixture(reward,true)).localPqcVerified).toBe(true));
 it('rejects a payer, finder, treasury, denomination, amount, hash shape, or network mismatch',()=>{
   const f=fixture(reward,true);
   for(const sends of [reward.slice(0,1),[...reward].reverse(),[{...reward[0],amount:'4999999'},reward[1]],[{...reward[0],recipient:'other finder'},reward[1]],[reward[0],{...reward[1],recipient:'other treasury'}]])expect(()=>verify(f,sends)).toThrow();
   expect(()=>verify(f,reward,'qorechain-vladi')).toThrow();
   f.receipt.tx.body.messages[0].from_address='wrong payer';expect(()=>verify(f)).toThrow();
   f.receipt.tx.body.messages[0].from_address=address;f.receipt.tx.body.messages[0].amount[0].denom='other';expect(()=>verify(f)).toThrow();
 });
 it('rejects a partial reward and identifies nonzero committed settlement',()=>{
   expect(()=>verify(fixture(reward.slice(0,1),true))).toThrow();
   const failed=fixture(reward,true);failed.receipt.tx_response.code=5;failed.rpc.result.tx_result.code=5;
   expect(()=>verify(failed)).toThrow(/nonzero/);
 });
});
