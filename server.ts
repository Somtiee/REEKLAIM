import { loadAuthConfig } from './server/auth/config.ts';

if (process.env.VERCEL === '1') {
 if (process.env.NODE_ENV !== 'production') throw new Error('Vercel requires production runtime configuration.');
 if (!loadAuthConfig()?.objectStorage) throw new Error('Vercel requires a configured database and a durable private evidence bucket.');
}

await import('./server/start.ts');
