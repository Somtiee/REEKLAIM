# Phase 3 report — authentication, PostgreSQL, sessions and private storage

Completed implementation/review: **18 November 2026**. Workspace: `D:\REEKLAIM`. Status: **PHASE 3 IMPLEMENTED — LIVE VERIFICATION PENDING**. $0 spent. No deployment, public source publication or Phase 4 work.

## Delivered architecture

The original React/Vite scaffold, Phase 2 consumer identity/public routes and the real native QoreX adapter are retained. Authentication is now a same-origin Node service backed by real PostgreSQL and encrypted private server files. Browser connection/flags/address/hash alone grant no account access.

`server/auth/config.ts` validates exact canonical origin, HTTPS outside local development, separate server credentials/keys and private storage paths. `db.ts` uses separate auth/runtime pools, checks restricted roles/forced RLS and refuses DB releases older than reviewed security floors. `service.ts` implements challenges, atomic consumption, minimal wallet-account onboarding, sessions/revocation and durable limits. `receipt.ts` independently verifies canonical native evidence and locally verifies ML-DSA. `http.ts` applies strict request schemas, Origin/CSRF, authorization and bounded private endpoints. `storage.ts` validates and encrypts objects. `server/start.ts` serves the built SPA and API with security headers/CSP; developer proof remains unavailable in production.

`src/auth` and `/sign-in` add review/consent, pending/verification/retry, protected account, alias-onboarding modal, synthetic-document vault and logout. The same wallet must reconnect before a restored account appears. Account/network changes hide private UI and attempt server revocation; a replacement account must separately authenticate. Public browsing remains available. Registration, reports, claims, transfers, payment collection and organization services stay gated.

## QoreX capability and live status

Reviewed installed `@qorechain/qorex-types` 0.1.0 / SDK 0.14.0 declarations/source and current official integration/SIWQ docs. QoreSign has SIWQ helpers, but the reviewed released QoreX integration does not offer a third-party hybrid SIWQ method. No assumed `signArbitrary`, EVM signing, dashboard-origin spoof or server user-key signer was added. The authorized native hybrid transaction fallback is implemented through official `qorexSignAndBroadcast` with capability/account/network checks.

The browser inventory found the user's ReeKlaim Chrome window, but the available native app context did not safely expose the extension for inspection. **Actual installed wallet version/capabilities, fresh-account state, real approval, balance/PQ state, genuine hash/receipt and first-use behavior remain unobserved.** Browser fixtures are explicitly named MOCK and not chain evidence. The server verifies key control; transactions cannot attest which wallet software produced them. Only QoreX is offered by the app.

All fourteen mandatory official URLs were refreshed successfully by direct HTTPS after some web-tool failures; retrieval metadata/hashes are in `evidence/phase3/reference-refresh.json`. The SIWQ spec was inspected for domain/nonce/expiry separation; no unsupported message-signing path was activated. Technical references include QoreX integrations, Hybrid Inspector/key binding, Supabase RLS/private storage, and current PostgreSQL security guidance.

## Authentication handshake and controls

1. A random 32-byte opaque pre-session is issued as an HttpOnly cookie; only its SHA-256 digest is stored. A session-bound HMAC CSRF value is returned to browser memory.
2. An exact-Origin/CSRF protected request with a validated native address reads fixed Diana RPC/REST identity and creates a five-minute challenge. A new random 32-byte nonce, UUID, pre-session digest, wallet, chain, origin, times, minimum observed height, MsgSend type, denomination and amount are bound by a canonical fixed-order JSON array and SHA-256 memo `rk:auth:v1:<digest>`.
3. The screen discloses a **1 uqor / 0.000001 test QOR self-transfer**, zero application sign-in fee, separate network gas and possible first-use key registration. No reliable current fee quote is invented. Explicit consent and a separate button request QoreX approval. No send occurs on page load, connection or challenge creation.
4. Server verification pins network identity, successful committed code/positive newer height, exact raw TxRaw hash, matching independent REST/RPC height/result, independent block chain/time, one exact self-send, canonical memo, one standard native coin-118 classical signer matching the address, direct signing mode and no unexpected messages/extension/fee delegation. It requires the exact ML-DSA-87 layer and unique signer/algorithm/verified event, plus a possession-proven registered key and actual local PQ verification using the official SDK's active sign-bytes version. Unknown/missing/ambiguous evidence fails closed. Reads are fixed, bounded and redirect-refusing; no arbitrary proxy is accepted.
5. After network I/O, PostgreSQL locks browser/challenge and repeats binding/state/expiry checks. Unique nonce/memo/chain+hash constraints and an atomic transaction consume the challenge, revoke pre-session, link receipt/account/audit and create a fresh independent session token. Concurrent attempts issue one session. A public hash cannot be claimed from another browser.
6. Opaque cookies use HttpOnly/Path=/SameSite=Lax, plus Secure and `__Host-` names for configured HTTPS. Local HTTP deliberately uses separate dev cookie names. Only digests persist. Absolute expiry is 12 hours, inactivity expiry 30 minutes; passive status checks do not extend idle activity. Logout/server revocation take effect on every private request. No privileged token is stored in localStorage.

