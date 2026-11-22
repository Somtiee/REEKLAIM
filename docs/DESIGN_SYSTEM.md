# ReeKlaim design system

Implemented locally on 17 November 2026 in the existing official React/Vite scaffold. Review interactive examples at `/design-system`. This is a Phase 2 product preview; account authentication and persisted records are out of scope.

## Identity and design direction

Human, editorial and specific: a split typographic hero, a real illustrative belonging and an original phone/QR/notification composition. Warm neutral, mint and lavender surfaces support midnight text, without crypto imagery, fabricated adoption numbers or testimonials. The QR-inspired mark combines scan corners and a return arrow. Source assets: `src/components/Brand.tsx` and `public/brand/{mark,logo-light,logo-dark,social-preview}.svg`; a 1200×630 social PNG is rendered from the original SVG.

The five mandatory references were studied before implementation. Capable informs product concreteness, Meo restrained workspace framing, Gallery image-led directory structure, Shifter search hierarchy, Fluxframe varied section rhythm. See `FRAMER_DESIGN_REFERENCES.md`; no restricted code/assets are incorporated.

## Tokens

`src/tokens.css` owns semantic colors, font, spacing, radii, shadows, focus and duration. Midnight `#10101C`, violet `#7C3AED`, lavender `#A78BFA`, cloud `#F8FAFC`. Light/dark surfaces, text, borders and semantic emerald/amber/red/blue states use paired foreground/background values. Status text/icons accompany color.

One self-hosted Latin variable Plus Jakarta Sans file serves both headings and body (SIL OFL). Display sizes scale with screen width; supporting UI uses 11–15px depending on hierarchy, with smaller text limited to explicitly illustrative miniature interfaces. Font preloading and explicit image dimensions preserve layout. No external font service or second family is loaded. Space scale: 4, 8, 12, 16, 24, 32, 48, 64, 96px. Radius scale: 6, 10, 18px plus pill; borders and whitespace carry most hierarchy. Focus: visible 2px link-colored outline, 4px offset. Motion: 140/220ms; all CSS animation/transition and smooth scrolling disabled for reduced-motion users.

Responsive CSS boundaries: 480, 767, 850, 1099, 1190, 1600px. Required validation widths: 360, 390, 430, 768, 1024, 1440, 1920px. Public navigation becomes a dialog drawer before desktop controls crowd; directory transitions 4/3 → 2 columns. App sidebar becomes a menu drawer and fixed five-action bottom navigation. Mobile form controls reflow instead of clipping.

## Components and contracts

- `Button`: primary, secondary, ghost and danger; explicit native button defaults, disabled/pending/focus/hover states. `IconButton` supplies a readable accessible name and 44px default target.
- `Field`, `SelectField`, `SearchField`: linked labels; hint/error IDs, invalid state; native semantics. `Tabs`: one tab stop with arrows/Home/End. `Chip`: pressed state. `Badge`: semantic text plus dot.
- `Dialog`/`ConfirmDialog`/drawer: native modal dialog, title, close button, Escape, body scroll lock, explicit Tab cycling and native return focus. `Dropdown`: named disclosure, outside/Escape dismissal, normal keyboard buttons. `Tooltip`: hover and focus description. `ToastProvider`: dismissible polite status, five-second timeout.
- `EmptyState`, decorative `Skeleton`, `Breadcrumbs`, bounded `Pagination`, photo/illustration `ItemCard`, real `WalletStatus`, honestly pending `TransactionStatus` and actual encoded `QRPreview`.
- `Marketplace`: pure isolated fixture filtering by status/query/category/coarse city/date, reset, empty state and pagination. No API, contact data or owner identity.
- `InteractivePreview`: local five-step example, editable example name, usable demo QR, simulated notification, verification explanation and reset confirmation. No persistent product records or network writes.
- `ApplicationShell`: public UI foundation only. Connected wallet remains not authenticated. No private records, fake profile, balances-as-auth or simulated account statistics.

## Theme and routing

Theme preference `rk-theme` accepts light/dark/system. A small head script resolves it before CSS/React; the provider follows system changes and persists explicit choices. Storage denial falls back to system detection. Semantic root tokens style all pages and dialogs. No hydration theme transition is introduced.

Original small History API router supports links, back/forward, hashes, top scroll and main focus on page changes; Vite handles direct local paths. Hosting must provide an SPA fallback when a deployment is eventually authorized. Production excludes the developer proof route. No canonical/og:url asserts ownership of the proposed deployment address. Sharing-image paths are origin-relative until hosting is configured.

## Honest security UX

The original adapter, chain allowlist, receipt verifier, backend and developer proof remain intact. Only the provider loading boundary changed: real adapter/API imports defer the large SDK. Wallet dialog displays missing/detected/disconnected/pending/connected-not-authenticated/network/capability/rejection/balance states. Browser wallet fixtures are injected only in tests, never app runtime. Faucet and install links are official. All product fees are proposed, test QOR only, network fees separate. QR tags do not provide GPS. Registrations are assertions, not legal title. Hybrid live evidence remains pending.

## Verification and limits

Evidence and actual results are in `PHASE_2_REPORT.md` and `evidence/phase2/README.md`. WCAG A/AA axe checks cover representative pages, both landing themes and wallet modal; keyboard tests cover native dialogs, navigation and tabs. This is not a WCAG conformance certification: real screen-reader, real-device and live-extension review remain necessary. No broad global clipping rule masks overflow. Visual QA corrected decorative-ring overflow, mobile headline/icon scale, metadata sizing and modal focus wrapping.
