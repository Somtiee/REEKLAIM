import { afterEach, describe, expect, it, vi } from 'vitest';
import { createQorexMock } from '@qorechain/qorex-wallet-mock';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { browserAdapter, detectQorex, walletError } from '../src/wallet/adapter.ts';
import { WalletProvider } from '../src/wallet/WalletProvider.tsx';
import { WalletCard } from '../src/components/WalletCard.tsx';
import { createProofIntent } from '../src/lib/proof.ts';

function officialMock() {
  const network = vi.fn(() => { throw new Error('Network forbidden in wallet mock tests.'); });
  const mock = createQorexMock({ profile: 'current', allowMainnet: false, fetch: network });
  mock.install(window);
  return { mock, network };
}
afterEach(() => { delete window.qorex; delete window.__qorexMock; vi.restoreAllMocks(); });
describe('QoreX adapter with official current-profile mock (never live evidence)', () => {
  it('detects absence without falling back to another wallet', () => { expect(detectQorex()).toBeUndefined(); expect(browserAdapter()).toBeUndefined(); });
  it('connects to a native account without authenticating', async () => {
    const { mock, network } = officialMock();
    const account = await browserAdapter()!.connect();
    expect(account.address).toBe(mock.addresses().native); expect(account.authenticated).toBe(false); expect(network).not.toHaveBeenCalled();
  });
  it('refuses a mainnet-selected wallet before enable or signing', async () => {
    const { mock, network } = officialMock();
    // Simulate only the read result. Never enable mainnet in the official mock.
    vi.spyOn(window.qorex!.evm, 'request').mockResolvedValue('0x2649');
    await expect(browserAdapter()!.connect()).rejects.toThrow('Wrong network');
    expect(mock.requests.some((r) => r.method === 'native:signAndBroadcast')).toBe(false); expect(network).not.toHaveBeenCalled();
  });
  it('handles a rejected signature without broadcasting', async () => {
    const { mock, network } = officialMock(); const adapter = browserAdapter()!;
    const account = await adapter.connect(); mock.rejectNext();
    await expect(adapter.sendProof(createProofIntent(account.address), true)).rejects.toThrow(/reject/i);
    expect(network).not.toHaveBeenCalled();
  });
  it('requires explicit approval before invoking the wallet send', async () => {
    const { mock } = officialMock(); const adapter = browserAdapter()!; const account = await adapter.connect();
    await expect(adapter.sendProof(createProofIntent(account.address), false)).rejects.toThrow('Explicit approval');
    expect(mock.requests.some((r) => r.method === 'native:signAndBroadcast')).toBe(false);
  });
  it('refuses missing native broadcast capability', async () => {
    officialMock(); const adapter = browserAdapter()!; const account = await adapter.connect();
    Object.defineProperty(window.qorex!.native, 'capabilities', { value: [], configurable: true });
    await expect(adapter.sendProof(createProofIntent(account.address), true)).rejects.toThrow('capability');
  });
  it('rechecks an account changed without wallet events', async () => {
    const { mock } = officialMock(); const adapter = browserAdapter()!; const account = await adapter.connect(); mock.switchAccount(1);
    await expect(adapter.sendProof(createProofIntent(account.address), true)).rejects.toThrow('account changed');
  });
  it('does not call unsupported arbitrary signing', async () => {
    const { mock } = officialMock(); await browserAdapter()!.connect(); expect(mock.requests.some((r) => /signArbitrary|signSiwq/.test(r.method))).toBe(false);
  });
});
describe('wallet presentation', () => {
  it('starts disconnected and offers official guidance', () => { render(<WalletProvider><WalletCard /></WalletProvider>); expect(screen.getByText('Disconnected')).toBeInTheDocument(); expect(screen.getByRole('button', { name: 'Connect QoreX' })).toBeEnabled(); expect(screen.getByText(/does not sign you in/)).toBeInTheDocument(); });
  it('displays approval rejection and stays disconnected', async () => {
    const { mock } = officialMock(); mock.rejectNext();
    render(<WalletProvider><WalletCard /></WalletProvider>); fireEvent.click(screen.getByRole('button', { name: 'Connect QoreX' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Approval declined'));
    expect(screen.getByText('Disconnected')).toBeInTheDocument();
  });
  it('explains insufficient balance and unsupported capabilities', () => {
    expect(walletError(new Error('insufficient funds'))).toContain('faucet'); expect(walletError(new Error('not supported'))).toContain('Update');
  });
});
