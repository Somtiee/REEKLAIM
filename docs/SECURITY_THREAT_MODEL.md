# Security threat model

## Phase 4 implemented controls — 18 November 2026

The item service adds owner-scoped RLS and column grants, strict mass-assignment refusal, encrypted private metadata/salts, immutable original commitments, append-only versions, exact fee/treasury/memo verification, shared auth/payment replay prevention, transactional QR activation and durable approval/hash reconciliation. Recovery responses use an explicit allowlist; random 256-bit locators can be revoked/rotated and never authorize ownership changes. Separate photos are decoded/re-encoded before optional public use. Anonymous one-way messages have pre-session CSRF, exact Origin and durable IP/tag limits and are encrypted for owner-only reading. Print CSS isolates a generic tag from private app content.

Tests include raw/hybrid failures, wrong chain/signer/fee/treasury/memo, real PostgreSQL replay/races/rollback, owner isolation, ciphertext/salts, QR revocation, HTTP authorization/contact, malicious public-photo input and metadata stripping. [Phase 4 report](PHASE_4_REPORT.md) records actual results; fixtures are not live proofs. No independent audit, legal-title guarantee, private-user production readiness or automated content moderation is asserted. Existing key custody/retention/backup and real-wallet/TLS gates remain.


## Phase 3 implemented controls — 18 November 2026

Implementation and actual tests are in `PHASE_3_REPORT.md` and `evidence/phase3`; this is not an independent security audit or production certification. All prior testnet and ownership-assertion boundaries remain.

Verified local controls: server-issued random browser-bound five-minute challenges; exact canonical native intent/signature/event/key/time checks plus local PQ verification; atomic PostgreSQL replay/race defenses; opaque HttpOnly cookies with HTTPS Secure/Host prefix; server revocation/rotation/idle+absolute expiration; exact Origin/Host and session-bound CSRF; private DB role separation and forced RLS; explicit owner predicates; encrypted random private objects; validated bounded uploads, quotas and processing slots; session-bound short downloads; no-store private responses; bounded redirect-refusing chain reads; and a standalone Node CSP/security-header adapter.

Development-only Vite file serving is explicitly restricted to index/frontend/dependencies/public roots, with a separate case-insensitive private-path guard. Ignored `.local` credentials/data are not made safe merely by `.gitignore`; direct, encoded and absolute filesystem HTTP paths are tested as denied. Standalone serving is confined to built `dist`. Generated DB/password/crypto values were compared against the built bundle without printing them; no leak was found.

PostgreSQL 18.0 was used for the initial isolated synthetic tests, then replaced for this dedicated cluster by current 18.7 binaries after checking official security guidance including RLS fixes. No system installation was upgraded. Runtime startup enforces reviewed patched-version floors. Npm production dependency audit reports zero advisories. The full development tree reports one unpatched picomatch ReDoS advisory propagated through 12 packages (GHSA-fc5q-39xc-vjpf, updated 17 November). No patch is published as of this review. Do not run `audit fix --force` to conceal it by unrelated downgrades. Mitigation: development server remains loopback-only, app APIs accept no user-controlled glob patterns, and deployed Node runtime excludes those dev dependencies. Track the upstream fix; untrusted build-source handling remains a residual risk.

Actual remaining gates: real installed QoreX capability/approval and canonical receipt schema; fresh testnet account/faucet/key-possession behavior; HTTPS/reverse-proxy/cookie/CSP compatibility with the real extension; authorized hosted credentials/persistent volume; key custody/rotation and backup/restore rehearsal; retention and human security/privacy review. Server-side encryption does not hide plaintext from the server operator. Official upstream validators/RPC/REST remain trusted, not a consensus light client. A valid chain signature proves key control, not which wallet software produced it or legal ownership of a belonging. Public browsing/demo fixtures remain isolated from private records.


Design review dated 17 November 2026; no claim of completed audit or tested security. Assets: wallet-control identity, session tokens, private evidence/contact, item-controller state, public recovery locators, transaction intents and testnet funds. Actors: malicious claimant/finder, impersonator, spammer, compromised browser/extension, malicious uploader, compromised backend/admin and unreliable chain infrastructure.

