# UI and UX design

Phase 0 specification, now accompanied by the implemented Phase 2 UI. Brand promise: a calmer route from losing something to getting it back. Use **Find what's lost. Prove what's yours.** Explain proofs as records of an assertion, with limitations available at the point of registration.

## Phase 2 implementation update — 17 November 2026

The public consumer interface is now implemented in the original React/Vite workspace. Review `DESIGN_SYSTEM.md`, `FRAMER_DESIGN_REFERENCES.md`, `PHASE_2_REPORT.md` and `evidence/phase2/README.md`. This dated update supersedes the old reference-access limitation below: all **five** requested Framer previews were actually rendered at desktop/mobile and visually inspected before implementation. Animation timing was not benchmarked.

Implemented: original QR/return mark and social artwork; editorial phone/QR/notification hero; twelve-section landing page; local interactive demo; public filtered fictional directory; prototype information pages; protected-by-gating workspace shell; reusable accessible primitives; real QoreX wallet dialog; persistent light/dark/system themes. Private records, sign-in, reports, claims, organization operations and fees remain unreleased. Real hybrid transaction verification is pending.

Actual Chromium screenshots at 360/390/430/768/1024/1440/1920px and both landing themes are saved. Automated browser tests cover navigation, keyboard focus, theme persistence, demo isolation, filters, pagination and wallet states. See the final report for exact results and limitations. No fake activity, testimonials, partner marks, chain evidence or GPS tracking claims were added.

## Phase 0 reference study and original translation (historical)

All four Marketplace listings and their linked live preview content were read on 17 November 2026. The preview content exposes navigation, section hierarchy and product/directory structure. Marketplace screenshot-image requests failed through the web tool; no rendered breakpoint or animation QA was performed. Responsive/animation descriptions below combine listing descriptions with proposed ReeKlaim behavior, not observed device tests.

