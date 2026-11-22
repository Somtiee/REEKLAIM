// Extended from the official fullstack-web scaffold. Original license: Apache-2.0.
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import { assertTestnetConfiguration } from './src/lib/network.ts';
import { createChainMiddleware } from './server/chain.ts';
import { createAuthMiddleware } from './server/auth/http.ts';
import { denyPrivateFiles } from './server/dev-files.ts';
import { loadAuthConfig } from './server/auth/config.ts';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  assertTestnetConfiguration(env.QORE_NETWORK);
  for (const key of ['QORE_REST_PROXY_TARGET', 'VITE_QORE_REST_URL', 'VITE_QORE_EVM_RPC_URL']) {
    if (env[key]) throw new Error(`${key} overrides are disabled. Use the centralized Diana allowlist.`);
  }
  const authConfig=loadAuthConfig({...process.env,...env});
  const authApi=createAuthMiddleware(authConfig);
  const privateFiles=denyPrivateFiles(authConfig?.storageDirectory);
  for(const key of Object.keys(env)) if(/^VITE_.*(SECRET|DATABASE|SERVICE_ROLE|PRIVATE_KEY)/i.test(key)) throw new Error('Server secrets must not use VITE_ names.');
  const chainReads: Plugin = {
    name: 'reeklaim-fixed-diana-reads',
    configureServer(server) {
      server.middlewares.use(privateFiles);
      server.middlewares.use((req, res, next) => {
        const path = req.url ?? '/';
        if (authConfig?.origin !== 'http://127.0.0.1:5173' ||
            req.headers.host !== 'localhost:5173' || req.method !== 'GET' ||
            req.headers['sec-fetch-mode'] !== 'navigate' || req.headers['sec-fetch-dest'] !== 'document' ||
            !/^\/(?![\\/])/.test(path) || /^\/api(?:[/?]|$)/.test(path)) return next();
        res.writeHead(302, { Location: authConfig.origin + path, 'Cache-Control': 'no-store' });
        res.end();
      });
      server.middlewares.use(authApi);
      server.middlewares.use(createChainMiddleware(true,undefined,authConfig?.origin));
    },
    configurePreviewServer(server) { server.middlewares.use(privateFiles); server.middlewares.use(authApi); server.middlewares.use(createChainMiddleware(false,undefined,authConfig?.origin)); },
  };
  return { envPrefix: [], plugins: [react(), chainReads], server: { host: '127.0.0.1', port: 5173, strictPort: true, fs: { allow: [resolve('index.html'),resolve('src'),resolve('public'),resolve('node_modules')], deny: ['.env','.env.*','**/*.{crt,pem}','**/.git/**','**/.local/**','**/private-storage/**'] } }, preview: { host: '127.0.0.1', port: 4173, strictPort: true } };
});