Trust boundaries: browser ↔ QoreX; browser ↔ API; API ↔ database/private storage; API ↔ chain read providers; public listing ↔ private record. The wallet holds user keys and approves sends. The app never holds them. Chain receipts prove accepted signed transactions, not truth of physical ownership.

| Threat | Attack | Required control | Acceptance test | Residual risk |
|---|---|---|---|---|
| False ownership | Register someone else's object or guess evidence | Ownership-assertion language; hidden distinguishing facts, human review and dispute freeze | Claimant cannot read correct answers or self-approve | False evidence and collusion remain possible |
| Wallet impersonation | Submit victim address/hash or spoof QoreX rdns | Fresh bound hybrid challenge, exact signer/intent, independent server verification | Victim hash, wrong signer and fake provider fail | Compromised genuine wallet/browser can approve harmful actions |
| Replay | Reuse nonce across domains/sessions | 256-bit nonce, short expiry, origin/chain/pre-session binding, DB atomic consumption | Concurrent attempts yield one issuance | Login remains dependent on trusted origin/browser |
| Duplicate transaction | Pay once, finalize twice | Unique chain/hash, operation binding and idempotent reconciliation | Same receipt cannot pay two registrations | Operations need manual support for ambiguous chain/DB state |
| QR enumeration | Guess sequential tags or scrape linked records | Random 256-bit token, independent ids, throttles and minimal projection | Sequential/internal ids do not resolve; rotated token denied | Physical tag can be copied; public locator is intentionally shareable |
| Malicious image | SVG script/polyglot/decompression bomb/EXIF | Allow JPEG/PNG/WebP only; sniff, decode and re-encode with limits; strip metadata; quarantine before public display | SVG/mismatched MIME/oversize/dimension bomb rejected | Novel decoder vulnerabilities require maintenance |
| Private evidence leakage | Guess keys, broad signed URLs, cache leaks | Private buckets, per-case grants, short URLs/no-store, server authorization, no PII logs | Other user and anonymous evidence reads fail | Service operator and compromised server may see plaintext |
| DB privilege escalation | Client writes role/owner; service-role exposure | No direct private grants, restricted runtime role, FORCE RLS, separate migration secrets, parameterized SQL | Missing/wrong actor context and mass assignment fail | Backend compromise can set identity context; RLS is defense in depth |
| Tampered payments | Change treasury, reward, denomination or memo | Immutable server intent; integer math; exact decoded receipt comparison | Alter any financial field → reject | User may approve unrelated transaction outside app |
| Fake transaction hashes | Invent hash, use failed/wrong-chain tx | Pinned chain identity, successful committed receipt and hybrid event/bytes/signer checks | Unknown/failed/classical/wrong-network receipts denied | RPC/REST providers are trusted; not a light-client proof |
| Fraud/spam | Flood reports/uploads/claims or harass owner | Shared durable limits, quotas, moderation/reporting, hidden contact, block controls | Across-instance bursts throttled; report token cannot access another case | Free-tier resources and human moderation are limited |
| Personal data exposure | Chain memo serial, exact map, QR owner link | Strict memo format, salted commitments, coarse public location, metadata scrubbing | Snapshot public API/log/memo contains no private fields | Public payer/treasury and timing permit linkage |
| Unauthorized status/transfer | Submit `owner_id` or race approvals | Server transition allowlists, DB row locks/version and recipient consent | Cross-owner update/stale version/second active claim denied | Admin abuse needs audit and governance |
| XSS/CSRF/session theft | Stored listing script, cross-site mutation | Plain text rendering, CSP, secure HttpOnly cookies, CSRF + Origin, no-store | XSS strings inert; missing CSRF/foreign Origin rejected | Browser extensions and endpoint compromise remain |
| SSRF/open proxy | Pass external RPC URL/image fetch URL | Fixed upstreams and path allowlists, no user URL fetching, bounded time/size | Private-IP/redirect/arbitrary proxy attempts denied | Upstream outage denies service |
| Dependency compromise | Unpinned updates or mock in production | Lockfile, provenance/integrity review, license inventory, secret scan, dev-only mocks | Build contains no mock bypass or secrets | Supply-chain vulnerabilities need ongoing review |

