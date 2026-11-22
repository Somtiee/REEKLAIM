import { hasCapability,qorexSignAndBroadcast } from '@qorechain/qorex-types';
import { MsgSend } from 'cosmjs-types/cosmos/bank/v1beta1/tx';
import { browserAdapter,detectQorex } from '../wallet/adapter.ts';
import { nativeAddress } from '../lib/amounts.ts';
import type { RegistrationIntent } from './domain.ts';
export async function approveRegistration(intent:RegistrationIntent,consent:boolean){
 if(!consent)throw new Error('Review the fee and approve the registration explicitly.');
 if(intent.state!=='pending'||intent.candidateHash||intent.origin!==window.location.origin||intent.chainId!=='qorechain-diana'||intent.amountUqor!=='100000'||!/^rk:reg:v1:[A-Za-z0-9_-]{43}$/.test(intent.memo)||!Number.isFinite(Date.parse(intent.expiresAt))||Date.parse(intent.expiresAt)<=Date.now())throw new Error('This intent cannot request another payment. Reconcile the existing hash.');
 nativeAddress(intent.recipient);nativeAddress(intent.address);const native=detectQorex();const adapter=browserAdapter();if(!native||!adapter||!hasCapability(native,'signAndBroadcast'))throw new Error('A current official QoreX wallet with native signAndBroadcast is required.');
 const account=await adapter.account();if(account.address!==intent.address)throw new Error('Wallet account changed. Reconnect the authenticated Diana account.');
 const result=await qorexSignAndBroadcast({chainId:'qorechain-diana',messages:[{typeUrl:'/cosmos.bank.v1beta1.MsgSend',value:MsgSend.encode({fromAddress:account.address,toAddress:intent.recipient,amount:[{denom:'uqor',amount:'100000'}]}).finish()}],memo:intent.memo},{native});
 if(!/^[a-fA-F0-9]{64}$/.test(result.txHash))throw new Error('No valid transaction hash was returned. Check QoreX history before retrying.');return result.txHash.toUpperCase();
}
