import { describe, expect, it } from 'vitest';
import { verifyHybridReceipt } from '../src/lib/receipt.ts';
import { hash, intent, syntheticReceipt } from './fixtures.ts';

describe('native hybrid receipt parser (synthetic fixtures only)', () => {
  it('matches all expected evidence without granting authentication', () => {
    const proof = verifyHybridReceipt(syntheticReceipt(), 'qorechain-diana', hash, intent);
    expect(proof.pqcSignatureBytes).toBe(4627); expect(proof.authentication).toBe(false); expect(proof.height).toBe('123');
  });
  it('rejects a wrong-chain source even when the receipt otherwise matches', () => expect(() => verifyHybridReceipt(syntheticReceipt(), 'qorechain-vladi', hash, intent)).toThrow());
  it('rejects failed transactions', () => { const r = syntheticReceipt(); r.tx_response.code = 5; expect(() => verifyHybridReceipt(r, 'qorechain-diana', hash, intent)).toThrow('failed'); });
  it.each([
    ['missing PQ layer', (r: ReturnType<typeof syntheticReceipt>) => { r.tx.body.extension_options = []; }],
    ['wrong algorithm', (r: ReturnType<typeof syntheticReceipt>) => { r.tx.body.extension_options[0].algorithm_id = 2; }],
    ['short PQ signature', (r: ReturnType<typeof syntheticReceipt>) => { r.tx.body.extension_options[0].pqc_signature = 'AAAA'; }],
    ['malformed base64', (r: ReturnType<typeof syntheticReceipt>) => { r.tx.body.extension_options[0].pqc_signature = '!'.repeat(6172); }],
    ['no verdict', (r: ReturnType<typeof syntheticReceipt>) => { r.tx_response.events = []; }],
    ['unverified verdict', (r: ReturnType<typeof syntheticReceipt>) => { r.tx_response.events[0].attributes[0].value = 'failed'; }],
    ['wrong event signer', (r: ReturnType<typeof syntheticReceipt>) => { r.tx_response.events[0].attributes[1].value = 'someone-else'; }],
    ['extra payment', (r: ReturnType<typeof syntheticReceipt>) => { r.tx.body.messages.push(r.tx.body.messages[0]); }],
    ['tampered amount', (r: ReturnType<typeof syntheticReceipt>) => { r.tx.body.messages[0].amount[0].amount = '1000000'; }],
    ['wrong memo', (r: ReturnType<typeof syntheticReceipt>) => { r.tx.body.memo = 'unrelated'; }],
    ['hash mismatch', (r: ReturnType<typeof syntheticReceipt>) => { r.tx_response.txhash = 'B'.repeat(64); }],
    ['duplicate extension', (r: ReturnType<typeof syntheticReceipt>) => { r.tx.body.extension_options.push(r.tx.body.extension_options[0]); }],
    ['duplicate event attribute', (r: ReturnType<typeof syntheticReceipt>) => { r.tx_response.events[0].attributes.push({ key: 'status', value: 'verified' }); }],
    ['wrong signer key', (r: ReturnType<typeof syntheticReceipt>) => { r.tx.auth_info.signer_infos[0].public_key.key = Buffer.alloc(33, 2).toString('base64'); }],
  ])('rejects %s', (_label, mutate) => { const r = syntheticReceipt(); mutate(r); expect(() => verifyHybridReceipt(r, 'qorechain-diana', hash, intent)).toThrow(); });
});
