import type { IncomingMessage, ServerResponse } from 'node:http';
import { loadAuthConfig } from './auth/config.ts';
import { createAuthMiddleware } from './auth/http.ts';
import { createChainMiddleware } from './chain.ts';

// The public deployment serves one canonical origin. Preview retains its own explicit setting.
const productionOrigin = 'https://reeklaim.vercel.app';
const config = loadAuthConfig({
 ...process.env,
 APP_ORIGIN: process.env.VERCEL_ENV === 'preview' || process.env.VERCEL_ENV === 'development'
  ? process.env.APP_ORIGIN
  : productionOrigin,
});
if (process.env.NODE_ENV !== 'production' || !config?.objectStorage) {
 throw new Error('Vercel requires production settings and a private evidence bucket.');
}
const auth = createAuthMiddleware(config);
const origin = config.origin;
const chain = createChainMiddleware(false, undefined, origin);

export default async function handleApi(req: IncomingMessage, res: ServerResponse) {
 const url = new URL(req.url ?? '/', origin);
 // Some hosting adapters expose the rewrite destination instead of the original path.
 if (url.pathname === '/api/dispatch') {
  const paths = url.searchParams.getAll('__rk_route');
  if (paths.length !== 1 || !/^[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*$/.test(paths[0]) || paths[0] === 'dispatch') {
   res.statusCode = 404;
   res.end();
   return;
  }
  url.pathname = '/api/' + paths[0];
 }
 url.searchParams.delete('__rk_route');
 req.url = url.pathname + url.search;
 let fallThrough = false;
 await auth(req, res, () => { fallThrough = true; });
 if (fallThrough) await chain(req, res, () => {
  res.statusCode = 404;
  res.setHeader('Cache-Control', 'no-store');
  res.end();
 });
}
