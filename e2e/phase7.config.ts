import {defineConfig} from '@playwright/test';
export default defineConfig({
  testDir:'.',testMatch:'payments.spec.ts',timeout:90000,workers:1,
  reporter:[['list'],['json',{outputFile:'docs/evidence/phase7/browser-results.json'}]],
  use:{baseURL:'http://127.0.0.1:4397',headless:true,reducedMotion:'reduce'},
  webServer:{command:'npm run start',url:'http://127.0.0.1:4397',timeout:90000,
    env:{PORT:'4397',APP_ORIGIN:'http://127.0.0.1:4397'}},
});
