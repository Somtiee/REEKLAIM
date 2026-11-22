import {test,expect} from '@playwright/test';
import {address} from '../tests/fixtures.ts';
for(const width of [390,1440])test('dashboard counts and activity at '+width,async({page})=>{
  await page.setViewportSize({width,height:1000});
  await page.addInitScript(wallet=>{
    Object.assign(window,{qorex:{native:{isQoreX:true,capabilities:[],enable:async()=>{},
      signDirect:async()=>{throw new Error('No signing in this fixture.');},
      getKey:async()=>({bech32Address:wallet,algo:'secp256k1'})}}});
  },address);
  const date='2026-11-19T10:00:00.000Z';
  const user={id:'3fb37fe0-d8b4-41d3-b9c3-a0740571c483',walletAddress:address,displayName:'Synthetic workspace',onboardedAt:date,createdAt:date,expiresAt:new Date(Date.now()+43200000).toISOString()};
  await page.route('**/api/auth/session',route=>route.fulfill({json:{available:true,authenticated:true,csrf:'fixture-only',user}}));
  await page.route('**/api/qorechain/balance?*',route=>route.fulfill({json:{chainId:'qorechain-diana',address,amountUqor:'12500000'}}));
  await page.route('**/api/workspace/overview',route=>route.fulfill({json:{
    counts:{registered:3,missing:1,found:2,claims:1,recoveries:2,successful:1,unread:1},preferences:{hide_balance:false,notifications:true,match_alerts:true},
    activity:[{kind:'finder_report',label:'A finder sent a request through your recovery tag.',href:'/app/items',created_at:date}],
  }}));
  await page.route('**/api/dashboard',route=>route.fulfill({json:{account:{display_name:'Synthetic workspace',wallet_address:address,created_at:date},counts:{items:3},evidence:[]}}));
  let unread=1;
  await page.route('**/api/workspace/notifications',route=>route.fulfill({json:{unread,items:[{id:'3fb37fe0-d8b4-41d3-b9c3-a0740571c481',safe_message:'A finder sent a request through your recovery tag.',href:'/app/items',kind:'finder_report',created_at:date,read_at:unread?null:date}]}}));
  await page.route('**/api/workspace/notifications/read',route=>{unread=0;return route.fulfill({json:{saved:true}});});
  await page.goto('/app');
  await page.getByRole('button',{name:'Connect QoreX',exact:true}).last().click();
  await page.getByRole('dialog').getByRole('button',{name:'Connect QoreX',exact:true}).click();
  await expect(page.getByText('Connected · authenticated session',{exact:true})).toBeVisible();
  await page.getByRole('dialog').getByRole('button',{name:'Close dialog'}).click();
  await expect(page.getByRole('link',{name:'3 Registered items'})).toBeVisible();
  await expect(page.getByText('12.5 QOR',{exact:true})).toBeVisible();
  await page.getByLabel('Search recent activity').fill('No match');
  await expect(page.getByText('No recent activity matches that search.')).toBeVisible();
  await page.getByLabel('Search recent activity').fill('');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
  await page.screenshot({path:(process.env.REEKLAIM_TEST_EVIDENCE ?? 'docs/evidence/phase8')+'/overview-'+width+'-MOCK.png',fullPage:true});
  await page.getByRole('button',{name:'Notifications',exact:true}).click();
  await page.getByRole('link',{name:'Open notifications'}).click();
  await expect(page.getByRole('heading',{name:'Notifications · 1 unread'})).toBeVisible();
  await page.getByRole('button',{name:'Mark all read'}).click();
  await expect(page.getByRole('heading',{name:'Notifications · 0 unread'})).toBeVisible();
});
