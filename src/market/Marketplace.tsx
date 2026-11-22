import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../auth/AuthProvider.tsx';
import { Link, useRoute } from '../ui/Router.tsx';
import { Badge, Dialog, EmptyState, Field, SelectField, Skeleton } from '../ui/primitives.tsx';
import { Button } from '../components/Button.tsx';
import { categories } from '../items/domain.ts';
import { reportFields, type Listing, type ReportFields } from './domain.ts';
import './market.css';

const endpoint='/api/market';
const titleCase=(s:string)=>s.charAt(0).toUpperCase()+s.slice(1).replaceAll('_',' ');
function rewardLabel(value:number){
  const base=BigInt(value);
  const fraction=(base%1000000n).toString().padStart(6,'0').replace(/0+$/,'');
  return (base/1000000n).toString()+(fraction?'.'+fraction:'')+' test QOR offered';
}
const message=(e:unknown)=>e instanceof Error?e.message:'Request unavailable. Try again.';
async function get<T>(url:string,signal?:AbortSignal):Promise<T>{
  const response=await fetch(url,{signal,cache:'no-store'});
  if(!response.ok) throw new Error(response.status===404?'This report is unavailable.':'The directory is temporarily unavailable. Try again.');
  return response.json();
}
function Photo({item}:{item:Listing}){
  return item.has_photo?<img className="market-photo" src={endpoint+'/'+item.id+'/photo'} alt={item.title} loading="lazy"/>:<div className="market-photo market-photo-empty" aria-hidden="true">{titleCase(item.category)}</div>;
}
function Metadata({item}:{item:Listing}){
  return <><div className="actions"><Badge tone={item.kind==='lost'?'warning':'success'}>{titleCase(item.kind)}</Badge>{item.verified&&<Badge tone="success">Diana registration verified</Badge>}</div><p>{item.city}, {item.country} · <time dateTime={item.occurred_on}>{item.occurred_on}</time></p>{item.reward>0&&<p>{rewardLabel(item.reward)}</p>}</>;
}
const initialFilters={q:'',category:'',country:'',city:'',since:'',until:'',reward:'',verified:'',sort:'recent'};
export function Directory(){
  const [kind,setKind]=useState<'lost'|'found'>('lost');
  const [filters,setFilters]=useState(initialFilters);
  const [applied,setApplied]=useState(initialFilters);
  const [drawer,setDrawer]=useState(false);
  const [mode,setMode]=useState<'grid'|'list'>('grid');
  const [page,setPage]=useState(1);
  const [reload,retry]=useState(0);
  const [data,setData]=useState<{items:Listing[];more:boolean}|null>(null);
  const [error,setError]=useState('');
  useEffect(()=>{
    const controller=new AbortController();
    const params=new URLSearchParams({kind,page:String(page)});
    for(const [key,value] of Object.entries(applied)) if(value.trim()) params.set(key,key==='country'?value.trim().toUpperCase():value.trim());
    setData(null);setError('');
    void get<{items:Listing[];more:boolean}>(endpoint+'?'+params,controller.signal).then(value=>{if(!controller.signal.aborted)setData(value);}).catch(e=>{if(!controller.signal.aborted)setError(message(e));});
    return ()=>controller.abort();
  },[kind,page,applied,reload]);
  function apply(e:FormEvent){e.preventDefault();setApplied({...filters});setPage(1);setDrawer(false);}
  return <section className="container market-page"><header className="market-intro"><span className="eyebrow">GLOBAL LOST & FOUND</span><h1>Find what’s missing.</h1><p>Search public reports by item, city or date.</p><div className="actions"><Link className="button primary" to="/reports/lost">Report lost</Link><Link className="button secondary" to="/reports/found">Report found</Link><Link className="text-link" to="/demo/directory">Browse fictional demo</Link></div></header>
    <div className="market-tools"><div className="actions" aria-label="Report type">{(['lost','found'] as const).map(tab=><Button key={tab} variant={kind===tab?'primary':'secondary'} aria-pressed={kind===tab} onClick={()=>{setKind(tab);setPage(1);}}>{titleCase(tab)}</Button>)}</div>
    <form className="market-search" onSubmit={apply}><Field label="Search reports" type="search" maxLength={80} value={filters.q} onChange={e=>setFilters({...filters,q:e.target.value})}/><Button type="submit">Search</Button></form>
    <div className="actions"><Button variant="secondary" onClick={()=>setDrawer(true)}>Filters</Button><SelectField label="Layout" value={mode} onChange={e=>setMode(e.target.value as typeof mode)}><option value="grid">Grid</option><option value="list">List</option></SelectField></div></div>
    <Dialog drawer open={drawer} onClose={()=>setDrawer(false)} title="Filter reports"><form className="market-form" onSubmit={apply}>
      <SelectField label="Category" value={filters.category} onChange={e=>setFilters({...filters,category:e.target.value})}><option value="">All categories</option>{categories.map(c=><option key={c}>{c}</option>)}</SelectField>
      <Field label="Country code" placeholder="NG" maxLength={2} pattern="[A-Za-z]{2}" value={filters.country} onChange={e=>setFilters({...filters,country:e.target.value})}/><Field label="City" value={filters.city} maxLength={70} onChange={e=>setFilters({...filters,city:e.target.value})}/>
      <Field label="From date" type="date" value={filters.since} max={filters.until||undefined} onChange={e=>setFilters({...filters,since:e.target.value})}/><Field label="To date" type="date" value={filters.until} min={filters.since||undefined} onChange={e=>setFilters({...filters,until:e.target.value})}/>
      {(['reward','verified'] as const).map(key=><SelectField key={key} label={key==='reward'?'Reward available':'Verified registration'} value={filters[key]} onChange={e=>setFilters({...filters,[key]:e.target.value})}><option value="">Any</option><option value="yes">Yes</option><option value="no">No</option></SelectField>)}
      <SelectField label="Sort by" value={filters.sort} onChange={e=>setFilters({...filters,sort:e.target.value})}><option value="recent">Most recent</option><option value="oldest">Oldest first</option><option value="reward">Highest offered reward</option></SelectField>
      <div className="actions"><Button type="submit">Apply filters</Button><Button variant="secondary" onClick={()=>{setFilters(initialFilters);setApplied(initialFilters);setPage(1);setDrawer(false);}}>Clear filters</Button></div>
    </form></Dialog>
    {error?<div className="notice error" role="alert">{error} <Button variant="secondary" onClick={()=>retry(reload+1)}>Retry search</Button></div>:!data?<div role="status" aria-label="Loading reports" className="market-grid">{[1,2,3].map(i=><Skeleton key={i} className="market-loading"/>)}</div>:<>
      {data.items.length?<div className={'market-grid market-'+mode}>{data.items.map(item=><article className="item-panel market-card" key={item.id}><Link to={'/explore/'+item.id}><Photo item={item}/><div className="market-card-copy"><Metadata item={item}/><h2>{item.title}</h2><p>{titleCase(item.category)}</p></div></Link></article>)}</div>:<EmptyState title="No public reports match">Try a different city, keyword or date range.</EmptyState>}
      <nav className="actions market-pagination" aria-label="Directory pages"><Button variant="secondary" disabled={page===1} onClick={()=>setPage(page-1)}>Previous page</Button><span>Page {page}</span><Button variant="secondary" disabled={!data.more} onClick={()=>setPage(page+1)}>Next page</Button></nav>
    </>}
  </section>;
}
export function ListingDetail({id}:{id:string}){
  const auth=useAuth();
  const [item,setItem]=useState<Listing|null>(null);
  const [error,setError]=useState('');
  const [flag,setFlag]=useState(false);
  const [reason,setReason]=useState('privacy');
  const [sent,setSent]=useState(false);
  const [busy,setBusy]=useState(false);
  useEffect(()=>{const controller=new AbortController();void get<Listing>(endpoint+'/'+encodeURIComponent(id),controller.signal).then(setItem).catch(e=>{if(!controller.signal.aborted)setError(message(e));});return()=>controller.abort();},[id]);
  async function report(){setBusy(true);setError('');try{await auth.request(endpoint+'/'+id+'/abuse',{reason});setFlag(false);setSent(true);}catch(e){setError(message(e));}finally{setBusy(false);}}
  return <section className="container market-page"><Link to="/explore">Back to directory</Link>{error&&<p role="alert" className="notice error">{error}</p>}{!item?<h1>{error?'Report unavailable':'Loading report…'}</h1>:<><h1>{item.title}</h1><div className="market-detail"><Photo item={item}/><section className="item-panel"><Metadata item={item}/><p>{titleCase(item.category)}</p><p>{item.description}</p>{[item.brand,item.model,item.colour].some(Boolean)&&<p>{[item.brand,item.model,item.colour].filter(Boolean).join(' · ')}</p>}{item.reward>0&&<p>Reward declarations are voluntary and funds are not held.</p>}<p>Meet at a staffed public place. Keep private evidence and contact details off public reports.</p><p>Claims require a verified QoreX account. Finder rewards depend on a confirmed recovery and verified Diana settlement.</p><div className="actions">{item.kind==='found'&&<Link className="button primary" to={'/app/claims/new?found='+item.id}>Start private claim</Link>}{item.kind==='lost'&&<Link className="button secondary" to="/reports/found">File a found report</Link>}<Button variant="secondary" onClick={()=>setFlag(true)} disabled={sent}>Report abuse</Button></div>{sent&&<p role="status">Sent for moderator review.</p>}</section></div></>}
  <Dialog open={flag} title="Report a safety issue" onClose={()=>setFlag(false)}><SelectField label="Reason" value={reason} onChange={e=>setReason(e.target.value)}>{['privacy','spam','unsafe','other'].map(r=><option key={r}>{r}</option>)}</SelectField>{error&&<p role="alert">{error}</p>}<Button disabled={busy||!auth.csrf} onClick={()=>void report()}>Send to moderators</Button></Dialog></section>;
}

