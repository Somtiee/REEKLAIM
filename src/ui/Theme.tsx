import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
export type ThemePreference = 'light' | 'dark' | 'system';
function preference(): ThemePreference { try { const value = localStorage.getItem('rk-theme'); return value === 'light' || value === 'dark' ? value : 'system'; } catch { return 'system'; } }
const ThemeContext = createContext<{ preference: ThemePreference; resolved: string; setPreference: (value: ThemePreference) => void }>({ preference: 'system', resolved: 'light', setPreference: () => {} });
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState(preference);
  const [systemDark, setSystemDark] = useState(() => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false);
  useEffect(() => { const media = window.matchMedia?.('(prefers-color-scheme: dark)'); if (!media) return; const change = () => setSystemDark(media.matches); media.addEventListener('change', change); return () => media.removeEventListener('change', change); }, []);
  const resolved = selected === 'system' ? systemDark ? 'dark' : 'light' : selected;
  useEffect(() => { document.documentElement.dataset.theme = resolved; document.documentElement.style.colorScheme = resolved; }, [resolved]);
  function setPreference(value: ThemePreference) { setSelected(value); try { localStorage.setItem('rk-theme', value); } catch { /* Preference remains usable without storage. */ } }
  return <ThemeContext.Provider value={{ preference: selected, resolved, setPreference }}>{children}</ThemeContext.Provider>;
}
export function useTheme() { return useContext(ThemeContext); }
