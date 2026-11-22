import {useEffect,useState,type FormEvent} from 'react';
import {useAuth} from '../auth/AuthProvider.tsx';
import {Link,useRoute} from '../ui/Router.tsx';
import {Badge,Dialog,EmptyState,Field,SelectField} from '../ui/primitives.tsx';
import {Button} from '../components/Button.tsx';
import type {MatchFields} from './matching.ts';
import './claims.css';

type Match={lost:MatchFields;found:MatchFields;score:number;reasons:string[]};
type Summary={id:string;state:string;version:number;updated_at:string;reviewer:boolean;recent_updates:number};
type Detail=Summary&{
  role:'reviewer'|'claimant';verification:'none'|'unavailable'|'confirmed';serialAgrees:boolean|null;reward?:{state:string;tx_hash:string|null;height:string|null}|null;
  narrative:{relationship:string;explanation:string;distinguishing:string;serial:string;additional:string;lost:MatchFields;found:MatchFields};
  files:{id:string;mime:string;bytes:number}[];
  events:{id:string;kind:string;at:string;author:string;text:string|null}[];
};
const root='/api/claims';
const friendly=(text:string)=>text.replaceAll('_',' ').replace(/^./,first=>first.toUpperCase());
const errorText=(error:unknown)=>error instanceof Error?error.message:'Could not complete the request.';
const terminal=['rejected','withdrawn','resolved','disputed'];
function Listing({entry,label}:{entry:MatchFields;label:string}){
  return <section className="item-panel claim-listing"><Badge>{label}</Badge><h3>{entry.title}</h3><p>{entry.description}</p>
    <p>{[entry.brand,entry.model,entry.colour].filter(Boolean).join(' · ')}</p><p>{entry.city}, {entry.country} · {entry.occurred_on}</p></section>;
}
async function upload(files:File[],csrf:string){
  const ids:string[]=[];
  for(const file of files){
    const response=await fetch('/api/private/evidence',{method:'POST',headers:{'Content-Type':file.type,'X-CSRF-Token':csrf},body:file});
    const result=await response.json();
    if(!response.ok)throw new Error(result.error??'Private upload failed.');
    ids.push(result.id);
  }
  return ids;
}
export function ClaimsWorkspace({recoveryOnly=false}:{recoveryOnly?:boolean}){
  const {location}=useRoute();
  const auth=useAuth();
  const route=location.path.split('/')[3];
  return <div className="claim-workspace" key={auth.user?.id}>
    <nav aria-label="Claims navigation" className="actions"><Link className="button secondary" to="/app/claims">Claims inbox</Link><Link className="button secondary" to="/app/claims/matches">Possible matches</Link></nav>
    {route==='matches'?<Matches/>:route==='new'?<Submission/>:route?<ClaimDetail key={route} id={route}/>:<Inbox recoveryOnly={recoveryOnly}/>}
  </div>;
}
function Inbox({recoveryOnly}:{recoveryOnly:boolean}){
  const {request}=useAuth();
  const [rows,setRows]=useState<Summary[]|null>(null);
  const [error,setError]=useState('');
  useEffect(()=>{let active=true;void request<{claims:Summary[]}>(root,undefined,'GET').then(data=>{if(active)setRows(data.claims);}).catch(e=>{if(active)setError(errorText(e));});return()=>{active=false;};},[request]);
  const visible=rows?.filter(row=>!recoveryOnly||['approved','recovery_in_progress','resolved','disputed'].includes(row.state));
  return <><h2>{recoveryOnly?'Recovery cases':'Claims inbox'}</h2><p>{recoveryOnly?'Review active coordination and confirmed returns.':'Review requests for items you found and track claims you submitted.'}</p>{error&&<p role="alert">{error}</p>}
    {!rows&&!error&&<p role="status">Loading private claims…</p>}
    {visible?.length===0&&<EmptyState title="No claims yet">Open possible matches or start a claim from a found report.</EmptyState>}
    {visible&&(['Finders’ inbox','Your submitted claims'] as const).map((title,index)=><section key={title}><h3>{title}</h3><div className="market-grid">{visible.filter(row=>row.reviewer===(index===0)).map(row=><article key={row.id} className="item-panel">
      <Badge>{friendly(row.state)}</Badge><p>Updated {new Date(row.updated_at).toLocaleDateString()}</p>{row.recent_updates>0&&<p>{row.recent_updates} participant updates in the last seven days</p>}<Link className="text-link" to={'/app/claims/'+row.id}>Open private claim</Link>
    </article>)}</div></section>)}
  </>;
}
function Matches(){
  const {request}=useAuth();
  const [matches,setMatches]=useState<Match[]|null>(null);
  const [compare,setCompare]=useState<Match|null>(null);
  const [error,setError]=useState('');
  const [reload,setReload]=useState(0);
  useEffect(()=>{let active=true;void request<{matches:Match[]}>(root+'/matches',undefined,'GET').then(data=>{if(active)setMatches(data.matches);}).catch(e=>{if(active)setError(errorText(e));});return()=>{active=false;};},[request,reload]);
  async function dismiss(entry:Match){
    try{await request(root+'/dismiss',{lost:entry.lost.id,found:entry.found.id});setMatches(rows=>rows?.filter(row=>row!==entry)??[]);setCompare(null);}
    catch(e){setError(errorText(e));}
  }
  return <><h2>Possible matches</h2><p>Suggestions compare your open lost reports with public found reports. Scores explain similarity and do not establish ownership.</p>
    {error&&<p role="alert">{error} <Button variant="secondary" onClick={()=>{setError('');setReload(reload+1);}}>Retry</Button></p>}
    {!matches&&!error&&<p role="status">Checking compatible reports…</p>}
    {matches?.length===0&&<EmptyState title="No suggestions yet">Keep your public brand, model and description current. <Link to="/reports/lost">Manage lost reports</Link>.</EmptyState>}
    <div className="market-grid">{matches?.map(entry=><article className="item-panel" key={entry.lost.id+entry.found.id}><Badge tone="info">{entry.score}/100 · {entry.score>=75?'strong':'possible'} similarity</Badge><h3>{entry.found.title}</h3><p>Compared with {entry.lost.title}</p><p>{entry.reasons.join(' · ')}</p><div className="actions"><Button onClick={()=>setCompare(entry)}>Compare reports</Button><Button variant="secondary" onClick={()=>void dismiss(entry)}>Dismiss</Button></div></article>)}</div>
    <Dialog open={!!compare} title="Compare reports" onClose={()=>setCompare(null)}>{compare&&<><div className="claim-columns"><Listing label="Your lost report" entry={compare.lost}/><Listing label="Public found report" entry={compare.found}/></div><p>{compare.reasons.join(' · ')}</p><Link className="button primary" to={'/app/claims/new?lost='+compare.lost.id+'&found='+compare.found.id}>Start private claim</Link></>}</Dialog>
  </>;
}
function Submission(){
  const auth=useAuth();
  const {location,navigate}=useRoute();
  const query=new URLSearchParams(location.search);
  const found=query.get('found')??'';
  const [lost,setLost]=useState(query.get('lost')??'');
  const [options,setOptions]=useState<{id:string;title:string}[]>([]);
  const [step,setStep]=useState(1);
  const [fields,setFields]=useState({relationship:'owner',explanation:'',distinguishing:'',serial:'',additional:''});
  const [files,setFiles]=useState<File[]>([]);
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  useEffect(()=>{let active=true;void auth.request<{items:{id:string;title:string;kind:string;status:string}[]}>('/api/market/mine',undefined,'GET').then(data=>{if(active)setOptions(data.items.filter(row=>row.kind==='lost'&&row.status==='open'));}).catch(e=>{if(active)setError(errorText(e));});return()=>{active=false;};},[auth.request]);
  async function submit(event:FormEvent){
    event.preventDefault();
    if(step===1){setStep(2);return;}
    setBusy(true);setError('');
    try{
      const attachments=await upload(files,auth.csrf);
      const result=await auth.request<{id:string}>(root,{...fields,lost,found,files:attachments});
      navigate('/app/claims/'+result.id);
    }catch(e){setError(errorText(e));}finally{setBusy(false);}
  }
  return <section className="item-panel"><h2>Start a private claim</h2><p>Step {step} of 2. The finder can review the information you share here. Keep unrelated information and wallet secrets out of your claim.</p>
    {!found?<p>Choose an open found report from the <Link to="/explore">directory</Link>.</p>:<form className="market-form" onSubmit={e=>void submit(e)}>
    {step===1?<><SelectField label="Your published lost report" required value={lost} onChange={e=>setLost(e.target.value)}><option value="">Choose report</option>{options.map(o=><option key={o.id} value={o.id}>{o.title}</option>)}</SelectField><Link to="/reports/lost">Create a lost report</Link>
    <SelectField label="Relationship to item" value={fields.relationship} onChange={e=>setFields({...fields,relationship:e.target.value})}><option value="owner">Owner</option><option value="authorized_representative">Authorized representative</option></SelectField>
    <label className="field">Ownership explanation<textarea required minLength={20} maxLength={1000} value={fields.explanation} onChange={e=>setFields({...fields,explanation:e.target.value})}/></label>
    <label className="field">Private distinguishing characteristics<textarea required minLength={10} maxLength={700} value={fields.distinguishing} onChange={e=>setFields({...fields,distinguishing:e.target.value})}/></label>
    <Button type="submit">Continue to evidence</Button></>:<>
    <Field label="Private serial number (optional)" value={fields.serial} maxLength={100} onChange={e=>setFields({...fields,serial:e.target.value})}/>
    <Field label="Additional identifying details (optional)" value={fields.additional} maxLength={500} onChange={e=>setFields({...fields,additional:e.target.value})}/>
    <Field label="Proof of purchase or private photos (up to three)" type="file" multiple accept="image/png,image/jpeg,image/webp,text/plain" onChange={e=>setFiles(Array.from(e.target.files??[]))}/>
    <p>Accepted formats are PNG, JPEG, WebP and plain text up to 4 MiB each. Submitting shares these files with the finder assigned to this claim.</p>
    <div className="actions"><Button variant="secondary" disabled={busy} onClick={()=>setStep(1)}>Back</Button><Button type="submit" disabled={busy||files.length>3}>{busy?'Submitting…':'Submit private claim'}</Button></div></>}
    {error&&<p role="alert">{error}</p>}</form>}
  </section>;
}
function ClaimDetail({id}:{id:string}){
  const auth=useAuth();
  const [detail,setDetail]=useState<Detail|null>(null);
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  const [text,setText]=useState('');
  const [files,setFiles]=useState<File[]>([]);
  const [view,setView]=useState<{url:string;mime:string}|null>(null);
  useEffect(()=>{let active=true;void auth.request<Detail>(root+'/'+id,undefined,'GET').then(data=>{if(active)setDetail(data);}).catch(e=>{if(active)setError(errorText(e));});return()=>{active=false;};},[auth.request,id]);
  async function run(action:string){
    if(!detail)return;
    setBusy(true);setError('');
    try{
      const attachments=action==='attach'?await upload(files,auth.csrf):[];
      await auth.request(root+'/'+id+'/actions',{action,version:detail.version,text,files:attachments});
      setText('');setFiles([]);setDetail(await auth.request<Detail>(root+'/'+id,undefined,'GET'));
    }catch(e){setError(errorText(e));try{setDetail(await auth.request<Detail>(root+'/'+id,undefined,'GET'));}catch{/* Keep the original error. */}}
    finally{setBusy(false);}
  }
  async function viewFile(file:Detail['files'][number]){
    try{const link=await auth.request<{url:string}>(root+'/'+id+'/files/'+file.id+'/link');setView({...link,mime:file.mime});}
    catch(e){setError(errorText(e));}
  }
  if(!detail)return error?<p role="alert">{error}</p>:<p role="status">Loading private claim…</p>;
  const reviewable=['submitted','under_review','more_information'].includes(detail.state);
  const review=detail.role==='reviewer';
  const actions:[string,string][]=[];
  if(review&&reviewable){
    if(detail.state==='submitted')actions.push(['review','Begin review']);
    if(detail.state!=='more_information')actions.push(['request','Request more evidence']);
    actions.push(['approve','Approve for coordination'],['reject','Reject claim']);
  }
  if(!review&&reviewable)actions.push(['withdraw','Withdraw claim']);
  if(!review&&detail.state==='more_information')actions.push(['attach','Send additional evidence']);
  if(detail.state==='approved')actions.push(['start','Start recovery coordination']);
  if(['approved','recovery_in_progress'].includes(detail.state))actions.push(['dispute','Request moderator review']);
  if(detail.state==='recovery_in_progress'&&!detail.events.slice(detail.events.map(event=>event.kind).lastIndexOf('moderator_resume')+1).some(event=>event.kind==='return_confirmed'&&event.author==='You'))actions.push(['resolve','Confirm item returned']);
  if(!terminal.includes(detail.state))actions.push(['message','Send private message']);
  actions.push(['abuse','Report abuse privately']);
  const {narrative}=detail;
  return <>
    <div className="actions"><Badge>{friendly(detail.state)}</Badge><Badge tone="info">{review?'Finder / reviewer':'Claimant'}</Badge></div>
    <h2>{narrative.found.title}</h2>{detail.reward&&<p>Finder reward: {friendly(detail.reward.state)} {detail.reward.tx_hash&&<a href={'https://explore.qore.network/tx/'+detail.reward.tx_hash} target="_blank" rel="noreferrer">View verified Diana receipt</a>}</p>}{detail.state==='resolved'&&<div className="actions">{!review&&<Link className="button secondary" to={'/app/transactions?claim='+id}>Prepare voluntary finder reward</Link>}<Link className="text-link" to="/app/transactions">View transaction history</Link></div>}
    <div className="claim-columns"><Listing entry={narrative.lost} label="Lost report at submission"/><Listing entry={narrative.found} label="Found report at submission"/></div>
    <div className="claim-columns">
      <section className="item-panel"><h3>Ownership evidence</h3><p>{friendly(narrative.relationship)}</p><p>{narrative.explanation}</p><p><strong>Distinguishing details</strong> {narrative.distinguishing}</p>{narrative.serial&&<p><strong>Submitted serial</strong> {narrative.serial}</p>}{narrative.additional&&<p>{narrative.additional}</p>}
      <Badge tone={detail.verification==='confirmed'?'success':'neutral'}>{detail.verification==='confirmed'?'Original Diana receipt independently verified':detail.verification==='unavailable'?'Original registration could not be reverified':'No verified prior registration for this claim'}</Badge>
      {detail.serialAgrees!==null&&<p>{detail.serialAgrees?'Submitted serial matches the original committed record.':'Submitted serial differs from the original committed record.'}</p>}
      <p>Registration establishes a wallet assertion at the time of the original payment. The finder must still evaluate factual ownership.</p>
      {detail.files.map((file,index)=><Button key={file.id} variant="secondary" onClick={()=>void viewFile(file)}>Open private file {index+1}</Button>)}</section>
      <section className="item-panel"><h3>Private coordination</h3><p>Suggest a staffed public hand-in point. Both participants must confirm return. Approval does not transfer ownership or funds.</p>
      <label className="field">Private message or reason<textarea maxLength={1000} value={text} onChange={e=>setText(e.target.value)}/></label>
      {!review&&detail.state==='more_information'&&<Field label="Additional private files" type="file" accept="image/png,image/jpeg,image/webp,text/plain" multiple onChange={e=>setFiles(Array.from(e.target.files??[]))}/>}
      <div className="actions">{actions.map(([action,label])=><Button key={action} variant={action==='approve'||action==='message'?'primary':'secondary'} disabled={busy||files.length>3||(['request','dispute','message','abuse'].includes(action)&&text.trim().length<5)} onClick={()=>void run(action)}>{label}</Button>)}</div>
      {error&&<p role="alert">{error}</p>}</section>
    </div>
    <section className="item-panel"><h3>Recovery timeline</h3><ol className="claim-timeline">{detail.events.map(event=><li key={event.id}><strong>{friendly(event.kind)}</strong> · {event.author} · <time dateTime={event.at}>{new Date(event.at).toLocaleString()}</time>{event.text&&<p>{event.text}</p>}</li>)}</ol></section>
    <Dialog open={!!view} title="Private evidence viewer" onClose={()=>setView(null)}>{view&&<>{view.mime==='image/png'&&<img className="claim-evidence" src={view.url} alt="Private claim attachment"/>}<a href={view.url} target="_blank" rel="noreferrer">Open authorized file</a><p>This link expires after one minute and requires your current session.</p></>}</Dialog>
  </>;
}
