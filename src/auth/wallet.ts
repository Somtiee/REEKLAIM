import { hasCapability,qorexSignAndBroadcast } from '@qorechain/qorex-types';
import { MsgSend } from 'cosmjs-types/cosmos/bank/v1beta1/tx';
import { browserAdapter,detectQorex } from '../wallet/adapter.ts';
import type { ChallengeView } from './AuthProvider.tsx';
export async function approveAuthentication(challenge:ChallengeView,explicitConsent:boolean){
 if(!explicitConsent)throw new Error('Explicit approval of the authentication self-transfer and network fees is required.');
 if(challenge.chainId!=='qorechain-diana'||challenge.origin!==window.location.origin||challenge.amountUqor!=='1'||!/^rk:auth:v1:[A-Za-z0-9_-]{43}$/.test(challenge.memo)||!Number.isFinite(Date.parse(challenge.expiresAt))||Date.now()>=Date.parse(challenge.expiresAt))throw new Error('Authentication challenge expired or does not match this origin and Diana testnet.');
 const native=detectQorex();const adapter=browserAdapter();if(!native||!adapter)throw new Error('Install and unlock the official QoreX wallet.');
 if(!hasCapability(native,'signAndBroadcast'))throw new Error('This QoreX version cannot broadcast native hybrid transactions. Update from the official store.');
 const account=await adapter.account();if(account.address!==challenge.address)throw new Error('Wallet account changed. No authentication transaction was requested.');
 const result=await qorexSignAndBroadcast({chainId:'qorechain-diana',messages:[{typeUrl:'/cosmos.bank.v1beta1.MsgSend',value:MsgSend.encode({fromAddress:account.address,toAddress:account.address,amount:[{denom:'uqor',amount:'1'}]}).finish()}],memo:challenge.memo},{native});
 if(result.code!==0||!/^[A-Fa-f0-9]{64}$/.test(result.txHash))throw new Error('QoreX did not return a successful, valid transaction hash.');return result.txHash.toUpperCase();
}
