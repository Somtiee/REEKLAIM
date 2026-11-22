# Database design

## Phase 4 applied extension — 18 November 2026

Migrations 004–005 add append-only `item_versions`, owner-scoped `registration_intents`, a narrow `recovery_public` projection and encrypted `recovery_messages`. All **23** application tables have forced RLS. The existing receipt ledger now accepts exactly one authentication or registration purpose, with global unique chain/hash protection. New runtime owner UPDATE privileges are column-specific and exclude owner identity; a trigger preserves the original non-null commitment. Existing migrations 001–003 remain unchanged.

Private metadata/snapshot/salt/tag tokens/messages use authenticated server-readable encryption; existing evidence files retain their Phase 3 protections. Public photos are separate sanitized derivatives and remain private until confirmed registration and explicit visibility. The auth role only reads the public projection and inserts encrypted finder requests, without private item/evidence reads or message SELECT. Separate Phase 4 integration tests use `reeklaim_phase4_tests`; Phase 3 tests retain their own database. See [registration design](ITEM_REGISTRATION_DESIGN.md) for exact canonical encoding, grants and reconciliation, and [report](PHASE_4_REPORT.md) for measured results.


## Phase 3 applied schema — 18 November 2026

Versioned migrations `database/migrations/001_foundation.sql`, `002_roles_and_rls.sql`, `003_auth_hardening.sql` were applied to a dedicated local PostgreSQL **18.7** cluster. The original system 18.0 installation/services were not modified. Official EDB standalone binaries and SHA-256 provenance are recorded under `evidence/phase3`. Startup refuses DB releases older than the reviewed security minima (18.7 / 17.12 / 16.16 / 15.20), rather than claiming RLS safety on the initially installed 18.0. Major/version security requirements must be reviewed when upgrading.

Physical entities: accounts (one verified Diana wallet identity per account, private alias/onboarding), pre-sessions, auth challenges, canonical receipt ledger, sessions, items, recovery tags, listings, found reports, claims, evidence, recovery cases, payment intents, transactions, notifications, organizations/memberships, audit events and durable rate-limit buckets. Future product tables have foreign keys/status/amount constraints and indexes but remain deny-by-default; this phase does not implement claims, registrations, payments or organization operations.

`reeklaim_auth` and `reeklaim_runtime` are separate login roles, not owners/superusers/BYPASSRLS roles. FORCE RLS is enabled on every application table. The trusted auth role has explicit policies/grants only in the authentication domain and append-only audit insertion; it cannot select private evidence/items. The runtime role receives only bounded product privileges, uses a server-derived `SET LOCAL rk.actor` inside every transaction, and cannot read session tables. Private services also include explicit actor predicates. Empty/wrong actors and pooled identity reuse are tested. Custom cookies do not populate Supabase `auth.uid()`; no Supabase service-role key is used.

Only the separate migration operator owns schema/DDL. Migrations use an advisory lock, per-file SHA-256 ledger and transaction; edited applied migrations are refused. Receipts are append-only to runtime auth; unique `(chain_id,tx_hash)`, nonce digest, memo and challenge receipt prevent reuse. Browser/challenge locks and repeated expiry predicates make concurrent consumption yield one session. Onboarding updates and audit insertion share a DB transaction.

Private evidence in this phase is an own-account synthetic-document vault. Claim associations exist in the model but are rejected by the current API/RLS until a reviewed claim service exists. Data is AES-256-GCM encrypted in random object files outside public roots; DB metadata contains opaque key, digest, MIME and bounded byte length. Private links require both a 60-second HMAC signature and the current authorized session. Uploads allow decoded/re-encoded PNG/JPEG/WebP and UTF-8 plain text, max 4 MiB/file, 20 MiB/account and 100 documents, with durable request limits, bounded concurrent processing and serialized quota checks. PDF, SVG, archives, animations and oversized/invalid images are rejected. Encryption is server-readable, not end-to-end or post-quantum storage.

`npm run db:setup` initializes only `.local/postgres` at loopback 55439, generates ignored admin/runtime credentials separately and applies migrations. Integration tests use **reeklaim_phase3_tests**, require the exact isolated local cluster, and never truncate the app database. No production in-memory persistence or browser database is provided. Hosted Supabase PostgreSQL can use the same role/SQL design after authorized setup, but no hosted project or Storage bucket is claimed. Current private-file adapter requires persistent Node storage and is unsuitable for ephemeral function disks.

