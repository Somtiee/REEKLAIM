import {Component,useEffect,useState,type ReactNode,type FormEvent} from 'react';
import {Bell,CheckCircle2,ClipboardList,FileCheck,Package,Search,Wallet} from 'lucide-react';
import {useAuth} from '../auth/AuthProvider.tsx';
import {useWallet} from '../wallet/WalletProvider.tsx';
import {useTheme,type ThemePreference} from '../ui/Theme.tsx';
import {Button} from '../components/Button.tsx';
import {Field,SelectField,EmptyState,useToast} from '../ui/primitives.tsx';
import {Link} from '../ui/Router.tsx';
import {displayQor} from '../payments/domain.ts';
import './workspace.css';

export const workspace='/api/workspace';
export function explain(error:unknown){return error instanceof Error?error.message:'Request unavailable. Try again.';}
type Prefs={notifications:boolean;match_alerts:boolean;hide_balance:boolean};
type Alert={id:string;safe_message:string;kind:string;href:string;created_at:string;read_at:string|null};
type Alerts={unread:number;items:Alert[]};
type OverviewData={counts:Record<string,number>;activity:{kind:string;label:string;href:string|null;created_at:string}[];preferences:Prefs};
const date=(value:string)=>new Date(value).toLocaleString();
function safeLink(path:string){return /^\/app(?:\/(?:items|claims|transactions)(?:\/(?:[a-f0-9-]{36}|matches))?)?$/.test(path);}
export class WorkspaceBoundary extends Component<{children:ReactNode},{failed:boolean}>{
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true};}
  render(){return this.state.failed?<div className="notice error" role="alert"><p>This workspace could not render.</p><Button onClick={()=>window.location.reload()}>Reload workspace</Button></div>:this.props.children;}
}
async function load<T>(path:string,signal:AbortSignal):Promise<T>{
  const reply=await fetch(workspace+path,{signal,cache:'no-store'});
  if(!reply.ok)throw new Error('Workspace data is unavailable. Try again.');
  return reply.json();
}
export function useUnread(account:string|null){
  const [count,setCount]=useState<{account:string;value:number}|null>(null);
  useEffect(()=>{
    if(!account)return;
    let active=true;
    const controller=new AbortController();
    const update=()=>void load<Alerts>('/notifications',controller.signal).then(data=>{
      if(active)setCount({account,value:data.unread});
    }).catch(()=>{/* Keep the last authorized count. */});
    update();const timer=window.setInterval(()=>{if(document.visibilityState==='visible')update();},30000);
    window.addEventListener('rk-notification-read',update);
    return()=>{active=false;controller.abort();clearInterval(timer);window.removeEventListener('rk-notification-read',update);};
  },[account]);
  return count?.account===account?count?.value??0:0;
}
export function Overview(){
  const wallet=useWallet();
  const [data,setData]=useState<OverviewData|null>(null);
  const [error,setError]=useState('');
  const [revision,setRevision]=useState(0);
  const [search,setSearch]=useState('');
  useEffect(()=>{
    const abort=new AbortController();
    void load<OverviewData>('/overview',abort.signal).then(setData).catch(e=>{if(!abort.signal.aborted)setError(explain(e));});
    return()=>abort.abort();
  },[revision]);
  const metrics=[['registered','Registered items',Package,'/app/items'],['missing','Missing items',Search,'/app/items'],
    ['found','Found reports',ClipboardList,'/reports/found'],['claims','Active claims',FileCheck,'/app/claims'],
    ['recoveries','Recovery cases',ClipboardList,'/app/recoveries'],['successful','Successful returns',CheckCircle2,'/app/recoveries']] as const;
  const activity=data?.activity.filter(item=>item.label.toLowerCase().includes(search.toLowerCase()));
  return <div className="rk-overview">
    <div className="rk-overview-intro"><div><span className="eyebrow">PERSONAL OVERVIEW</span><h2>Everything in its place.</h2><p>Track belongings and pick up where each recovery left off.</p></div>
      <div className="rk-wallet-summary"><Wallet size={19}/><span>Diana testnet balance</span><strong>{!data?'Checking…':data.preferences.hide_balance?'Hidden':wallet.balance!==null?displayQor(wallet.balance)+' QOR':'Unavailable'}</strong></div></div>
    <div className="actions"><Link className="button primary" to="/app/items/new">Register an item</Link><Link className="button secondary" to="/reports/found">Report an item</Link><Link className="button secondary" to="/app/claims/matches">Check possible matches</Link></div>
    {error&&<div className="notice error">{error} <Button variant="secondary" onClick={()=>{setError('');setRevision(revision+1);}}>Retry</Button></div>}
    <div className="rk-metrics">{metrics.map(([key,label,Icon,href])=><Link to={href} className="rk-metric" key={key}><Icon size={20}/><strong>{data?.counts[key]??'—'}</strong><span>{label}</span></Link>)}</div>
    <section className="item-panel rk-activity"><div className="rk-activity-heading"><h3>Recent activity</h3><Field label="Search recent activity" type="search" maxLength={80} value={search} onChange={e=>setSearch(e.target.value)}/></div>
      {!data&&!error&&<p role="status">Loading your overview…</p>}
      {data&&!activity?.length&&<p>{search?'No recent activity matches that search.':'Your wallet, item and recovery activity will appear here.'}</p>}
      <ul>{activity?.map((event,i)=><li key={event.created_at+':'+i}>{event.href&&safeLink(event.href)?<Link to={event.href}>{event.label}</Link>:<span>{event.label.replaceAll(/[._]/g,' ')}</span>}<time dateTime={event.created_at}>{date(event.created_at)}</time></li>)}</ul>
    </section>
  </div>;
}
export function Notifications(){
  const auth=useAuth();
  const toast=useToast();
  const [data,setData]=useState<Alerts|null>(null);
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  async function refresh(){setData(await auth.request<Alerts>(workspace+'/notifications',undefined,'GET'));}
  useEffect(()=>{let active=true;void auth.request<Alerts>(workspace+'/notifications',undefined,'GET').then(result=>{if(active)setData(result);}).catch(e=>{if(active)setError(explain(e));});return()=>{active=false;};},[auth.request]);
  async function read(id:string){
    setBusy(true);setError('');
    try{await auth.request(workspace+'/notifications/read',{id});await refresh();window.dispatchEvent(new Event('rk-notification-read'));toast('Read status updated.');}
    catch(e){setError(explain(e));}finally{setBusy(false);}
  }
  return <section className="item-panel rk-activity"><div className="rk-activity-heading"><h2><Bell size={22}/> Notifications {data&&'· '+data.unread+' unread'}</h2><Button variant="secondary" disabled={busy||!data?.unread} onClick={()=>void read('all')}>Mark all read</Button></div>
    {error&&<p role="alert">{error}</p>}{!data&&!error&&<p role="status">Loading notifications…</p>}
    {data?.items.length===0&&<EmptyState title="You’re all caught up">Finder requests, claim activity and confirmed payments appear here.</EmptyState>}
    <ul>{data?.items.map(alert=><li key={alert.id} className={alert.read_at?'':'rk-unread'}><div>{safeLink(alert.href)?<Link to={alert.href}>{alert.safe_message}</Link>:<span>{alert.safe_message}</span>}<time dateTime={alert.created_at}>{date(alert.created_at)}</time></div>
      {!alert.read_at&&<Button disabled={busy} variant="secondary" onClick={()=>void read(alert.id)}>Mark read</Button>}</li>)}</ul>
  </section>;
}
type SettingsData={preferences:Prefs;deletion:string|null;sessions:{id:string;created_at:string;expires_at:string;current:boolean}[]};
export function SettingsPanel(){
  const auth=useAuth();
  const theme=useTheme(),toast=useToast();
  const [data,setData]=useState<SettingsData|null>(null);
  const [name,setName]=useState(auth.user?.displayName??'');
  const [confirm,setConfirm]=useState('');
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  useEffect(()=>{let active=true;void auth.request<SettingsData>(workspace+'/settings',undefined,'GET').then(result=>{if(active)setData(result);}).catch(e=>{if(active)setError(explain(e));});return()=>{active=false;};},[auth.request]);
  async function run(work:()=>Promise<void>){setBusy(true);setError('');try{await work();}catch(e){setError(explain(e));}finally{setBusy(false);}}
  async function refresh(){setData(await auth.request<SettingsData>(workspace+'/settings',undefined,'GET'));}
  async function exportData(){
    const value=await auth.request<object>(workspace+'/export',{});
    const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'}));
    const anchor=document.createElement('a');anchor.href=url;anchor.download='reeklaim-account.json';anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function preference(key:keyof Prefs,checked:boolean){if(data)setData({...data,preferences:{...data.preferences,[key]:checked}});}
  return <div className="rk-stack">
    {error&&<p className="notice error" role="alert">{error}</p>}
    <form className="item-panel market-form" onSubmit={e=>{e.preventDefault();void run(async()=>{await auth.request('/api/account/profile',{displayName:name});await auth.refresh();toast('Profile saved.');});}}><h2>Profile</h2><p className="break-text">{auth.user?.walletAddress}</p><Field label="Display name" value={name} required maxLength={60} onChange={e=>setName(e.target.value)}/><Button type="submit" disabled={busy}>Save display name</Button></form>
    <section className="item-panel"><h2>Appearance and privacy</h2><SelectField label="Theme" value={theme.preference} onChange={e=>theme.setPreference(e.target.value as ThemePreference)}><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></SelectField>
    {data?<><label className="rk-check"><input type="checkbox" checked={data.preferences.hide_balance} onChange={e=>preference('hide_balance',e.target.checked)}/> Hide balance on the personal overview</label>
      <label className="rk-check"><input type="checkbox" checked={data.preferences.notifications} onChange={e=>preference('notifications',e.target.checked)}/> Receive in-app notifications</label>
      <label className="rk-check"><input type="checkbox" checked={data.preferences.match_alerts} onChange={e=>preference('match_alerts',e.target.checked)}/> Notify me about possible matches</label>
      <Button disabled={busy} onClick={()=>void run(async()=>{await auth.request(workspace+'/settings',data.preferences);toast('Preferences saved.');})}>Save preferences</Button></>:<p role="status">Loading preferences…</p>}</section>
    <section className="item-panel"><h2>Active sessions</h2><ul className="rk-sessions">{data?.sessions.map(session=><li key={session.id}>{session.current?'Current session':date(session.created_at)} · Expires {date(session.expires_at)} {!session.current&&<Button variant="secondary" disabled={busy} onClick={()=>void run(async()=>{await auth.request(workspace+'/sessions/revoke',{id:session.id});await refresh();})}>Revoke</Button>}</li>)}</ul>
      <div className="actions"><Button variant="secondary" disabled={busy||!data?.sessions.some(session=>!session.current)} onClick={()=>void run(async()=>{await auth.request(workspace+'/sessions/revoke',{id:'others'});await refresh();})}>Revoke other sessions</Button><Button variant="secondary" onClick={()=>void run(auth.logout)}>Log out this session</Button></div></section>
    <section className="item-panel"><h2>Account data</h2><p>Export your profile, items, reports and account activity as JSON. Download private files individually from the evidence vault.</p><Button disabled={busy} variant="secondary" onClick={()=>void run(exportData)}>Export account data</Button>
      <p>Deletion requests are reviewed by the operator. Shared recovery records may need to be retained. Blockchain commitments and transactions cannot be erased.</p>
      {data?.deletion?<p role="status">Deletion requested {date(data.deletion)}.</p>:<form className="market-form" onSubmit={(e:FormEvent)=>{e.preventDefault();void run(async()=>{await auth.request(workspace+'/deletion',{confirm});await refresh();});}}><Field label="Type REQUEST DELETION to confirm" value={confirm} onChange={e=>setConfirm(e.target.value)}/><Button disabled={busy||confirm!=='REQUEST DELETION'} type="submit">Request account deletion</Button></form>}
    </section>
  </div>;
}
