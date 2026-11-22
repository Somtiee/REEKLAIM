import { createContext, lazy, Suspense, useContext, useEffect, useState, type ReactNode } from 'react';
import { ArrowRight, Check, CircleHelp, Menu, Monitor, Moon, Sun, Wallet, X } from 'lucide-react';
import { Button } from './Button.tsx';
import { Brand } from './Brand.tsx';
import { Dialog, Dropdown, IconButton } from '../ui/primitives.tsx';
import { Link, useRoute } from '../ui/Router.tsx';
import { useTheme, type ThemePreference } from '../ui/Theme.tsx';
import { useWallet } from '../wallet/WalletProvider.tsx';
import { useAuth } from '../auth/AuthProvider.tsx';

const WalletCard = lazy(() => import('./WalletCard.tsx').then((module) => ({ default: module.WalletCard })));
const SignInDialogContent = lazy(() => import('../pages/SignInPage.tsx'));
const WalletUIContext = createContext(() => {});
const WalletSignInContext = createContext(() => {});
export function WalletUIProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<'wallet' | 'sign-in' | null>(null);
  const { location } = useRoute();
  const wallet = useWallet();
  useEffect(() => setMode(null), [location.path]);
  const signingIn = mode === 'sign-in' && !!wallet.account;
  function startSignIn() {
    setMode('sign-in');
    if (!wallet.account) void wallet.connect();
  }
  return <WalletUIContext.Provider value={() => setMode('wallet')}>
    <WalletSignInContext.Provider value={startSignIn}>{children}</WalletSignInContext.Provider>
    <Dialog open={mode !== null} onClose={() => { wallet.cancelConnect(); setMode(null); }} title={signingIn ? 'Sign in with QoreX' : 'Connect your wallet'}>
      <Suspense fallback={<p role="status">Loading QoreX…</p>}>
        {signingIn ? <SignInDialogContent embedded /> : <WalletCard />}
      </Suspense>
    </Dialog>
  </WalletUIContext.Provider>;
}
export function useWalletUI() { return useContext(WalletUIContext); }
export function ConnectWallet({ className }: { className?: string }) {
  const wallet = useWallet();
  const auth = useAuth();
  const { location, navigate } = useRoute();
  const startSignIn = useContext(WalletSignInContext);
  if (auth.bound && auth.user?.onboardedAt && wallet.account) {
    const address = wallet.account.address;
    const amount = wallet.balance === null ? null : BigInt(wallet.balance);
    const balance = amount === null ? 'Balance unavailable' : `${amount / 1_000_000n}.${(amount % 1_000_000n).toString().padStart(6, '0')} test QOR`;
    return <Dropdown label={`${address.slice(0, 7)}…${address.slice(-4)}`} icon={<Wallet size={16} />}>
      <p>Diana testnet · {balance}</p>
      <button onClick={() => navigate('/app')}>Dashboard</button>
      <button onClick={() => void wallet.refresh()}>Refresh balance</button>
      <button onClick={() => void auth.logout()}>Log out</button>
      <button onClick={wallet.disconnect}>Disconnect wallet</button>
    </Dropdown>;
  }
  return <Button className={className} aria-haspopup={location.path === '/sign-in' ? undefined : 'dialog'} disabled={wallet.busy} onClick={() => {
    if (location.path !== '/sign-in') startSignIn();
    else if (!wallet.account) void wallet.connect();
  }}>{wallet.busy ? 'Connecting wallet…' : wallet.account && location.path !== '/sign-in' ? 'Sign in with QoreX' : 'Connect Wallet'}</Button>;
}
export function ThemeMenu() { const theme = useTheme(); return <Dropdown label="Choose color theme" icon={theme.resolved === 'dark' ? <Moon size={19} /> : <Sun size={19} />}><span className="dropdown-label">Appearance</span><div role="radiogroup" aria-label="Color theme">{([{ value: 'light', icon: Sun }, { value: 'dark', icon: Moon }, { value: 'system', icon: Monitor }] as const).map(({ value, icon: Icon }) => <button role="radio" tabIndex={theme.preference === value ? 0 : -1} aria-checked={theme.preference === value} onKeyDown={(event) => { const choices = ['light', 'dark', 'system'] as const; const index = choices.indexOf(value); let next: number; if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % 3; else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index + 2) % 3; else if (event.key === 'Home') next = 0; else if (event.key === 'End') next = 2; else return; event.preventDefault(); theme.setPreference(choices[next]); (event.currentTarget.parentElement?.children[next] as HTMLButtonElement)?.focus(); }} key={value} onClick={() => theme.setPreference(value as ThemePreference)}><Icon size={17} /><span>{value[0].toUpperCase() + value.slice(1)}</span>{theme.preference === value && <Check size={15} />}</button>)}</div></Dropdown>; }
export function WalletStatus({ compact = false }: { compact?: boolean }) { const wallet = useWallet(); const auth = useAuth(); const open = useWalletUI(); return <Button variant="secondary" className={`wallet-status ${compact ? 'wallet-compact' : ''}`} onClick={open}><Wallet size={16} />{wallet.busy ? 'Connecting…' : wallet.account ? `${wallet.account.address.slice(0, 7)}…${wallet.account.address.slice(-4)}` : 'Connect QoreX'}{wallet.account && !auth.bound && <span className="wallet-unverified" title="Connected, not authenticated" />}</Button>; }
const publicNav = [{ to: '/explore', label: 'Explore' }, { to: '/#how-it-works', label: 'How it works' }, { to: '/organizations', label: 'For organizations' }, { to: '/#fees', label: 'Fees' }, { to: '/#faq', label: 'FAQ' }];
export function SiteHeader() {
  const [menu, setMenu] = useState(false); const { location } = useRoute();
  const auth = useAuth();
  const dashboardAvailable = location.path !== '/sign-in' && !!auth.user?.onboardedAt;
  useEffect(()=>setMenu(false),[location.path]);
  return <><header className="site-header"><div className="container header-inner"><Link to={dashboardAvailable?'/app':'/'} aria-label={dashboardAvailable?'ReeKlaim dashboard':'ReeKlaim home'}><Brand /></Link><nav className="desktop-nav" aria-label="Main navigation">{publicNav.map((item) => <Link key={item.to} to={item.to} aria-current={location.path === item.to ? 'page' : undefined}>{item.label}</Link>)}</nav><div className="header-actions"><ThemeMenu />{dashboardAvailable?<Link to="/app" className="button primary header-start">Dashboard</Link>:<ConnectWallet className="header-start" />}<span className="mobile-menu-button"><IconButton label="Open navigation" aria-expanded={menu} aria-controls="mobile-navigation" onClick={() => setMenu(true)}><Menu size={23} /></IconButton></span></div></div></header>
    <Dialog open={menu} onClose={() => setMenu(false)} title="Find your way" drawer><nav id="mobile-navigation" className="mobile-navigation" aria-label="Mobile navigation">{publicNav.map((item) => <Link key={item.to} to={item.to} onClick={() => setMenu(false)}>{item.label}<ArrowRight size={18} /></Link>)}</nav></Dialog>
  </>;
}
export function SiteFooter() { return <footer className="site-footer"><div className="container"><div className="footer-top"><div className="footer-brand"><Link to="/" aria-label="ReeKlaim home"><Brand /></Link><p>For the things that matter.<br />And the people who bring them back.</p><span className="footer-testnet"><i />Diana testnet · live wallet proof pending</span></div><div><h3>Product</h3><Link to="/explore">Explore lost & found</Link><Link to="/#how-it-works">How it works</Link><Link to="/demo">Try the demonstration</Link><Link to="/#fees">Proposed fees</Link></div><div><h3>For organizations</h3><Link to="/organizations">Organization preview</Link><Link to="/organizations#campuses">Universities & schools</Link><Link to="/organizations#travel">Travel & hospitality</Link><Link to="/organizations#workplaces">Businesses & events</Link></div><div><h3>Good to know</h3><Link to="/help">Help & safety</Link><Link to="/privacy">Privacy</Link><Link to="/terms">Prototype terms</Link><Link to="/docs">Documentation</Link></div></div><div className="footer-bottom"><span>© 2026 ReeKlaim. Original code under <Link to="/docs#open-source">MIT</Link>.</span><div><a href="https://qorechain.io/" target="_blank" rel="noreferrer">QoreChain ↗</a><a href="https://docs.qorechain.io/" target="_blank" rel="noreferrer">Chain docs ↗</a><Link to="/status">Testnet status</Link></div></div><p className="footer-disclosure">Independent project building on QoreChain. Demo listings are fictional. No endorsement, legal ownership guarantee or live recovery claim is implied. <Link to="/docs#credits">Image & design credits</Link>.</p></div></footer>; }
export function HelpLink() { return <Link className="help-link" to="/help"><CircleHelp size={16} />Need a little guidance?</Link>; }
export function ClosePreview({ to = '/' }: { to?: string }) { return <Link className="button ghost" to={to}><X size={16} />Leave preview</Link>; }
