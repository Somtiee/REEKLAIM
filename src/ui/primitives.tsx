import { cloneElement, createContext, useContext, useEffect, useId, useRef, useState, type InputHTMLAttributes, type ReactElement, type ReactNode, type SelectHTMLAttributes } from 'react';
import { AlertCircle, Check, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { Button } from '../components/Button.tsx';

export function IconButton({ label, children, onClick, className = '', ...props }: { label: string; children: ReactNode; onClick?: () => void; className?: string; 'aria-expanded'?: boolean; 'aria-controls'?: string }) {
  return <Button variant="ghost" className={`icon-button ${className}`} aria-label={label} title={label} onClick={onClick} {...props}>{children}</Button>;
}
export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'success' | 'warning' | 'info' | 'violet' }) { return <span className={`badge badge-${tone}`}><span className="badge-dot" />{children}</span>; }
export function Field({ label, hint, error, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; error?: string }) {
  const id = useId(); return <div className="field"><label htmlFor={id}>{label}</label><input id={id} aria-describedby={hint || error ? `${id}-hint` : undefined} aria-invalid={!!error} {...props} />{(hint || error) && <span id={`${id}-hint`} className={error ? 'field-error' : 'field-hint'}>{error ?? hint}</span>}</div>;
}
export function SelectField({ label, children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { label: string }) { const id = useId(); return <div className="field select-field"><label htmlFor={id}>{label}</label><select id={id} {...props}>{children}</select></div>; }
export function SearchField({ label = 'Search', ...props }: InputHTMLAttributes<HTMLInputElement> & { label?: string }) { const id = useId(); return <div className="search-field"><Search size={19} aria-hidden="true" /><label className="sr-only" htmlFor={id}>{label}</label><input id={id} type="search" {...props} /></div>; }
export function Chip({ children, selected, onClick }: { children: ReactNode; selected: boolean; onClick: () => void }) { return <button className={`chip ${selected ? 'selected' : ''}`} type="button" aria-pressed={selected} onClick={onClick}>{children}</button>; }
export function Tabs<T extends string>({ items, value, onChange, label }: { items: { value: T; label: string }[]; value: T; onChange: (value: T) => void; label: string }) {
  return <div className="tabs" role="tablist" aria-label={label}>{items.map((item, index) => <button key={item.value} role="tab" type="button" aria-selected={item.value === value} tabIndex={item.value === value ? 0 : -1} onKeyDown={(e) => { let next: number; if (e.key === 'ArrowRight') next = (index + 1) % items.length; else if (e.key === 'ArrowLeft') next = (index - 1 + items.length) % items.length; else if (e.key === 'Home') next = 0; else if (e.key === 'End') next = items.length - 1; else return; e.preventDefault(); onChange(items[next].value); (e.currentTarget.parentElement?.children[next] as HTMLButtonElement)?.focus(); }} onClick={() => onChange(item.value)}>{item.label}</button>)}</div>;
}
export function Dialog({ open, onClose, title, children, drawer = false }: { open: boolean; onClose: () => void; title: string; children: ReactNode; drawer?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null); const id = useId();
  useEffect(() => {
    const dialog = ref.current; if (!dialog) return;
    if (open) { if (typeof dialog.showModal === 'function' && !dialog.open) dialog.showModal(); else dialog.setAttribute('open', ''); const old = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = old; if (dialog.open && typeof dialog.close === 'function') dialog.close(); }; }
    if (dialog.open && typeof dialog.close === 'function') dialog.close(); else dialog.removeAttribute('open');
  }, [open]);
  return <dialog ref={ref} className={drawer ? 'dialog drawer' : 'dialog'} aria-labelledby={id} onKeyDown={(event) => { if (event.key !== 'Tab') return; const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]')).filter(node => node.getClientRects().length > 0); const first = controls[0]; const last = controls[controls.length - 1]; if (!first) { event.preventDefault(); return; } if (event.shiftKey && (document.activeElement === first || !event.currentTarget.contains(document.activeElement))) { event.preventDefault(); last.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); } }} onCancel={(e) => { e.preventDefault(); onClose(); }} onClick={(e) => { if (e.target === e.currentTarget) { const bounds = e.currentTarget.getBoundingClientRect(); if (e.clientX < bounds.left || e.clientX > bounds.right || e.clientY < bounds.top || e.clientY > bounds.bottom) onClose(); } }}><div className="dialog-heading"><h2 id={id}>{title}</h2><IconButton label="Close dialog" onClick={onClose}><X size={21} /></IconButton></div>{open && children}</dialog>;
}
export function ConfirmDialog({ open, onClose, onConfirm, title, children }: { open: boolean; onClose: () => void; onConfirm: () => void; title: string; children: ReactNode }) { return <Dialog open={open} onClose={onClose} title={title}><p>{children}</p><div className="actions"><Button variant="secondary" onClick={onClose}>Keep exploring</Button><Button onClick={() => { onConfirm(); onClose(); }}>Reset demonstration</Button></div></Dialog>; }
export function Tooltip({ label, children }: { label: string; children: ReactElement<{ 'aria-describedby'?: string }> }) { const id = useId(); return <span className="tooltip-wrap">{cloneElement(children, { 'aria-describedby': id })}<span id={id} role="tooltip" className="tooltip-content">{label}</span></span>; }
export function Dropdown({ label, icon, children }: { label: string; icon: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false); const ref = useRef<HTMLDivElement>(null); const id = useId();
  useEffect(() => { const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); }; document.addEventListener('click', close); return () => document.removeEventListener('click', close); }, []);
  return <div ref={ref} className="dropdown" onKeyDown={(e) => { if (e.key === 'Escape') { setOpen(false); ref.current?.querySelector('button')?.focus(); } }}><IconButton label={label} aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>{icon}</IconButton>{open && <div id={id} className="dropdown-panel" onClick={() => setOpen(false)}>{children}</div>}</div>;
}
export function EmptyState({ title, children, action, icon }: { title: string; children: ReactNode; action?: ReactNode; icon?: ReactNode }) { return <div className="empty-state"><div className="empty-symbol">{icon ?? <Search size={26} />}</div><h3>{title}</h3><p>{children}</p>{action}</div>; }
export function Skeleton({ className = '' }: { className?: string }) { return <div aria-hidden="true" className={`skeleton ${className}`} />; }
export function Breadcrumbs({ children }: { children: ReactNode }) { return <nav className="breadcrumbs" aria-label="Breadcrumb">{children}</nav>; }
export function Pagination({ page, total, onChange }: { page: number; total: number; onChange: (page: number) => void }) { return <nav className="pagination" aria-label="Listing pages"><Button variant="secondary" aria-label="Previous page" disabled={page === 1} onClick={() => onChange(page - 1)}><ChevronLeft size={17} /></Button><span aria-live="polite">Page {page} of {Math.max(1, total)}</span><Button variant="secondary" aria-label="Next page" disabled={page >= total} onClick={() => onChange(page + 1)}><ChevronRight size={17} /></Button></nav>; }
const ToastContext = createContext<(message: string) => void>(() => {});
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState('');
  useEffect(() => { if (!toast) return; const timeout = setTimeout(() => setToast(''), 5000); return () => clearTimeout(timeout); }, [toast]);
  return <ToastContext.Provider value={setToast}>{children}<div className="toast-region" role="status" aria-live="polite">{toast && <div className="toast"><Check size={19} /><span>{toast}</span><IconButton label="Dismiss notification" onClick={() => setToast('')}><X size={16} /></IconButton></div>}</div></ToastContext.Provider>;
}
export function useToast() { return useContext(ToastContext); }
export function PreviewNotice({ children = 'Illustrative demo only. No real item or transaction is created.' }: { children?: ReactNode }) { return <div className="preview-notice"><AlertCircle size={16} aria-hidden="true" /><span>{children}</span></div>; }
