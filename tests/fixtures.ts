// Synthetic receipt-parser fixtures. NOT blockchain evidence or real signatures.
import { bytesToBech32, ripemd160, sha256 } from '@qorechain/sdk';
import type { ProofIntent } from '../src/lib/proof.ts';
export const publicKey = Uint8Array.from(Buffer.from('0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798', 'hex'));
export const address = bytesToBech32(ripemd160(sha256(publicKey)), 'qor');
export const hash = 'A'.repeat(64);
export const intent: ProofIntent = { chainId: 'qorechain-diana', sender: address, recipient: address, amountUqor: '1', memo: `rk:proof:v1:${'a'.repeat(32)}` };
export function syntheticReceipt() {
  return {
    tx: {
      body: {
        memo: intent.memo,
        messages: [{ '@type': '/cosmos.bank.v1beta1.MsgSend', from_address: address, to_address: address, amount: [{ denom: 'uqor', amount: '1' }] }],
        extension_options: [{ '@type': '/qorechain.pqc.v1.PQCHybridSignature', algorithm_id: 1, pqc_signature: Buffer.alloc(4627, 1).toString('base64') }],
      },
      auth_info: { signer_infos: [{ public_key: { '@type': '/cosmos.crypto.secp256k1.PubKey', key: Buffer.from(publicKey).toString('base64') } }] },
      signatures: [Buffer.alloc(64, 1).toString('base64')],
    },
    tx_response: { txhash: hash, code: 0, height: '123', timestamp: '2026-11-17T14:00:00Z', events: [{ type: 'pqc_hybrid_verify', attributes: [{ key: 'status', value: 'verified' }, { key: 'address', value: address }, { key: 'algorithm_id', value: '1' }] }] },
  };
}
