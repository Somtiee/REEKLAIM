import {hasCapability,qorexSignAndBroadcast} from '@qorechain/qorex-types';
import {MsgSend} from 'cosmjs-types/cosmos/bank/v1beta1/tx';
import {browserAdapter,detectQorex} from '../wallet/adapter.ts';
import {nativeAddress} from '../lib/amounts.ts';
import {rewardQuote,TRANSFER_FEE,type PaymentView} from './domain.ts';

export async function approvePayment(intent:PaymentView,consent:boolean,reserve:()=>Promise<unknown>){
  if(!consent)throw new Error('Explicit consent is required.');
  if(!intent.canPay||intent.chainId!=='qorechain-diana'||intent.origin!==window.location.origin||intent.state!=='pending'||intent.approval_started||
    intent.candidate_hash||!intent.memo||!/^rk:pay:v1:[A-Za-z0-9_-]{43}$/.test(intent.memo)||
    !intent.expires_at||!Number.isFinite(Date.parse(intent.expires_at))||Date.parse(intent.expires_at)<=Date.now())throw new Error('Payment is unavailable. Check its existing receipt.');
  nativeAddress(intent.payer);nativeAddress(intent.recipient);nativeAddress(intent.treasury);
  const expected=intent.purpose==='transfer'?[{recipient:intent.treasury,amount:TRANSFER_FEE}]:(()=>{
    const quote=rewardQuote(intent.sends[0]?.amount??'');
    return [{recipient:intent.recipient,amount:quote.reward},...(quote.fee==='0'?[]:[{recipient:intent.treasury,amount:quote.fee}])];
  })();
  if(expected.length!==intent.sends.length||expected.some((send,index)=>send.recipient!==intent.sends[index].recipient||send.amount!==intent.sends[index].amount))throw new Error('The exact payment messages do not match the review.');
  const native=detectQorex(),adapter=browserAdapter();
  if(!native||!adapter||!hasCapability(native,'signAndBroadcast'))throw new Error('Connect official QoreX with native broadcasting support.');
  if((await adapter.account()).address!==intent.payer)throw new Error('Reconnect the authorized payer on Diana.');
  await reserve();
  const result=await qorexSignAndBroadcast({
    chainId:'qorechain-diana',memo:intent.memo,messages:expected.map(send=>({
      typeUrl:'/cosmos.bank.v1beta1.MsgSend',
      value:MsgSend.encode({fromAddress:intent.payer,toAddress:send.recipient,amount:[{denom:'uqor',amount:send.amount}]}).finish(),
    })),
  },{native});
  if(!/^[A-Fa-f0-9]{64}$/.test(result.txHash))throw new Error('No usable hash returned. Check QoreX history before taking further action.');
  return result.txHash.toUpperCase();
}
