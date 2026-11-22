import { z } from 'zod';
import { DIANA } from './network.ts';
import type { HybridProof } from './receipt.ts';
import type { ProofIntent } from './proof.ts';

export async function api<T>(route: string): Promise<T> {
  const res = await fetch(`/api/qorechain/${route}`, { cache: 'no-store', signal: AbortSignal.timeout(20000) });
  const value: unknown = await res.json();
  if (!res.ok) {
    const parsed = z.object({ error: z.string() }).safeParse(value);
    throw new Error(parsed.success ? parsed.data.error : `Read failed: HTTP ${res.status}.`);
  }
  return value as T;
}
export const healthSchema = z.object({ native: z.union([
  z.object({ ok: z.literal(true), chainId: z.literal(DIANA.chainId), height: z.string(), blockTime: z.string(), checkedAt: z.string() }),
  z.object({ ok: z.literal(false), error: z.string() }),
]), evm: z.union([z.object({ ok: z.literal(true), chainId: z.literal('0x2648') }), z.object({ ok: z.literal(false), error: z.string() })]) });
export type NetworkHealth = z.infer<typeof healthSchema>;
export async function getHealth() { return healthSchema.parse(await api('health')); }
export async function getBalance(address: string) {
  return z.object({ chainId: z.literal(DIANA.chainId), address: z.literal(address), amountUqor: z.string().regex(/^\d+$/) }).parse(await api(`balance?${new URLSearchParams({ address })}`));
}
export async function getPqc(address: string) {
  return z.object({ registered: z.boolean(), possessionProven: z.boolean().optional() }).parse(await api(`pqc?${new URLSearchParams({ address })}`));
}
export async function getProof(hash: string, intent: ProofIntent) {
  // Proof is descriptive developer evidence only; it never grants an account/session.
  return api<HybridProof & { independentRpcHashMatched: true; checkedAt: string }>(`receipt?${new URLSearchParams({ hash, sender: intent.sender, memo: intent.memo })}`);
}
