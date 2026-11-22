# Phase 2 report — ReeKlaim

Date: 17 November 2026. Workspace: `D:\REEKLAIM`. Scope: premium design system, public landing/directory/demonstration and gated application UI foundation. Existing official React/Vite project retained. No Phase 3 implementation, publication or paid service.

**Status: PHASE 2 COMPLETE.** All Phase 2 acceptance checks pass; real wallet/hybrid evidence remains pending.

## Outcome

The original consumer identity and complete public UI are implemented. All private product functionality remains gated. Real QoreX approval and a genuine hybrid transaction remain **pending**; Phase 2 screenshots, test fixtures and wallet mocks do not satisfy that live-evidence requirement. Final verification results are recorded below and in `evidence/phase2`.

## Implementation

- Original QR/return logo mark, horizontal wordmark, light/dark SVG variants, favicon and original 1200×630 social SVG/PNG.
- Semantic token system; one self-hosted OFL variable font; consistent light/dark/system themes persisted before React renders; reduced-motion support.
- Editorial split hero with original phone, registered-belonging preview, functional demonstration QR, simulated found notification and recovery progress composition. No copied template art, fictitious testimonials, adoption counts or partner logos.
- Twelve landing sections: hero, interactive demonstration, three distinct quick actions, filtered demo marketplace, four-step journey, honest QoreChain/security explanation, varied use cases, complete proposed-fee table, illustrative organization dashboard, eleven FAQs, closing CTA and full footer.
- Five-step local demonstration, confirmation reset, public sample QR recovery form, isolated eight-item fictional directory with query/status/category/coarse city/date filters, pagination, empty state and detail pages. No report, private account, notification or product record is created.
- Gated desktop sidebar/topbar and mobile drawer/bottom navigation; actual public wallet indicator, honest empty notification/account menus and no private dashboard records or fake statistics.
- Real wallet missing/detected/disconnected/pending/connected-not-authenticated, rejection, wrong-network, unsupported broadcast, balance-loading and balance-unavailable states. Official install and faucet links; connecting/opening the modal never sends a transaction.
- Titles, descriptions, Open Graph/X cards, favicon, semantic landmarks/headings and linked informational pages. The proposed deployment address is not asserted as owned or live.

Reusable components: `Button`, `IconButton`, `Field`, `SelectField`, `SearchField`, `Tabs`, `Chip`, `Badge`, `Dialog`, drawer variant, `ConfirmDialog`, `Tooltip`, `Dropdown`, `EmptyState`, `Skeleton`, `ToastProvider`, `Breadcrumbs`, `Pagination`, `ItemCard`, `WalletStatus`, `TransactionStatus`, `QRPreview`, `Marketplace`, `InteractivePreview`, `HeroComposition`, `OrganizationPreview`, public header/footer and gated `ApplicationShell`. Native dialogs include Escape, explicit focus cycling and return focus; theme radios support arrows/Home/End; tabs support arrows/Home/End. Review at `/design-system`.

## Routes

| Route | Behavior |
|---|---|
| `/` | Complete landing |
| `/explore` | Filtered fictional directory |
| `/explore/:demo-id` | Sample detail; invalid IDs show 404 |
| `/demo` | Interactive local journey |
| `/demo/recovery` | Public finder-form simulation; no submission |
| `/preview/report-lost`, `/preview/report-found` | Honest next-step information |
| `/organizations` | Unreleased organization tools and illustrative inventory |
| `/privacy`, `/terms`, `/help` | Prototype privacy/limitations/safety information |
| `/docs`, `/status`, `/design-system` | Product notes, optional real read-only network check, component gallery |
| `/app` | Gated workspace overview |
| `/app/items`, `/app/report-lost`, `/app/report-found` | Gated future property actions |
| `/app/claims`, `/app/recoveries`, `/app/transactions`, `/app/settings` | Gated future account areas |
| Workspace Explore | Goes to public `/explore` |
| `/dev/qorechain` | Existing developer proof, development only; 404 screen in production |
| Other public paths | Useful 404 and working onward links |

## Research and asset provenance

The five required Marketplace listings and live previews were read; Playwright rendered desktop 1440×1000 and mobile 390×844 screenshots for each, and all ten were visually inspected **before implementation**. Pre-implementation findings: `FRAMER_DESIGN_REFERENCES.md`. Capable informs product presentation; Meo workspace restraint; Gallery image-led filters/cards; Shifter search prominence while avoiding its observed mobile overlap; Fluxframe section/process rhythm. Original-source creators and license limits are recorded there. Reference images remain in `%TEMP%\reeklaim-phase2\reference-screenshots`, outside the MIT repository. No animation benchmark or complete template audit is claimed.

Original SVG/React compositions and brand assets are MIT. Lucide and qrcode.react are ISC; Plus Jakarta Sans is SIL OFL; Playwright is Apache-2.0; axe is MPL-2.0. Four Pexels sample photographs retain the separate Pexels License and creator attribution. `THIRD_PARTY_NOTICES.md`, public `/docs#credits`, `research/phase2-photo-sources.json`, `phase2-assets.json` and `phase2-dependencies.json` record provenance. The latter inventories 351 lockfile entries including optional platform packages, not 351 installed packages. Installation audit reported zero vulnerabilities. No paid fonts, photos, Framer plan/template, domain, hosting or API. **$0 spent.**

## Validation

