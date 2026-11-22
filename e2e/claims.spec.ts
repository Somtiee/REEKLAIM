import {test,expect} from '@playwright/test';
import {createQorexMock} from '@qorechain/qorex-wallet-mock';

test('claim guests stay locked',async({page,request})=>{
  expect((await request.get('/api/claims')).status()).toBe(401);
  await page.goto('/app/claims');
  await expect(page.getByRole('link',{name:'Sign in with QoreX'}).last()).toBeVisible();
  await expect(page.getByRole('heading',{name:'Claims inbox'})).toHaveCount(0);
});

for(const width of [390,1440])test('compare reports and submit private claim at '+width,async({page})=>{
  await page.setViewportSize({width,height:1000});
  const mock=createQorexMock({profile:'current',allowMainnet:false});
  const walletAddress=mock.addresses().native;
  await page.addInitScript({content:mock.initScript()});
  await page.route('**/api/qorechain/balance?*',route=>route.fulfill({json:{chainId:'qorechain-diana',address:walletAddress,amountUqor:'10000000'}}));
  await page.route('**/api/auth/session',route=>route.fulfill({json:{available:true,authenticated:true,csrf:'ui-fixture',user:{id:'3fb37fe0-d8b4-41d3-b9c3-a0740571c483',walletAddress,displayName:'Fixture account',onboardedAt:new Date().toISOString(),createdAt:new Date().toISOString(),expiresAt:new Date(Date.now()+43200000).toISOString()}}}));
  const lost={id:'d2a37e60-3ee0-43f8-969c-29dc59f60b60',title:'Travel camera',description:'Camera in a fabric travel case',category:'electronics',country:'NG',city:'Lagos',occurred_on:'2026-01-01',brand:'Canon',model:'R5',colour:'Black'};
  const found={...lost,id:'d2a37e60-3ee0-43f8-969c-29dc59f60b61',title:'Found travel camera'};
  const id='d2a37e60-3ee0-43f8-969c-29dc59f60b62';
  const detail={id,state:'submitted',version:1,role:'claimant',verification:'none',serialAgrees:null,files:[],events:[],narrative:{relationship:'owner',explanation:'Fixture ownership explanation',distinguishing:'Fixture distinguishing detail',serial:'',additional:'',lost,found}};
  await page.route('**/api/market/mine',route=>route.fulfill({json:{items:[{...lost,kind:'lost',status:'open'}]}}));
  await page.route('**/api/claims/matches',route=>route.fulfill({json:{matches:[{lost,found,score:82,reasons:['Same model','Same city']}]}}));
  await page.route('**/api/claims',async route=>{
    expect(route.request().method()).toBe('POST');
    expect(route.request().postDataJSON()).toMatchObject({lost:lost.id,found:found.id});
    await route.fulfill({status:201,json:{id}});
  });
  await page.route('**/api/claims/'+id,route=>route.fulfill({json:detail}));
  await page.goto('/app/claims/matches');
  await page.getByRole('button',{name:'Connect QoreX',exact:true}).last().click();
  await page.getByRole('dialog').getByRole('button',{name:'Connect QoreX',exact:true}).click();
  await expect(page.getByText('Connected · authenticated session',{exact:true})).toBeVisible();
  await page.getByRole('dialog').getByRole('button',{name:'Close dialog'}).click();
  await expect(page.getByText('82/100 · strong similarity')).toBeVisible();
  await page.getByRole('button',{name:'Compare reports'}).click();
  await expect(page.getByRole('dialog',{name:'Compare reports'})).toBeVisible();
  await page.screenshot({path:(process.env.REEKLAIM_TEST_EVIDENCE ?? 'docs/evidence/phase8')+'/regression/compare-'+width+'-MOCK.png',fullPage:true});
  await page.getByRole('link',{name:'Start private claim'}).click();
  await page.getByLabel('Ownership explanation').fill('I purchased this camera for a work trip last spring.');
  await page.getByLabel('Private distinguishing characteristics').fill('The inner lint pocket is stitched by hand.');
  await page.getByRole('button',{name:'Continue to evidence'}).click();
  await page.getByRole('button',{name:'Submit private claim'}).click();
  await expect(page.getByRole('heading',{name:'Recovery timeline'})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:(process.env.REEKLAIM_TEST_EVIDENCE ?? 'docs/evidence/phase8')+'/regression/claim-'+width+'-MOCK.png',fullPage:true});
});
