import { createContext, useContext, useEffect, useRef, useState, type AnchorHTMLAttributes, type ReactNode } from 'react';

type Location = { path: string; search: string; hash: string };
const read = (): Location => ({ path: window.location.pathname, search: window.location.search, hash: window.location.hash });
const RouteContext = createContext<{ location: Location; navigate: (to: string) => void }>({ location: read(), navigate: () => {} });
export function Router({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState(read);
  const previousPath = useRef(location.path);
  useEffect(() => { const change = () => setLocation(read()); window.addEventListener('popstate', change); return () => window.removeEventListener('popstate', change); }, []);
  useEffect(() => {
    if (location.hash) { requestAnimationFrame(() => document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })); }
    else window.scrollTo({ top: 0, behavior: 'instant' });
    const main = document.getElementById('main');
    if (main && previousPath.current !== location.path && !location.hash) main.focus({ preventScroll: true });
    previousPath.current = location.path;
  }, [location.path, location.hash]);
  function navigate(to: string) { window.history.pushState(null, '', to); setLocation(read()); }
  return <RouteContext.Provider value={{ location, navigate }}>{children}</RouteContext.Provider>;
}
export function useRoute() { return useContext(RouteContext); }
export function Link({ to, onClick, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) {
  const { navigate } = useRoute();
  return <a href={to} {...props} onClick={(event) => { onClick?.(event); if (!event.defaultPrevented && !event.ctrlKey && !event.metaKey && !event.shiftKey && event.button === 0 && !props.target) { event.preventDefault(); navigate(to); } }} />;
}
