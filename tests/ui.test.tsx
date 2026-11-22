import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { demoItems, filterDemoItems } from '../src/demo/items.ts';
import { InteractivePreview } from '../src/components/InteractivePreview.tsx';
import { ToastProvider, Tabs } from '../src/ui/primitives.tsx';
import { ThemeProvider, useTheme } from '../src/ui/Theme.tsx';

afterEach(() => { localStorage.clear(); vi.restoreAllMocks(); });
describe('isolated public directory', () => {
  it('combines status, city, category and search without modifying fixtures', () => {
    const original = JSON.stringify(demoItems);
    const results = filterDemoItems(demoItems, {query: 'backpack', status: 'lost', category: 'Luggage', location: 'London', since: ''});
    expect(results).toHaveLength(1); expect(JSON.stringify(demoItems)).toBe(original);
  });
  it('returns no records for an unmatched private identifier', () => {
    expect(filterDemoItems(demoItems, {query: 'nonexistent serial', status: 'all', category: 'All items', location: 'Anywhere', since: ''})).toHaveLength(0);
  });
  it('filters dates inclusively', () => {
    const results = filterDemoItems(demoItems, {query: '', status: 'all', category: 'All items', location: 'Anywhere', since: '2026-11-16'});
    expect(results.length).toBeGreaterThan(0); expect(results.every(item => item.date >= '2026-11-16')).toBe(true);
  });
});
describe('demonstration interactions', () => {
  it('requires an example name and advances locally without requesting a network', () => {
    const network = vi.spyOn(globalThis, 'fetch');
    render(<ToastProvider><InteractivePreview /></ToastProvider>);
    fireEvent.change(screen.getByLabelText('Example item name'), {target: {value: ' '}});
    expect(screen.getByRole('button', {name: /Preview registration/})).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Example item name'), {target: {value: 'Example keys'}});
    fireEvent.click(screen.getByRole('button', {name: /Preview registration/}));
    expect(screen.getByRole('heading', {name: 'Meet your recovery tag'})).toBeInTheDocument();
    expect(screen.getByText('Example keys')).toBeInTheDocument(); expect(network).not.toHaveBeenCalled();
  });
  it('supports arrow-key tab navigation with one tab stop', () => {
    const changed = vi.fn(); render(<Tabs label="Examples" items={[{value:'all',label:'All'},{value:'lost',label:'Lost'}]} value="all" onChange={changed} />);
    fireEvent.keyDown(screen.getByRole('tab', {name:'All'}), {key:'ArrowRight'});
    expect(changed).toHaveBeenCalledWith('lost'); expect(screen.getByRole('tab', {name:'Lost'})).toHaveFocus();
  });
});
function ThemeProbe() { const theme = useTheme(); return <button onClick={() => theme.setPreference('dark')}>{theme.preference}:{theme.resolved}</button>; }
describe('theme preferences', () => {
  it('persists an explicit choice', () => { render(<ThemeProvider><ThemeProbe /></ThemeProvider>); fireEvent.click(screen.getByRole('button')); expect(localStorage.getItem('rk-theme')).toBe('dark'); expect(document.documentElement.dataset.theme).toBe('dark'); });
  it('uses the saved theme on initialization', () => { localStorage.setItem('rk-theme','light'); render(<ThemeProvider><ThemeProbe /></ThemeProvider>); expect(screen.getByText('light:light')).toBeInTheDocument(); });
  it('treats corrupt stored preferences as system', () => { localStorage.setItem('rk-theme','invalid'); render(<ThemeProvider><ThemeProbe /></ThemeProvider>); expect(screen.getByRole('button')).toHaveTextContent('system:'); });
});