type OwnListing=Listing&{revision:number;item_id:string|null};
const blank:ReportFields={title:'',description:'',category:'other',country:'',city:'',brand:'',model:'',colour:'',occurred_on:new Date().toISOString().slice(0,10),reward:0};
export function Reports({kind}:{kind:'lost'|'found'}){
  const auth=useAuth();
  return <ReportWorkspace key={auth.bound?auth.user?.id:'guest'} kind={kind}/>;
}
function ReportWorkspace({kind}:{kind:'lost'|'found'}){
  const auth=useAuth();
  const {location,navigate}=useRoute();
  const [fields,setFields]=useState<ReportFields>(blank);
  const [itemId,setItemId]=useState('');
  const [tag,setTag]=useState('');
  const [followUp,setFollowUp]=useState('');
  const [inventory,setInventory]=useState<{id:string;name:string;status:string}[]>([]);
  const [rows,setRows]=useState<OwnListing[]>([]);
  const [editing,setEditing]=useState<OwnListing|null>(null);
  const [selected,setSelected]=useState<OwnListing|null>(null);
  const [photo,setPhoto]=useState<File|null>(null);
  const [photoUrl,setPhotoUrl]=useState('');
  const [removePhoto,setRemovePhoto]=useState(false);
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  const [notice,setNotice]=useState('');
  useEffect(()=>{if(!photo){setPhotoUrl('');return;}const url=URL.createObjectURL(photo);setPhotoUrl(url);return()=>URL.revokeObjectURL(url);},[photo]);
  useEffect(()=>{
    if(!auth.bound)return;
    let current=true;
    void auth.request<{items:OwnListing[]}>(endpoint+'/mine',undefined,'GET').then(data=>{if(current)setRows(data.items);}).catch(e=>{if(current)setError(message(e));});
    if(kind==='lost')void auth.request<{items:{id:string;name:string;status:string}[]}>('/api/items',undefined,'GET').then(data=>{
      if(!current)return;
      const owned=data.items.filter(i=>['registered','missing'].includes(i.status));
      setInventory(owned);
      const requested=new URLSearchParams(location.search).get('item');
      if(requested&&owned.some(i=>i.id===requested))setItemId(requested);
    }).catch(e=>{if(current)setError(message(e));});
    return()=>{current=false;};
  },[auth.bound,auth.request,kind,location.search]);
  async function reload(){setRows((await auth.request<{items:OwnListing[]}>(endpoint+'/mine',undefined,'GET')).items);}
  async function run(action:()=>Promise<void>){setBusy(true);setError('');setNotice('');try{await action();}catch(e){setError(message(e));}finally{setBusy(false);}}
  function setField<K extends keyof ReportFields>(key:K,value:ReportFields[K]){setFields(current=>({...current,[key]:value}));}
  async function draft(){
    const parsed=reportFields.safeParse(fields);
    if(!parsed.success)throw new Error(parsed.error.issues.map(i=>i.path.join('.')+' '+i.message).join(' '));
    const id=editing?.id??(await auth.request<{id:string}>(endpoint,{...parsed.data,kind,itemId:itemId||null})).id;
    if(editing)await auth.request(endpoint+'/'+id+'/edit',{revision:editing.revision,fields:parsed.data,removePhoto});
    setEditing(null);setNotice('Private draft saved.');
    await reload();
    if(photo){
      const response=await fetch(endpoint+'/'+id+'/photo',{method:'POST',headers:{'X-CSRF-Token':auth.csrf,'Content-Type':photo.type},body:photo});
      if(!response.ok)throw new Error('Draft saved. The photo was rejected. Edit the draft to try another image.');
    }
    const data=await auth.request<{items:OwnListing[]}>(endpoint+'/mine',undefined,'GET');setRows(data.items);
    setSelected(data.items.find(i=>i.id===id)??null);setPhoto(null);
  }
  function edit(row:OwnListing){
    const {title,description,category,country,city,occurred_on,reward,brand,model,colour}=row;
    setEditing(row);setFields({title,description,category,country,city,occurred_on,reward,brand,model,colour});setItemId(row.item_id??'');setRemovePhoto(false);setPhoto(null);
    document.getElementById('market-report-form')?.scrollIntoView();
  }
  return <section className="container market-page"><Link to="/explore">Back to directory</Link><h1>Report {kind==='lost'?'a lost item':'a found item'}.</h1><p>Reporting is free. Publish only details you are comfortable sharing publicly.</p>
    {kind==='found'&&<form className="item-panel market-form" onSubmit={e=>{e.preventDefault();const t=tag.trim().match(/^(?:[A-Za-z0-9_-]{43}|https?:\/\/[^/]+\/recover\/[A-Za-z0-9_-]{43})$/);if(t)navigate('/recover/'+t[0].split('/').pop());else setError('Enter the token or scan the URL printed on the ReeKlaim tag.');}}><h2>Have a QR tag?</h2><Field label="ReeKlaim recovery link or token" value={tag} maxLength={300} onChange={e=>setTag(e.target.value)}/><Button type="submit">Open recovery tag</Button><p>Send an anonymous request through the tag. Protected claims require a verified QoreX account. Finder rewards depend on a confirmed recovery and verified Diana settlement.</p></form>}
    {kind==='found'&&<form className="item-panel market-form" onSubmit={e=>{e.preventDefault();void run(async()=>{await auth.request(endpoint+'/finder-status',{token:followUp.trim()});setNotice('The finder request was received.');});}}><Field label="Finder acknowledgement code" required pattern="[A-Za-z0-9_-]{43}" value={followUp} maxLength={43} onChange={e=>setFollowUp(e.target.value)}/><Button type="submit" disabled={busy||!auth.csrf}>Check receipt</Button></form>}
    {error&&<p className="notice error" role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}
    {!auth.bound?<div className="item-panel"><p>Sign in with your QoreX wallet to manage and publish public reports.</p><Link className="button primary" to={'/sign-in?returnTo='+encodeURIComponent(location.path+location.search)}>Sign in with QoreX</Link></div>:<>
    <form id="market-report-form" className="item-panel market-form" onSubmit={e=>{e.preventDefault();void run(draft);}}>
    <h2>{editing?'Edit report':'Create a private draft'}</h2>
    {kind==='lost'&&<SelectField label="Registered item (optional)" disabled={!!editing} value={itemId} onChange={e=>setItemId(e.target.value)}><option value="">Unregistered item</option>{inventory.map(i=><option key={i.id} value={i.id}>{i.name}</option>)}</SelectField>}
    <Field label="Public title" required maxLength={100} value={fields.title} onChange={e=>setField('title',e.target.value)}/>
    <label className="field">Public description<textarea required maxLength={600} value={fields.description} onChange={e=>setField('description',e.target.value)} /></label>
    <SelectField label="Category" value={fields.category} onChange={e=>setField('category',e.target.value as ReportFields['category'])}>{categories.map(c=><option key={c}>{c}</option>)}</SelectField>
    {(['brand','model','colour'] as const).map(key=><Field key={key} label={titleCase(key)+' (optional)'} value={fields[key]} onChange={e=>setField(key,e.target.value)}/>)}
    <Field label="Country code" required placeholder="NG" maxLength={2} pattern="[A-Za-z]{2}" value={fields.country} onChange={e=>setField('country',e.target.value)}/>
    <Field label="Approximate city" required maxLength={70} value={fields.city} onChange={e=>setField('city',e.target.value)}/>
    <Field label="Date last seen or found" required type="date" value={fields.occurred_on} max={blank.occurred_on} onChange={e=>setField('occurred_on',e.target.value)}/>
    {kind==='lost'&&<Field label="Optional reward in uqor (1 QOR = 1,000,000 uqor)" type="number" min={0} max={100000000} step={1} value={fields.reward} onChange={e=>setField('reward',Number(e.target.value))}/>}
    <Field label="Separate public photo (optional)" type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>setPhoto(e.target.files?.[0]??null)}/>
    {photoUrl&&<img className="market-photo" src={photoUrl} alt="Selected public photo"/>}
    {editing?.has_photo&&<label><input type="checkbox" checked={removePhoto} onChange={e=>setRemovePhoto(e.target.checked)}/> Remove previous public photo</label>}
    <p>Keep addresses, phone numbers, full serials and documents out of descriptions and photos. Photos are re-encoded to remove metadata.</p>
    <Button type="submit" disabled={busy}>Save draft and review</Button>
    </form>
    <h2>Your reports</h2><div className="market-grid">{rows.filter(row=>row.kind===kind).map(row=><article className="item-panel" key={row.id}><Badge>{titleCase(row.status)}</Badge><h3>{row.title}</h3><div className="actions">
    {row.status==='open'&&<Link to={'/explore/'+row.id}>View listing</Link>}
    {['open','draft'].includes(row.status)&&<Button variant="secondary" disabled={busy} onClick={()=>edit(row)}>Edit</Button>}
    {row.status==='draft'&&<Button disabled={busy} onClick={()=>setSelected(row)}>Review &amp; publish</Button>}
    {row.status==='open'&&<Button variant="secondary" disabled={busy} onClick={()=>void run(async()=>{await auth.request(endpoint+'/'+row.id+'/close');await reload();})}>Close</Button>}
    {['draft','open','closed','held','recovered'].includes(row.status)&&<Button variant="secondary" disabled={busy} onClick={()=>void run(async()=>{await auth.request(endpoint+'/'+row.id+'/archive');await reload();})}>Archive</Button>}
    </div></article>)}</div></>}
    <Dialog open={!!selected&&auth.bound} title="Review public listing" onClose={()=>setSelected(null)}>{selected&&<><h3>{selected.title}</h3><Metadata item={selected}/><p>{titleCase(selected.category)}</p><p>{selected.description}</p><p>{[selected.brand,selected.model,selected.colour].filter(Boolean).join(' · ')}</p>{selected.has_photo&&<img className="market-photo" alt="Sanitized image to be published" src={endpoint+'/'+selected.id+'/preview-photo'}/>}<p>Confirm these exact details are safe to publish. A declared reward does not move funds.</p>{error&&<p role="alert">{error}</p>}<Button disabled={busy} onClick={()=>void run(async()=>{await auth.request(endpoint+'/'+selected.id+'/publish',{revision:selected.revision,approved:true});setSelected(null);setFields(blank);setItemId('');await reload();setNotice('Report published.');})}>Approve and publish</Button></>}</Dialog>
  </section>;
}
