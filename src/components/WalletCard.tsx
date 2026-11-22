import { QOREX_DOWNLOAD_URLS } from '@qorechain/qorex-types';
import { useWallet } from '../wallet/WalletProvider.tsx';
import { formatQor } from '../lib/amounts.ts';
import { Button } from './Button.tsx';
import { useAuth } from '../auth/AuthProvider.tsx';
import { Link } from '../ui/Router.tsx';
export function WalletCard() {
  const wallet = useWallet(); const auth=useAuth();
  return <section className="panel wallet-card" aria-labelledby="wallet-title">
    <div className="section-head"><span className="eyebrow">YOUR WALLET</span><span className="status">{auth.bound ? 'Connected · authenticated session' : wallet.account ? 'Connected · not authenticated' : 'Disconnected'}</span></div>
    <h2 id="wallet-title">Connect with QoreX.</h2>
    <p>Your keys stay in your wallet. Connecting lets ReeKlaim read your public address; it does not sign you in.</p>
    {!wallet.account && wallet.installed && <p className="hint">QoreX detected. Unlock the extension, select Diana testnet and approve the connection there.</p>}
    {wallet.account ? <>
      <dl><dt>Native address</dt><dd className="mono break">{wallet.account.address}</dd><dt>Testnet balance</dt><dd role="status">{wallet.balanceLoading && wallet.balance === null ? 'Loading testnet balance…' : wallet.balance === null ? 'Unavailable — refresh to retry' : `${formatQor(wallet.balance)} QOR`}</dd></dl>
      {!wallet.account.capabilities.includes('signAndBroadcast') && <p className="notice">Native broadcast functionality is unavailable in this wallet version. Update QoreX before attempting a developer proof transaction.</p>}
      <div className="actions"><Button variant="secondary" onClick={() => void wallet.refresh()} disabled={wallet.busy}>{wallet.busy ? 'Refreshing…' : 'Refresh wallet'}</Button><Button variant="secondary" onClick={wallet.disconnect}>Disconnect locally</Button></div>
      <Link to="/sign-in" className="text-link">Verify wallet →</Link>
      <p className="hint">Local disconnect clears this app’s connection state. Revoke site permission inside QoreX if needed.</p>
    </> : <>
      <Button onClick={() => void wallet.connect()} disabled={wallet.busy}>{wallet.busy ? 'Waiting for QoreX…' : 'Connect QoreX'}</Button>
      {wallet.busy && <p role="status">If no prompt appears, open QoreX from your browser toolbar and check for a connection request.</p>}
      {!wallet.installed && <p className="hint">QoreX not detected. <a href={QOREX_DOWNLOAD_URLS.chrome} target="_blank" rel="noreferrer">Install for Chrome / Edge</a> or <a href={QOREX_DOWNLOAD_URLS.firefox} target="_blank" rel="noreferrer">Firefox</a>, unlock and reload.</p>}
    </>}
    {wallet.error && <p className="notice error" role="alert">{wallet.error}</p>}
    <p className="hint"><a href="https://dashboard.qorechain.io/faucet" target="_blank" rel="noreferrer">Official testnet faucet ↗</a> · Human dashboard sign-in required. Test QOR has no monetary value.</p>
  </section>;
}