| Reference | Observed content/structure | Original ReeKlaim application |
|---|---|---|
| [Capable, Praha](https://www.framer.com/marketplace/templates/capable/) · [preview](https://capable.framer.website/) | Short section navigation, headline + paired CTA, app presentation, benefit/how-to/pricing/FAQ sequence | Clear recovery promise, original QR-tag + real app preview, three-step registration/recovery narrative and transparent testnet fee table |
| [Gallery, Charu Consul](https://www.framer.com/marketplace/templates/gallery/) · [preview](https://gallerytemplate.framer.website/) | Categories/locations/themes navigation, filter vocabulary, repeated image cards and load-more exploration | Lost/found tabs, category + coarse country/city/date filters, consistent listing cards and cursor pagination; no geographic overprecision |
| [Meo, Umair Khan](https://www.framer.com/marketplace/templates/meo/) · [preview](https://meo.framer.ai/) | Hero contains a rich dashboard hierarchy: sidebar, counts, search, state tabs and rows; use-case/feature/pricing/FAQ flow | Show real ReeKlaim inventory, claim status and wallet verification states; structured dashboard presentation without copied mockup data |
| [Shifter, Framebite](https://www.framer.com/marketplace/templates/shifter/) · [preview](https://jobshifter.framer.website/) | Prominent search, category browsing, featured/recent listing sections and recurring submission CTA | Search-first directory with consistent metadata, report-found entry and clear return-to-results navigation |

Use layout ideas, hierarchy and navigation principles only. Do not import templates, Framer component code, images, illustrations, branded graphics, text or example logos. Free does not mean MIT redistribution. Listings state Limited licensing; [community terms](https://www.framer.com/legal/community-terms/1.0) restrict standalone redistribution. Record all influences in notices and final README. No template downloads or proprietary assets entered this workspace.

## Visual system

- Midnight `#10101C`: primary text/light-theme anchors, dark surfaces.
- Violet `#7C3AED`: principal CTA/light-theme emphasis with white text; verify final contrast in actual component states.
- Lavender `#A78BFA`: dark-theme links, focus accents and restrained decoration; do not use as low-contrast body text on Cloud.
- Cloud `#F8FAFC`: page background and dark-theme foreground.
- Additional semantic colors for success/warning/error must meet contrast, include text/icons and avoid color-only status communication.

Prefer system sans typography initially to avoid external font tracking/licensing; 16px base, 1.5 body line height, 12–16px metadata only when readable. Hero 40–64px responsive, page titles 28–36px. Constrain reading width to ~65–75 characters and app content to ~1200px. Spacing scale 4/8/12/16/24/32/48/64; medium 12–20px radii; restrained borders/shadows. Avoid gradient-dominant backgrounds.

Original identity: three QR finder-corner motifs form a recovery frame around a small returned-item mark. Draw as original SVG/CSS in implementation. Decorative brand motif must not look like a scannable code; actual QR is generated from canonical public URLs with standard quiet zones, dark ink and error correction. Use original geometric item drawings or permission-cleared synthetic photos; do not download restricted reference visuals. No image generation service is needed for this phase or budget.

## Pages and hierarchy

Landing order: compact navigation (How it works, Lost & found, For organizations, Fees, FAQ, Sign in); plain promise; register/browse CTAs; live product preview; register/attach/recover steps; privacy explanation; individual/institution use cases labeled intended use; fee table; FAQ; final CTA and privacy/safety footer. Organization CTA explains planned functionality instead of opening a fake dashboard. Replace template social-proof sections with actual workflow demonstrations.

Dashboard: desktop sidebar (Overview, My belongings, Lost & found, Claims, Activity, Settings); top wallet/testnet/verification status; real summary counts; item cards or table; pending tasks. Mobile has a compact header and bottom navigation (Home, Items, Directory, Claims, More). Counts derive from user records and show zero honestly. Wallet labels distinguish "connected", "verification pending", "verified session" and "session expired".

Register wizard: category/details → private evidence → public recovery preview → fees and approval → pending/confirmed receipt → tag download/print. Never display an active verified tag before the registration receipt is accepted. Let users save an off-chain draft if wallet/chain is unavailable.

Recovery page: readable item nickname/category and minimal owner-approved image, testnet explanation only where relevant, Report found button, optional coarse location and safe note, privacy notice and safe-meeting guidance. No owner address/name/phone, exact address, public evidence or wallet requirement. Optional contact remains private unless deliberately shared. A finder continuation token is not exposed in listing URLs or analytics.

Directory: tabs and search above filters; mobile filters in an accessible sheet; filter state preserved in URL; cards use consistent image ratio, category, coarse location, date, status and optional testnet reward intention. Detail shows a safe description and similar category/city cards. Do not reveal hidden distinguishing evidence through search snippets, alt text or suggestions.

Claim review: side-by-side safe listing and private submitted answers for authorized reviewers, evidence access indicator, approve/reject controls with reason and confirmation; disputes show an explicit freeze. Coordination offers private in-app text with safe meetup advice. Return confirmation distinguishes two-party acknowledgement from owner-only closure.

## Interaction and accessibility

Buttons have minimum 44px target areas, visible focus, pending labels and disabled duplicate-submit handling. Forms have permanent labels, described errors, preserved safe input, field-level guidance and summary focus. Toasts use polite live announcements but never carry the only record of a critical result; persistent receipt/error panels remain visible.

Skeletons match final layout; empty states explain the next action. Distinguish pending indexing from failed transactions. Wallet rejection returns to the fee screen without auto-reprompt. Wrong network gives manual QoreX switch instructions; no unsupported auto-switch promise. Handle stale balance/timeouts without showing invented amounts. Animations are short 120–200ms transitions with reduced-motion support; never delay access behind a decorative preloader.

Light/dark defaults follow OS preference with a user override; persist only the theme preference locally. Text contrast target is at least 4.5:1, large text 3:1, UI/focus boundaries 3:1. Verify both themes at 360/768/1440px, 200% zoom, keyboard and screen reader. Real responsive behavior remains Phase 4 acceptance work.

## Demo assets

Featured image: original 1600×900 composition of brand frame, actual product screen and short promise, no fabricated transaction or adoption metric. Video target 170 seconds: problem (15), real wallet/auth (35), registration/receipt (40), QR/found/claim/return (50), privacy/architecture/credits (30). No more than 180 seconds. Blur private evidence, avoid wallet secrets/notifications, and show actual observed testnet proof. The image and video are Phase 6 deliverables, not created in Phase 0.
