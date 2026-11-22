import { bech32ToHex, fromBase, isValidBech32, toBase } from '@qorechain/sdk';

export function nativeAddress(address: string): string {
  if (address !== address.toLowerCase() || !isValidBech32(address, 'qor') || bech32ToHex(address).length !== 42) throw new Error('A valid 20-byte qor1 native address is required.');
  return address;
}
export function formatQor(base: string): string {
  if (!/^\d+$/.test(base)) throw new Error('Invalid uqor balance.');
  return fromBase(base, { exponent: 6 });
}
export function parseQor(amount: string): string {
  if (!/^\d+(\.\d{1,6})?$/.test(amount)) throw new Error('Use a nonnegative QOR amount with at most six decimal places.');
  return toBase(amount, { exponent: 6 });
}
