// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { createChainMiddleware, nativeNetwork, readJson } from '../server/chain.ts';
import { qorechainTypes } from '@qorechain/sdk';
import { TxRaw, TxBody } from 'cosmjs-types/cosmos/tx/v1beta1/tx';
import { createHash } from 'node:crypto';
import { proofMessage } from '../src/lib/proof.ts';
import { syntheticReceipt, intent } from './fixtures.ts';

function request(url: string, method = 'GET', headers = { host: 'localhost:5173' }) {
  return { url, method, headers } as IncomingMessage;
}
function response() {
  const result = { statusCode: 0, body: '', setHeader: vi.fn(), end: (value: string) => { result.body = value; } };
  return result;
}
describe('fixed read-only local backend', () => {
  it.each(['/api/qorechain/https://evil.invalid', '/api/qorechain/broadcast', '/api/qorechain/health?url=http://127.0.0.1'])('does not proxy arbitrary input: %s', async (url) => {
    const network = vi.fn(); const res = response();
    await createChainMiddleware(true, network)(request(url), res as unknown as ServerResponse, vi.fn());
    expect(res.statusCode).not.toBe(200); expect(network).not.toHaveBeenCalled();
  });
  it('refuses writes and non-loopback hosts', async () => {
    const network = vi.fn(); const middleware = createChainMiddleware(true, network);
    const res = response(); await middleware(request('/api/qorechain/health', 'POST'), res as unknown as ServerResponse, vi.fn()); expect(res.statusCode).toBe(405);
    await middleware(request('/api/qorechain/health', 'GET', { host: 'evil.invalid' }), res as unknown as ServerResponse, vi.fn()); expect(res.statusCode).toBe(403); expect(network).not.toHaveBeenCalled();
  });
  it('disables developer receipt verification in preview/production mode', async () => {
    const network = vi.fn(); const res = response(); await createChainMiddleware(false, network)(request('/api/qorechain/receipt'), res as unknown as ServerResponse, vi.fn()); expect(res.statusCode).toBe(404); expect(network).not.toHaveBeenCalled();
  });
  it('refuses an upstream reporting mainnet', async () => {
    const network = vi.fn(async (url: string | URL | Request) => Response.json(String(url).includes('/status') ? { result: { node_info: { network: 'qorechain-vladi' }, sync_info: { latest_block_height: '1', latest_block_time: 'x', catching_up: false } } } : { default_node_info: { network: 'qorechain-diana' } }));
    await expect(nativeNetwork(network)).rejects.toThrow('Wrong network');
  });
  it('surfaces upstream HTTP errors rather than fabricating a balance', async () => {
    await expect(readJson('https://api-testnet.qore.host', {}, vi.fn(async () => new Response('', { status: 403 })))).rejects.toThrow('HTTP 403');
  });
  it.each(['matching', 'missing-layer', 'different-signature'])('independently checks raw RPC hybrid bytes: %s (synthetic only)', async (variant) => {
    const message = proofMessage(intent);
    const extension = { typeUrl: '/qorechain.pqc.v1.PQCHybridSignature', value: qorechainTypes.pqcHybrid.PQCHybridSignature.encode({ algorithmId: 1, pqcSignature: Buffer.alloc(4627, variant === 'different-signature' ? 2 : 1), pqcPublicKey: new Uint8Array() }).finish() };
    const body = TxBody.encode(TxBody.fromPartial({ messages: [message], memo: intent.memo, extensionOptions: variant === 'missing-layer' ? [] : [extension] })).finish();
    const bytes = TxRaw.encode({ bodyBytes: body, authInfoBytes: new Uint8Array(), signatures: [Buffer.alloc(64, 1)] }).finish();
    const hash = createHash('sha256').update(bytes).digest('hex').toUpperCase();
    const receipt = syntheticReceipt(); receipt.tx_response.txhash = hash;
    const fetcher = vi.fn(async (url: string | URL | Request) => {
      const path = String(url);
      if (path.endsWith('/status')) return Response.json({ result: { node_info: { network: 'qorechain-diana' }, sync_info: { latest_block_height: '123', latest_block_time: '2026-11-17T14:00:00Z', catching_up: false } } });
      if (path.endsWith('/node_info')) return Response.json({ default_node_info: { network: 'qorechain-diana' } });
      if (path.includes('/cosmos/tx/')) return Response.json(receipt);
      if (path.includes('/tx?')) return Response.json({ result: { hash, height: '123', tx: Buffer.from(bytes).toString('base64'), tx_result: { code: 0 } } });
      throw new Error('Unexpected upstream');
    });
    const res = response();
    await createChainMiddleware(true, fetcher)(request(`/api/qorechain/receipt?${new URLSearchParams({ hash, sender: intent.sender, memo: intent.memo })}`), res as unknown as ServerResponse, vi.fn());
    expect(res.statusCode).toBe(variant === 'matching' ? 200 : 502);
    if (variant === 'matching') expect(JSON.parse(res.body)).toMatchObject({ independentRpcHashMatched: true, authentication: false });
  });
});
