import {useEffect,useState,type FormEvent} from 'react';
import {useAuth} from '../auth/AuthProvider.tsx';
import {Link,useRoute} from '../ui/Router.tsx';
import {Badge,Field,SelectField,EmptyState,useToast} from '../ui/primitives.tsx';
import {Button} from '../components/Button.tsx';
import {workspace,explain} from './Workspace.tsx';

type Profile={name:string;kind:string;description:string};
type Org=Profile&{id:string;role:'owner'|'admin'|'staff'};
type Invite={id:string;org_name:string;role:string;expires_at:string};
type Inventory={id:string;title:string;notes:string;kind:string;status:string;version:number};
type OrganizationDetail={organization:Org;inventory:Inventory[];members:{account_id:string;role:string}[];
  invitations:Invite[];activity:{id:string;action:string;at:string}[];counts:{kind:string;status:string;total:number}[];actor:string};
const endpoint=workspace+'/organizations';
const kinds=['university','hotel','airport','transport','business','venue'];
const emptyProfile={name:'',kind:'business',description:''};
const roleName=(value:string)=>value==='admin'?'Manager':value==='owner'?'Owner':'Staff';

function ProfileForm({initial,working,label,save}:{initial:Profile;working:boolean;label:string;save:(profile:Profile)=>void}){
  const [profile,setProfile]=useState(initial);
  return <form className="item-panel market-form" onSubmit={e=>{e.preventDefault();save(profile);}}>
    <h2>{label}</h2><Field label="Organization name" required minLength={2} maxLength={100} value={profile.name} onChange={e=>setProfile({...profile,name:e.target.value})}/>
    <SelectField label="Organization type" value={profile.kind} onChange={e=>setProfile({...profile,kind:e.target.value})}>{kinds.map(kind=><option key={kind}>{kind}</option>)}</SelectField>
    <Field label="Organization description" maxLength={500} value={profile.description} onChange={e=>setProfile({...profile,description:e.target.value})}/>
    <Button type="submit" disabled={working}>Save organization profile</Button>
  </form>;
}
export function OrganizationsWorkspace(){
  const {location}=useRoute();
  const org=location.path.split('/')[3];
  return org?<Organization key={org} id={org}/>:<Hub/>;
}
function Hub(){
  const auth=useAuth();
  const {navigate}=useRoute();
  const [data,setData]=useState<{organizations:Org[];invitations:Invite[]}|null>(null);
  const [error,setError]=useState('');
  const [working,setWorking]=useState(false);
  useEffect(()=>{let active=true;void auth.request<NonNullable<typeof data>>(endpoint,undefined,'GET').then(result=>{if(active)setData(result);}).catch(e=>{if(active)setError(explain(e));});return()=>{active=false;};},[auth.request]);
  async function run(path:string,body?:Profile){
    setWorking(true);setError('');
    try{const result=await auth.request<{id:string}>(path,body);navigate('/app/organizations/'+result.id);}
    catch(e){setError(explain(e));}finally{setWorking(false);}
  }
  return <div className="rk-stack"><p>Organization workspaces are private and self-managed. Profiles have no institutional verification.</p>
    {error&&<p role="alert">{error}</p>}{!data&&!error&&<p role="status">Loading organizations…</p>}
    {data?.organizations.length===0&&<EmptyState title="No organization workspaces yet">Create one to track found property or accept an invitation from an existing team.</EmptyState>}
    <div className="market-grid">{data?.organizations.map(org=><article className="item-panel" key={org.id}><Badge>{roleName(org.role)}</Badge><h3>{org.name}</h3><p>{org.description}</p><Link className="button secondary" to={'/app/organizations/'+org.id}>Open workspace</Link></article>)}</div>
    <section className="item-panel"><h2>Invitations</h2>{!data?.invitations.length&&<p>No pending invitations.</p>}
    {data?.invitations.map(invite=><div className="actions" key={invite.id}><strong>{invite.org_name}</strong><span>{roleName(invite.role)}</span><Button disabled={working} onClick={()=>void run(endpoint+'/'+invite.id+'/accept')}>Accept invitation</Button></div>)}</section>
    <ProfileForm initial={emptyProfile} working={working} label="Create organization" save={value=>void run(endpoint,value)}/>
  </div>;
}
function Organization({id}:{id:string}){
  const auth=useAuth(),toast=useToast();
  const [detail,setDetail]=useState<OrganizationDetail|null>(null);
  const [error,setError]=useState('');
  const [working,setWorking]=useState(false);
  const [address,setAddress]=useState('');
  const [role,setRole]=useState('staff');
  const [kind,setKind]=useState('found');
  const [title,setTitle]=useState('');
  const [notes,setNotes]=useState('');
  const [asset,setAsset]=useState('');
  const [items,setItems]=useState<{id:string;name:string;status:string}[]>([]);
  const [search,setSearch]=useState('');
  const [record,setRecord]=useState<Inventory|null>(null);
  const [reviewNotes,setReviewNotes]=useState('');
  const path=endpoint+'/'+id;
  const manager=detail?.organization.role==='owner'||detail?.organization.role==='admin';
  useEffect(()=>{let active=true;void auth.request<OrganizationDetail>(path,undefined,'GET').then(data=>{if(active)setDetail(data);}).catch(e=>{if(active)setError(explain(e));});return()=>{active=false;};},[path,auth.request]);
  useEffect(()=>{if(!manager)return;let active=true;void auth.request<{items:typeof items}>('/api/items',undefined,'GET').then(data=>{if(active)setItems(data.items.filter(row=>['registered','returned'].includes(row.status)));}).catch(()=>{});return()=>{active=false;};},[manager,auth.request]);
  async function action(name:string,body:unknown,onSuccess?:()=>void){
    setWorking(true);setError('');
    try{await auth.request(path+'/'+name,body);setDetail(await auth.request<OrganizationDetail>(path,undefined,'GET'));onSuccess?.();toast('Workspace updated.');}
    catch(e){setError(explain(e));}finally{setWorking(false);}
  }
  function submit(e:FormEvent){e.preventDefault();void action('inventory',{title,notes,kind,registeredItem:kind==='asset'?asset:null},()=>{setTitle('');setNotes('');setAsset('');});}
  if(!detail)return <><Link to="/app/organizations">All organizations</Link><p role={error?'alert':'status'}>{error||'Loading private organization…'}</p></>;
  const org=detail.organization;
  const rows=detail.inventory.filter(row=>[row.title,row.kind,row.status].some(value=>value.toLowerCase().includes(search.toLowerCase())));
  const next:Record<string,string[]>={held:['review','closed'],review:['approved','held','closed'],approved:['recovered','review'],recovered:['closed']};
  return <div className="rk-stack">
    <nav aria-label="Organization breadcrumb" className="rk-crumb"><Link to="/app/organizations">Organizations</Link><span aria-hidden="true">/</span><span>{org.name}</span></nav>
    <div className="item-panel"><Badge>Self-managed profile</Badge><h2>{org.name}</h2><p>{org.kind} · {roleName(org.role)}</p><p>{org.description}</p></div>
    {error&&<p role="alert" className="notice error">{error}</p>}
    <div className="rk-metrics">{detail.counts.map(row=><div className="rk-metric" key={row.kind+row.status}><strong>{row.total}</strong><span>{row.kind} · {row.status}</span></div>)}</div>
    <section className="item-panel"><h2>Found-property and asset inventory</h2><Field label="Search organization inventory" type="search" maxLength={80} value={search} onChange={e=>setSearch(e.target.value)}/>
      {!rows.length&&<p>No inventory entries match.</p>}
      <div className="rk-table" role="region" aria-label="Organization inventory table" tabIndex={0}><table><thead><tr><th>Item</th><th>Type</th><th>Status</th>{manager&&<th>Action</th>}</tr></thead><tbody>{rows.map(row=><tr key={row.id}><td><strong>{row.title}</strong>{row.notes&&<p>{row.notes}</p>}</td><td>{row.kind}</td><td>{row.status}</td>
        {manager&&<td>{row.status!=='closed'&&<Button variant="secondary" onClick={()=>{setRecord(row);setReviewNotes(row.notes);}}>Review</Button>}</td>}</tr>)}</tbody></table></div>
      {record&&manager&&<div className="market-form"><h3>Review {record.title}</h3><p>Record claimant verification and safe handover instructions internally. Do not include identity documents or home addresses.</p><Field label="Internal claim or handover notes" maxLength={800} value={reviewNotes} onChange={e=>setReviewNotes(e.target.value)}/>
        <div className="actions">{(record.kind==='asset'?['closed']:next[record.status]??[]).map(status=><Button key={status} disabled={working} onClick={()=>void action('review',{inventory:record.id,version:record.version,status,notes:reviewNotes},()=>setRecord(null))}>{status==='review'?'Start claim review':status==='approved'?'Approve for handover':status==='recovered'?'Record return':status==='held'?'Return to held':'Close record'}</Button>)}<Button variant="secondary" onClick={()=>setRecord(null)}>Cancel</Button></div></div>}
    </section>
    <form className="item-panel market-form" onSubmit={submit}><h2>Add inventory</h2>
      {manager&&<SelectField label="Inventory type" value={kind} onChange={e=>setKind(e.target.value)}><option value="found">Found property</option><option value="asset">Linked registered asset</option></SelectField>}
      {kind==='asset'&&<SelectField label="Your registered item" required value={asset} onChange={e=>setAsset(e.target.value)}><option value="">Select item</option>{items.map(row=><option key={row.id} value={row.id}>{row.name}</option>)}</SelectField>}
      <Field label="Inventory title" required minLength={2} maxLength={100} value={title} onChange={e=>setTitle(e.target.value)}/><Field label="Internal notes" maxLength={800} value={notes} onChange={e=>setNotes(e.target.value)}/><Button type="submit" disabled={working}>Add inventory record</Button>
    </form>
    <section className="item-panel"><h2>Members</h2><ul className="rk-sessions">{detail.members.map(member=><li key={member.account_id}><span>{member.account_id===detail.actor?'You':member.account_id.slice(0,8)} · {roleName(member.role)}</span>{org.role==='owner'&&member.role!=='owner'&&<div className="actions"><Button variant="secondary" disabled={working} onClick={()=>void action('member',{account:member.account_id,role:member.role==='staff'?'admin':'staff'})}>{member.role==='staff'?'Make manager':'Make staff'}</Button><Button variant="secondary" disabled={working} onClick={()=>void action('member',{account:member.account_id,role:'remove'})}>Remove</Button></div>}</li>)}</ul></section>
    {manager&&<><form className="item-panel market-form" onSubmit={e=>{e.preventDefault();void action('invite',{address:address.trim(),role},()=>setAddress(''));}}><h2>Invite a member</h2><Field label="Verified Diana wallet address" required maxLength={90} value={address} onChange={e=>setAddress(e.target.value)}/>
      {org.role==='owner'&&<SelectField label="Invitation role" value={role} onChange={e=>setRole(e.target.value)}><option value="staff">Staff</option><option value="admin">Manager</option></SelectField>}<Button type="submit" disabled={working}>Create invitation</Button></form>
      {detail.invitations.length>0&&<section className="item-panel"><h2>Pending invitations</h2><ul className="rk-sessions">{detail.invitations.map(i=><li key={i.id}>{roleName(i.role)} · Expires {new Date(i.expires_at).toLocaleDateString()} {(org.role==='owner'||i.role==='staff')&&<Button variant="secondary" disabled={working} onClick={()=>void action('revoke',{invite:i.id})}>Revoke invitation</Button>}</li>)}</ul></section>}
      <ProfileForm key={org.name+org.description+org.kind} initial={{name:org.name,kind:org.kind,description:org.description}} working={working} label="Edit organization profile" save={value=>void action('profile',value)}/></>}
    <section className="item-panel"><h2>Workspace activity</h2><ul className="rk-sessions">{detail.activity.map(event=><li key={event.id}>{event.action.replace('.',' ')} <time dateTime={event.at}>{new Date(event.at).toLocaleString()}</time></li>)}</ul></section>
  </div>;
}
