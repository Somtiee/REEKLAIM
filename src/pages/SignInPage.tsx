import { useCallback,useEffect,useRef,useState } from 'react';
import { ArrowRight,Clock3 } from 'lucide-react';
import { useAuth,type ChallengeView } from '../auth/AuthProvider.tsx';
import { useWallet } from '../wallet/WalletProvider.tsx';
import { WalletStatus } from '../components/Layout.tsx';
import { Button } from '../components/Button.tsx';
import { Badge,Field } from '../ui/primitives.tsx';
import { Link,useRoute } from '../ui/Router.tsx';
function workspaceDestination(search:string){
 const requested=new URLSearchParams(search).get('returnTo');
 if(!requested?.startsWith('/')||requested.startsWith('//')||requested.includes('\\'))return '/app';
 const target=new URL(requested,window.location.origin);
 return target.origin===window.location.origin&&(target.pathname==='/app'||target.pathname.startsWith('/app/')||target.pathname==='/reports/lost'||target.pathname==='/reports/found')
  ? target.pathname+target.search : '/app';
}
export default function SignInPage({embedded=false}:{embedded?:boolean}={}){
 const auth=useAuth();const wallet=useWallet();const {navigate,location}=useRoute();const destination=embedded?'/app':workspaceDestination(location.search);const [challenge,setChallenge]=useState<ChallengeView|null>(null);const [consent,setConsent]=useState(false);const [busy,setBusy]=useState('');const [error,setError]=useState('');const [hash,setHash]=useState('');const [recoveryHash,setRecoveryHash]=useState('');const [displayName,setDisplayName]=useState('');const [now,setNow]=useState(Date.now());const [terms,setTerms]=useState(false);
 useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer);},[]);
 useEffect(()=>{if(auth.bound&&auth.user?.onboardedAt)navigate(destination);},[auth.bound,auth.user?.onboardedAt,destination,navigate]);
 const active=challenge?.address===wallet.account?.address?challenge:auth.pending?.address===wallet.account?.address?auth.pending:null;const txHash=hash||active?.candidateHash||'';const expired=!!active&&Date.parse(active.expiresAt)<=now;
 async function issue(){setError('');setBusy('Requesting a server challenge…');try{if(!wallet.account)throw new Error('Connect your fresh Diana testnet account first.');const next=await auth.request<ChallengeView>('/api/auth/challenge',{address:wallet.account.address});setChallenge(next);setHash('');setConsent(false);}catch(e){setError(e instanceof Error?e.message:'Challenge unavailable.');}finally{setBusy('');}}
 const attemptedReceipt=useRef('');
 const verify=useCallback(async (candidate:string)=>{
  if(!active)return;
  attemptedReceipt.current=active.id+':'+candidate;
  setError('');setBusy('Independently verifying the Diana receipt…');
  try{
   await auth.request('/api/auth/verify',{challengeId:active.id,hash:candidate});
   await auth.refresh();setChallenge(null);setHash('');
  }catch(e){setError(e instanceof Error?e.message:'Could not verify the receipt.');}
  finally{setBusy('');}
 },[active,auth.request,auth.refresh]);
 useEffect(()=>{
  const candidate=active?.candidateHash;
  if(auth.user||auth.loading||wallet.busy||!active||!candidate||attemptedReceipt.current===active.id+':'+candidate)return;
  void verify(candidate);
 },[active,auth.user,auth.loading,wallet.busy,verify]);
 async function approve(){if(!active)return;setBusy('Waiting for your approval in QoreX…');setError('');try{const {approveAuthentication}=await import('../auth/wallet.ts');const candidate=await approveAuthentication(active,consent);setHash(candidate);await verify(candidate);}catch(e){setError(e instanceof Error?e.message:'Sign-in not verified.');}finally{setBusy('');}}
 async function save(){setBusy('Saving your private profile…');setError('');try{await auth.request('/api/account/profile',{displayName,acceptTerms:terms});await auth.refresh();}catch(e){setError(e instanceof Error?e.message:'Profile unavailable.');}finally{setBusy('');}}
 return <section className={embedded?"auth-dialog-content":"container authentication-page"}>{!embedded&&<div className="auth-intro"><span className="eyebrow">A VERIFIED HELLO</span><h1>Your wallet.<br /><span>Your way in.</span></h1><p>Connect QoreX to access your ReeKlaim account on Diana testnet.</p></div>}
 <div className={embedded?"auth-dialog-card":"auth-card"}><Badge tone={auth.bound?'success':'violet'}>{auth.bound?'Authenticated account':'QoreX · Diana testnet'}</Badge>
 {auth.loading?<p role="status">Checking the secure session…</p>:auth.user?<><h2>{auth.bound?'A verified hello.':'Reconnect the same wallet.'}</h2><p>{auth.bound?'Your server session is authenticated. Choose a private display name to finish onboarding.':'A server session exists for this wallet. Reconnect it on Diana to reveal this account, or log out before switching.'}</p><p className="mono break">{auth.user.walletAddress}</p>{auth.bound&&auth.user.onboardedAt?<p role="status">Opening your dashboard…</p>:auth.bound?<><Field label="Private display name" hint="Use an alias. Never enter a recovery phrase or private key." value={displayName} maxLength={60} onChange={e=>setDisplayName(e.target.value)}/><label className="consent"><input type="checkbox" checked={terms} onChange={e=>setTerms(e.target.checked)}/><span>I accept the <Link to="/terms" target="_blank">ReeKlaim terms</Link>.</span></label><div className="actions"><Button disabled={!displayName.trim()||!terms||!!busy} onClick={()=>void save()}>Finish onboarding <ArrowRight size={16}/></Button>{auth.user.onboardedAt&&<Link to="/app" className="button secondary">Open account</Link>}</div></>:<WalletStatus/>}<Button variant="ghost" onClick={()=>void auth.logout().catch(e=>setError(e.message))}>Log out</Button></>:!auth.available?<><h2>Sign-in is unavailable</h2><p>{!auth.error&&'The sign-in service is temporarily unavailable.'}</p><Button variant="secondary" onClick={()=>void auth.refresh()}>Retry secure connection</Button></>:<><h2>{active?'Review before you approve.':'Start with your QoreX wallet.'}</h2>{!embedded&&<><p>Connecting shares a public address. It does not sign you in.</p><WalletStatus/>{wallet.account&&<p className="mono break">{wallet.account.address}</p>}</>}{embedded&&!active&&<p>Verify your connected wallet to open your ReeKlaim account.</p>}
 {!active||(expired&&!active.candidateHash)?<>{expired&&<p className="notice">This challenge expired. A previously submitted transaction will not be sent again automatically.</p>}<Button disabled={!wallet.account||wallet.busy||!!busy} onClick={()=>void issue()}>{expired?'Request a new challenge':embedded?'Review sign-in':'Request sign-in challenge'}<ArrowRight size={16}/></Button></>:<>{!txHash&&<p>Verify your wallet with a 1 uqor self-transfer. ReeKlaim charges no sign-in fee. Review network costs in QoreX.</p>}
 <details className="auth-recover"><summary>Transaction details</summary><dl className="auth-challenge"><dt>Wallet</dt><dd className="mono break">{active.address}</dd><dt>Origin</dt><dd>{active.origin}</dd><dt>Signing deadline</dt><dd>{new Date(active.expiresAt).toLocaleTimeString()}</dd><dt>Public memo</dt><dd className="mono break">{active.memo}</dd>{txHash&&<><dt>Transaction hash</dt><dd className="mono break">{txHash}</dd></>}</dl></details>
 {txHash?<><p className="notice">Transaction submitted.</p>{!busy&&attemptedReceipt.current===active.id+':'+txHash&&<Button disabled={!!busy} onClick={()=>{setError('');void verify(txHash).catch(e=>{setError(e.message);setBusy('');});}}>Retry receipt verification</Button>}{expired&&error&&<Button variant="ghost" disabled={!!busy} onClick={()=>void issue()}>Start a new sign-in request</Button>}</>:<><label className="consent"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/><span>I approve the testnet self-transfer and will review the network fee in QoreX.</span></label><Button disabled={!consent||!!busy||wallet.busy||wallet.account?.address!==active.address} onClick={()=>void approve()}>Request approval in QoreX <ArrowRight size={16}/></Button><details className="auth-recover"><summary>Already approved in QoreX? Recover verification.</summary><p>If the page was interrupted after approval, do not send again. Copy that authentication transaction hash from QoreX and verify it against this same browser-bound challenge.</p><Field label="Existing authentication transaction hash" value={recoveryHash} maxLength={64} onChange={e=>setRecoveryHash(e.target.value.trim())}/><Button variant="secondary" disabled={!/^[a-fA-F0-9]{64}$/.test(recoveryHash)||!!busy} onClick={()=>{const existing=recoveryHash.toUpperCase();setHash(existing);setError('');void verify(existing).catch(e=>{setError(e.message);setBusy('');});}}>Verify existing transaction</Button></details></>}
 </>}
 </>}
 {busy&&<div className="auth-progress" role="status"><Clock3 size={20}/>{busy}</div>}{(error||auth.error||(!wallet.account&&wallet.error))&&<p className="notice error" role="alert">{error||auth.error||wallet.error}</p>}<Link to="/help" className="text-link">Help & safety <ArrowRight size={15}/></Link></div></section>;
}
