# Marketplace design

The live directory at /explore reads PostgreSQL. Demo cards at /demo/directory remain local fixtures. Public queries select an explicit field list from open reports under forced RLS. The public-serving database role lacks column grants for owner and item identifiers. No registration record is included by default. The owner role is scoped by the existing transaction actor and genuine QoreX session.

Publishing requires an approved revision. The photo preview is authenticated and uses the same sanitized bytes served after publication. A published report returns to draft on edit so changed fields must be reviewed again. Lost-report publication marks an eligible linked registered item missing and updates its QR projection in the same transaction. Archiving a linked item archives its reports. Closing a report does not decide whether the underlying item was physically recovered. Authorized claim and case record transitions update previously open linked reports to claim pending, recovery in progress, recovered or closed. Drafts and moderated reports stay out of public circulation. The marketplace itself grants no case write privileges.

The directory supports bounded pages of 12, up to page 100, and uses a stable UUID tie-breaker. Search combines simple and English PostgreSQL full-text matching with title substring fallback. English stemming handles common singular/plural variants. Arbitrary typo correction and multilingual stemming are outside this release. Partial indexes serve open reports. At higher volumes the substring fallback and offset pagination may need replacement.

Use the existing local migration administrator to inspect the capped abuse queue with `npx.cmd tsx scripts/moderate-market.ts queue`. Operator actions are `hold <listing UUID>`, `restore <listing UUID>`, `dismiss <listing UUID>`, and `purge-acknowledgements`. A held report disappears immediately from the directory and cannot be republished by its owner. Reports of abuse do not automatically hide a listing. The public role can append flags and cannot read them. Public fields are restricted and operators can act on reports. Free text and image pixels still require owner judgment and review.

QR scan messages remain encrypted and owner-scoped. A random acknowledgement is stored only as a digest with a seven-day expiry. Possession permits a receipt check only and reveals no item or message metadata. The operator can purge expired digests. Existing rate limits use peer IP and should be reviewed with any reverse proxy.

## API inventory

| Method and route | Boundary |
|---|---|
| GET /api/market | Public, validated filters and bounded pages |
| GET /api/market/:id and /photo | Public open report and sanitized photo |
| GET /api/market/mine and /:id/preview-photo | Verified owner session |
| POST /api/market | Owner creates private draft |
| POST /api/market/:id/photo, /edit, /publish, /close, /archive | Verified owner and CSRF, state and revision checks on edits and publication |
| POST /api/market/:id/abuse | Rate-limited session or guest pre-session and CSRF |
| POST /api/recover/:token/contact | Existing QR intake, now returns acknowledgement code |
| POST /api/market/finder-status | Guest or account CSRF and rate limits, acknowledgement code in request body |

Migration 006 creates report and moderation tables, RLS, indexes and the linked-item archive trigger. Migration 007 adds the finder acknowledgement table and English search index. Migration 008 synchronizes open linked reports with authorized claim and recovery case record transitions. No prior migration was changed.
