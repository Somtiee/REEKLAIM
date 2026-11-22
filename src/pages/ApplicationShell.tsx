import { Notifications, Overview, SettingsPanel, WorkspaceBoundary, useUnread } from '../workspace/Workspace.tsx';
import { OrganizationsWorkspace } from '../workspace/Organizations.tsx';
import { PaymentsWorkspace } from '../payments/Payments.tsx';
import { ClaimsWorkspace } from '../claims/Claims.tsx';
import { useEffect, useState } from 'react';

import { ArrowRight, Bell, Check, ChevronRight, CircleHelp, Compass, FileCheck, History, House, LockKeyhole, Menu, Package, Search, Settings, UserRound, Wallet } from 'lucide-react';

import { Link, useRoute } from '../ui/Router.tsx';

import { Badge, Dialog, Dropdown, EmptyState, IconButton, PreviewNotice } from '../ui/primitives.tsx';

import { Brand } from '../components/Brand.tsx';

import { ThemeMenu, useWalletUI, WalletStatus } from '../components/Layout.tsx';

import { Button } from '../components/Button.tsx';

import { useWallet } from '../wallet/WalletProvider.tsx';

import { useAuth } from '../auth/AuthProvider.tsx';

import ItemsPage from '../items/ItemsPage.tsx';

import { AccountDashboard } from '../auth/AccountDashboard.tsx';



const nav = [{ slug: '', label: 'Dashboard', icon: House }, { slug: 'items', label: 'My items', icon: Package }, { slug: 'explore', label: 'Explore', icon: Compass, to: '/explore' }, { slug: 'report-lost', label: 'Report lost', icon: Search, to: '/reports/lost' }, { slug: 'report-found', label: 'Report found', icon: Check, to: '/reports/found' }, { slug: 'claims', label: 'Claims', icon: FileCheck }, { slug: 'recoveries', label: 'Recoveries', icon: History }, { slug: 'transactions', label: 'Transactions', icon: Wallet }, { slug: 'organizations', label: 'Organizations', icon: Package }, { slug: 'notifications', label: 'Notifications', icon: Bell }, { slug: 'settings', label: 'Settings', icon: Settings }];