Cleanup SQL is operator-only in `database/cleanup.sql`: expired unused challenge/pre-session records and old rate buckets can be removed; sessions are revoked on expiry. Minimal consumed challenge/receipt linkage remains for replay/audit. Private-file retention, encrypted backups/restore procedures and production legal retention review remain operator release requirements; no automatic personal-data deletion or restore rehearsal is fabricated. After restoring a backup, revoke all restored sessions/pre-sessions and cancel pending challenges before enabling sign-in.


Historical Phase 0 proposal below; the applied Phase 3 schema and differences are documented above. PostgreSQL is authoritative for application state; a verified chain receipt is required for each configured on-chain operation. Use UTC `timestamptz`, random UUIDs internally, `numeric(78,0)` for amounts, string serialization to JSON, and explicit foreign keys. Never use SQL floating-point/money types for QOR.

## Relations

| Table | Principal columns and constraints |
|---|---|
| `accounts` | `id`, `chain_id`, canonical validated `wallet_address`, timestamps; UNIQUE(chain_id, wallet_address); CHECK chain is diana |
| `profiles` | account FK, optional display name, encrypted optional contact, privacy flags; never public by default |
| `auth_challenges` | random id, account address, chain, origin, nonce digest, pre-session digest, exact memo digest, amount `1`, issued/expiry, minimum height, state, used_at, receipt FK; UNIQUE nonce digest |
| `sessions` | token digest UNIQUE, account FK, created/last-active/absolute expiry, revoked_at, authentication receipt FK; no raw session secret |
| `items` | id, owner FK, category, private name/description, status, row version, commitment version/hash, registration operation FK, timestamps; owner updates only through guarded services |
| `recovery_tags` | item FK, 256-bit random URL token digest UNIQUE, active/revoked timestamps; separate token from internal id and commitment |
| `item_secrets` | item FK, encrypted serial/receipt metadata, encryption-key version, encrypted commitment salt; access restricted to current owner and explicit case grants |
| `evidence` | id, submitter FK or finder participant FK, claim/item FK, random storage key, MIME/size/digest, classification, processing state, created/deletion dates |
| `listings` | item FK nullable for unregistered found property, custodian FK, kind lost/found, moderation state, safe title/body, approved image FK, country/city, occurred date, reward integer, currency/chain; row version |
| `found_reports` | item/tag FK nullable, safe description, coarse location, private optional contact, status, participant FK, created/expiry |
| `finder_participants` | opaque token digest UNIQUE, report FK, limited scopes, expiry/revoked_at; no account ownership authority |
| `claims` | item/listing FK, claimant FK, reviewer FK, found-report FK optional, state, version, private reason, reviewed_at |
| `claim_evidence_grants` | claim/evidence/actor FK, purpose, expiry/revocation; no grant from a guessed item id |
| `coordination_messages` | claim/report FK, sender identity, plain text body, moderation/expiry; participants only |
| `return_confirmations` | claim FK, actor identity, confirmation mode, timestamp; UNIQUE(claim, actor); server derives final state |
| `operations` | id, actor FK, type, item/case FK, expected record version, exact canonical intent hash, amount/fee/treasury snapshot, expiry, state, receipt FK; unique actor-scoped idempotency key |
| `chain_receipts` | chain, normalized hash UNIQUE with chain, verified signer, message summary/intent, code, height, block time, hybrid extension metadata/event verdict, verifier version, checked_at; append-only |
| `ownership_history` | item FK, previous/new owner FK, version, accepted operation/receipt FKs, effective time; future transfer path only |
| `notifications` | account FK, type, resource FK, safe message, read_at; never push sensitive evidence into payloads |
| `audit_events` | actor, action, opaque resource id, before/after state, request id, time; append-only minimal metadata |
| `rate_limit_buckets` | hashed principal/action/window key, atomic count and expiry; shared across function instances |
| `organizations`, `memberships` | future: org id, account, role, invitations and scope; no live permissions until implemented/tested |

Opaque public recovery tokens use 32 random bytes base64url (43 characters). Store a digest for lookup; returning/printing an existing tag requires an encrypted recoverable token or owner-authorized rotation. Keep ciphertext separately from the public projection. A token is a public locator, never proof of ownership or permission to mutate the item.

## Public and private projections

Use an explicit allowlisted projection for directory/recovery responses. Never serialize a whole private row and remove a few fields. Public listing output excludes account identifiers, serials, contact details, evidence keys, exact location, salts and private claim answers. Wallet addresses are publicly linkable through chain receipts; do not promise anonymity. Public QR pages omit receipt links that trivially expose the owner; owner receipt views are private, while opted-in public verification must disclose linkability.

