import { test,expect,type Page } from '@playwright/test';
import { createQorexMock } from '@qorechain/qorex-wallet-mock';
import AxeBuilder from '@axe-core/playwright';
const root=(process.env.REEKLAIM_TEST_EVIDENCE ?? 'docs/evidence/phase8')+'/regression/regression/regression/auth';
async function fixture(page:Page,{reject=false,existing=false,pending=false,expired=false,holdVerification=false,stallConnection=false}={}){
 const mock=createQorexMock({profile:'current',allowMainnet:false});const address=mock.addresses().native;let authenticated=existing;let alias=existing?'Fixture account':null;let logoutCount=0;let verifications=0;
 let releaseVerification:()=>void=()=>{};const verificationGate=new Promise<void>(resolve=>{releaseVerification=resolve;});
 await page.addInitScript({content:mock.initScript()});await page.addInitScript(({reject})=>{Object.assign(window,{__authUiSendCount:0});window.qorex!.native.signAndBroadcast=async()=>{(window as unknown as {__authUiSendCount:number}).__authUiSendCount++;if(reject)throw new Error('User rejected approval');return {txHash:'A'.repeat(64),code:0,height:101,shield:'shielded'};};},{reject});
 if(stallConnection)await page.addInitScript(()=>{
  const native=window.qorex!.native;
  const enable=native.enable.bind(native);
  let attempts=0;
  native.enable=(chain)=>{
   if(++attempts!==1)return enable(chain);
   document.documentElement.dataset.walletConnectionStarted='yes';
   return new Promise(()=>{});
  };
 });
 await page.route(/^https:\/\/(?:api-testnet|rpc-testnet|evm-testnet)\.qore\.host/,route=>route.abort());
 await page.route('**/api/qorechain/balance?*',route=>route.fulfill({json:{chainId:'qorechain-diana',address:new URL(route.request().url()).searchParams.get('address'),amountUqor:'1000000'}}));
 const challenge={id:'7e165b88-aa4d-43c1-b269-2b2b25808715',address,chainId:'qorechain-diana',origin:(process.env.REEKLAIM_TEST_ORIGIN ?? 'http://127.0.0.1:5173'),memo:'rk:auth:v1:'+'a'.repeat(43),amountUqor:'1',issuedAt:new Date().toISOString(),expiresAt:new Date(Date.now()+(expired?-1000:300000)).toISOString(),candidateHash:pending?'A'.repeat(64):null};
 await page.route('**/api/auth/**',async route=>{const path=new URL(route.request().url()).pathname;if(path.endsWith('/session'))return route.fulfill({json:{available:true,authenticated,csrf:'fixture-csrf-not-a-real-token',pending:pending?challenge:null,...(authenticated?{user:{id:'3fb37fe0-d8b4-41d3-b9c3-a0740571c483',walletAddress:address,displayName:alias,onboardedAt:alias?new Date().toISOString():null,createdAt:new Date().toISOString(),expiresAt:new Date(Date.now()+43200000).toISOString()}}:{})}});if(path.endsWith('/challenge'))return route.fulfill({status:201,json:challenge});if(path.endsWith('/verify')){verifications++;if(holdVerification)await verificationGate;authenticated=true;return route.fulfill({json:{authenticated:true}});}if(path.endsWith('/logout')){authenticated=false;logoutCount++;return route.fulfill({json:{authenticated:false}});}return route.abort();});
 await page.route('**/api/account/profile',async route=>{alias=route.request().postDataJSON().displayName;return route.fulfill({json:{saved:true}});});
 await page.route('**/api/dashboard',route=>route.fulfill({json:{account:{display_name:alias,wallet_address:address,created_at:new Date().toISOString()},counts:{items:0},evidence:[]}}));
 return {challenge,releaseVerification,logoutCount:()=>logoutCount,verifications:()=>verifications};
}
async function connect(page:Page){await page.getByRole('button',{name:'Connect QoreX',exact:true}).last().click();await page.getByRole('dialog').getByRole('button',{name:'Connect QoreX',exact:true}).click();await expect(page.getByText(/^Connected · (not authenticated|authenticated session)$/)).toBeVisible();await page.getByRole('dialog').getByRole('button',{name:'Close dialog'}).click();}
async function screenshot(page:Page,name:string){await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:`${root}/${name}.png`,fullPage:true});}
test('landing wallet connection opens sign-in in place and waits for consent',async({page})=>{
 const setup=await fixture(page);
 await page.goto('/');
 await page.getByRole('banner').getByRole('button',{name:'Connect Wallet',exact:true}).click();
 const dialog=page.getByRole('dialog',{name:'Sign in with QoreX'});
 await expect(dialog).toBeVisible();
 await expect(page).toHaveURL('/');
 await dialog.getByRole('button',{name:'Review sign-in'}).click();
 const approve=dialog.getByRole('button',{name:'Request approval in QoreX'});
 await expect(approve).toBeDisabled();
 expect(setup.verifications()).toBe(0);
 expect(await page.evaluate(()=>(window as unknown as {__authUiSendCount:number}).__authUiSendCount)).toBe(0);
 await dialog.getByRole('checkbox').check();
 await approve.click();
 await dialog.getByLabel('Private display name').fill('Landing test alias');
 await dialog.getByRole('checkbox').check();
 await dialog.getByRole('button',{name:'Finish onboarding'}).click();
 await expect(page).toHaveURL('/app');
});
test('an unanswered wallet connection times out and retries on the landing page',async({page})=>{
 await fixture(page,{stallConnection:true});
 await page.clock.install();
 await page.goto('/');
 await page.getByRole('banner').getByRole('button',{name:'Connect Wallet',exact:true}).click();
 const connect=page.getByRole('dialog',{name:'Connect your wallet'});
 await expect(connect.getByText(/open QoreX from your browser toolbar/i)).toBeVisible();
 await expect(page.locator('html')).toHaveAttribute('data-wallet-connection-started','yes');
 await page.clock.fastForward(31_000);
 await expect(connect.getByRole('alert')).toContainText('QoreX did not respond');
 await connect.getByRole('button',{name:'Connect QoreX',exact:true}).click();
 await expect(page.getByRole('dialog',{name:'Sign in with QoreX'})).toBeVisible();
 await expect(page).toHaveURL('/');
});
test('sign-in returns to a report and retains the selected item (fixture)',async({page})=>{
 await fixture(page,{existing:true});
 const item='0b27ae22-9061-4850-9112-80c04e9da214';
 await page.route('**/api/items',route=>route.fulfill({json:{items:[{id:item,name:'Test camera',status:'registered'}]}}));
 await page.route('**/api/market/mine',route=>route.fulfill({json:{items:[]}}));
 await page.goto('/reports/lost?item='+item);
 await page.getByRole('link',{name:'Sign in with QoreX',exact:true}).click();
 await page.getByRole('button',{name:'Connect Wallet',exact:true}).click();
 await expect(page).toHaveURL('/reports/lost?item='+item);
 await expect(page.getByRole('combobox',{name:/registered item/i})).toHaveValue(item);
});
async function accessibility(page:Page){const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))).toEqual([]);}
test('real local guest sign-in remains gated without wallet approval',async({page})=>{await page.goto('/sign-in');await expect(page.getByRole('button',{name:'Request sign-in challenge'})).toBeDisabled();await expect(page.getByText('Start with your QoreX wallet.')).toBeVisible();await expect(page.getByRole('button',{name:'Request approval in QoreX'})).toHaveCount(0);await screenshot(page,'sign-in-guest');await accessibility(page);});
for(const width of [390,1440])for(const theme of ['light','dark'])test(`authentication review and onboarding ${width} ${theme} (UI fixture only)`,async({page})=>{
 await page.setViewportSize({width,height:1000});await page.emulateMedia({colorScheme:theme as 'light'|'dark'});const setup=await fixture(page,{holdVerification:true});await page.goto('/sign-in');await connect(page);await page.getByRole('button',{name:'Request sign-in challenge'}).click();await expect(page.getByRole('button',{name:'Request approval in QoreX'})).toBeDisabled();expect(await page.evaluate(()=>(window as unknown as {__authUiSendCount:number}).__authUiSendCount)).toBe(0);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await screenshot(page,`auth-review-${width}-${theme}-MOCK`);await accessibility(page);
 await page.getByRole('checkbox').check();await page.getByRole('button',{name:'Request approval in QoreX'}).click();try{await expect(page.getByText('Independently verifying the Diana receipt…')).toBeVisible();}finally{setup.releaseVerification();}await expect(page).toHaveURL(/\/sign-in$/);await expect(page.getByRole('button',{name:'Finish onboarding'})).toBeDisabled();await screenshot(page,`onboarding-${width}-${theme}-MOCK`);await accessibility(page);await page.getByLabel('Private display name').fill('Test alias');await page.getByRole('checkbox').check();await page.getByRole('button',{name:'Finish onboarding'}).click();await expect(page).toHaveURL(/\/app$/);await expect(page.getByRole('heading',{name:'Welcome, Test alias.'})).toBeVisible();await screenshot(page,`account-${width}-${theme}-MOCK`);await accessibility(page);expect(setup.verifications()).toBe(1);
 await page.getByRole('button',{name:'Log out',exact:true}).click();await expect(page.getByText('Not authenticated',{exact:true})).toBeVisible();expect(setup.logoutCount()).toBe(1);
});
test('approval rejection does not attempt verification or unlock records',async({page})=>{const setup=await fixture(page,{reject:true});await page.goto('/sign-in');await connect(page);await page.getByRole('button',{name:'Request sign-in challenge'}).click();await page.getByRole('checkbox').check();await page.getByRole('button',{name:'Request approval in QoreX'}).click();await expect(page.getByRole('alert')).toContainText('User rejected');expect(setup.verifications()).toBe(0);await screenshot(page,'auth-rejected-MOCK');});
test('automatically resumes an existing hash after signing closes without a new send',async({page})=>{
 const setup=await fixture(page,{pending:true,expired:true});
 await page.goto('/sign-in');
 await connect(page);
 await expect(page.getByRole('button',{name:'Finish onboarding'})).toBeVisible();
 await expect(page.getByRole('button',{name:'Retry receipt verification'})).toHaveCount(0);
 expect(setup.verifications()).toBe(1);
 expect(await page.evaluate(()=>(window as unknown as {__authUiSendCount:number}).__authUiSendCount)).toBe(0);
});
test('account changes revoke the old session and never unlock the replacement wallet',async({page})=>{const setup=await fixture(page,{existing:true});await page.goto('/app');await connect(page);await expect(page.getByRole('heading',{name:'Welcome, Fixture account.'})).toBeVisible();await page.evaluate(()=>window.__qorexMock!.switchAccount(1));await page.getByRole('button',{name:/qor1/}).first().click();await page.getByRole('button',{name:'Refresh wallet',exact:true}).click();await expect.poll(()=>setup.logoutCount()).toBe(1);await expect(page.getByText('Not authenticated',{exact:true})).toBeVisible();await expect(page.getByRole('heading',{name:'Welcome, Fixture account.'})).toHaveCount(0);});

