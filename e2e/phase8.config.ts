import {defineConfig} from '@playwright/test';
export default defineConfig({
  testDir:'.',testMatch:'workspace.spec.ts',timeout:90000,workers:1,
  reporter:[['list'],['json',{outputFile:'../docs/evidence/phase8/workspace-browser.json'}]],
  use:{baseURL:'http://127.0.0.1:4398',headless:true,reducedMotion:'reduce'},
  webServer:{command:'npm run start',url:'http://127.0.0.1:4398',timeout:90000,
    env:{PORT:'4398',APP_ORIGIN:'http://127.0.0.1:4398'}},
});
