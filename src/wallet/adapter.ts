import { getQorexNative, hasCapability, qorexSignAndBroadcast, type QorexNativeProvider } from '@qorechain/qorex-types';
import { assertDiana, assertEvmDiana, DIANA } from '../lib/network.ts';
import { nativeAddress } from '../lib/amounts.ts';
import { proofMessage, type ProofIntent } from '../lib/proof.ts';

export function detectQorex(): QorexNativeProvider | undefined {
  const native = getQorexNative();
  return native?.isQoreX === true ? native : undefined;
}
export function walletError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/reject|denied|cancel/i.test(message)) return 'Approval declined. No successful transaction has been verified. You can review and try again.';
  if (/insufficient|not enough/i.test(message)) return 'Insufficient testnet QOR. Use the official faucet and leave enough for network fees and first-use key registration.';
  if (/chain|network/i.test(message)) return 'Wrong network or network unavailable. Select Diana testnet in QoreX, then reconnect.';
  if (/not.*support|capability/i.test(message)) return 'This QoreX build does not support the required native hybrid broadcast. Update from the official store.';
  return message.slice(0, 500);
}
export class QorexAdapter {
  constructor(private readonly native: QorexNativeProvider, private readonly readChain?: () => Promise<unknown>) {}
  async account() {
    if (this.readChain) assertEvmDiana(await this.readChain());
    const key = await this.native.getKey(DIANA.chainId);
    nativeAddress(key.bech32Address);
    return { address: key.bech32Address, capabilities: [...this.native.capabilities], algo: key.algo, authenticated: false as const };
  }
  async connect(signal?: AbortSignal) {
    signal?.throwIfAborted();
    if (this.readChain) assertEvmDiana(await this.readChain());
    signal?.throwIfAborted();
    await this.native.enable(DIANA.chainId);
    signal?.throwIfAborted();
    return this.account();
  }
  async sendProof(intent: ProofIntent, explicitApproval: boolean) {
    if (!explicitApproval) throw new Error('Explicit approval of the self-transfer and network fees is required.');
    assertDiana(intent.chainId);
    if (!hasCapability(this.native, 'signAndBroadcast') || typeof this.native.signAndBroadcast !== 'function') throw new Error('Native signAndBroadcast capability is not supported.');
    const current = await this.account();
    if (current.address !== intent.sender) throw new Error('Wallet account changed. Reconnect and prepare a new proof.');
    const result = await qorexSignAndBroadcast({ chainId: DIANA.chainId, messages: [proofMessage(intent)], memo: intent.memo }, { native: this.native });
    if (result.code !== 0) throw new Error(`QoreX returned transaction failure code ${result.code}.`);
    if (!/^[0-9a-fA-F]{64}$/.test(result.txHash)) throw new Error('QoreX returned an invalid transaction hash.');
    return { ...result, txHash: result.txHash.toUpperCase() };
  }
}
export function browserAdapter(): QorexAdapter | undefined {
  const native = detectQorex();
  if (!native) return undefined;
  const evm = window.qorex?.evm;
  return new QorexAdapter(native, evm ? () => evm.request({ method: 'eth_chainId' }) : undefined);
}
export const authenticationCapability = {
  connectedIsAuthenticated: false, siwq: 'not-supported-by-reviewed-interface',
  recommendation: 'A server-issued native hybrid challenge is planned. No authenticated session is created in Phase 1.',
} as const;
