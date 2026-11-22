import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const root = join(tmpdir(), 'reeklaim-phase2', 'reference-screenshots');
await mkdir(root, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];
for (const [name, url] of Object.entries({capable:'https://capable.framer.website/',meo:'https://meo.framer.ai/',gallery:'https://gallerytemplate.framer.website/',shifter:'https://jobshifter.framer.website/',fluxframe:'https://fluxframe.framer.website/'})) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  try {
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1800);
    await page.screenshot({ path: join(root, name+'-desktop.png') });
    const headings = await page.locator('h1,h2').allTextContents();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: join(root, name+'-mobile.png') });
    results.push({ name, url, status: response?.status(), headings: headings.slice(0,12), screenshots: [name+'-desktop.png',name+'-mobile.png'] });
  } catch (error) { results.push({ name, url, error: String(error) }); }
  await page.close();
}
await browser.close();
await writeFile(join(root,'observations.json'), JSON.stringify(results,null,2));
console.log(JSON.stringify({ root, results },null,2));
