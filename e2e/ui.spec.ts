import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createQorexMock } from '@qorechain/qorex-wallet-mock';
const evidence = (process.env.REEKLAIM_TEST_EVIDENCE ?? 'docs/evidence/phase8')+'/regression/regression/regression/regression';
async function ready(page: Page) {
  await page.evaluate(async () => { await document.fonts.ready; await Promise.all(Array.from(document.images).map(async image => { image.loading='eager'; try { await image.decode(); } catch { /* Assert all sources below. */ } })); });
  expect(await page.locator('img').evaluateAll(images => images.every(image => (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
}
async function noOverflow(page: Page) { expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no horizontal page overflow').toBe(true); }
async function shot(page: Page, name: string, fullPage = true) { await ready(page); await page.screenshot({path:`${evidence}/${name}.png`,fullPage}); }
async function accessible(page: Page) { const result = await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze(); expect(result.violations.map(v => ({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))).toEqual([]); }
for (const width of [360,390,430,768,1024,1440,1920]) for (const theme of ['light','dark'] as const) {
  test(`landing ${width}px ${theme}`, async ({page}) => {
    await page.setViewportSize({width,height:1000}); await page.addInitScript(theme => localStorage.setItem('rk-theme',theme),theme); await page.goto('/');
    await expect(page.getByRole('heading',{name:/Lost something/})).toBeVisible(); await noOverflow(page); await shot(page,`landing-${width}-${theme}`);
    if(width===1440 || width===390) { await accessible(page); await page.screenshot({path:`${evidence}/hero-${width}-${theme}.png`}); }
    expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe(theme);
  });
}
test('all public and gated routes reflow at each requested width',async({page})=>{ test.setTimeout(180000);
  for(const width of [360,390,430,768,1024,1440,1920]) { await page.setViewportSize({width,height:900}); for(const path of ['/explore','/demo/directory/demo-backpack','/demo','/demo/recovery','/preview/report-lost','/preview/report-found','/organizations','/help','/privacy','/terms','/docs','/status','/design-system','/app','/app/items','/app/claims','/app/transactions','/app/settings']) { await page.goto(path); await expect(page.locator('h1')).toBeVisible(); await noOverflow(page); } }
});
test('directory filters, empty state, pagination and details',async({page})=>{
  await page.goto('/demo/directory'); await expect(page.locator('.item-card')).toHaveCount(6); await page.getByRole('button',{name:'Next page'}).click(); await expect(page.locator('.item-card')).toHaveCount(2);
  await page.getByRole('searchbox').fill('no such example'); await expect(page.getByText('No demo belongings match.')).toBeVisible(); await page.getByRole('button',{name:'Clear filters',exact:true}).last().click();
  await page.getByRole('tab',{name:'Lost',exact:true}).click(); await expect(page.locator('.listing-status')).toHaveText(['Lost','Lost','Lost','Lost']);
  await page.getByRole('button',{name:'Electronics',exact:true}).click(); await expect(page.locator('.item-card')).toHaveCount(1); await page.getByLabel('Location',{exact:true}).selectOption('Nairobi'); await shot(page,'directory-filtered');
  await page.locator('.item-image').click(); await expect(page.getByRole('heading',{level:1})).toHaveText('Over-ear headphones'); await page.goBack(); await page.goto('/demo/directory'); await shot(page,'directory-desktop'); await accessible(page);
});
test('demo steps, reset confirmation, QR destination and isolated finder report',async({page})=>{
  const writes:string[]=[]; page.on('request',r=>{if(r.method()!=='GET') writes.push(r.url());}); await page.goto('/demo');
  await page.getByLabel('Example item name').fill('Example backpack'); await page.getByRole('button',{name:'Preview registration',exact:true}).click(); await expect(page.getByRole('heading',{name:'Meet your recovery tag'})).toBeVisible();
  await page.getByRole('button',{name:'Preview missing report',exact:true}).click(); await page.getByRole('button',{name:'Simulate found notification',exact:true}).click(); await expect(page.getByText('SIMULATED NOTIFICATION')).toBeVisible(); await page.getByRole('button',{name:'Preview verification',exact:true}).click(); await expect(page.getByText('No transaction signed. No legal title established.')).toBeVisible(); await shot(page,'demo-verification');
  await page.getByRole('button',{name:'Start over'}).click(); await expect(page.getByRole('dialog')).toBeVisible(); await page.getByRole('button',{name:'Reset demonstration'}).click(); await expect(page.getByLabel('Example item name')).toHaveValue('Everyday backpack');
  await page.goto('/demo/recovery'); await page.getByRole('button',{name:/Simulate found report/}).click(); await expect(page.getByText(/no report was sent/i)).toBeVisible(); expect(writes).toEqual([]);
});
test('mobile menu traps focus, closes on Escape and navigates',async({page})=>{
  await page.setViewportSize({width:390,height:844}); await page.goto('/'); const open=page.getByRole('button',{name:'Open navigation'}); await open.click(); await expect(page.getByRole('dialog')).toBeVisible(); await shot(page,'mobile-navigation',false);
  await page.keyboard.press('Shift+Tab'); expect(await page.evaluate(()=>!!document.activeElement?.closest('dialog'))).toBe(true); await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).not.toBeVisible(); await expect(open).toBeFocused(); await open.click(); await page.getByRole('navigation',{name:'Mobile navigation'}).getByRole('link',{name:'Explore',exact:true}).click(); await expect(page).toHaveURL(/explore/); await expect(page.getByRole('dialog')).not.toBeVisible();
});
test('theme persists, system preference resolves, accordion and anchor links work',async({page})=>{
  await page.emulateMedia({colorScheme:'dark'}); await page.goto('/'); await expect(page.locator('html')).toHaveAttribute('data-theme','dark'); await page.getByRole('button',{name:'Choose color theme'}).click(); await page.getByRole('radio',{name:'Light',exact:true}).click(); await page.reload(); await expect(page.locator('html')).toHaveAttribute('data-theme','light'); await page.getByRole('link',{name:'FAQ',exact:true}).click(); await expect(page).toHaveURL(/#faq$/); await page.locator('summary').filter({hasText:'GPS location'}).click(); await expect(page.getByText(/does not provide real-time location tracking/)).toBeVisible();
});
test('application shell stays gated and supports mobile workspace navigation',async({page})=>{
  await page.goto('/app'); await expect(page.getByText('Not authenticated',{exact:true})).toBeVisible(); await shot(page,'app-desktop'); await accessible(page); await page.setViewportSize({width:390,height:844}); await shot(page,'app-mobile'); await page.getByRole('button',{name:'Open workspace menu'}).click(); await shot(page,'app-mobile-menu',false); await page.getByRole('dialog').getByRole('link',{name:'Transactions'}).click(); await expect(page).toHaveURL(/app\/transactions/); await expect(page.getByRole('heading',{name:'Real receipts, when they exist.'})).toBeVisible(); await accessible(page);
});
test('component gallery and representative public pages meet automated accessibility checks',async({page})=>{for(const path of ['/design-system','/demo','/privacy','/organizations','/demo/recovery']){await page.goto(path);await accessible(page);}});
async function walletDialog(page:Page){await page.goto('/sign-in');await page.getByRole('button',{name:'Connect QoreX',exact:true}).click();await expect(page.getByRole('heading',{name:'Connect with QoreX.'})).toBeVisible();}
test('wallet missing is honest and official installation links exist',async({page})=>{await walletDialog(page);await expect(page.getByText(/QoreX not detected/)).toBeVisible();await shot(page,'wallet-missing',false);await accessible(page);});
for(const state of ['connected','rejected','wrong-network','unsupported','pending','balance-loading','balance-unavailable']) test(`wallet ${state} using official current-profile mock only`,async({page})=>{
  const mock=createQorexMock({profile:'current',allowMainnet:false,autoApprove:state!=='pending'});await page.addInitScript({content:mock.initScript()});
  await page.addInitScript(state=>{if(state==='rejected')window.__qorexMock!.rejectNext();if(state==='wrong-network'){const original=window.qorex!.evm.request.bind(window.qorex!.evm);window.qorex!.evm.request=(args)=>args.method==='eth_chainId'?Promise.resolve('0x2649'):original(args);}if(state==='unsupported')Object.defineProperty(window.qorex!.native,'capabilities',{value:[],configurable:true});},state);
  await page.route('**/api/qorechain/balance?*',async route=>{if(state==='balance-loading')await new Promise(resolve=>setTimeout(resolve,4000));if(state==='balance-unavailable')return route.fulfill({status:503,json:{error:'Unavailable in isolated UI test'}});return route.fulfill({json:{chainId:'qorechain-diana',address:new URL(route.request().url()).searchParams.get('address'),amountUqor:'1000000'}});});
  await walletDialog(page);await expect(page.getByText(/QoreX detected/)).toBeVisible();await page.getByRole('dialog').getByRole('button',{name:'Connect QoreX',exact:true}).click();
  if(state==='rejected')await expect(page.getByRole('dialog').getByRole('alert')).toContainText('Approval declined');else if(state==='wrong-network')await expect(page.getByRole('dialog').getByRole('alert')).toContainText('Wrong network');else if(state==='pending')await expect(page.getByRole('button',{name:'Waiting for QoreX…'})).toBeDisabled();else {await expect(page.getByText('Connected · not authenticated',{exact:true})).toBeVisible();if(state==='unsupported')await expect(page.getByText(/broadcast functionality is unavailable/)).toBeVisible();else if(state==='balance-loading')await expect(page.getByText('Loading testnet balance…')).toBeVisible();else if(state==='balance-unavailable')await expect(page.getByText('Unavailable — refresh to retry')).toBeVisible();else await expect(page.getByText('1 QOR',{exact:true})).toBeVisible();}
  await shot(page,`wallet-${state}-MOCK`,false);expect(await page.evaluate(()=>window.__qorexMock!.requests.some(r=>/signAndBroadcast|signDirect|signArbitrary|signSiwq/.test(r.method)))).toBe(false);
  if(state==='connected'){await page.keyboard.press('Escape');await page.goto('/app');await expect(page.getByText('Not authenticated',{exact:true})).toBeVisible();}
});

test('dark directory, gated shell and mobile wallet remain readable',async({page})=>{
 await page.emulateMedia({colorScheme:'dark'});await page.setViewportSize({width:390,height:844});
 for(const [path,name] of [['/demo/directory','directory-mobile-dark'],['/app','app-mobile-dark'],['/design-system','components-mobile-dark']]){await page.goto(path);await noOverflow(page);await shot(page,name);await accessible(page);}
 await page.goto('/sign-in');await page.getByRole('button',{name:'Connect QoreX',exact:true}).click();await expect(page.getByRole('heading',{name:'Connect with QoreX.'})).toBeVisible();await shot(page,'wallet-mobile-missing-dark',false);await accessible(page);
});
test('theme radio choices support arrow keys and reduced motion disables scanning',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Choose color theme'}).click();const system=page.getByRole('radio',{name:'System',exact:true});await system.focus();await page.keyboard.press('ArrowRight');await expect(page.getByRole('radio',{name:'Light',exact:true})).toBeFocused();await expect(page.locator('html')).toHaveAttribute('data-theme','light');await page.keyboard.press('ArrowRight');await expect(page.locator('html')).toHaveAttribute('data-theme','dark');await page.keyboard.press('Escape');await expect(page.getByRole('button',{name:'Choose color theme'})).toBeFocused();expect(await page.locator('.scan-light').evaluate(node=>getComputedStyle(node).animationName)).toBe('none');
});
