# Third-party notices and design references

At Phase 0 this repository contained original planning only, without installed application dependencies or copied template files. Phase 1 now includes the genuine QoreChain `fullstack-web` scaffold, original implementation and installed dependencies. No proprietary Framer assets were imported. Original ReeKlaim code is MIT licensed; this does not relicense upstream Apache-2.0 template portions or dependencies.

## Phase 1 installed software and template attribution

The official `create-qorechain-dapp@0.14.0` generated the React/Vite baseline. Original template author: **QoreChain / QoreChain Association**, Apache-2.0. Derived/retained paths: `src/main.tsx`, `src/vite-env.d.ts`, `src/App.tsx`, `index.html`, `tsconfig.json`, `vite.config.ts`, `.env.example`, `package.json`. Modifications include the original ReeKlaim shell, typed native adapter, constrained backend, network guards and updated build/test configuration; no upstream template is represented as wholly original work. Preserve [Apache-2.0 license](docs/research/QORECHAIN-APACHE-2.0.txt), [original README](docs/research/scaffold-README.md) and [scaffold provenance](docs/research/phase1-scaffold.json). No separate upstream NOTICE was present in the distributed scaffold package.

Direct official SDK **0.14.0** and QoreX types **0.1.0**: Apache-2.0. Development-only official QoreX mock **0.1.0**: Apache-2.0, including its QoreSign **0.1.0** dependency. SDK-transitive EVM **0.14.0** and PQC **0.2.3** remain upstream components. The [Hybrid Inspector](https://github.com/qorechain/build-before-qday/tree/main/workshop-1/03-hybrid-inspector) informed the send/read/extension/event workflow (Apache-2.0); the implementation uses generated cosmjs-types encoders rather than copying its manual protobuf encoder. Native tests and synthetic fixtures are not live wallet/chain evidence.

Other installed direct software: React/React DOM **18.3.1** (MIT), cosmjs-types **0.11.0** (Apache-2.0), Zod **4.6.7** (MIT), TypeScript **5.9.3** (Apache-2.0), Vite/plugin-react/Vitest/ESLint/Testing Library and related tooling under their declared licenses. See the complete [resolved package/version/license/integrity inventory](docs/research/phase1-dependencies.json) and `package-lock.json`; upstream license files are retained under installed packages. Recheck license-text distribution requirements when publishing distributable bundles.

Portable Node.js 22.23.5 was obtained from the official Node distribution, checksum verified and stored outside the repository. It was not bundled into ReeKlaim. No purchased fonts/images or paid APIs were used. Design references below remain inspiration only.

## Official kits researched

| Source | Observed license/status | Actual use |
|---|---|---|
| [QoreChain SDK/scaffolder](https://github.com/qorechain/qorechain-sdk) | Apache-2.0; CLI/SDK 0.14.0 registry metadata and package LICENSE inspected | Architecture/API/units research; real temporary `fullstack-web` CLI probe |
| [QoreX integrations](https://github.com/qorechain/qorex-integrations) | Apache-2.0; qorex-types 0.1.0 package LICENSE inspected | Native provider/capability and test tooling research |
| [QoreSign](https://github.com/qorechain/qoresign) | Apache-2.0; 0.2.0 package LICENSE inspected | Hybrid and SIWQ verification design research |
| [Build Before Q-Day examples](https://github.com/qorechain/build-before-qday) | README states Apache-2.0 | Hybrid Inspector/Guestbook/Counter behavior and workflow study; no copied app |
| [QoreChain documentation](https://docs.qorechain.io/) | Documentation content remains upstream's; no wholesale redistribution | Linked and paraphrased technical research |

Copyright and trademark rights remain with their owners. On implementation, preserve Apache-2.0 LICENSE and any supplied NOTICE obligations for copied/distributed kit/template portions and mark modifications. MIT applies only to ReeKlaim's original code, not to relicensed upstream material. Include the actual dependency tree, versions and license notices before publication; do not assume transitive licenses from a parent package.

## Design references, inspiration only

| Template/creator | Link | Influence |
|---|---|---|
| Capable — Praha | [Marketplace](https://www.framer.com/marketplace/templates/capable/) · [preview](https://capable.framer.website/) | Landing hierarchy and app-centric recovery storytelling |
| Gallery — Charu Consul | [Marketplace](https://www.framer.com/marketplace/templates/gallery/) · [preview](https://gallerytemplate.framer.website/) | Filterable visual directory and category/location navigation |
| Meo — Umair Khan | [Marketplace](https://www.framer.com/marketplace/templates/meo/) · [preview](https://meo.framer.ai/) | Product/dashboard presentation and clear status/table hierarchy |
| Shifter — Framebite | [Marketplace](https://www.framer.com/marketplace/templates/shifter/) · [preview](https://jobshifter.framer.website/) | Search prominence, listing metadata and report CTA placement |

These Marketplace listings show Limited licensing. [Framer Community Terms 1.0](https://www.framer.com/legal/community-terms/1.0) were reviewed; free availability does not grant permission to redistribute template assets as MIT source. Use original React, text, SVGs, layouts and visuals implementing general principles. Do not copy their source, screenshots, photographs, fictional metrics/testimonials, brand marks or component exports. Credits acknowledge inspiration, not endorsement or partnership.

## Phase 0 proposed dependencies (historical)

Phase 0 proposed React/React DOM, TypeScript, Vite, Tailwind CSS, Zod, Lucide, accessible UI primitives, a QR generator, PostgreSQL driver, an image decoder/re-encoder, Vitest and Playwright. The Phase 1 selection above installs only the tools needed now; Tailwind/Lucide/QR/database/image processing/Playwright remain uninstalled. System fonts are used; no font assets were obtained. Supabase and public hosting remain prospective services, not enabled subscriptions.

## Phase 2 additions — 17 November 2026

This section supersedes the historical Phase 0/1 statements that Lucide, QR generation, Playwright and font assets were uninstalled. No Framer source, photographs, screenshots, templates or component exports are distributed. All five reference previews were actually rendered for research; those restricted reference screenshots remain outside this repository in the machine temporary directory. [Reference analysis](docs/FRAMER_DESIGN_REFERENCES.md) records creators, source links and limits.

- `lucide-react` 1.74.0, Lucide contributors, ISC. Original Lucide icons are used through the package.
- `qrcode.react` 4.2.0, zpao and contributors, ISC, including upstream QR encoding notices retained in its package.
- Plus Jakarta Sans variable font, Tokotype / upstream font contributors, SIL Open Font License 1.1. Package `@fontsource-variable/plus-jakarta-sans` 5.3.0; one Latin normal variable WOFF2 is self-hosted in `public/fonts`. Full copyright and OFL terms: `public/fonts/OFL.txt`. The CSS family alias does not modify the font binary.
- `@playwright/test` 1.65.1, Microsoft contributors, Apache-2.0, development only. Installed Chromium is a testing tool outside the repository; upstream browser licenses apply.
- `@axe-core/playwright` 4.14.0, Deque Systems contributors, MPL-2.0; its axe-core dependency is MPL-2.0, development only. Dependency license texts remain in installed package distributions.

### Sample photography — Pexels License, not MIT

The [Pexels License](https://www.pexels.com/license/) permits free website/app use and modification. Do not imply photographer/brand endorsement or sell/redistribute unaltered photographs as stock. Photo copyrights remain with their respective creators. These are illustrative sample belongings, not actual lost-property evidence or images supplied by real owners.

| Local file | Creator | Original photograph |
|---|---|---|
| `public/images/backpack.jpg` | Cindy Bartillon | [Black leather backpack](https://www.pexels.com/photo/a-black-leather-backpack-on-the-white-table-15246346/) |
| `public/images/camera.jpg` | craveiro_ pics | [Camera on white](https://www.pexels.com/photo/vintage-camera-on-white-background-4219113/) |
| `public/images/headphones.jpg` | Vladislav Anchuk | [Black studio headphones](https://www.pexels.com/photo/black-studio-headphones-on-white-background-30428610/) |
| `public/images/wallet.jpg` | Gül Işık | [Brown leather wallets](https://www.pexels.com/photo/the-leather-wallet-is-made-from-brown-leather-28028262/) |

Downloaded resized JPEGs and SHA-256 evidence are recorded in `docs/research/phase2-photo-sources.json`. Visible product marks belong to their owners; no partnership is implied. Public credits appear at `/docs#credits`. Original ReeKlaim logo, wordmark, social artwork, item illustrations, phone and dashboard compositions were created in SVG/React; no purchased template art or AI-generated raster assets were used.

## Phase 3 additions — 18 November 2026

- `pg` 8.23.1, node-postgres contributors, MIT; `@types/pg` 8.23.1, DefinitelyTyped contributors, MIT (development types).
- `sharp` 0.35.5, Lovell Fuller and contributors, Apache-2.0; bundled libvips/native dependencies retain their respective upstream licenses, including LGPL obligations for libvips distributions. Dependency license files are retained in package distributions; no native binaries are copied into public source assets.
- `tsx` 4.23.15, Hiroki Osame and contributors, MIT; the Node backend runner is a runtime dependency, with its upstream esbuild notices retained.
- Official PostgreSQL 18.7 standalone EDB binary archive is local ignored tooling under `.local`, not repository-distributed source. PostgreSQL is under the PostgreSQL License; EDB distribution notices accompany the archive. System PostgreSQL 18.0 was not modified. Source/hash evidence: `docs/evidence/phase3/postgres-binary.json`.

No Supabase SDK, Supabase Auth, hosted project, paid service or remote storage subscription was added. Original Phase 3 auth/database/storage/UI code is MIT. Existing QoreChain Apache-2.0 and all Phase 2 photo/font/icon notices remain applicable. Development tooling currently has the unpatched picomatch advisory GHSA-fc5q-39xc-vjpf; the runtime-only audit reports zero. This is an advisory disclosure, not a license change.

## Phase 9B hosting integration

The optional Supabase Storage adapter uses the documented Storage HTTP service. No Supabase SDK dependency or third-party code was added for the adapter. Existing QoreChain and test tool notices still apply.
