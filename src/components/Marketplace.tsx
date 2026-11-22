import { useState } from 'react';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { categories, demoItems, filterDemoItems, type Category } from '../demo/items.ts';
import { Chip, EmptyState, Field, Pagination, PreviewNotice, SearchField, SelectField, Tabs } from '../ui/primitives.tsx';
import { ItemCard } from './ProductUI.tsx';
import { Button } from './Button.tsx';
import { Link } from '../ui/Router.tsx';

export function Marketplace({ compact = false }: { compact?: boolean }) {
  const [tab, setTab] = useState<'all' | 'lost' | 'found'>('all');
  const [query, setQuery] = useState(''); const [category, setCategory] = useState<Category>('All items');
  const [location, setLocation] = useState('Anywhere'); const [since, setSince] = useState(''); const [page, setPage] = useState(1);
  const results = filterDemoItems(demoItems, { query, category, location, status: tab, since });
  const size = compact ? 4 : 6; const pages = Math.ceil(results.length / size); const currentPage = Math.min(page, Math.max(1, pages));
  function reset() { setTab('all'); setQuery(''); setCategory('All items'); setLocation('Anywhere'); setSince(''); setPage(1); }
  return <div className="marketplace"><div className="market-toolbar"><Tabs label="Listing type" items={[{ value: 'all', label: 'All belongings' }, { value: 'lost', label: 'Lost' }, { value: 'found', label: 'Found' }]} value={tab} onChange={(value) => { setTab(value); setPage(1); }} /><SearchField label="Search demo belongings" placeholder="Search an item, category or city…" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} /></div>
    <div className="market-filters"><div className="category-chips" aria-label="Item categories">{categories.map((value) => <Chip key={value} selected={category === value} onClick={() => { setCategory(value); setPage(1); }}>{value}</Chip>)}</div><SelectField label="Location" value={location} onChange={(e) => { setLocation(e.target.value); setPage(1); }}><option>Anywhere</option>{[...new Set(demoItems.map((item) => item.city))].map((city) => <option key={city}>{city}</option>)}</SelectField>{!compact && <Field label="From date" type="date" value={since} onChange={(e) => { setSince(e.target.value); setPage(1); }} />}</div>
    <div className="market-caption"><span>{results.length} illustrative {results.length === 1 ? 'listing' : 'listings'} · no live reports</span>{(query || category !== 'All items' || location !== 'Anywhere' || since || tab !== 'all') && <Button variant="ghost" onClick={reset}><RotateCcw size={13} />Clear filters</Button>}</div>
    {results.length ? <div className="item-grid">{results.slice((currentPage - 1) * size, currentPage * size).map((item) => <ItemCard key={item.id} item={item} />)}</div> : <EmptyState title="No demo belongings match." action={<Button variant="secondary" onClick={reset}>Clear filters</Button>}>Try another category, city or search. These filters search only the example dataset.</EmptyState>}
    {compact ? <div className="market-bottom"><p>*Example reward intentions only. No funds are held or guaranteed.</p><Link className="text-link" to="/demo/directory">Explore the demo directory <ArrowRight size={17} /></Link></div> : <><Pagination page={currentPage} total={pages} onChange={setPage} /><PreviewNotice>Fictional listings and coarse locations. Rewards are illustrative intentions, not escrow or guaranteed payments.</PreviewNotice></>}
  </div>;
}
