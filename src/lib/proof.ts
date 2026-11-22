import { MsgSend } from 'cosmjs-types/cosmos/bank/v1beta1/tx';
import { DIANA, assertDiana } from './network.ts';
import { nativeAddress } from './amounts.ts';

export interface ProofIntent { chainId: typeof DIANA.chainId; sender: string; recipient: string; amountUqor: '1'; memo: string }

export function createProofIntent(address: string): ProofIntent {
  nativeAddress(address);
  const nonce = new Uint8Array(16);
  crypto.getRandomValues(nonce);
  return { chainId: DIANA.chainId, sender: address, recipient: address, amountUqor: '1', memo: `rk:proof:v1:${Array.from(nonce, (b) => b.toString(16).padStart(2, '0')).join('')}` };
}
export function proofMessage(intent: ProofIntent) {
  assertDiana(intent.chainId);
  nativeAddress(intent.sender);
  if (intent.recipient !== intent.sender || intent.amountUqor !== '1' || !/^rk:proof:v1:[a-f0-9]{32}$/.test(intent.memo)) throw new Error('Only the reviewed 1 uqor self-transfer proof is allowed.');
  return { typeUrl: '/cosmos.bank.v1beta1.MsgSend', value: MsgSend.encode({ fromAddress: intent.sender, toAddress: intent.recipient, amount: [{ denom: DIANA.denom, amount: intent.amountUqor }] }).finish() };
}