test('development server never serves private configuration or storage paths',async({request})=>{for(const path of ['/.local/runtime.json','/.LOCAL/admin.json','/@fs/D:/REEKLAIM/.local/runtime.json','/@fs/D:/REEKLAIM/%2Elocal/admin.json','/server/auth/config.ts'])expect((await request.get(path)).status()).toBe(403);});

test('recovers an already-approved hash without making another wallet request',async({page})=>{const setup=await fixture(page);await page.goto('/sign-in');await connect(page);await page.getByRole('button',{name:'Request sign-in challenge'}).click();await page.getByText('Already approved in QoreX? Recover verification.',{exact:true}).click();await page.getByLabel('Existing authentication transaction hash').fill('A'.repeat(64));await page.getByRole('button',{name:'Verify existing transaction',exact:true}).click();await expect(page.getByRole('button',{name:'Finish onboarding'})).toBeVisible();expect(setup.verifications()).toBe(1);expect(await page.evaluate(()=>(window as unknown as {__authUiSendCount:number}).__authUiSendCount)).toBe(0);});

test('returning session opens the dashboard without signing or collecting terms again (fixture)',async({page})=>{
 const setup=await fixture(page,{existing:true});
 await page.addInitScript(()=>{
  sessionStorage.setItem('rk-wallet-connected','yes');
  const evm = window.qorex?.evm;
  if (evm) {
   const request = evm.request.bind(evm);
   evm.request = (input) => input.method === 'eth_accounts'
    ? Promise.resolve(['0x1111111111111111111111111111111111111111'])
    : request(input);
  }
 });
 await page.goto('/sign-in');
 await expect(page).toHaveURL(/\/app$/);
 await expect(page.getByRole('heading',{name:'Welcome, Fixture account.'})).toBeVisible();
 await page.reload();
 await expect(page.getByRole('heading',{name:'Welcome, Fixture account.'})).toBeVisible();
 expect(setup.verifications()).toBe(0);
 await expect(page.getByRole('button',{name:'Finish onboarding'})).toHaveCount(0);
 await page.goto('/explore');
 const header=page.getByRole('banner');
 await expect(header.getByRole('link',{name:'Dashboard',exact:true})).toBeVisible();
 await header.getByRole('link',{name:'ReeKlaim dashboard',exact:true}).click();
 await expect(page).toHaveURL('/app');
 await page.getByRole('navigation',{name:'Workspace navigation'}).getByRole('link',{name:'My items'}).click();
 await page.locator('.app-sidebar').getByRole('link',{name:'ReeKlaim dashboard'}).click();
 await expect(page).toHaveURL('/app');
});


