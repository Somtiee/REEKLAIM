import { describe, expect, it } from 'vitest';
import { assertDiana, assertEvmDiana, assertTestnetConfiguration, DIANA } from '../src/lib/network.ts';
import { formatQor, parseQor } from '../src/lib/amounts.ts';

describe('reviewed native testnet configuration', () => {
  it('matches the installed official SDK preset', () => {
    expect(() => assertTestnetConfiguration('testnet')).not.toThrow();
    expect(DIANA.chainId).toBe('qorechain-diana'); expect(DIANA.evmChainId).toBe(9800);
    for (const key of ['rpc', 'rest', 'evmRpc'] as const) expect(DIANA[key]).toContain('-testnet.');
  });
  it.each(['mainnet', 'qorechain-vladi', 'localnet', 'unsupported'])('refuses %s configuration', (chain) => {
    expect(() => assertTestnetConfiguration(chain)).toThrow(); expect(() => assertDiana(chain)).toThrow();
  });
  it('refuses mainnet wallet chain and numeric lookalikes', () => {
    expect(() => assertEvmDiana('0x2649')).toThrow(); expect(() => assertEvmDiana(9800)).toThrow();
  });
});
describe('integer QOR amounts', () => {
  it('preserves exact large balances and tiny amounts', () => {
    expect(formatQor('100000')).toBe('0.1'); expect(formatQor('1')).toBe('0.000001');
    expect(formatQor('9007199254740993123456')).toBe('9007199254740993.123456');
    expect(parseQor('0.10')).toBe('100000'); expect(parseQor('0.05')).toBe('50000');
  });
  it.each(['-1', 'NaN', '1e6', '0.0000001', '+1', 'Infinity'])('rejects invalid input %s', (value) => expect(() => parseQor(value)).toThrow());
});
