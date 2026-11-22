import { bytesToBech32, ripemd160, sha256 } from '@qorechain/sdk';
import { z } from 'zod';
import { assertDiana } from './network.ts';
import { proofMessage, type ProofIntent } from './proof.ts';

const record = z.record(z.string(), z.unknown());
const receiptSchema = z.object({
  tx: z.object({
    body: z.object({ memo: z.string(), messages: z.array(record), extension_options: z.array(record).optional(), non_critical_extension_options: z.array(record).optional() }),
    auth_info: z.object({ signer_infos: z.array(z.object({ public_key: z.object({ '@type': z.string(), key: z.string() }) })) }), signatures: z.array(z.string()),
  }),
  tx_response: z.object({
    txhash: z.string(), code: z.union([z.number().int().nonnegative(), z.string().regex(/^\d+$/)]), height: z.string().regex(/^[1-9]\d*$/), timestamp: z.string().datetime({ offset: true }),
    events: z.array(z.object({ type: z.string(), attributes: z.array(z.object({ key: z.string(), value: z.string() })) })),
  }),
});
export function base64Bytes(value: unknown): Uint8Array {
  if (typeof value !== 'string' || value.length === 0 || value.length % 4 !== 0 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) throw new Error('Invalid base64 signature evidence.');
  return Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
}
export interface HybridProof {
  hash: string; height: string; timestamp: string; chainId: 'qorechain-diana'; sender: string; memo: string; amountUqor: '1'; classicalSignatureBytes: number; pqcSignatureBytes: number;
  extensionType: string; algorithmId: '1'; event: Record<string, string>; verification: 'chain-verified-native-hybrid'; authentication: false;
}
/** Network identity is supplied by the server's fixed upstream reads, never a client assertion. */
export function verifyHybridReceipt(input: unknown, chainId: unknown, expectedHash: string, intent: ProofIntent): HybridProof {
  assertDiana(chainId);
  proofMessage(intent);
  const { tx, tx_response: response } = receiptSchema.parse(input);
  if (!/^[0-9A-Fa-f]{64}$/.test(expectedHash) || response.txhash.toUpperCase() !== expectedHash.toUpperCase()) throw new Error('Transaction hash mismatch.');
  if (BigInt(response.code) !== 0n) throw new Error('Transaction failed on-chain.');
  if (tx.body.memo !== intent.memo || tx.body.messages.length !== 1) throw new Error('Receipt does not match the approved proof intent.');
  const message = z.object({ '@type': z.literal('/cosmos.bank.v1beta1.MsgSend'), from_address: z.literal(intent.sender), to_address: z.literal(intent.recipient), amount: z.tuple([z.object({ denom: z.literal('uqor'), amount: z.literal('1') })]) }).parse(tx.body.messages[0]);
  if (tx.auth_info.signer_infos.length !== 1 || tx.signatures.length !== 1 || base64Bytes(tx.signatures[0]).length !== 64) throw new Error('Invalid classical signer evidence.');
  const pub = tx.auth_info.signer_infos[0].public_key;
  if (pub['@type'] !== '/cosmos.crypto.secp256k1.PubKey') throw new Error('Use a standard native (coin-118) account for this Phase 1 proof.');
  const pubkey = base64Bytes(pub.key);
  if (pubkey.length !== 33 || bytesToBech32(ripemd160(sha256(pubkey)), 'qor') !== message.from_address) throw new Error('Signer public key does not control the expected sender.');
  const extensions = [...(tx.body.extension_options ?? []), ...(tx.body.non_critical_extension_options ?? [])];
  if (extensions.length !== 1 || extensions[0]['@type'] !== '/qorechain.pqc.v1.PQCHybridSignature') throw new Error('Expected exactly one native PQCHybridSignature extension.');
  const hybrid = extensions[0];
  if (String(hybrid.algorithm_id) !== '1' || base64Bytes(hybrid.pqc_signature).length !== 4627) throw new Error('Invalid ML-DSA-87 signature evidence.');
  const events = response.events.filter((event) => event.type === 'pqc_hybrid_verify');
  if (events.length !== 1) throw new Error('Missing or ambiguous chain hybrid verification event.');
  const attrs = events[0].attributes;
  if (new Set(attrs.map((a) => a.key)).size !== attrs.length) throw new Error('Duplicate verification event attributes.');
  const event = Object.fromEntries(attrs.map((a) => [a.key, a.value]));
  if (event.status !== 'verified' || event.address !== intent.sender || !['1', 'dilithium5'].includes(event.algorithm_id)) throw new Error('Chain did not verify ML-DSA-87 for the expected signer.');
  return { hash: response.txhash.toUpperCase(), height: response.height, timestamp: response.timestamp, chainId: 'qorechain-diana', sender: intent.sender, memo: intent.memo, amountUqor: '1', classicalSignatureBytes: 64, pqcSignatureBytes: 4627, extensionType: String(hybrid['@type']), algorithmId: '1', event, verification: 'chain-verified-native-hybrid', authentication: false };
}
