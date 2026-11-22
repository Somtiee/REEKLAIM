import {test,expect} from '@playwright/test';
import {address as payer} from '../tests/fixtures.ts';
import {bytesToBech32} from '@qorechain/sdk';
test('payment review at mobile width requires consent and saves the reconciliation hash',async({page})=>{
  await page.setViewportSize({width:390,height:1000});
  const treasury='qor1ez7wqp5ala5ph5nx95n6tdedrccsacqndfjgx3';
  const recipient=bytesToBech32(new Uint8Array(20).fill(6),'qor');
  let reserved=false,verified=false;
  await page.addInitScript(address=>{
    // No key material or mnemonic. This provider does not broadcast.
    Object.assign(window,{qorex:{native:{isQoreX:true,capabilities:['signAndBroadcast'],
      enable:async()=>{},signDirect:async()=>{throw new Error('No transaction signing in this fixture.');},getKey:async()=>({bech32Address:address,algo:'secp256k1'}),
      signAndBroadcast:async()=>({txHash:'A'.repeat(64),code:0}),
    }}});
  },payer);
  await page.route('**/api/qorechain/balance?*',route=>route.fulfill({json:{chainId:'qorechain-diana',address:payer,amountUqor:'10000000'}}));
  await page.route('**/api/auth/session',route=>route.fulfill({json:{available:true,authenticated:true,csrf:'fixture-only',user:{id:'3fb37fe0-d8b4-41d3-b9c3-a0740571c483',walletAddress:payer,displayName:'Fixture account',onboardedAt:new Date().toISOString(),createdAt:new Date().toISOString(),expiresAt:new Date(Date.now()+43200000).toISOString()}}}));
  const id='d2a37e60-3ee0-43f8-969c-29dc59f60b61';
  await page.route('**/api/payments',route=>route.fulfill({json:{collectionEnabled:true,atomicRewardsEnabled:false,authentication:[],registrations:[],operations:[
    {id,purpose:'transfer',payer,recipient,treasury,chainId:'qorechain-diana',origin:new URL(route.request().url()).origin,
      sends:[{recipient:treasury,amount:'50000'}],state:verified?'confirmed':'pending',canPay:true,canAccept:false,
      memo:'rk:pay:v1:'+'a'.repeat(43),expires_at:new Date(Date.now()+900000).toISOString(),candidate_hash:null,
      approval_started:reserved,created_at:new Date().toISOString(),receipt_hash:verified?'A'.repeat(64):null,height:verified?'101':null},
  ]}}));
  await page.route('**/api/payments/'+id+'/approval',route=>{reserved=true;return route.fulfill({json:{saved:true}});});
  await page.route('**/api/payments/'+id+'/verify',route=>{expect(route.request().postDataJSON().hash).toBe('A'.repeat(64));verified=true;return route.fulfill({json:{confirmed:true}});});
  await page.goto('/app/transactions');
  await page.getByRole('button',{name:'Connect QoreX',exact:true}).last().click();
  await page.getByRole('dialog').getByRole('button',{name:'Connect QoreX',exact:true}).click();
  await expect(page.getByText('Connected · authenticated session',{exact:true})).toBeVisible();
  await page.getByRole('dialog').getByRole('button',{name:'Close dialog'}).click();
  const approval=page.getByRole('button',{name:'Review and approve in QoreX'});
  await expect(approval).toBeDisabled();
  expect(reserved).toBe(false);
  await page.screenshot({path:(process.env.REEKLAIM_TEST_EVIDENCE ?? 'docs/evidence/phase8')+'/regression/mobile-checkout-MOCK.png',fullPage:true});
  await page.getByRole('checkbox').check();
  await approval.click();
  await expect(page.getByText('Verified Diana receipt · Block 101')).toBeVisible();
  expect(verified).toBe(true);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:(process.env.REEKLAIM_TEST_EVIDENCE ?? 'docs/evidence/phase8')+'/regression/mobile-receipt-MOCK.png',fullPage:true});
});
