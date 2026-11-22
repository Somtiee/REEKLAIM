# ReeKlaim master plan

## Current implementation — 18 November 2026

The user subsequently authorized Phases 1–4. The genuine official scaffold, consumer UI, wallet-challenge/session foundation and item registration/QR services are implemented locally. Read `PHASE_4_REPORT.md` and `PHASE_4_SETUP.md` for the current state; the Phase 0 plan below remains historical. Real wallet/hybrid evidence, native-only event eligibility, public deployment and later recovery/transfer/organization workflows remain pending. No automatic Phase 5 work is authorized.


**Phase 0 planning complete — 17 November 2026, Africa/Lagos. Implementation and competition eligibility remain gated.**

ReeKlaim is a privacy-conscious lost-and-found product: register a belonging, attach a QR recovery tag, receive a safe found report, assess private evidence and coordinate return. Blockchain records an authenticated, timestamped assertion; it does not determine legal ownership, physical possession or the truth of a description.

## Decisions

| Decision | Selected approach | Reason and boundary |
|---|---|---|
| Frontend | Official `fullstack-web` scaffold, React + Vite + TypeScript; Tailwind, accessible primitives, Lucide | Retains an actual official baseline and avoids unnecessary EVM wallet dependencies |
| Backend | TypeScript Node HTTP handlers, deployable as Vercel functions; portable service modules | Sessions, authorization, private evidence and verification require a trusted server |
| Persistence | PostgreSQL, optionally Supabase Free database/private storage; custom wallet sessions | Durable nonce consumption and financial idempotency cannot live in process memory |
| Blockchain | Native hybrid `MsgSend` with versioned commitment memo, independently read back | Official QoreX native broadcast path is documented; EVM browser sends are reported unsupported |
| Authentication | Explicitly approved 1 uqor self-transfer challenge; zero application fee, separate gas | Off-chain SIWQ cannot presently be assumed available from released QoreX |
| Contract | Conditional meaningful registry, only if required and supported | Deployment wording needs clarification; CosmWasm uploads require governance and browser EVM writes conflict with current limits |
| Hosting | Local first; eligible free demo host, Vercel-compatible packaging | Public host eligibility and endpoint reachability are deployment gates, not assumed successes |

See [architecture](ARCHITECTURE.md), [authentication](AUTHENTICATION_DESIGN.md), [blockchain](BLOCKCHAIN_INTEGRATION.md) and [research](SOURCE_REFERENCES.md) for evidence and alternatives.

## Verified Phase 0 work

The initial `D:\REEKLAIM` directory had no project files, package installation or Git history. Official competition pages, mandatory documentation, repositories, Framer listings and linked preview content were reviewed. Browser web retrieval failed for some fest pages; direct HTTPS reads succeeded. Four official npm tarballs were downloaded to a temporary directory and checked against registry SHA-512 integrity values. Their distributed JavaScript/declarations were inspected. Nothing was installed as a project dependency.

The genuine `create-qorechain-dapp@0.14.0` CLI generated a temporary `fullstack-web` testnet probe with `--no-install`. This establishes template inspection, not completion of the final app's scaffold requirement. Phase 1 must generate and retain the real app baseline. [Evidence manifest](research/phase0-evidence.json) records versions, checksums and the actual command.

Read-only native RPC returned `qorechain-diana`, block `10259320`, block time `2026-11-17T14:11:28.337153803Z`, with `catching_up: false`. REST node-info also returned that network. Other REST paths and the EVM chain-ID request returned HTTP 403 from this environment. Those successes establish endpoint observation, not transaction success. No wallet, transaction, deployment or contract was exercised.

## Delivery boundary

**Hackathon critical:** genuine scaffold, real QoreX connection and cryptographic authentication, testnet deployment accepted by the category, a genuine verified hybrid transaction, one complete registration → QR → found report → recovery workflow, privacy and access controls, usable directory/dashboard, receipts, README, MIT LICENSE, credits, featured image, a video of at most 180 seconds and actual AI disclosure.

**After the core proof:** richer matching, ownership transfer, optional atomic rewards, broader moderation and dispute tools. Organizations follow only after the core gates. Future startup features include staff roles, family sharing, imports, inventory analytics, mobile apps, localization and institution integrations. No paid or mainnet feature enters this plan.

## Gate register

| Gate | Owner/action needed | Blocks |
|---|---|---|
| G1 Real wallet | Human installs/unlocks official QoreX, selects testnet and test-only account; supplies public address only | Live sign-in and on-chain proof |
| G2 Category interpretation | Human obtains organizer clarification: is a hosted native-only app with useful committed records a testnet deployment? | Claiming final Quantum Pass compliance |
| G3 Treasury | Human supplies testnet treasury address and confirms control; address prefix alone cannot distinguish networks | Registration/transfer fees and reward fee collection |
| G4 Free hosting/database | Human creates eligible free accounts and configures server secrets; no credentials in chat | Persistent public demo |
| G5 Network | Implementer establishes server reachability and live fee/feature reads; investigate observed 403 responses | Production verification and fee estimation |
| G6 Eligibility and source | Human confirms age, team size, event registration, repository ownership and original-work dates | Submission/publication |

These are implementation/release gates, not missing Phase 0 documents. G2 stays explicit rather than asserting that a contract is mandatory or unnecessary. If a meaningful deployable contract is required and no supported QoreX interaction path can be proven, stop that branch and obtain organizer guidance; do not add a decorative counter.

## Effort and schedule

Planning estimates, not delivery promises: core path **100–148 focused engineer-hours**, including integration spikes, security testing and demo packaging. Optional rewards/transfer add 16–28 hours; an original contract path adds 20–40 hours plus external waiting; organization portal adds 30–50 hours. One engineer at eight focused hours/day needs roughly 13–19 days for the core. Two registered team members may overlap UI and backend after integration gates, but wallet and deployment gates remain serial.

Today is 17 November. The currently published submission deadline is **3 December 2026, 00:59 WAT** (2 December, 23:59 UTC). Aim to freeze on 30 November, leaving 1–2 December for verification and submission. Scope is tight for one engineer. Protect the core path before adding startup breadth. Official dates/rules may change; recheck before submission. [Official rules](https://build.qorechain.io/rules).

## Phase 0 acceptance

- All 15 requested Markdown deliverables exist and agree on scope, money, network, auth and unresolved gates.
- Every mandatory reference is inventoried, including retrieval limitations and documentation contradictions.
- Exact official packages and available scaffold templates were inspected; experimental evidence is separated from implementation evidence.
- Every future phase has dependencies and measurable acceptance criteria.
- No complete application, secret, paid resource, mainnet operation, fabricated address or transaction has been created.

Detailed phase criteria and estimates are in [execution phases](EXECUTION_PHASES.md). Phase 0 is complete as an architecture/documentation phase; the product is not implemented, audited or submission-ready.
