import {test,expect} from '@playwright/test';

for(const width of [360,1920])test('live directory filters and result layout at '+width,async({page})=>{
  await page.setViewportSize({width,height:900});
  const item={id:'e64a2a7e-2ea9-454f-b757-56d96db26516',kind:'found',title:'Canvas backpack',description:'Blue fabric with a front pocket',category:'bags',country:'NG',city:'Lagos',occurred_on:'2026-01-01',reward:0,verified:false,status:'open',has_photo:false};
  await page.route('**/api/market?*',route=>{
    const params=new URL(route.request().url()).searchParams;
    const matches=params.get('kind')==='found'&&params.get('category')==='bags'&&params.get('country')==='NG';
    return route.fulfill({json:{items:matches?[item]:[],more:false}});
  });
  await page.goto('/explore');
  await expect(page.getByRole('heading',{name:'No public reports match'})).toBeVisible();
  await page.getByRole('button',{name:'Found',exact:true}).click();
  await page.getByRole('button',{name:'Filters',exact:true}).click();
  const drawer=page.getByRole('dialog');
  await drawer.getByLabel('Category').selectOption('bags');
  await drawer.getByLabel('Country code').fill('ng');
  await page.screenshot({path:(process.env.REEKLAIM_TEST_EVIDENCE ?? 'docs/evidence/phase8')+'/regression/regression/filters-'+width+'-MOCK.png',fullPage:true});
  await drawer.getByRole('button',{name:'Apply filters'}).click();
  await expect(page.getByRole('heading',{name:'Canvas backpack'})).toBeVisible();
  await expect(page.getByText('Diana registration verified')).toHaveCount(0);
  await page.getByLabel('Layout').selectOption('list');
  await expect(page.locator('.market-grid.market-list')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
  await page.screenshot({path:(process.env.REEKLAIM_TEST_EVIDENCE ?? 'docs/evidence/phase8')+'/regression/regression/directory-'+width+'-MOCK.png',fullPage:true});
});

test('actual directory responds and guests cannot publish',async({page,request})=>{
  const reply=await request.get('/api/market?kind=found');
  expect(reply.ok()).toBe(true);
  expect(await reply.json()).toMatchObject({items:expect.any(Array),page:1});
  await page.goto('/reports/found');
  await expect(page.getByRole('link',{name:'Sign in with QoreX',exact:true})).toBeVisible();
  const token='a'.repeat(43);
  await page.getByLabel('ReeKlaim recovery link or token').fill(token);
  await page.getByRole('button',{name:'Open recovery tag'}).click();
  await expect(page).toHaveURL('/recover/'+token);
});
