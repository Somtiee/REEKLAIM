import { defineConfig } from '@playwright/test';

const origin = 'http://127.0.0.1:4399';
process.env.REEKLAIM_TEST_ORIGIN = origin;
process.env.REEKLAIM_TEST_EVIDENCE ??= 'docs/evidence/phase9/regression';
if (process.env.REEKLAIM_TEST_EVIDENCE === 'docs/evidence/phase9b') {
  process.env.REEKLAIM_RELEASE_EVIDENCE ??= process.env.REEKLAIM_TEST_EVIDENCE;
}

export default defineConfig({
  testDir: './e2e',
  grepInvert: /development server never serves private configuration/,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  workers: 1,
  reporter: [['list'], ['json', { outputFile: 'docs/evidence/phase9/browser-results.json' }]],
  use: {
    baseURL: origin,
    reducedMotion: 'reduce',
  },
  webServer: {
    command: 'npm run start',
    url: origin,
    timeout: 90_000,
    reuseExistingServer: process.env.REEKLAIM_REUSE_TEST_SERVER === '1',
    env: { PORT: '4399', APP_ORIGIN: origin },
  },
});