Verification retries reuse the original hash; candidate hashes persist server-side once submitted. If an approval was interrupted before reaching the server, an explicit recovery form accepts that same hash for the existing browser-bound challenge without another wallet request. Expired challenges cannot authenticate, and a new transaction always needs fresh consent. Registration is still an assertion, not legal title; no PII/private evidence enters the auth memo.

## Database migrations, roles and authorization

Applied locally to dedicated PostgreSQL **18.7**, loopback 55439, with 19 application tables:

- `001_foundation.sql`: accounts/wallet identities, pre-sessions, challenges, receipt ledger, sessions, items, public recovery-token digests, listings/lost and found reports, claims/evidence, recovery cases, payment intents/transactions, notifications, organizations/memberships, audit and rate limits.
- `002_roles_and_rls.sql`: no public/browser grants, separate non-owner/non-superuser/non-BYPASSRLS auth/runtime roles, FORCE RLS everywhere, own-account policies and deny-by-default future tables. Transaction-local actor context comes only from the verified server session; custom cookies do not set Supabase `auth.uid()`.
- `003_auth_hardening.sql`: auth receipt append-only permissions, expiry constraints and challenge/rate/evidence indexes.

Foreign keys, unique constraints, integer numeric amounts, statuses, indexes, timestamps and serial quota/challenge operations are present. The trusted auth role is limited to the auth domain and audit insertion; it cannot select private items/evidence. Runtime cannot read sessions or mutate owners. Both explicit service predicates and RLS enforce isolation; empty/wrong actor and pooled context reset are tested. Onboarding changes and audit insertion are transactional. Future case/member/payment policies remain unavailable until their services are implemented.

Migrations use advisory locking, per-file SHA-256 tracking and transactions. Admin credentials are separate from runtime and never loaded by the frontend. Initial tests used the installed 18.0 binaries only in the isolated cluster; current security guidance prompted an update to official standalone 18.7 binaries without altering existing system services. Source/hash are recorded, not misrepresented as an independently published checksum. Startup now enforces reviewed patched version minima. Tests use only `reeklaim_phase3_tests`, not the app database or another cluster.

## Private storage

Implemented equivalent private storage is an encrypted persistent server filesystem, not an assumed/unconfigured hosted Supabase bucket. Random 32-byte object names, independent AES-256-GCM encryption key/nonce/AAD, integrity digests and private DB metadata protect files outside web roots. Browser never sees object keys or credentials.

Uploads accept only valid decoded/re-encoded PNG/JPEG/WebP and UTF-8 plain text. Metadata is stripped; PDF/SVG/archives, animation, binary/text mismatch, invalid content, excessive dimensions/pixels and size are refused. Limits: 4 MiB/file, 20 MiB/account, 100 objects; durable per-account request limits, two in-process upload slots acquired before buffering, bounded image processing and transaction-serialized quota checks. Failed DB inserts remove their encrypted object. Files orphaned by a process crash still need operator reconciliation.

Downloads are authorized before a 60-second HMAC URL is issued, then recheck current session/actor/RLS at read time. Copying a URL to another account/session or using it after logout fails. Responses are no-store/private, attachment/nosniff/sandbox. Claim attachments are intentionally denied until case-scoped authorization exists. Only synthetic test documents were used. Encryption is server-readable, not end-to-end/post-quantum storage. Production key rotation/custody, retention and encrypted backup/restore procedures remain operator release requirements.

## API and configuration

`GET /api/auth/session`; `POST /api/auth/challenge`, `/verify`, `/logout`; protected `GET /api/me`, `/api/dashboard`; `POST /api/account/profile`; `POST /api/private/evidence`; `POST /api/private/evidence/:id/link`; authorized `GET .../:id/download`.

Private responses never trust a requested user/owner ID. Strict bodies, CSRF, exact configured Host/Origin and rate limits protect mutations. Vite has explicit frontend/public/dependency filesystem roots plus a private-path guard; `.gitignore` is not relied on as web access control. The fixed chain-read middleware only gains an optional exact configured-origin allowance for the standalone server; its default loopback and Diana/network/receipt behavior is preserved and original tests pass.

