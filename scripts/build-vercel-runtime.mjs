import { build } from 'esbuild';

await build({
  entryPoints: ['server/vercel-api.ts'],
  outfile: '.vercel-runtime/api.mjs',
  platform: 'node',
  target: 'node22',
  format: 'esm',
  bundle: true,
  external: ['pg', 'sharp'],
  banner: {
    js: 'import { createRequire as createNodeRequire } from "node:module"; const require = createNodeRequire(import.meta.url);',
  },
});