test('onboarding returns to the item form and wallet refresh keeps it open (fixture)',async({page})=>{
 const setup=await fixture(page,{pending:true,expired:true});
 await page.goto('/app/items/new');
 await page.getByRole('link',{name:'Sign in with QoreX',exact:true}).click();
 await connect(page);
 await page.getByLabel('Private display name').fill('Test alias');
 await page.getByRole('checkbox').check();
 await page.getByRole('button',{name:'Finish onboarding'}).click();
 await expect(page).toHaveURL(/\/app\/items\/new$/);
 const name=page.getByLabel('Item name');
 await name.fill('Fixture camera');
 let releaseBalance:()=>void=()=>{};
 const balanceGate=new Promise<void>(resolve=>{releaseBalance=resolve;});
 await page.route('**/api/qorechain/balance?*',async route=>{
  await balanceGate;
  await route.fulfill({status:503,json:{error:'Diana balance temporarily unavailable.'}});
 });
 try {
  const balanceRequest=page.waitForRequest('**/api/qorechain/balance?*');
  await page.evaluate(()=>{
   const evm=window.qorex!.evm!;
   const request=evm.request.bind(evm);
   evm.request=(input)=>input.method==='eth_accounts'?Promise.resolve([]):request(input);
   window.dispatchEvent(new Event('focus'));
  });
  await balanceRequest;
  await expect(name).toBeVisible();
  await expect(name).toHaveValue('Fixture camera');
 }finally{releaseBalance();}
 await expect(name).toBeVisible();
 expect(setup.logoutCount()).toBe(0);
 expect(setup.verifications()).toBe(1);
 await page.reload();
 await expect(page.getByLabel('Item name')).toBeVisible();
 await page.getByLabel('Item name').fill('Draft survives wallet interruption');
 expect(setup.verifications()).toBe(1);
 await page.evaluate(()=>{
  const native=window.qorex!.native;
  const getKey=native.getKey.bind(native);
  native.getKey=async (chainId)=>{
   native.getKey=getKey;
   throw new Error('Wallet read temporarily unavailable for '+chainId);
  };
  window.dispatchEvent(new Event('focus'));
 });
 await expect(page.getByRole('heading',{name:'Reconnect your QoreX wallet'})).toBeVisible();
 await expect(page.getByLabel('Item name')).toBeHidden();
 expect(setup.logoutCount()).toBe(0);
 await page.getByRole('button',{name:'Reconnect QoreX',exact:true}).click();
 await expect(page.getByLabel('Item name')).toBeVisible();
 await expect(page.getByLabel('Item name')).toHaveValue('Draft survives wallet interruption');
 expect(setup.verifications()).toBe(1);
 await page.getByRole('button',{name:'Account menu'}).click();
 await page.getByRole('button',{name:'Disconnect locally'}).click();
 await expect.poll(setup.logoutCount).toBe(1);
 await expect(page.getByLabel('Item name')).toHaveCount(0);
});
