import { createHash } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { TxRaw, TxBody } from 'cosmjs-types/cosmos/tx/v1beta1/tx';
import { MsgSend } from 'cosmjs-types/cosmos/bank/v1beta1/tx';
import { z } from 'zod';
import { qorechainTypes } from '@qorechain/sdk';
import { DIANA, assertDiana } from '../src/lib/network.ts';
import { nativeAddress } from '../src/lib/amounts.ts';
import { verifyHybridReceipt, base64Bytes } from '../src/lib/receipt.ts';
import type { ProofIntent } from '../src/lib/proof.ts';

type Fetcher = typeof fetch;
export class UpstreamError extends Error {
  constructor(readonly status: number, message: string) { super(message); }
}
export async function readJson(url: string, init: RequestInit = {}, fetcher: Fetcher = fetch): Promise<unknown> {
  const response = await fetcher(url, { ...init, redirect: 'error', signal: AbortSignal.timeout(12000), headers: { 'Accept': 'application/json', ...(init.headers ?? {}) } });
  if (!response.ok) throw new UpstreamError(response.status, `Official testnet upstream returned HTTP ${response.status}.`);
  const limit = 2_000_000;
  if (Number(response.headers.get('content-length')) > limit) throw new Error('Upstream response too large.');
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Empty upstream response.');
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > limit) { await reader.cancel(); throw new Error('Upstream response too large.'); }
    chunks.push(value);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
}
const rpcStatus = z.object({ result: z.object({ node_info: z.object({ network: z.string() }), sync_info: z.object({ latest_block_height: z.string().regex(/^\d+$/), latest_block_time: z.string(), catching_up: z.boolean() }) }) });
const restInfo = z.object({ default_node_info: z.object({ network: z.string() }) });