The local `.local` config and cluster are ready. No hosted credentials are required for these completed tests; no hosted Supabase project was created. Follow `PHASE_3_SETUP.md` and `.env.example` for current PostgreSQL, separate migration/runtime logins, TLS verification, independent server keys, exact HTTPS origin, persistent private volume and reverse proxy. Credentials belong only in an authorized server environment, never chat, `VITE_*` or Git. Current file storage does not support ephemeral serverless function disks. The proposed `reeklaim.vercel.app` remains unconfirmed/unpublished.

## Actual validation and evidence

- **104 unit/integration tests pass** in eight files: all original 59 plus 19 synthetic canonical/PQ receipt cases, 10 security/upload cases and 16 actual PostgreSQL/session/RLS/storage/HTTP cases. No skipped integration cases in the recorded run. `evidence/phase3/unit-results.json`.
- **40 full browser cases pass**, including all original 31; final **10 targeted auth cases pass** after file-root hardening and adding interrupted-approval recovery (41 distinct browser cases across the two actual runs). Full and targeted JSONs are retained separately. No full 41-case run is falsely claimed.
- Coverage includes valid synthetic verification; expiry/replay/reused hash; wrong wallet/chain/memo/amount/recipient/signer; failed/extra-message/missing/ambiguous hybrid evidence; local PQ verification; canonical raw hash/block time; DB race/fixation/atomic rollback; stolen public hash; missing/wrong Origin/CSRF; logout/idle/absolute revocation; cross-account reads/writes/role escalation/pool isolation; authorized upload/encryption/download expiry/session binding; account-switch revocation; approval rejection/explicit consent; retry without another send; and private-file HTTP denial.
- Type checking, ESLint and production build pass. Operational scripts are included in type checking. Initial/public entry is ~361.66 KB JS / 111.35 KB gzip; existing deferred SDK ~2.65 MB / 501.81 KB gzip retains its build warning. No performance score or full accessibility certification is invented.
- The built client was served through the real Node adapter on explicit **local HTTP development** port 4173. It renders sign-in, issues HttpOnly/SameSite cookies, returns 401 for anonymous private routes, 404 for private files/receipt/debug routes, supplies CSP and has no page errors. Exact generated credentials/keys were compared with the bundle without printing them; no leak was found, and public mock mnemonic/proof-action markers are absent. This is not an HTTPS/public deployment.
- Actual rendered screenshots cover sign-in/review/onboarding/private account in desktop/mobile light/dark, plus preserved seven-width landing/regression evidence. Inspected screenshots visually and ran WCAG A/AA axe checks on tested auth states. MOCK filenames are simulated UI success, never real sessions or transactions on chain.
- Real DB version/migration checksums/role flags and forced-RLS table metadata are recorded in `database-verification.json`. Core adapter/network/legacy verifier/proof hashes are compared with Phase 2 in `preservation.json`; the chain middleware's exact origin addition is disclosed.

Runtime npm audit reports **zero advisories**. The full dev tree reports one unpatched picomatch ReDoS advisory propagated through 12 packages (GHSA-fc5q-39xc-vjpf, updated 17 November 2026); no patched release exists at this review. It is not concealed by forced Vite/test-tool downgrades. Mitigation: loopback-only development, fixed developer-controlled glob patterns, no user glob API, and exclusion of those dev dependencies from the deployed Node runtime. Track the upstream patch; untrusted build/source inputs and independent security review remain release concerns.

Corrections before final passing evidence: stopped/stale services across the overnight pause, Windows daemon output handling, private dev file access, safe redacted config errors, status-cookie probe logic, a restored-session selector and server-restart/test-run timing. Failed intermediate runs are not presented as acceptance passes.

## Remaining manual requirements and Phase 4 readiness

Personally inspect/install/unlock a fresh native Diana QoreX account, fund it only with free test QOR, review and approve the challenge, and save a genuine canonical authentication receipt. Confirm real event/extension/key-possession behavior and reject any unsupported difference. No genuine authentication hash exists in this evidence. No real wallet secret was requested, exported or stored.

Before real private users or public release: authorize hosted credentials/eligible free hosting, use HTTPS/patched PostgreSQL and persistent storage, test proxy/cookies/CSP with the real extension, establish key backup/rotation/retention/recovery, and obtain independent security/privacy review. Source publication, event eligibility/category interpretation and submission remain separate gates.

The implemented foundation supports authorized Phase 4 work, but live blockchain acceptance and production operations are still open. Property workflows remain gated and **Phase 4 has not started**. Start/review instructions and the exact manual approval boundary are in `PHASE_3_SETUP.md`.

PHASE 3 IMPLEMENTED — LIVE VERIFICATION PENDING
