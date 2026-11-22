import { getNetwork } from '@qorechain/sdk';

export const DIANA = Object.freeze({
  name: 'QoreChain Diana testnet', chainId: 'qorechain-diana', evmChainId: 9800, evmChainHex: '0x2648',
  rpc: 'https://rpc-testnet.qore.host', rest: 'https://api-testnet.qore.host', evmRpc: 'https://evm-testnet.qore.host',
  faucet: 'https://dashboard.qorechain.io/faucet', explorer: 'https://explore.qore.network', denom: 'uqor', decimals: 6,
} as const);

export function assertDiana(chain: unknown): asserts chain is typeof DIANA.chainId {
  if (chain !== DIANA.chainId) throw new Error('Wrong network. Select QoreChain Diana testnet in QoreX. Mainnet and other networks are refused.');
}
export function assertEvmDiana(chain: unknown): void {
  if (chain !== DIANA.evmChainHex) throw new Error('Wrong network. Switch QoreX to Diana testnet (9800) manually.');
}
export function assertTestnetConfiguration(network?: string): void {
  if (network && network !== 'testnet') throw new Error('Only the testnet configuration is permitted. Signing, broadcasting and deployment on mainnet are disabled.');
  const official = getNetwork('testnet');
  assertDiana(official.chainId);
  if (official.evmChainId !== DIANA.evmChainId || official.coin.base !== DIANA.denom || official.coin.exponent !== DIANA.decimals || official.endpoints.rpc !== DIANA.rpc || official.endpoints.rest !== DIANA.rest || official.endpoints.evmRpc !== DIANA.evmRpc) throw new Error('Installed SDK testnet configuration differs from the reviewed Diana allowlist.');
}
assertTestnetConfiguration();