export async function nativeNetwork(fetcher: Fetcher = fetch) {
  const [rpc, rest] = await Promise.all([
    readJson(`${DIANA.rpc}/status`, {}, fetcher).then((v) => rpcStatus.parse(v)),
    readJson(`${DIANA.rest}/cosmos/base/tendermint/v1beta1/node_info`, {}, fetcher).then((v) => restInfo.parse(v)),
  ]);
  assertDiana(rpc.result.node_info.network);
  assertDiana(rest.default_node_info.network);
  if (rpc.result.sync_info.catching_up) throw new Error('Testnet node is catching up; writes are disabled.');
  return { chainId: DIANA.chainId, height: rpc.result.sync_info.latest_block_height, blockTime: rpc.result.sync_info.latest_block_time, checkedAt: new Date().toISOString() };
}
export async function networkHealth(fetcher: Fetcher = fetch) {
  const [native, evm] = await Promise.allSettled([
    nativeNetwork(fetcher),
    readJson(DIANA.evmRpc, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_chainId', params: [] }) }, fetcher).then((v) => z.object({ result: z.literal(DIANA.evmChainHex) }).parse(v)),
  ]);
  return {
    native: native.status === 'fulfilled' ? { ok: true, ...native.value } : { ok: false, error: errorMessage(native.reason) },
    evm: evm.status === 'fulfilled' ? { ok: true, chainId: evm.value.result } : { ok: false, error: errorMessage(evm.reason) }, testnetOnly: true, authentication: false,
  };
}
function errorMessage(error: unknown): string { return error instanceof Error ? error.message : 'Network read failed.'; }
function exactQuery(url: URL, keys: string[]) {
  if ([...url.searchParams.keys()].some((key) => !keys.includes(key)) || keys.some((key) => url.searchParams.getAll(key).length !== 1)) throw new Error('Unexpected or missing query parameters.');
}

export function createChainMiddleware(devProofEnabled: boolean, fetcher: Fetcher = fetch, canonicalOrigin?: string) {
  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    if (!req.url?.startsWith('/api/qorechain')) return next();
    res.setHeader('Cache-Control', 'no-store'); res.setHeader('Content-Type', 'application/json');
    res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    const reply = (status: number, value: unknown) => { res.statusCode = status; res.end(JSON.stringify(value)); };
    if (req.method !== 'GET') return reply(405, { error: 'Only fixed read operations are permitted.' });
    const allowedHost = canonicalOrigin ? new URL(canonicalOrigin).host : null;
    const host = req.headers.host ?? '';
    const allowedOrigin = canonicalOrigin ?? `http://${host}`;
    if ((allowedHost ? host !== allowedHost : !/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)) ||
        (req.headers.origin && req.headers.origin !== allowedOrigin) || req.headers['sec-fetch-site'] === 'cross-site') {
      return reply(403, { code: 'ORIGIN', error: 'Open ReeKlaim at its configured address before reading your Diana balance.' });
    }
    try {
      const url = new URL(req.url, 'http://localhost');
      if (url.pathname === '/api/qorechain/health') { exactQuery(url, []); return reply(200, await networkHealth(fetcher)); }
      if (url.pathname === '/api/qorechain/balance' || url.pathname === '/api/qorechain/pqc') {
        exactQuery(url, ['address']);
        const address = nativeAddress(url.searchParams.get('address') ?? '');
        const context = await nativeNetwork(fetcher);
        if (url.pathname.endsWith('/balance')) {
          const data = z.object({ balance: z.object({ denom: z.literal('uqor'), amount: z.string().regex(/^\d+$/) }).nullable() }).parse(await readJson(`${DIANA.rest}/cosmos/bank/v1beta1/balances/${address}/by_denom?denom=uqor`, {}, fetcher));
          return reply(200, { ...context, address, amountUqor: data.balance?.amount ?? '0' });
        }
        const data = z.object({ found: z.boolean(), account: z.object({ algorithm_id: z.union([z.string(), z.number()]).optional(), possession_proven: z.boolean().optional() }).nullable().optional() }).parse(await readJson(`${DIANA.rest}/qorechain/pqc/v1/account/${address}`, {}, fetcher));
        return reply(200, { ...context, address, registered: data.found, algorithmId: data.account?.algorithm_id, possessionProven: data.account?.possession_proven });
      }
      if (url.pathname === '/api/qorechain/receipt' && devProofEnabled) {
        exactQuery(url, ['hash', 'sender', 'memo']);
        const hash = z.string().regex(/^[A-Fa-f0-9]{64}$/).parse(url.searchParams.get('hash')).toUpperCase();
        const sender = nativeAddress(url.searchParams.get('sender') ?? '');
        const memo = z.string().regex(/^rk:proof:v1:[a-f0-9]{32}$/).parse(url.searchParams.get('memo'));
        const intent: ProofIntent = { chainId: DIANA.chainId, sender, recipient: sender, amountUqor: '1', memo };
        const context = await nativeNetwork(fetcher);
        const [receipt, raw] = await Promise.all([
          readJson(`${DIANA.rest}/cosmos/tx/v1beta1/txs/${hash}`, {}, fetcher),
          readJson(`${DIANA.rpc}/tx?hash=0x${hash}&prove=false`, {}, fetcher),
        ]);
        const proof = verifyHybridReceipt(receipt, context.chainId, hash, intent);
        const rawResult = z.object({ result: z.object({ hash: z.string(), height: z.string(), tx: z.string(), tx_result: z.object({ code: z.union([z.number(), z.string()]) }) }) }).parse(raw).result;
        const bytes = base64Bytes(rawResult.tx);
        if (createHash('sha256').update(bytes).digest('hex').toUpperCase() !== hash || rawResult.hash.toUpperCase() !== hash || rawResult.height !== proof.height || BigInt(rawResult.tx_result.code) !== 0n) throw new Error('Independent RPC transaction hash/height/result mismatch.');
        const rawTx = TxRaw.decode(bytes);
        const body = TxBody.decode(rawTx.bodyBytes);
        if (body.memo !== memo || body.messages.length !== 1 || body.messages[0].typeUrl !== '/cosmos.bank.v1beta1.MsgSend') throw new Error('Raw signed intent mismatch.');
        const send = MsgSend.decode(body.messages[0].value);
        if (send.fromAddress !== sender || send.toAddress !== sender || send.amount.length !== 1 || send.amount[0].denom !== 'uqor' || send.amount[0].amount !== '1') throw new Error('Raw signed payment mismatch.');
        const rawExtensions = [...body.extensionOptions, ...body.nonCriticalExtensionOptions];
        if (rawExtensions.length !== 1 || rawExtensions[0].typeUrl !== proof.extensionType || rawTx.signatures.length !== 1 || rawTx.signatures[0].length !== 64) throw new Error('Raw native hybrid signature layer mismatch.');
        const rawHybrid = qorechainTypes.pqcHybrid.PQCHybridSignature.decode(rawExtensions[0].value);
        const rest = z.object({ tx: z.object({ body: z.object({ extension_options: z.array(z.object({ pqc_signature: z.string().optional() }).passthrough()).optional(), non_critical_extension_options: z.array(z.object({ pqc_signature: z.string().optional() }).passthrough()).optional() }) }) }).parse(receipt);
        const restExtension = [...(rest.tx.body.extension_options ?? []), ...(rest.tx.body.non_critical_extension_options ?? [])][0];
        if (rawHybrid.algorithmId !== 1 || rawHybrid.pqcSignature.length !== 4627 || !Buffer.from(rawHybrid.pqcSignature).equals(Buffer.from(base64Bytes(restExtension.pqc_signature)))) throw new Error('Raw PQ signature does not match the REST evidence.');
        return reply(200, { ...proof, independentRpcHashMatched: true, checkedAt: context.checkedAt, caveat: 'Independent official REST/RPC reads; validators verified signatures. Not a consensus light client or an authenticated account session.' });
      }
      return reply(404, { error: 'Read route unavailable.' });
    } catch (error) { return reply(error instanceof UpstreamError && error.status === 404 ? 404 : 502, { error: errorMessage(error), verified: false }); }
  };
}
