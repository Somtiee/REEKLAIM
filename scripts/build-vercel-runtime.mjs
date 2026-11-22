import { build } from 'esbuild';

await build({
  entryPoints: ['server.ts'],
  outfile: 'server.mjs',
  platform: 'node',
  target: 'node22',
  format: 'esm',
  bundle: true,
  external: ['pg', 'sharp'],
  banner: {
    js: 'import { createRequire as createNodeRequire } from "node:module"; const require = createNodeRequire(import.meta.url);',
  },
});
