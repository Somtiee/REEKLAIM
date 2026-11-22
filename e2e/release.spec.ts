import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

const releaseOrigin = 'http://127.0.0.1:4399';
const evidence = process.env.REEKLAIM_RELEASE_EVIDENCE ?? 'docs/evidence/phase9';

test.beforeEach(({ baseURL }) => {
  test.skip(baseURL !== releaseOrigin, 'Requires the production-build server.');
});

test('production pages reflow and report local Chromium navigation measurements', async ({ page }) => {
  test.setTimeout(180_000);
  const measurements = [];
  for (const width of [360, 390, 430, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    for (const [name, path] of [['landing', '/'], ['marketplace', '/explore'], ['dashboard-guest', '/app']]) {
      await page.goto(path, { waitUntil: 'load' });
      await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      if (name === 'landing') {
        await page.waitForFunction(() => performance.getEntriesByName('first-contentful-paint').length > 0);
        const metrics = await page.evaluate(() => {
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          const scripts = (performance.getEntriesByType('resource') as PerformanceResourceTiming[])
            .filter(entry => new URL(entry.name).pathname.endsWith('.js'));
          return {
            loadMs: Math.round(navigation.loadEventEnd),
            firstContentfulPaintMs: performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? null,
            scriptDecodedBytes: scripts.reduce((total, script) => total + script.decodedBodySize, 0),
            scripts: scripts.map(script => ({ path: new URL(script.name).pathname, bytes: script.decodedBodySize })),
          };
        });
        expect(metrics.scripts.every(script => script.bytes < 500_000)).toBe(true);
        measurements.push({ width, ...metrics });
      }
      if (name === 'landing' || [390, 1440].includes(width)) {
        await page.screenshot({ path: `${evidence}/${name}-${width}.png`, fullPage: true });
      }
    }
  }
  await writeFile(`${evidence}/chromium-navigation.json`, JSON.stringify(measurements, null, 2));
});

test('production landing passes representative axe and keyboard checks', async ({ page }) => {
  const cdp = await page.context().newCDPSession(page);
  const policyIssues: string[] = [];
  cdp.on('Audits.issueAdded', ({ issue }) => {
    if (issue.code === 'ContentSecurityPolicyIssue') policyIssues.push(issue.code);
  });
  await cdp.send('Audits.enable');
  await page.goto('/');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to content' });
  await expect(skip).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
  const cameraLink = page.locator('a.item-image').filter({ has: page.getByAltText(/A camera full of memories/) });
  await expect(cameraLink).toHaveAccessibleName(/A camera full of memories.*Demo listing.*Found/i);
  const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  await writeFile(`${evidence}/axe-landing.json`, JSON.stringify(audit.violations, null, 2));
  expect(audit.violations.map(violation => violation.id)).toEqual([]);
  expect(policyIssues).toEqual([]);
});

test('production serves security headers and keeps development files private', async ({ request }) => {
  const landing = await request.get('/');
  expect(landing.ok()).toBe(true);
  expect(landing.headers()['content-security-policy']).toContain("frame-ancestors 'none'");
  expect(landing.headers()['referrer-policy']).toBe('no-referrer');
  for (const path of ['/.local/runtime.json', '/server/auth/config.ts', '/.env']) {
    expect((await request.get(path)).status()).toBe(404);
  }
  const guest = await request.get('/api/workspace/overview');
  expect(guest.status()).toBe(401);
  expect(guest.headers()['cache-control']).toContain('no-store');
});

test('a failed route chunk leaves a usable retry action', async ({ page }) => {
  const asset = '**/assets/PublicPages-*.js';
  await page.route(asset, route => route.abort());
  await page.goto('/demo/directory');
  await expect(page.getByRole('alert')).toHaveText('This page could not load.');
  await page.unroute(asset);
  await page.getByRole('button', { name: 'Reload page' }).click();
  await expect(page.getByRole('heading', { level: 1, name: /Lost\. Found\./ })).toBeVisible();
});