- Node 22.23.5 / npm 10.9.9. `npm run typecheck` passes, including Playwright test source/config. `npm run lint` passes. `npm run build` passes.
- **59 unit tests pass** across five files, including all 51 unchanged Phase 1 tests and eight new directory/demo/tab/theme tests. Machine output: `evidence/phase2/unit-results.json`.
- **31 final browser tests pass**, with no failures or skips. Browser results: see `evidence/phase2/README.md` and `playwright-results.json`. The full earlier 29-case run and 11-case refinement run also passed and are retained separately. Final suite adds dark directory/shell/gallery/mobile-wallet and keyboard theme/reduced-motion coverage.
- Required landing widths 360, 390, 430, 768, 1024, 1440, 1920, in light/dark. Eighteen representative public/gated routes checked at all seven widths, with no horizontal page scrolling.
- Real rendered PNGs cover desktop/mobile landing, both themes, directory/filters, gated shell, mobile navigation, demonstration verification and wallet states. Images/fonts are decoded before capture; no blank lazy-image screenshots are presented as final evidence. `MOCK` wallet captures use only the official current profile, mainnet disabled, balance requests intercepted, and no signing/broadcast calls. Missing-wallet captures show actual absence in the fresh test browser.
- WCAG A/AA axe checks pass on representative pages, both landing themes, component gallery, shell and wallet modal. Keyboard, native-dialog containment/return, menus, FAQ, anchor links, theme persistence, reduced motion, demo isolation, directory filters/pagination and wrong-network gates pass browser checks. Automated results do not establish complete WCAG conformance.
- Production smoke passes: public entry/direct listing render; no page errors; initial large SDK chunk not requested; developer proof excluded; receipt API HTTP 404; public mock mnemonic and proof-action markers absent from built JS. `evidence/phase2/production-smoke.json` and reproducible `scripts/verify-phase2-production.mjs`.
- SHA-256 comparison confirms the adapter, centralized network guards, receipt verifier, fixed backend and developer proof source unchanged. Only `WalletProvider.tsx` changed its loading boundary to defer imports of the same real adapter/API. `research/phase2-preservation-check.json`.

Visual review actually inspected desktop/mobile light/dark compositions, responsive contact sheets across all seven widths, full-page desktop/mobile sections, marketplace photos/metadata, organization preview, FAQ/footer, gated shell, navigation and every wallet-state composition. Corrected mobile decorative-ring overflow; headline wrapping and small icon size; metadata readability; one prohibited ARIA attribute; dialog Tab wrapping; theme radio keyboard behavior; and a trust illustration caption obscured by its overlay. Initial selector/time-limit and Windows encoding issues were corrected before recording passing results.

Performance: public entry ~261.75 KB JS / 82.06 KB gzip; CSS ~65.42 KB / 13.37 KB gzip. The existing SDK is deferred and still contributes a ~2.65 MB / 502 KB gzip chunk, with Vite's warning retained. No Lighthouse, CLS, real-device speed or animation-performance score is invented.

## Acceptance matrix

| Criterion | Evidence / outcome |
|---|---|
| Original coherent identity | Original vector branding/compositions; inspected screenshots |
| Five references documented | Pre-implementation reference analysis and render metadata |
| Desktop/mobile layout | Seven-width landing and 18-route reflow checks |
| Light/dark/system themes | Prepaint preference, browser and unit checks |
| Working navigation | History/hash/back/forward, public links, drawers, gated routes |
| Actual QoreX retained | Unchanged adapter hash; real provider imports |
| Wallet connection distinct from authentication | All connected states explicitly not authenticated; private gate always closed |
| Diana guards operational | Preserved allowlist/verifier/backend plus unchanged negative tests |
| Existing tests pass | All original 51 inside 59 passing unit tests |
| New UI tests pass | Eight unit tests plus passing browser acceptance/refinement checks |
| Type/lint pass | Final commands successful |
| Production build passes | Built and separately smoke-tested |
| Visual QA performed | Actual PNGs, visual inspection, documented corrections |
| Unreleased behavior labelled | Demo/gated/illustrative/proposed copy throughout |
| No fabricated/restricted evidence | Original/licensed assets; no live hash invented; no commit/push/publication |

## Known limits and Phase 3 readiness

Real extension presence/version/capabilities, human QoreX approval, balance/PQ state and genuine hybrid receipt remain pending. Phase 1's actual testnet endpoint identity reads remain recorded in its report; mocked browser states do not update that live status. No account session, production storage, uploads, legal-title determination, reports/claims/reward payment, organization service, contract or public deployment exists. Fees are proposals until a later verified implementation; gas remains separate.

The UI foundation is ready to support **explicitly authorized** Phase 3 work. Authentication must first prove the released QoreX capability and server-side verification path, fail closed, then add sessions/CSRF/replay defense and authorization before private records. A connected address, a submitted hash or the developer proof must never unlock accounts. This task does not proceed to Phase 3.

Chromium automation is not Safari/Firefox, physical-device, screen-reader or real-extension validation. Proposed hosting must add SPA fallback, a deployable constrained backend and verified absolute social/canonical URLs. `reeklaim.vercel.app` remains unconfirmed. Demo QR codes encode the current local origin and are not registered recovery tags. The large deferred SDK still needs future performance work. A source repository/public release, human security/privacy/license review and submission assets are outstanding.

## Start and review locally

```powershell
cd D:\REEKLAIM
. .\scripts\Use-Node22.ps1
npm.cmd run dev
```

Open `http://127.0.0.1:5173/`; review `/explore`, `/demo`, `/app`, `/design-system` and `/dev/qorechain`. Reuse the already running dev server if port 5173 is occupied. Node 22 must be installed; the helper uses the checksum-verified temporary runtime on this machine. Clean dependency setup: `npm.cmd ci --ignore-scripts`. Browser setup/check: `npx.cmd playwright install chromium`, then `npm.cmd run test:e2e`. The temporary production preview used for smoke testing is stopped after verification; run `npm.cmd run build` then `npm.cmd run preview` to review at 4173. No `.env` or wallet secret is required.
