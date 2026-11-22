# Phase 5 marketplace and reporting

19 November 2026, Africa/Lagos.

## Implementation

- `/explore` now queries the PostgreSQL directory. It has lost and found views, keyword, category, country, city, date, reward and registration filters, sorting, capped pagination, grid and list layouts, a mobile filter drawer, loading and empty states, and retry on failure.
- `/demo/directory` retains the clearly marked fictional dataset.
- `/reports/lost` and `/reports/found` support authenticated drafts, separate approved photos, exact public previews, publication, editing, closing and archiving. An eligible registered item can be linked by its owner. Unregistered reports are supported. A public registration badge derives from a confirmed stored receipt.
- `/recover/:token` retains the anonymous QR finder flow. Submissions return a seven-day acknowledgement code. The status check reveals receipt only. Private QR messages stay encrypted and owner scoped.
- Open listings provide safe public details, approximate city, date, voluntary testnet reward declarations, safety guidance and abuse reporting. The operator queue supports hold, restore and dismissal.

## Migrations and API

Migration 006 adds reports, abuse flags, public column grants, forced RLS, indexes and archive synchronization. Migration 007 adds expiring acknowledgement digests and an English stemming index. Migration 008 adds linked claim and recovery case state synchronization. The [API inventory and operating instructions](MARKETPLACE_DESIGN.md) describe routes, state transitions and authorization.

The database suite uses isolated PostgreSQL and synthetic wallet evidence. It tests private drafts, authenticated lost and found creation, cross-account refusal, publication and revision checks, photo rejection, filtered search, pagination, linked-item state, QR intake and receipt checks, public projection, and abuse throttling. Application configuration and the QoreX verification code remain outside the test bypass. The production routes use the existing genuine authentication middleware.

## Verification and screenshots

- TypeScript, ESLint and the production build passed. The existing large SDK chunk warning remains.
- The complete unit and integration suite passed all 145 tests with none skipped. See [unit results](evidence/phase5/unit-results.json).
- The three new Chromium checks passed. They exercised filter submission and grid/list at 360px and 1920px, plus the actual directory API and guest QR entry.
- The full Chromium run passed 49 of 51 cases. Two desktop wallet fixture tests timed out and both passed in the separate single-worker rerun. All 51 cases passed across those runs. See the [full run](evidence/phase5/playwright-results.json) and [desktop rerun](evidence/phase5/desktop-rerun.json). An earlier run was interrupted by a stale Vite instance.
- Directory and filter snapshots use synthetic listing data. See [mobile directory](evidence/phase5/directory-360-MOCK.png), [mobile filters](evidence/phase5/filters-360-MOCK.png), [desktop directory](evidence/phase5/directory-1920-MOCK.png), and [desktop filters](evidence/phase5/filters-1920-MOCK.png).
- The local moderation queue command ran successfully. The application database had no unresolved flags at the time of the check.

## Known limits

Database triggers synchronize linked open reports with claim and recovery case records. Initiating and reviewing claims through the user interface is outside Phase 5. Closing a marketplace report does not decide whether its item was recovered. Declared rewards have no escrow or payout. Moderation runs in the operator shell. Owners and operators review visible image content and public free text. Country filtering uses a two-letter code. Search supports stemming and partial title matches rather than general typo correction.

No public deployment or genuine wallet transaction was executed. Native-only hackathon eligibility still needs organizer clarification. All six requested references were retrieved over HTTPS. Retrieval metadata is in [references.json](evidence/phase5/references.json). The new interface builds on the repo’s Gallery and Shifter design references and existing components.

**PHASE 5 COMPLETE**
