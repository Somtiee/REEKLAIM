import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { getQorexNative } from '@qorechain/qorex-types';

type Account = { address: string; capabilities: string[]; algo: string; authenticated: false };
type WalletContextValue = {
  installed: boolean; account: Account | null; balance: string | null; balanceLoading: boolean; busy: boolean; error: string | null;
  connect: () => Promise<void>; cancelConnect: () => void; disconnect: () => void; refresh: () => Promise<void>; disconnectVersion: number;
};
const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [installed, setInstalled] = useState(false);
  const [account, setAccount] = useState<Account | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tracking, setTracking] = useState(false);
  const [disconnectVersion, setDisconnectVersion] = useState(0);
  const generation = useRef(0);
  const connection = useRef<AbortController | null>(null);
  const cancelConnect = useCallback(() => {
    connection.current?.abort(new Error('Wallet connection canceled.'));
  }, []);
  const disconnect = useCallback(() => { generation.current++; try { sessionStorage.removeItem('rk-wallet-connected'); } catch { /* Storage may be unavailable. */ } setTracking(false); setDisconnectVersion(value => value + 1); setAccount(null); setBalance(null); setBalanceLoading(false); setError(null); setBusy(false); }, []);
  const load = useCallback(async (connect: boolean) => {
    if (connection.current) return;
    const attempt = new AbortController();
    if (connect) connection.current = attempt;
    const timeout = window.setTimeout(() => {
      attempt.abort(new Error('QoreX did not respond. Open the QoreX extension from your browser toolbar, unlock it on Diana testnet, then try again.'));
    }, connect ? 30_000 : 8_000);
    const current = ++generation.current;
    setInstalled(!!getQorexNative());
    if (connect || !account?.address) setBusy(true);
    setError(null);
    let explain = (e: unknown) => e instanceof Error ? e.message : 'Wallet request failed.';
    try {
      // Keep the large SDK off the public landing page's initial render.
      // These are the original real adapter and reader, loaded only for wallet work.
      const [{ browserAdapter, walletError }, { getBalance }] = await Promise.all([import('./adapter.ts'), import('../lib/api.ts')]);
      explain = walletError;
      const adapter = browserAdapter();
      if (!adapter) throw new Error('QoreX was not found. Install the official extension, unlock it and reload this page.');
      // Passive, native-only account reads must not depend on EVM site permissions.
      const next = await new Promise<Awaited<ReturnType<typeof adapter.connect>>>((resolve, reject) => {
        const { signal } = attempt;
        if (signal.aborted) { reject(signal.reason); return; }
        const abort = () => reject(signal.reason);
        signal.addEventListener('abort', abort, { once: true });
        const read = connect ? adapter.connect(signal) : adapter.account();
        void read.then(resolve, reject).finally(() => signal.removeEventListener('abort', abort));
      });
      window.clearTimeout(timeout);
      if (connection.current === attempt) connection.current = null;
      if (current !== generation.current) return;
      if (account?.address !== next.address) setBalance(null);
      setAccount(next);
      setTracking(true);
      setBusy(false);
      setBalanceLoading(true);
      if (connect) try { sessionStorage.setItem('rk-wallet-connected', 'yes'); } catch { /* Storage may be unavailable. */ }
      try {
        const data = await getBalance(next.address);
        if (current === generation.current) setBalance(data.amountUqor);
      } catch (e) { if (current === generation.current) setError(`Wallet connected; balance unavailable. ${walletError(e)}`); }
    } catch (e) {
      if (current === generation.current) { setAccount(null); setBalance(null); setError(attempt.signal.aborted ? (attempt.signal.reason as Error).message : explain(e)); }
    } finally {
      window.clearTimeout(timeout);
      if (connection.current === attempt) connection.current = null;
      if (current === generation.current) { setBusy(false); setBalanceLoading(false); }
    }
  }, [account?.address]);
  const connect = useCallback(() => load(true), [load]);
  const refresh = useCallback(() => load(false), [load]);
  useEffect(() => {
    const detect = () => setInstalled(!!getQorexNative());
    detect();
    window.addEventListener('focus', detect);
    return () => window.removeEventListener('focus', detect);
  }, []);
  useEffect(() => {
    if (!tracking) return;
    const onFocus = () => { void refresh(); };
    const interval = window.setInterval(() => { if (document.visibilityState === 'visible') void refresh(); }, 30000);
    window.addEventListener('focus', onFocus);
    return () => { clearInterval(interval); window.removeEventListener('focus', onFocus); };
  }, [tracking, refresh]);
  return <WalletContext.Provider value={{ installed, account, balance, balanceLoading, busy, error, connect, cancelConnect, disconnect, refresh, disconnectVersion }}>{children}</WalletContext.Provider>;
}
export function useWallet() {
  const value = useContext(WalletContext);
  if (!value) throw new Error('WalletProvider is required.');
  return value;
}