export default function ApplicationShell({ section }: { section: string }) {

  const auth=useAuth(); const wallet = useWallet(); const connect = useWalletUI(); const [menu, setMenu] = useState(false);

  const { navigate, location } = useRoute();
  const [unlockedPage, setUnlockedPage] = useState('');
  const pageIdentity = auth.user ? auth.user.id + location.path + location.search : '';
  useEffect(() => {
    if (auth.bound) setUnlockedPage(pageIdentity);
    else if (!auth.user || wallet.account && wallet.account.address !== auth.user.walletAddress) setUnlockedPage('');
  }, [auth.bound, auth.user, pageIdentity, wallet.account]);
  const walletPaused = !!auth.user && !auth.bound && !wallet.account;
  const retainWorkspace = !!auth.user && (auth.bound || walletPaused && unlockedPage === pageIdentity);
  const signInPath = "/sign-in?returnTo=" + encodeURIComponent(location.path + location.search);
  const needsProfile = auth.bound && !auth.user?.onboardedAt;
  useEffect(() => { if (needsProfile) navigate(signInPath); }, [needsProfile, navigate, signInPath]);
  const unread=useUnread(auth.bound&&!needsProfile?auth.user?.id??null:null);
  if(needsProfile) return <main id="main" tabIndex={-1}><p role="status">Opening account setup…</p></main>;
  const current = nav.find((entry) => entry.slug === section) ?? nav[0];

  const sidebar = <><Link to={auth.user?.onboardedAt?'/app':'/'} className="app-home" aria-label={auth.user?.onboardedAt?'ReeKlaim dashboard':'ReeKlaim home'} onClick={()=>setMenu(false)}><Brand /></Link><div className="sidebar-workspace"><span className="workspace-icon"><Package size={19} /></span><div><strong>Personal workspace</strong><small>{auth.bound?'Verified wallet account':'Sign-in required'}</small></div>{!auth.bound&&<LockKeyhole size={15} />}</div><nav className="app-nav" aria-label="Workspace navigation">{nav.map(({ slug, label, icon: Icon, to }) => <Link key={slug} to={to ?? `/app${slug ? `/${slug}` : ''}`} className={section === slug && !to ? 'active' : ''} aria-current={section === slug && !to ? 'page' : undefined} onClick={() => setMenu(false)}><Icon size={18} /><span>{label}</span>{!auth.bound&&!to && <LockKeyhole size={12} className="nav-lock" />}</Link>)}</nav><div className="sidebar-help"><HeartIcon /><strong>A way back starts here.</strong><p>Take the product demonstration for a little test drive.</p><Link to="/demo" onClick={() => setMenu(false)}>Try the demo <ArrowRight size={15} /></Link></div><Link to="/help" className="sidebar-help-link"><CircleHelp size={17} />Help & safety</Link><span className="sidebar-network"><i />Diana testnet only</span></>;

  return <div className="application-shell"><aside className="app-sidebar">{sidebar}</aside><div className="app-workspace"><header className="app-topbar"><div className="app-topbar-title"><span className="app-mobile-menu"><IconButton label="Open workspace menu" onClick={() => setMenu(true)}><Menu size={21} /></IconButton></span><span>Workspace <ChevronRight size={14} /> <strong>{current.label}</strong></span></div><div className="app-topbar-controls"><ThemeMenu /><WalletStatus compact /><Dropdown label="Notifications" icon={<span className="rk-bell"><Bell size={19} />{unread>0&&<span aria-hidden="true">{unread>99?'99+':unread}</span>}</span>}><div className="dropdown-message"><strong>{auth.bound?unread+" unread notifications":"Notifications"}</strong><Link to="/app/notifications">Open notifications</Link></div></Dropdown><Dropdown label="Account menu" icon={<UserRound size={19} />}><div className="dropdown-message"><strong>{auth.bound ? 'Authenticated account' : wallet.account ? 'Connected, not authenticated' : 'Guest preview'}</strong><p>{auth.bound ? 'Your verified account session is active.' : 'No private account is unlocked.'}</p></div>{auth.user&&<button onClick={()=>void auth.logout()}>Log out of account</button>}<button onClick={connect}><Wallet size={17} />Wallet connection</button>{wallet.account && <button onClick={wallet.disconnect}>Disconnect locally</button>}</Dropdown></div></header>

    <main id="main" tabIndex={-1} className="app-main"><div className="workspace-preview-bar"><LockKeyhole size={15} /><span>{auth.bound ? 'Private account · Diana testnet registration.' : walletPaused ? 'Wallet connection interrupted.' : 'Workspace preview. Private account features remain locked.'}</span><Badge tone={auth.bound?'success':'violet'}>{auth.bound?'Authenticated':walletPaused?'Reconnect wallet':'Not authenticated'}</Badge></div><div className="app-page-heading"><div><span className="eyebrow">YOUR WAY BACK, IN THE MAKING</span><h1>{section ? current.label : 'A place for what matters.'}</h1><p>{section ? auth.bound&&section==='items'?'Your private belongings, verified registrations and recovery tags.':auth.bound&&(section==='claims'||section==='recoveries')?'Review private evidence and coordinate returns with the participants in each case.':'Private workspace access is protected by genuine sign-in.' : 'Your everyday essentials deserve a little peace of mind.'}</p></div>{!auth.bound&&<Link to="/demo" className="button secondary">Try an example <ArrowRight size={16} /></Link>}</div>

    {retainWorkspace&&auth.user&&<div hidden={!auth.bound}><WorkspaceBoundary key={(auth.user?.id??"guest")+section}>{section==='items'?<ItemsPage/>:section==='claims'||section==='recoveries'?<ClaimsWorkspace recoveryOnly={section==='recoveries'}/>:section==='transactions'?<PaymentsWorkspace key={auth.user.id}/>:section==='organizations'?<OrganizationsWorkspace/>:section==='notifications'?<Notifications/>:section==='settings'?<><SettingsPanel/><AccountDashboard/></>:<><Overview/><AccountDashboard/></>}</WorkspaceBoundary></div>}{walletPaused?<div className="app-locked-panel"><h2>Reconnect your QoreX wallet</h2><p>Your sign-in is still active. Reconnect the same Diana wallet to continue.</p><Button disabled={wallet.busy} onClick={()=>void wallet.connect()}>{wallet.busy?'Checking QoreX…':'Reconnect QoreX'}</Button>{wallet.error&&<p role="alert">{wallet.error}</p>}</div>:!auth.bound&&<><div className="app-locked-panel"><div className="locked-preview-icon"><LockKeyhole size={27} strokeWidth={1.5} /></div><span className="eyebrow">BUILT AROUND YOUR PRIVACY</span><h2>{section === 'items' ? 'Your belongings will live here.' : section === 'transactions' ? 'Real receipts, when they exist.' : section === 'claims' ? 'Private evidence deserves real protection.' : 'A verified hello comes first.'}</h2><p>{wallet.account ? 'Your QoreX wallet is connected. Complete a server-verified sign-in challenge before private records can load.' : 'Connect your QoreX wallet to check its public details. Sign in through a server-issued challenge to unlock your account.'}</p><div className="actions"><Link to={signInPath} className="button primary">Sign in with QoreX <ArrowRight size={16}/></Link><Button variant="secondary" onClick={connect}><Wallet size={17} />{wallet.account ? 'Review wallet connection' : 'Connect QoreX'}</Button><Link to="/demo" className="button secondary">Explore the demonstration <ArrowRight size={16} /></Link></div><span className="lock-caption"><ShieldIcon />No private items, claims, history or profile data loaded.</span></div>

    <div className="app-lower-grid"><section><span className="eyebrow">A LITTLE GUIDANCE</span><h3>First, see how it feels.</h3><p>Take an example from registration to a simulated recovery. The demo stays separate from real accounts.</p><Link to="/demo" className="text-link">Try the interactive preview <ArrowRight size={16} /></Link></section><section><span className="eyebrow">CLEAR BY DESIGN</span><h3>Connection ≠ authentication.</h3><p>A wallet address, a connection or a submitted hash never grants access to private belongings.</p><Link to="/docs" className="text-link">Read the product notes <ArrowRight size={16} /></Link></section></div><PreviewNotice>Sign in to manage reports, claims, transfers and organization workspaces.</PreviewNotice><EmptyState title="Looking for something in the meantime?" action={<Link to="/explore" className="button secondary">Browse public reports <ArrowRight size={16} /></Link>}>Browsing public reports needs no wallet.</EmptyState></>}{auth.error&&<p className="notice error" role="alert">{auth.error}</p>}</main>

    <nav className="app-bottom-nav" aria-label="Mobile workspace shortcuts"><Link to="/app" aria-current={!section ? 'page' : undefined}><House size={21} />Dashboard</Link><Link to="/app/items" aria-current={section === 'items' ? 'page' : undefined}><Package size={21} />Items</Link><Link to="/explore"><Compass size={21} />Explore</Link><Link to="/app/claims" aria-current={section === 'claims' ? 'page' : undefined}><FileCheck size={21} />Claims</Link><button type="button" onClick={() => setMenu(true)}><Menu size={21} />More</button></nav></div>

    <Dialog drawer open={menu} onClose={() => setMenu(false)} title="Your workspace"><div className="drawer-app-navigation">{sidebar}</div></Dialog>

  </div>;

}

function HeartIcon() { return <span className="sidebar-qr" aria-hidden="true"><Package size={23} /></span>; }

function ShieldIcon() { return <Check size={14} aria-hidden="true" />; }
