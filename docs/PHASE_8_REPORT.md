# Phase 8 integrated personal and organization workspace

19 November 2026, Africa/Lagos.

- The personal overview counts authorized registered and missing belongings, found reports, active claims, recovery cases and completed returns. It pairs searchable recent activity and short links with the existing Diana balance reader. Privacy settings can hide the balance.
- The same workspace gives direct access to personal items, QR tags, private evidence, ownership-transfer receipts, incoming and outgoing claims, match suggestions, filtered recoveries, reward status and transaction receipts. Testnet collection and wallet approval gates remain in place.
- In-app notifications cover QR intake, possible matches, claims and review requests, messages, confirmed recovery, verified rewards and transfer acceptance. They support safe deep links, unread counts, individual and bulk read actions, preferences, and event-key deduplication.
- Organization workspaces support self-managed profiles, verified-account invitations with explicit acceptance, owner, manager and staff roles, found inventory, links to owned registered assets, internal claim and handover review, audit activity and counts. Tenant membership does not grant access to personal claim or wallet records. Public demonstration figures remain illustrative.
- Settings integrate the existing profile and theme controls with account preferences, active session revocation, an account-scoped JSON export and an explicit deletion request. The request opens an operator review and preserves other participants’ records. Blockchain commitments and transactions are immutable.

See [routes, authorization, retention and operational limits](WORKSPACE_DESIGN.md). Migrations 013–015 add workspace settings, notifications, tenancy and trigger guards.

## Validation

- The isolated PostgreSQL unit and integration suite passed all 156 checks, with none skipped. New coverage exercises real owner-only counts, notification permission and deduplication, preferences, tenant isolation, staff versus manager review, explicit invite acceptance and export/deletion scope. See [unit results](evidence/phase8/unit-results.json).
- The built Node app passed both focused Chromium tests. I visually inspected the [mobile overview](evidence/phase8/overview-390-MOCK.png) and [desktop overview](evidence/phase8/overview-1440-MOCK.png). The fixture screens use synthetic account data. See [browser results](evidence/phase8/workspace-browser.json).
- The full Chromium suite passed 54 of 57 cases. Three older item and QR fixture cases timed out. All four item presentation variants passed against the built Node app, so all 57 distinct browser cases passed across the recorded runs. See the [full suite](evidence/phase8/playwright-results.json) and [item rerun](evidence/phase8/item-rerun.json).
- TypeScript, ESLint and the production build passed. The existing large SDK chunk warning remains.
- All seven supplied references returned HTTP 200. See [retrieval metadata](evidence/phase8/references.json).

## Limits

Match alerts are created when an authorized user requests matching results. Email, push and a background matching worker are outside this phase. Organization review is an internal custody workflow. It does not delegate a member’s private personal claim records or settle rewards for the organization. Deletion requests require operator review. No live wallet approval or public deployment was performed in this phase.

**PHASE 8 COMPLETE**
