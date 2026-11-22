import { createContext,useCallback,useContext,useEffect,useRef,useState,type ReactNode } from 'react';
import { z } from '../lib/browserValidation.ts';
import { useWallet } from '../wallet/WalletProvider.tsx';
const userSchema=z.object({id:z.string().uuid(),walletAddress:z.string(),displayName:z.string().nullable(),onboardedAt:z.string().nullable(),createdAt:z.string(),expiresAt:z.string()});
export type AuthUser=z.infer<typeof userSchema>;
export type ChallengeView={id:string;address:string;chainId:'qorechain-diana';origin:string;memo:string;amountUqor:'1';issuedAt:string;expiresAt:string;candidateHash:string|null};
type State={user:AuthUser|null;csrf:string;available:boolean;loading:boolean;error:string;pending:ChallengeView|null};
type Context=State&{bound:boolean;refresh:()=>Promise<void>;logout:()=>Promise<void>;request:<T>(path:string,body?:unknown,method?:string)=>Promise<T>};
const unavailable=async()=>{throw new Error('Secure authentication provider is unavailable.');};
const AuthContext=createContext<Context>({user:null,csrf:'',available:false,loading:false,error:'',pending:null,bound:false,refresh:async()=>{},logout:async()=>{},request:unavailable});
export function AuthProvider({children}:{children:ReactNode}){
 const wallet=useWallet();const [state,setState]=useState<State>({user:null,csrf:'',available:false,loading:true,error:'',pending:null});const lastDisconnect=useRef(wallet.disconnectVersion);const revoking=useRef(false);
 const refresh=useCallback(async()=>{try{const response=await fetch('/api/auth/session',{credentials:'same-origin',cache:'no-store'});const data=await response.json().catch(()=>null);if(!data)throw new Error('The sign-in service did not respond. Open the configured ReeKlaim address and retry.');if(!response.ok)throw new Error(data.error??'Secure sign-in unavailable.');const user=data.authenticated?userSchema.parse(data.user):null;setState({user,csrf:z.string().parse(data.csrf),available:true,loading:false,error:'',pending:data.pending??null});}catch(error){setState({user:null,csrf:'',available:false,loading:false,error:error instanceof Error?error.message:'Secure sign-in unavailable.',pending:null});}},[]);
 useEffect(()=>{void refresh();},[refresh]);
 const restoredAccount = useRef<string | null>(null);
 useEffect(() => {
  const address = state.user?.walletAddress ?? null;
  if (!address) { restoredAccount.current = null; return; }
  if (wallet.account) { restoredAccount.current = address; return; }
  if (wallet.busy || !wallet.installed || restoredAccount.current === address) return;
  try { if (sessionStorage.getItem('rk-wallet-connected') !== 'yes') return; } catch { return; }
  restoredAccount.current = address;
  void wallet.refresh();
 }, [state.user?.walletAddress, wallet.account, wallet.busy, wallet.installed, wallet.refresh]);
 const request=useCallback(async<T,>(path:string,body?:unknown,method='POST'):Promise<T>=>{if(!path.startsWith('/api/'))throw new Error('Only same-origin application requests are allowed.');const response=await fetch(path,{method,credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json','X-CSRF-Token':state.csrf},...(body!==undefined?{body:JSON.stringify(body)}:{})});const value=await response.json();if(!response.ok){if(response.status===401)await refresh();throw new Error(value.error??'Secure request failed.');}return value as T;},[state.csrf,refresh]);
 const logout=useCallback(async()=>{if(state.csrf)await request('/api/auth/logout');setState(old=>({...old,user:null,csrf:'',loading:true,pending:null}));await refresh();},[state.csrf,request,refresh]);
 const bound=!!state.user&&!!wallet.account&&state.user.walletAddress===wallet.account.address&&!wallet.busy&&!revoking.current;
 useEffect(()=>{
  const disconnected=lastDisconnect.current!==wallet.disconnectVersion;
  lastDisconnect.current=wallet.disconnectVersion;
  if(!state.user)return;
  if(disconnected||(wallet.account&&wallet.account.address!==state.user.walletAddress)){
   if(revoking.current)return;revoking.current=true;void logout().catch(()=>setState(old=>({...old,user:null,error:'Session revocation could not be confirmed. Retry logout before continuing.',loading:false}))).finally(()=>{revoking.current=false;});
  }
 },[wallet.account?.address,wallet.disconnectVersion,state.user,logout]);
 useEffect(()=>{if(!state.user)return;const check=()=>{if(document.visibilityState==='visible')void refresh();};const interval=window.setInterval(check,60000);window.addEventListener('focus',check);return()=>{clearInterval(interval);window.removeEventListener('focus',check);};},[state.user?.id,refresh]);
 return <AuthContext.Provider value={{...state,bound,refresh,logout,request}}>{children}</AuthContext.Provider>;
}
export function useAuth(){return useContext(AuthContext);}