## Authorization matrix

| Resource | Public | Owner/custodian | Claimant/finder | Moderator |
|---|---|---|---|---|
| Approved directory card | Read safe projection | Edit own through service | Read | Hide/restore with reason |
| Item private record | Deny | Read/update own guarded fields | Deny | No default evidence access |
| Claim evidence | Deny | Only linked case/reviewer grant | Own evidence + allowed thread | Case-scoped, audited grant |
| Found report | Create with throttle | Read own linked reports | Own limited report credential | Case-scoped |
| Owner reassignment | Deny | Initiate only verified transfer | Intended recipient accepts | Cannot bypass transfer protocol |
| Session/challenge/rate bucket | Deny | API-controlled only | API-controlled only | No routine UI access |

Use a dedicated `reeklaim_runtime` database role with no `SUPERUSER`, `BYPASSRLS`, role creation, schema creation or migration rights. FORCE ROW LEVEL SECURITY on protected tables. Backend starts a transaction and sets a local actor identifier from its verified session; do not trust a request body or header for that identifier. RLS expressions read that context; do not assume Supabase `auth.uid()` is populated by a custom wallet cookie. Connection-pool reuse must not leak identity: SET LOCAL within every transaction, rollback on errors, deny reads when context is absent.

The browser has no private database grants or DB credentials. If a Supabase anon key is present for unrelated public features, its role still has no private table access. Migration role is separate. Supabase Storage service-role secrets, if needed to issue signed URLs, are server-only and bypass policy: enforce case authorization, bucket/key allowlists and short expirations before every call. Prefer server-mediated evidence reads where revocation must be immediate; already-issued URLs remain valid until expiry. Never use service-role access as a substitute for database authorization.

## Transactional invariants

- Normalize addresses using the official SDK and enforce native testnet configuration. Prefix `qor` does not distinguish mainnet from testnet.
- UNIQUE(chain_id, hash) on receipts; a hash cannot authenticate two sessions or pay for two operations. A separate operation/challenge binding prevents semantic reuse.
- Challenge consumption, receipt association, account upsert and session creation happen in one DB transaction after independent verification. Lock the challenge; conditional update requires unused/unexpired and matching pre-session/intent. Concurrent second request fails.
- A partial unique index on active approved/disputed claims per item prevents two parallel recoveries. Lock item and claim rows and check versions before transition.
- Owner changes only through a transfer-specific service with both wallet consents and unique verified receipts. A generic item update must not accept `owner_id`, commitment or receipt fields.
- Monetary columns have nonnegative CHECK constraints and bounded configured maxima. Store currency `uqor`, chain and treasury snapshot with every paid intent.
- Chain confirmation plus SQL commit is not a distributed atomic transaction. The durable operation reconciles chain success after DB/HTTP failure; no automatic re-payment.

Indexes: owner/status/created for inventory; country/city/category/kind/date plus cursor id for approved listings; PostgreSQL full-text index on safe text; claim participants/state; report item/time; session digest/expiry; receipt hash; notification owner/read state. Search suggestions are deterministic category + coarse city relevance in MVP, not paid AI similarity.

## Evidence, retention and recovery

Private originals remain private; decode, re-encode, strip EXIF and moderate a separate public derivative. Encrypt private structured fields with a server-managed versioned AEAD key, unique nonces and key backups. This is server-readable storage encryption, not end-to-end or post-quantum encryption. Random salted evidence commitments use domain-separated canonical encoding; salts remain private and random, never derived from a phone/serial.

Proposed defaults: challenges expire after 5 minutes, purge bodies after 24 hours; revoked/expired session tokens purge after 30 days; rate-limit identifiers expire within 24 hours; rejected/closed claim evidence and coordination messages purge after 30 days unless a documented dispute hold applies; inactive anonymous reports expire after 30 days. Let owners delete off-chain records; retain minimal operation/receipt and necessary abuse audit metadata with a disclosed policy. On-chain data is immutable and cannot be deleted. Final retention notice and jurisdiction review are release gates.

Use migration rollback plans, an encrypted local export for the demo database and a restore rehearsal. Never put backups, encryption keys or real user evidence in Git. Test two simultaneous challenge verifications, cross-user reads, empty actor context, pool reuse, duplicate receipts, competing claim approvals and reconciliation after simulated DB failure.
