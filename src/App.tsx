// Original ReeKlaim UI extending the genuine official React/Vite scaffold.
import { lazy, Suspense, useEffect } from 'react';
import { WalletProvider } from './wallet/WalletProvider.tsx';
import { Router, useRoute } from './ui/Router.tsx';
import { ThemeProvider } from './ui/Theme.tsx';
import { ToastProvider } from './ui/primitives.tsx';
import { PageErrorBoundary, PageLoadError } from './ui/PageErrorBoundary.tsx';
import { SiteFooter, SiteHeader, WalletUIProvider } from './components/Layout.tsx';
import LandingPage from './pages/LandingPage.tsx';
import './styles.css';
import { AuthProvider } from './auth/AuthProvider.tsx';
import './items/items.css';

const ApplicationShell = lazy(() => import('./pages/ApplicationShell.tsx'));
const DesignSystemPage = lazy(() => import('./pages/DesignSystemPage.tsx'));
const RecoveryPage = lazy(() => import('./items/RecoveryPage.tsx'));
const SignInPage = lazy(() => import('./pages/SignInPage.tsx'));
const PublicPage = lazy(() => import('./pages/PublicPages.tsx'));
const Directory = lazy(() => import('./market/Marketplace.tsx').then(module => ({ default: module.Directory })));
const ListingDetail = lazy(() => import('./market/Marketplace.tsx').then(module => ({ default: module.ListingDetail })));
const Reports = lazy(() => import('./market/Marketplace.tsx').then(module => ({ default: module.Reports })));

const DevProof = import.meta.env.DEV ? lazy(() => import('./pages/ProofPage')) : null;
function Routes() {
  const { location } = useRoute(); const path = location.path.replace(/\/$/, '') || '/';
  useEffect(() => { const title = path === '/' ? 'Lost something? Let’s get it back.' : path.startsWith('/app') ? 'Your workspace' : path.startsWith('/explore') ? 'Explore lost & found' : path === '/organizations' ? 'For organizations' : 'A thoughtful way back'; document.title = `ReeKlaim · ${title}`; }, [path]);
  if (path === '/app' || path.startsWith('/app/')) {
    return <PageErrorBoundary route={path} fallback={<main id="main" tabIndex={-1}><PageLoadError /></main>}>
      <Suspense fallback={<main id="main" tabIndex={-1}><p role="status">Loading workspace…</p></main>}>
        <ApplicationShell section={path.split('/')[2] ?? ''} />
      </Suspense>
    </PageErrorBoundary>;
  }
  let page;
  if (path === '/') page = <LandingPage />;
  else if (path === '/sign-in') page = <SignInPage />;
  else if (path.startsWith('/recover/')) page = <RecoveryPage key={path} token={path.split('/')[2]}/>;
  else if (path === '/explore') page = <Directory />;
  else if (path === '/reports/lost' || path === '/reports/found') page = <Reports key={path} kind={path.endsWith('/lost')?'lost':'found'} />;
  else if (path.startsWith('/explore/')) page = <ListingDetail key={path} id={path.split('/')[2]} />;
  else if (path === '/design-system') page = <DesignSystemPage />;
  else if (path === '/dev/qorechain' && DevProof) page = <div className="container proof-route"><Suspense fallback={<p role="status">Loading the developer proof tools…</p>}><DevProof /></Suspense></div>;
  else page = <PublicPage path={path} />;
  return <><SiteHeader /><main id="main" tabIndex={-1}>
    <PageErrorBoundary route={path} fallback={<PageLoadError />}>
      <Suspense fallback={<p className="container" role="status">Loading page…</p>}>{page}</Suspense>
    </PageErrorBoundary>
  </main><SiteFooter /></>;
}
export function App() { return <ThemeProvider><Router><WalletProvider><AuthProvider><ToastProvider><WalletUIProvider><div className="app" id="top"><a className="skip-link" href="#main">Skip to content</a><Routes /></div></WalletUIProvider></ToastProvider></AuthProvider></WalletProvider></Router></ThemeProvider>; }