## Proposed protective defaults

Zod checks every server boundary; use allowlists instead of permissive passthrough schemas. Reject unknown monetary/owner/role fields. Text limits: public note 1000 characters, private coordination 2000; total JSON 32 KB. Evidence maximum 5 MB/file, maximum decoded 16 megapixels, accepted count 5 per case; image worker rejects over-limit data before public derivatives. These are proposed limits, benchmark and enforce in Phase 3.

Durable rate-limit starting points: challenges 5/10 min per pre-session+hashed IP and 10/hour per wallet; verification 20/10 min per pre-session; found reports 5/hour per hashed IP and 3/hour per tag; claims 5/hour/account; uploads 10/hour/account with total quota. Add a global circuit breaker for free-tier exhaustion. Do not rely on function-local memory or easily spoofed forwarded IP; use host-trusted proxy metadata and short retention. Rate limits must not reveal whether a private wallet/item exists. Tune after abuse tests; do not silently add paid CAPTCHA/identity APIs.

Use CSP with tightly scoped script/connect/image origins, no arbitrary HTML rendering, no unsafe user SVG, same-origin API, Referrer-Policy no-referrer on recovery/evidence routes and frame-ancestors restriction. Separate public immutable image caching from private no-store evidence. Avoid loading analytics/third-party fonts on recovery pages.

## Commitments and privacy limits

Use independently random salts and domain-separated canonical encoding. Store salts encrypted off-chain with private records, never beside public commitments. Hashing is not encryption; low-entropy values can be guessed without adequate salts. Even salted commitments do not remove wallet/amount/time linkage or make the product anonymous. No sensitive data is needed in a chain memo. Communicate immutable-chain retention before approval.

No legal-ownership conclusion follows from registration, claim approval or a cryptographic key. Meet in safe public places; never publish home addresses. Disputes freeze app transfers/rewards and route to reviewed resolution; the app does not adjudicate legal title or offer emergency services. Initially avoid collecting data about children and sensitive government documents beyond the minimum necessary.

## Operational security and incident response

Keep database/storage/session/encryption keys in server environment secrets, never `VITE_*`. Separate dev/demo storage. Log request/operation ids and normalized failure reasons, redact cookies, nonce material, private notes and evidence URLs. Audit privileged access and treasury changes. Review dependency advisories before release and document unresolved issues.

If compromise is suspected: disable new challenges/paid operations, revoke affected sessions and storage grants, rotate server credentials, preserve minimal sanitized audit evidence, investigate scope, restore from verified backup, and notify affected users with human authorization. Existing on-chain transfers cannot be rolled back by the app. Do not auto-resend transactions during recovery.

Release requires threat-table negative tests, actual real-wallet receipt verification, private access/role tests, replay race tests and a human security review. A passed mock suite alone cannot close these gates. Phase 0 has produced the design only.

## Phase 6 boundaries

Participant RLS, explicit attachments and session-bound expiring file links protect case evidence. Competing approvals use locks and database uniqueness. Encrypted narratives and case messages remain off-chain. Matching reasons derive only from approved listing fields. Receipt and commitment validation fail closed, and real hybrid testnet evidence remains outstanding. Operator review and retention need a production policy.

## Phase 7 payment boundaries

Only the authenticated payer can reserve a wallet approval. Transfer recipients must separately accept. Canonical raw receipt and local hybrid checks precede atomic settlement, and global uniqueness prevents reuse across payment purposes. A timeout preserves the original hash. The server never signs a transaction. Combined reward collection stays disabled pending live atomic verification.

## Phase 8 workspace boundaries

Forced RLS scopes tenant rows, notifications and account preferences. Organization acceptance is bound to the intended verified account. Inventory roles protect custody review and cross-tenant writes. Exports contain explicit columns and deletion is a request. Notification content contains generic descriptions and same-origin links, with no sensitive messages or externally delivered PII.
