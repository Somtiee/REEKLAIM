# Execution phases and acceptance gates

Current execution note (19 November 2026): the user authorized Phase 5 marketplace, reporting and search after the Phase 4 local registration implementation. See PHASE_5_REPORT.md and MARKETPLACE_DESIGN.md. The historical numbered plan below uses different names. Genuine live verification and deployment eligibility remain pending. Do not proceed automatically to Phase 6.

## Phase 0 — research and architecture (complete)

Dependencies: user brief and readable official sources. Work: inspect empty workspace, research every mandatory link and previews, inspect official published packages and scaffold, produce the 15 requested documents plus a factual evidence manifest.

Acceptance: all requested files present; source/version/retrieval limitations recorded; package integrity verified; real CLI template probe observed; all future gates measurable; no claimed live wallet/contract/transaction success. Evidence: [manifest](research/phase0-evidence.json) and [source register](SOURCE_REFERENCES.md). Implementation is not part of this phase. Human review of proposals remains useful but is not falsely recorded as completed.

## Phase 1 — integration feasibility and retained scaffold (12–20 hours)

Dependencies: Phase 0; G1 test-only real QoreX, G2 organizer interpretation and G5 endpoint access for the final architecture decision. Human uses official faucet and never shares wallet secrets.

Work: generate `apps/web` with official pinned `fullstack-web`; record command, package integrity/version and baseline hashes, preserve React/Vite/SDK code lineage; inspect resolved installed dependencies and create lockfile; add direct native adapter and server read proxy. Recheck all network settings. Exercise an explicitly approved self-send and inspect actual chain receipt schemas before coding security parsers. Ask the human to obtain G2 clarification; no agent sends messages externally on its own.

Acceptance:

- Genuine CLI output and retained baseline exist in the actual repo; no unrelated replacement scaffold.
- Actual extension version/browser/capabilities and account key type recorded without secrets; wrong/mainnet account rejected.
- QoreX approves a diana native send; independently observed committed code=0, expected signer/messages and hybrid extension/event saved.
- Server reaches RPC/REST consistently; exact gas/key registration behavior and memo preservation understood.
- Organizer confirms native deployment or a meaningful supported contract branch is chosen and proven feasible. Until then category compliance remains open.

Gate: no full product build around assumed signing support. Failure fallback: document cause, continue original UI specification/isolated fixtures, keep dependent authentication/deployment claims blocked. If native-only is rejected, add the 20–40-hour contract branch, test registry invariants and prove supported interaction before proceeding. No secret export from end users.

## Phase 2 — authenticated server foundation (16–24 hours)

Dependencies: Phase 1 wallet/receipt shape; PostgreSQL available locally or through eligible free project. Implement custom challenge/session services, atomic nonce consumption, network-bound verifier and durable operation framework. Add fixed-origin configuration, CSRF, cookies and rate limits.

Acceptance:

- Real wallet approved challenge issues an opaque cookie only after independent chain validation.
- Wrong signer/domain/session/chain/amount, extra messages, forged hash/event, expiry and replay all fail.
- Concurrent nonce submissions create at most one authenticated session; failed DB transaction creates none.
- Logout/revocation, idle/absolute expiry, account-change recheck and secret redaction work.
- Frontend bundle contains no DB/service-role/session/encryption credentials; production has no mock-auth path.

Gate: no private dashboard data or write operations until all authorization-negative tests pass. Authentication test runs remain testnet-only and require wallet consent each time.

## Phase 3 — registration and recovery core (22–30 hours)

Dependencies: Phase 2; G3 user-provided treasury for paid registration. Implement migrations/RLS, item draft/intents, salted commitments, receipt finalization, random QR tags, anonymous reports, private evidence, case state machine and basic coordination.

Acceptance:

- Real registration fee goes only to approved testnet treasury; amount/memo/signer checked; one paid intent finalizes once and reconciles after simulated DB failure.
- An independently random public tag scans without wallet and reveals no personal/private data; invalid/rotated tags handled.
- Owner sees report, reviews claim, approves/rejects, coordinates, confirms return with truthful acknowledgement mode; history persists.
- Anonymous report token cannot act as account/owner; cross-user/evidence access denied; malicious uploads quarantined/rejected.
- Competing approvals, stale actions, unauthorized owner changes and disputed-case handovers fail.

