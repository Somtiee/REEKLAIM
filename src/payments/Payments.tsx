import {useEffect,useState,type FormEvent} from 'react';
import {useAuth} from '../auth/AuthProvider.tsx';
import {useRoute} from '../ui/Router.tsx';
import {Badge,Field,EmptyState} from '../ui/primitives.tsx';
import {Button} from '../components/Button.tsx';
import {displayQor,rewardQuote,type PaymentView} from './domain.ts';

const api='/api/payments';
type History={operations:PaymentView[];registrations:{id:string;state:string;recipient:string;payer:string;amount:string;at:string;hash:string|null;height:string|null}[];
 authentication:{hash:string;height:string;at:string}[];collectionEnabled:boolean;atomicRewardsEnabled:boolean};
const label=(purpose:string)=>purpose==='reward'?'Finder reward':'Ownership transfer';
const explorer=(hash:string)=>'https://explore.qore.network/tx/'+hash;
function ChainReceipt({hash,height}:{hash:string|null;height:string|null}){
  return hash?<p>Verified Diana receipt · Block {height??'unavailable'}<br/><a href={explorer(hash)} target="_blank" rel="noreferrer">View transaction on explorer (select Testnet)</a><br/><code style={{overflowWrap:'anywhere'}}>{hash}</code></p>:null;
}
export function PaymentsWorkspace(){
  const auth=useAuth();
  const {location}=useRoute();
  const search=new URLSearchParams(location.search);
  const item=search.get('item'), claim=search.get('claim');
  const [history,setHistory]=useState<History|null>(null);
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  const [recipient,setRecipient]=useState('');
  const [reward,setReward]=useState('5000000');
  useEffect(()=>{
    let active=true;
    void auth.request<History>(api,undefined,'GET').then(result=>{if(active)setHistory(result);}).catch(e=>{if(active)setError(e.message);});
    return()=>{active=false;};
  },[auth.request]);
  const refresh=async()=>setHistory(await auth.request<History>(api,undefined,'GET'));
  async function create(e:FormEvent){
    e.preventDefault();setBusy(true);setError('');
    try{await auth.request(api,item?{purpose:'transfer',item,recipient:recipient.trim()}:{purpose:'reward',claim,amount:reward});await refresh();}
    catch(e){setError(e instanceof Error?e.message:'Payment preparation failed.');}finally{setBusy(false);}
  }
  let quote;
  try{quote=rewardQuote(reward);}catch{/* Invalid amount stays disabled. */}
  return <div className="claim-workspace">
    <div><Badge tone="warning">Diana testnet only</Badge><h2>Payments and transaction history</h2><p>All amounts are test QOR. Gas and possible first-use costs are separate and shown by QoreX.</p></div>
    {error&&<p role="alert" className="notice error">{error}</p>}
    {!history&&!error&&<p role="status">Loading private transaction history…</p>}
    {history&&!history.collectionEnabled&&<p role="status">Collection is disabled until the operator verifies the Diana treasury configuration.</p>}
    {history&&!history.atomicRewardsEnabled&&<p>Combined reward and fee payments await live atomic QoreX verification. Reward declarations remain voluntary and funds are not held.</p>}
    {(item||claim)&&<form className="item-panel market-form" onSubmit={e=>void create(e)}><h3>{item?'Offer a transfer':'Prepare a voluntary finder reward'}</h3>
      {item?<><Field label="Recipient’s verified QoreX Diana address" required value={recipient} onChange={e=>setRecipient(e.target.value)}/><p>The other account must accept before you can prepare the 0.05 test QOR transfer fee. Private evidence stays with the previous owner and old QR tags are revoked on finalization.</p></>:<>
        <Field label="Finder reward in uqor" required inputMode="numeric" pattern="[1-9][0-9]{0,8}" value={reward} onChange={e=>setReward(e.target.value)}/>
        {quote&&<p>Finder: {displayQor(quote.reward)} test QOR · Fee: {displayQor(quote.fee)} test QOR · Total: {displayQor(quote.total)} test QOR before gas.</p>}
      </>}
      <Button type="submit" disabled={busy||!history?.collectionEnabled||(!item&&(!quote||(quote.fee!=='0'&&!history.atomicRewardsEnabled)))}>{item?'Create transfer offer':'Create reward intent'}</Button>
    </form>}
    {history?.operations.map(operation=><Checkout key={operation.id} operation={operation} refresh={refresh} collectionEnabled={history.collectionEnabled}/>)}
    {history&&!history.operations.length&&!history.registrations.length&&!history.authentication.length&&<EmptyState title="No transactions yet">Registration fees, approved transfers and finder rewards appear here.</EmptyState>}
    {history?.registrations.map(row=><section className="item-panel" key={row.id}><h3>Item registration</h3><Badge>{row.state}</Badge><p>{displayQor(row.amount)} test QOR · {new Date(row.at).toLocaleString()}</p><ChainReceipt hash={row.hash} height={row.height}/></section>)}
    {history?.authentication.map(row=><section className="item-panel" key={row.hash}><h3>Wallet sign-in</h3><p>0 test QOR application fee · 1 uqor self-send · {new Date(row.at).toLocaleString()}</p><ChainReceipt hash={row.hash} height={row.height}/></section>)}
  </div>;
}
function Checkout({operation:p,refresh,collectionEnabled}:{operation:PaymentView;refresh:()=>Promise<void>;collectionEnabled:boolean}){
  const auth=useAuth();
  const [agree,setAgree]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const storageKey='rk:payment-hash:'+p.id;
  const [hash,setHash]=useState(p.candidate_hash??sessionStorage.getItem(storageKey)??'');
  const effectiveHash=p.candidate_hash??hash;
  const total=p.sends.reduce((sum,send)=>sum+BigInt(send.amount),0n).toString();
  async function action(name:string){
    setBusy(true);setError('');
    try{
      if(name==='send'){
        const wallet=await import('./wallet.ts');
        const candidate=await wallet.approvePayment(p,agree,()=>auth.request(api+'/'+p.id+'/approval'));
        setHash(candidate);
        sessionStorage.setItem(storageKey,candidate);
        await auth.request(api+'/'+p.id+'/verify',{hash:candidate});
      }else await auth.request(api+'/'+p.id+'/'+name,name==='verify'?{hash:effectiveHash.trim()}:undefined);
    }catch(e){setError(e instanceof Error?e.message:'Payment unavailable. Check QoreX history before attempting a new payment.');}
    finally{try{await refresh();}catch{/* Preserve the candidate hash and the preceding error. */}setBusy(false);}
  }
  const actionable=p.state==='pending'&&p.canPay;
  return <section className="item-panel"><div className="actions"><Badge tone={p.state==='confirmed'?'success':'warning'}>{p.state}</Badge><span>{new Date(p.created_at).toLocaleString()}</span></div>
    <h3>{label(p.purpose)}</h3><p><strong>Payer</strong> {p.payer}<br/><strong>{p.purpose==='reward'?'Finder':'Intended new owner'}</strong> {p.recipient}<br/><strong>Treasury</strong> {p.treasury}</p>
    <ul>{p.sends.map(send=><li key={send.recipient}>{send.recipient===p.treasury?'Platform fee':'Finder reward'}: {displayQor(send.amount)} test QOR</li>)}</ul>
    <p><strong>Total</strong> {displayQor(total)} test QOR. Gas estimate: shown in the QoreX prompt. No app-side estimate is available.</p>
    {p.memo&&<p><strong>Transaction memo</strong> <code>{p.memo}</code></p>}
    {p.expires_at&&<p>Signing window ends {new Date(p.expires_at).toLocaleString()}. A previously sent hash can still be reconciled.</p>}
    {p.canAccept&&p.state==='offered'&&<Button disabled={busy} onClick={()=>void action('accept')}>Accept transfer as recipient</Button>}
    {p.canPay&&p.state==='accepted'&&<Button disabled={busy||!collectionEnabled} onClick={()=>void action('prepare')}>Prepare Diana payment</Button>}
    {p.canPay&&p.purpose==='transfer'&&['offered','accepted','pending'].includes(p.state)&&!p.approval_started&&!p.candidate_hash&&<Button variant="secondary" disabled={busy} onClick={()=>void action('cancel')}>Cancel transfer</Button>}
    {actionable&&!p.approval_started&&!p.candidate_hash&&<div><label><input type="checkbox" checked={agree} onChange={e=>setAgree(e.target.checked)}/> I reviewed the exact testnet payment and separate gas costs.</label><Button disabled={busy||!agree||!collectionEnabled} onClick={()=>void action('send')}>Review and approve in QoreX</Button></div>}
    {actionable&&p.approval_started&&<div><p>If QoreX was interrupted, look up the original hash in wallet history. This intent cannot open another approval.</p><Field label="Existing Diana transaction hash" value={effectiveHash} disabled={!!p.candidate_hash} onChange={e=>setHash(e.target.value)}/><Button variant="secondary" disabled={busy||!(/^[0-9a-f]{64}$/i.test(effectiveHash.trim()))} onClick={()=>void action('verify')}>Verify existing hash</Button></div>}
    {busy&&<p role="status">Waiting for wallet approval or server verification…</p>}
    {error&&<p role="alert" className="notice error">{error}</p>}
    <ChainReceipt hash={p.receipt_hash} height={p.height}/>
  </section>;
}
