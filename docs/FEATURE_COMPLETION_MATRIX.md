# Feature completion matrix

Working means directly covered locally by source and this or earlier isolated runtime/test evidence. Authenticated Playwright uses fixtures. PostgreSQL integration proves local persistence/authorization. No live wallet proof is implied. The route, component, API and data dependencies in each section apply to the rows as appropriate. Rows that need blockchain beyond the shared live login gate state it explicitly. Browser UI verification for individual controls varies by available evidence.

## Auth

- Route: /sign-in, /app
- Component: SignInPage, WalletProvider, AuthProvider
- API: /api/auth/*, /api/account/profile
- Data: accounts, sessions, auth_challenges

| Feature | Actual status | Blocker or local evidence and remaining work |
| --- | --- | --- |
| Connect QoreX | IMPLEMENTED BUT LIVE VERIFICATION PENDING | Vincent reports connection; record released extension capability and reproduce securely |
| Wallet detection | IMPLEMENTED BUT LIVE VERIFICATION PENDING | Verify installed extension across origins and browsers |
| First-time signup | PARTIALLY IMPLEMENTED | Proof routes to app before onboarding; require one-time profile step after verified proof |
| Existing user login | IMPLEMENTED BUT LIVE VERIFICATION PENDING | Verify receipt with installed wallet; bypass profile for completed account |
| Session restoration | PARTIALLY IMPLEMENTED | Server restores cookie but wallet state starts empty; silently restore authorized same-wallet binding |
| Logout | WORKING AND VERIFIED | Server revocation has local coverage |
| Wallet switching | PARTIALLY IMPLEMENTED | Current detected mismatch revokes session; verify extension-specific change events and immediate UI clearing |
| Wrong-network handling | WORKING AND VERIFIED | Diana chain guard and local test coverage |
| Real QOR balance | IMPLEMENTED BUT CONFIGURATION BLOCKED | Align Host and origin; verify read paths and actual returned amount |
| Protected dashboard access | IMPLEMENTED BUT LIVE VERIFICATION PENDING | Verify live wallet then exercise authorized dashboard |

## Items

- Route: /app/items
- Component: ItemsPage
- API: /api/items/*, /api/private/evidence
- Data: items, item_versions, evidence, registration_intents

| Feature | Actual status | Blocker or local evidence and remaining work |
| --- | --- | --- |
| Register belongings | LOCKED BY FEATURE FLAG | Private drafts work; production paid registration and real receipt still gated |
| Upload item images | WORKING AND VERIFIED | Local ingestion and normalization verified |
| Upload private ownership evidence | WORKING AND VERIFIED | Local encrypted evidence and access tests |
| Blockchain registration commitment | IMPLEMENTED BUT LIVE VERIFICATION PENDING | Local canonical binding; obtain one genuine anchored receipt |
| Registration payment | LOCKED BY FEATURE FLAG | Treasury and production collection evidence gate |
| Registration transaction verification | IMPLEMENTED BUT LIVE VERIFICATION PENDING | Validate genuine registration receipt and indexing behavior |
| My Items | WORKING AND VERIFIED | Authorized local inventory |
| Item details | WORKING AND VERIFIED | Authorized local detail |
| Edit item | WORKING AND VERIFIED | Local edit/version tests |
| Archive item | WORKING AND VERIFIED | Local archive tests |
| Transfer ownership | LOCKED BY FEATURE FLAG | Production collection disabled; complete recipient acceptance and genuine settlement |
| Mark an item as lost | WORKING AND VERIFIED | Owner-scoped missing action |

## QR

- Route: /app/items/:id, /recover/:token
- Component: ItemsPage, RecoveryPage
- API: /api/items/*, /api/recover/*
- Data: items, QR projections, finder records

| Feature | Actual status | Blocker or local evidence and remaining work |
| --- | --- | --- |
| Generate unique QR code | IMPLEMENTED BUT LIVE VERIFICATION PENDING | Local QR verified; real issuance depends on genuine registration |
| Download QR code | WORKING AND VERIFIED | Fixture SVG download verified; live tag issuance tracked separately |
| Print QR tag | WORKING AND VERIFIED | Fixture print verified |
| Copy recovery link | WORKING AND VERIFIED | Browser interaction verified within local fixture coverage |
| Public QR scan page | WORKING AND VERIFIED | Local minimal projection |
| Anonymous found-item reporting | WORKING AND VERIFIED | Local anonymous rate-limited intake |
| QR regeneration | WORKING AND VERIFIED | Local transactional rotation |
| QR invalidation | WORKING AND VERIFIED | Local revoked tag denial |

## Marketplace

- Route: /explore, /reports/lost, /reports/found
- Component: Marketplace.tsx
- API: /api/market/*
- Data: market reports and photos

| Feature | Actual status | Blocker or local evidence and remaining work |
| --- | --- | --- |
| Real lost-item listings | WORKING AND VERIFIED | Database-backed local behavior |
| Real found-item listings | WORKING AND VERIFIED | Database-backed local behavior |
| Create lost report | WORKING AND VERIFIED | Draft and explicit publication locally |
| Create found report | WORKING AND VERIFIED | Draft and explicit publication locally |
| Search | WORKING AND VERIFIED | Bounded local search |
| Category filtering | WORKING AND VERIFIED | Local filter |
| Geographic filtering | WORKING AND VERIFIED | Local filter |
| Date filtering | WORKING AND VERIFIED | Local filter |
| Reward filtering | WORKING AND VERIFIED | Local filter |
| Listing details | WORKING AND VERIFIED | Local public projection |
| Edit report | WORKING AND VERIFIED | Owner-scoped local edit |
| Archive or close report | WORKING AND VERIFIED | Owner-scoped local transitions |

## Claims

- Route: /app/claims
- Component: Claims.tsx, matching.ts
- API: /api/claims/*
- Data: claims, claim events and evidence

| Feature | Actual status | Blocker or local evidence and remaining work |
| --- | --- | --- |
| Submit ownership claim | WORKING AND VERIFIED | Local case creation |
| Upload supporting evidence | WORKING AND VERIFIED | Local attachment authorization |
| Intelligent item matching | WORKING AND VERIFIED | Heuristic matching tested; no external AI required |
| Match explanations | WORKING AND VERIFIED | Safe local matching reasons |
| Incoming claims | WORKING AND VERIFIED | Local participant scope |
| Outgoing claims | WORKING AND VERIFIED | Local participant scope |
| Request additional evidence | WORKING AND VERIFIED | Local transition |
| Approve claim | WORKING AND VERIFIED | Local concurrent-approval coverage |
| Reject claim | WORKING AND VERIFIED | Local transition |
| Withdraw claim | WORKING AND VERIFIED | Local transition |
| Dispute handling | PARTIALLY IMPLEMENTED | Dispute and operator workflow exist; staffed moderation and auditable operational resolution not rehearsed |
| Private communication | WORKING AND VERIFIED | Local participant-only event/message coverage |

## Recovery

- Route: /app/recoveries, /app/claims/:id
- Component: Claims.tsx
- API: /api/claims/*
- Data: claims, claim events and item/report state

| Feature | Actual status | Blocker or local evidence and remaining work |
| --- | --- | --- |
| Recovery case creation | WORKING AND VERIFIED | Local approval and coordination |
| Finder coordination | WORKING AND VERIFIED | Local participant-only flow |
| Owner confirmation | WORKING AND VERIFIED | Local confirmation |
| Finder confirmation | WORKING AND VERIFIED | Local confirmation |
| Recovery code | NOT IMPLEMENTED | Optional handover code not shipped; QR acknowledgement is a different feature |
| Complete recovery | WORKING AND VERIFIED | Local dual confirmation |
| Close marketplace listing | WORKING AND VERIFIED | Local state synchronization |
| Recovery history | WORKING AND VERIFIED | Local case/event timeline |

## Payments

- Route: /app/transactions
- Component: Payments.tsx, wallet.ts
- API: /api/payments/*, /api/items/*
- Data: payment_operations, receipt ledger, registration intents

| Feature | Actual status | Blocker or local evidence and remaining work |
| --- | --- | --- |
| 0.10 QOR registration fee | LOCKED BY FEATURE FLAG | Verify 100000 uqor receipt and operator approval before production collection |
| 0.05 QOR ownership transfer fee | LOCKED BY FEATURE FLAG | Verify 50000 uqor and recipient consent |
| Optional finder reward | LOCKED BY FEATURE FLAG | Production collection gate and live reward proof |
| 2% finder reward processing fee | LOCKED BY FEATURE FLAG | Atomic reward-plus-fee gate requires genuine ordered sends in one transaction |
| Testnet treasury configuration | IMPLEMENTED BUT CONFIGURATION BLOCKED | Local address configured; release environment and control confirmation pending |
| Real QoreX payment approval | IMPLEMENTED BUT LIVE VERIFICATION PENDING | Vincent approval required |
| Real transaction submission | IMPLEMENTED BUT LIVE VERIFICATION PENDING | Obtain genuine Diana result without signing on the server |
| Blockchain receipt verification | IMPLEMENTED BUT LIVE VERIFICATION PENDING | Genuine native receipt and event evidence pending |
| Payment reconciliation | IMPLEMENTED BUT LIVE VERIFICATION PENDING | Rehearse real delayed-index/expired intent flow without resend |
| Transaction history | WORKING AND VERIFIED | Local real DB projection tested |
| Duplicate payment prevention | WORKING AND VERIFIED | Local uniqueness and concurrency tests |

## Dashboard

- Route: /app, /app/settings, /app/notifications
- Component: Workspace.tsx, ApplicationShell.tsx
- API: /api/workspace/*, /api/dashboard
- Data: account settings, scoped reports, claims, notifications

| Feature | Actual status | Blocker or local evidence and remaining work |
| --- | --- | --- |
| Actual user statistics | WORKING AND VERIFIED | Actor-scoped local data |
| Registered items | WORKING AND VERIFIED | Local dashboard count |
| Active lost reports | WORKING AND VERIFIED | Local scoped projection; distinguish missing inventory from marketplace reports |
| Found reports | WORKING AND VERIFIED | Actor-scoped local data |
| Claims | WORKING AND VERIFIED | Actor-scoped local data |
| Recoveries | WORKING AND VERIFIED | Actor-scoped local data |
| Notifications | PARTIALLY IMPLEMENTED | In-app and on-demand matching; no background match delivery, email or push |
| Transaction history | WORKING AND VERIFIED | Local projections |
| Profile settings | WORKING AND VERIFIED | Local validated preferences |
| Privacy settings | WORKING AND VERIFIED | Local settings |
| Account data export | WORKING AND VERIFIED | Local owner-scoped export |

## Organizations

- Route: /app/organizations
- Component: Organizations.tsx
- API: /api/workspace/organizations/*
- Data: organization, invitation, membership and inventory tables

| Feature | Actual status | Blocker or local evidence and remaining work |
| --- | --- | --- |
| Organization creation | WORKING AND VERIFIED | Local self-managed tenant |
| Organization membership | WORKING AND VERIFIED | Local explicit invite acceptance |
| Staff invitations | WORKING AND VERIFIED | Local wallet-bound acceptance |
| Role management | WORKING AND VERIFIED | Owner/admin/staff local role checks |
| Organization inventory | WORKING AND VERIFIED | Local tenant inventory |
| Found-property management | WORKING AND VERIFIED | Local custody tracking |
| Claims management | PARTIALLY IMPLEMENTED | Internal custody review; personal claim evidence is outside organization access |
| Recovery management | PARTIALLY IMPLEMENTED | Internal handover state; no tenant-linked personal recovery or payment workflow |
| Organization analytics | WORKING AND VERIFIED | Basic tenant inventory status counts only |
| Tenant isolation | WORKING AND VERIFIED | Local forced RLS and role tests |

## General

- Route: /, /explore, /app, /docs
- Component: Theme, Router, App, private storage middleware
- API: Same-origin API where applicable
- Data: PostgreSQL and encrypted volume where applicable

| Feature | Actual status | Blocker or local evidence and remaining work |
| --- | --- | --- |
| Light mode | WORKING AND VERIFIED | Browser coverage |
| Dark mode | WORKING AND VERIFIED | Browser coverage |
| Mobile responsiveness | PARTIALLY IMPLEMENTED | Seven width emulations; full gated/manual accessibility and performance still pending |
| Working navigation | PARTIALLY IMPLEMENTED | Most routes verified; duplicate auth CTAs and gated-flow redirects need consolidation |
| Error states | PARTIALLY IMPLEMENTED | Chunk retry works; origin and setup failures need actionable classification |
| Loading states | WORKING AND VERIFIED | Suspense and local loading states |
| Database persistence | WORKING AND VERIFIED | Isolated PostgreSQL migration and persistence verified locally |
| Secure private storage | IMPLEMENTED BUT CONFIGURATION BLOCKED | Encrypted server volume works locally; production durable private volume and restore missing |
| Public privacy controls | WORKING AND VERIFIED | Local public projection and moderation tests |
| Abuse reporting | PARTIALLY IMPLEMENTED | Intake/queues exist; production moderation ownership and runbook missing |
| Documentation | PARTIALLY IMPLEMENTED | Phase docs exist; stale UI copy and incomplete live/deployment evidence |