Gate: no public demo of private evidence until authorization and upload processing tests pass. Missing treasury disables paid operations; it never selects an arbitrary address.

## Phase 4 — consumer product interface (22–30 hours)

Dependencies: Phase 3 service contracts; some original UI components can begin after Phase 1 proof. Build landing, directory/details/suggestions, dashboard/settings/notifications/history, QR download/print and complete loading/error/empty states. Retain original implementation and design credits.

Acceptance:

- Every navigation/CTA works or clearly marks a deferred feature; no fake metrics/testimonials/partnerships.
- Lost/found search plus category/country/city/date filters and pagination work with approved public projections.
- All requested inventory categories and private/public preview steps work; balances and receipts reflect actual data or honest unavailable states.
- Light/dark, 360/768/1440px, keyboard focus, form errors, reduced motion, contrast and screen-reader checks documented.
- Printed QR is decoded from a physical or realistic print sample and resolves the deployed/local canonical route as appropriate.

Gate: no fabricated populated dashboard presented as user data. Fixture mode is visibly labeled and cannot issue verified receipts.

## Phase 5 — security, reliability and deployment (16–24 hours)

Dependencies: Phases 2–4; G4 eligible free host/database, G5 endpoint reads and G2 accepted deployment model. Use Vercel-compatible static/Node packaging; select host only after checking free-plan terms. Configure private secrets and canonical origin through host settings.

Acceptance:

- Unit/integration tests cover amount boundaries, transition guards, signer/receipt validation, replay races and RLS. Mock Playwright covers product journeys and rejected prompts; manual real-extension run remains separate.
- Deployed API verifies real diana receipt, secure cookie attributes/CSRF, deep links, persistence, upload permissions and free-tier limits.
- Independent wrong-network and public-data leakage checks pass; no production secret/mock bypass in build; dependency/license review recorded.
- Outage/index delay/broadcast timeout and DB-after-chain-failure recovery do not cause unauthorized access or double payment.
- Backup restore rehearsed, moderation/reconciliation runbook ready; actual native deployment evidence or meaningful contract deployment demonstrated according to G2.

Gate: fail release on private data leaks, authentication bypasses, unresolved duplicate-payment behavior, unsupported wallet flow or unmet deployment interpretation. Do not buy infrastructure to bypass $0 constraints.

## Phase 6 — submission package (12–20 hours)

Dependencies: Phase 5 and human eligibility/publication authority. Write comprehensive root README and actual MIT LICENSE; preserve upstream licenses/notices. Add real testnet addresses/hashes, verifier/explorer reproduction, limitations, setup, architecture, privacy/economy and test results. Prepare original featured image and video ≤180 seconds; update actual human/AI contributions.

Acceptance:

- Human confirms registration, age/team rules, category, event-original Git history and source ownership; public MIT repo is reachable.
- Clean-machine README setup succeeds without committed secrets; all dependencies/templates/design references credited.
- Featured image exists and video duration ≤180 seconds, showing real workflow and verifiable hybrid proof without wallet secrets/private evidence.
- Compliance table has linked actual artifacts, no placeholders mistaken for evidence; all final submission fields reviewed.
- Human submits before current deadline and saves submission acknowledgement; no unrequested mainnet voting or optional key-disclosure drill.

Gate: do not mark submitted based only on prepared files. External publication/submission needs the user's actual authorization. This task only prepared the plan.

## Optional phases after core proof

| Phase | Dependency | Effort | Acceptance |
|---|---|---|---|
| P1 transfer/reward | Core and treasury, real multi-message capability | 16–28 h | Both transfer parties approve same versioned intent; atomic reward and 2% fee exact and verified; failure rolls back, no escrow claim |
| P2 organization pilot | Stable core + explicit scope | 30–50 h | Owner/admin/staff permissions tested across two orgs; inventory, found management, recoveries and actual analytics; no cross-tenant access |

## Schedule and scope decisions

Core totals 100–148 hours. Suggested calendar: 18–20 November wallet/deployment/auth gates; 21–24 core data/recovery; 25–28 interface and security; 29–30 deployment/demo freeze; 1–2 December submission buffer. This assumes sustained daily availability and rapid resolution of human gates. Reduce organization/reward/transfer scope first; do not reduce authentication, privacy or genuine evidence. In Africa/Lagos the published deadline is 3 December 00:59 WAT. Recheck official schedule at release.
