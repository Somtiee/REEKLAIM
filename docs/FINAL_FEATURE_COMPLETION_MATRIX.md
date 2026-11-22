# Final feature completion matrix

One row per Phase 9A audit feature. Status measures local functionality with actual evidence where available. Live and hosted gates are separate. Carried-forward rows use the Phase 9A local evidence and Phase 9B regression where covered.

| Area | Feature | Previous status | Current status | Changes, evidence and remaining limits |
| --- | --- | --- | --- | --- |
| Auth | Connect QoreX | IMPLEMENTED BUT LIVE VERIFICATION PENDING | IMPLEMENTED BUT LIVE VERIFICATION PENDING | Carried forward. Vincent reports connection; record released extension capability and reproduce securely. |
| Auth | Wallet detection | IMPLEMENTED BUT LIVE VERIFICATION PENDING | IMPLEMENTED BUT LIVE VERIFICATION PENDING | Carried forward. Verify installed extension across origins and browsers. |
| Auth | First-time signup | PARTIALLY IMPLEMENTED | IMPLEMENTED BUT LIVE VERIFICATION PENDING | Verified account stays on sign-in; new profile requires terms and precedes dashboard. Four synthetic desktop/mobile light/dark tests passed. Live receipt pending. |
| Auth | Existing user login | IMPLEMENTED BUT LIVE VERIFICATION PENDING | IMPLEMENTED BUT LIVE VERIFICATION PENDING | Completed profile sends bound account directly to dashboard. Genuine wallet proof pending. |
| Auth | Session restoration | PARTIALLY IMPLEMENTED | IMPLEMENTED BUT LIVE VERIFICATION PENDING | Same-tab hint permits passive authorized wallet read with valid server cookie. Released-extension restoration remains pending. |
| Auth | Logout | WORKING AND VERIFIED | WORKING AND VERIFIED | Carried forward. Server revocation has local coverage. |
| Auth | Wallet switching | PARTIALLY IMPLEMENTED | PARTIALLY IMPLEMENTED | Carried forward. Current detected mismatch revokes session; verify extension-specific change events and immediate UI clearing. |
| Auth | Wrong-network handling | WORKING AND VERIFIED | WORKING AND VERIFIED | Carried forward. Diana chain guard and local test coverage. |
| Auth | Real QOR balance | IMPLEMENTED BUT CONFIGURATION BLOCKED | WORKING AND VERIFIED | Fixed canonical origin error and obtained actual Diana balance response from the standalone app using the public treasury. Live extension balance UX remains unproven. |
| Auth | Protected dashboard access | IMPLEMENTED BUT LIVE VERIFICATION PENDING | IMPLEMENTED BUT LIVE VERIFICATION PENDING | Carried forward. Verify live wallet then exercise authorized dashboard. |
| Items | Register belongings | LOCKED BY FEATURE FLAG | LOCKED BY FEATURE FLAG | Carried forward. Private drafts work; production paid registration and real receipt still gated. |
| Items | Upload item images | WORKING AND VERIFIED | WORKING AND VERIFIED | Carried forward. Local ingestion and normalization verified. |
| Items | Upload private ownership evidence | WORKING AND VERIFIED | WORKING AND VERIFIED | Carried forward. Local encrypted evidence and access tests. |
| Items | Blockchain registration commitment | IMPLEMENTED BUT LIVE VERIFICATION PENDING | IMPLEMENTED BUT LIVE VERIFICATION PENDING | Carried forward. Local canonical binding; obtain one genuine anchored receipt. |
| Items | Registration payment | LOCKED BY FEATURE FLAG | LOCKED BY FEATURE FLAG | Carried forward. Treasury and production collection evidence gate. |
| Items | Registration transaction verification | IMPLEMENTED BUT LIVE VERIFICATION PENDING | IMPLEMENTED BUT LIVE VERIFICATION PENDING | Carried forward. Validate genuine registration receipt and indexing behavior. |
| Items | My Items | WORKING AND VERIFIED | WORKING AND VERIFIED | Carried forward. Authorized local inventory. |
| Items | Item details | WORKING AND VERIFIED | WORKING AND VERIFIED | Carried forward. Authorized local detail. |
| Items | Edit item | WORKING AND VERIFIED | WORKING AND VERIFIED | Carried forward. Local edit/version tests. |
| Items | Archive item | WORKING AND VERIFIED | WORKING AND VERIFIED | Carried forward. Local archive tests. |
| Items | Transfer ownership | LOCKED BY FEATURE FLAG | LOCKED BY FEATURE FLAG | Carried forward. Production collection disabled; complete recipient acceptance and genuine settlement. |
| Items | Mark an item as lost | WORKING AND VERIFIED | WORKING AND VERIFIED | Carried forward. Owner-scoped missing action. |
| QR | Generate unique QR code | IMPLEMENTED BUT LIVE VERIFICATION PENDING | IMPLEMENTED BUT LIVE VERIFICATION PENDING | Carried forward. Local QR verified; real issuance depends on genuine registration. |
| QR | Download QR code | WORKING AND VERIFIED | WORKING AND VERIFIED | Carried forward. Fixture SVG download verified; live tag issuance tracked separately. |
| QR | Print QR tag | WORKING AND VERIFIED | WORKING AND VERIFIED | Carried forward. Fixture print verified. |
| QR | Copy recovery link | WORKING AND VERIFIED | WORKING AND VERIFIED | Carried forward. Browser interaction verified within local fixture coverage. |
| QR | Public QR scan page | WORKING AND VERIFIED | WORKING AND VERIFIED | Carried forward. Local minimal projection. |
| QR | Anonymous found-item reporting | WORKING AND VERIFIED | WORKING AND VERIFIED | Carried forward. Local anonymous rate-limited intake. |
| QR | QR regeneration | WORKING AND VERIFIED | WORKING AND VERIFIED | Carried forward. Local transactional rotation. |
| QR | QR invalidation | WORKING AND VERIFIED | WORKING AND VERIFIED | Carried forward. Local revoked tag denial. |
| Marketplace | Real lost-item listings | WORKING AND VERIFIED | WORKING AND VERIFIED | Carried forward. Database-backed local behavior. |
| Marketplace | Real found-item listings | WORKING AND VERIFIED | WORKING AND VERIFIED | Carried forward. Database-backed local behavior. |
| Marketplace | Create lost report | WORKING AND VERIFIED | WORKING AND VERIFIED | Carried forward. Draft and explicit publication locally. |
| Marketplace | Create found report | WORKING AND VERIFIED | WORKING AND VERIFIED | Carried forward. Draft and explicit publication locally. |
| Marketplace | Search | WORKING AND VERIFIED | WORKING AND VERIFIED | Carried forward. Bounded local search. |
| Marketplace | Category filtering | WORKING AND VERIFIED | WORKING AND VERIFIED | Carried forward. Local filter. |
| Marketplace | Geographic filtering | WORKING AND VERIFIED | WORKING AND VERIFIED | Carried forward. Local filter. |
| Marketplace | Date filtering | WORKING AND VERIFIED | WORKING AND VERIFIED | Carried forward. Local filter. |
| Marketplace | Reward filtering | WORKING AND VERIFIED | WORKING AND VERIFIED | Carried forward. Local filter. |
| Marketplace | Listing details | WORKING AND VERIFIED | WORKING AND VERIFIED | Carried forward. Local public projection. |
| Marketplace | Edit report | WORKING AND VERIFIED | WORKING AND VERIFIED | Carried forward. Owner-scoped local edit. |
| Marketplace | Archive or close report | WORKING AND VERIFIED | WORKING AND VERIFIED | Carried forward. Owner-scoped local transitions. |
| Claims | Submit ownership claim | WORKING AND VERIFIED | WORKING AND VERIFIED | Carried forward. Local case creation. |
| Claims | Upload supporting evidence | WORKING AND VERIFIED | WORKING AND VERIFIED | Carried forward. Local attachment authorization. |
| Claims | Intelligent item matching | WORKING AND VERIFIED | WORKING AND VERIFIED | Carried forward. Heuristic matching tested; no external AI required. |
| Claims | Match explanations | WORKING AND VERIFIED | WORKING AND VERIFIED | Carried forward. Safe local matching reasons. |
| Claims | Incoming claims | WORKING AND VERIFIED | WORKING AND VERIFIED | Carried forward. Local participant scope. |
| Claims | Outgoing claims | WORKING AND VERIFIED | WORKING AND VERIFIED | Carried forward. Local participant scope. |
| Claims | Request additional evidence | WORKING AND VERIFIED | WORKING AND VERIFIED | Carried forward. Local transition. |
| Claims | Approve claim | WORKING AND VERIFIED | WORKING AND VERIFIED | Carried forward. Local concurrent-approval coverage. |
| Claims | Reject claim | WORKING AND VERIFIED | WORKING AND VERIFIED | Carried forward. Local transition. |
| Claims | Withdraw claim | WORKING AND VERIFIED | WORKING AND VERIFIED | Carried forward. Local transition. |
| Claims | Dispute handling | PARTIALLY IMPLEMENTED | PARTIALLY IMPLEMENTED | Carried forward. Dispute and operator workflow exist; staffed moderation and auditable operational resolution not rehearsed. |
| Claims | Private communication | WORKING AND VERIFIED | WORKING AND VERIFIED | Carried forward. Local participant-only event/message coverage. |
| Recovery | Recovery case creation | WORKING AND VERIFIED | WORKING AND VERIFIED | Carried forward. Local approval and coordination. |
| Recovery | Finder coordination | WORKING AND VERIFIED | WORKING AND VERIFIED | Carried forward. Local participant-only flow. |
| Recovery | Owner confirmation | WORKING AND VERIFIED | WORKING AND VERIFIED | Carried forward. Local confirmation. |
| Recovery | Finder confirmation | WORKING AND VERIFIED | WORKING AND VERIFIED | Carried forward. Local confirmation. |
| Recovery | Recovery code | NOT IMPLEMENTED | NOT IMPLEMENTED | Carried forward. Optional handover code not shipped; QR acknowledgement is a different feature. |
| Recovery | Complete recovery | WORKING AND VERIFIED | WORKING AND VERIFIED | Carried forward. Local dual confirmation. |
| Recovery | Close marketplace listing | WORKING AND VERIFIED | WORKING AND VERIFIED | Carried forward. Local state synchronization. |
| Recovery | Recovery history | WORKING AND VERIFIED | WORKING AND VERIFIED | Carried forward. Local case/event timeline. |
| Payments | 0.10 QOR registration fee | LOCKED BY FEATURE FLAG | LOCKED BY FEATURE FLAG | Carried forward. Verify 100000 uqor receipt and operator approval before production collection. |
| Payments | 0.05 QOR ownership transfer fee | LOCKED BY FEATURE FLAG | LOCKED BY FEATURE FLAG | Carried forward. Verify 50000 uqor and recipient consent. |
| Payments | Optional finder reward | LOCKED BY FEATURE FLAG | LOCKED BY FEATURE FLAG | Carried forward. Production collection gate and live reward proof. |
| Payments | 2% finder reward processing fee | LOCKED BY FEATURE FLAG | LOCKED BY FEATURE FLAG | Carried forward. Atomic reward-plus-fee gate requires genuine ordered sends in one transaction. |
| Payments | Testnet treasury configuration | IMPLEMENTED BUT CONFIGURATION BLOCKED | IMPLEMENTED BUT CONFIGURATION BLOCKED | Carried forward. Local address configured; release environment and control confirmation pending. |
| Payments | Real QoreX payment approval | IMPLEMENTED BUT LIVE VERIFICATION PENDING | IMPLEMENTED BUT LIVE VERIFICATION PENDING | Carried forward. Vincent approval required. |
| Payments | Real transaction submission | IMPLEMENTED BUT LIVE VERIFICATION PENDING | IMPLEMENTED BUT LIVE VERIFICATION PENDING | Carried forward. Obtain genuine Diana result without signing on the server. |
| Payments | Blockchain receipt verification | IMPLEMENTED BUT LIVE VERIFICATION PENDING | IMPLEMENTED BUT LIVE VERIFICATION PENDING | Carried forward. Genuine native receipt and event evidence pending. |
| Payments | Payment reconciliation | IMPLEMENTED BUT LIVE VERIFICATION PENDING | IMPLEMENTED BUT LIVE VERIFICATION PENDING | Carried forward. Rehearse real delayed-index/expired intent flow without resend. |
| Payments | Transaction history | WORKING AND VERIFIED | WORKING AND VERIFIED | Carried forward. Local real DB projection tested. |
| Payments | Duplicate payment prevention | WORKING AND VERIFIED | WORKING AND VERIFIED | Carried forward. Local uniqueness and concurrency tests. |
| Dashboard | Actual user statistics | WORKING AND VERIFIED | WORKING AND VERIFIED | Carried forward. Actor-scoped local data. |
| Dashboard | Registered items | WORKING AND VERIFIED | WORKING AND VERIFIED | Carried forward. Local dashboard count. |
| Dashboard | Active lost reports | WORKING AND VERIFIED | WORKING AND VERIFIED | Carried forward. Local scoped projection; distinguish missing inventory from marketplace reports. |
| Dashboard | Found reports | WORKING AND VERIFIED | WORKING AND VERIFIED | Carried forward. Actor-scoped local data. |
| Dashboard | Claims | WORKING AND VERIFIED | WORKING AND VERIFIED | Carried forward. Actor-scoped local data. |
| Dashboard | Recoveries | WORKING AND VERIFIED | WORKING AND VERIFIED | Carried forward. Actor-scoped local data. |
| Dashboard | Notifications | PARTIALLY IMPLEMENTED | PARTIALLY IMPLEMENTED | Carried forward. In-app and on-demand matching; no background match delivery, email or push. |
| Dashboard | Transaction history | WORKING AND VERIFIED | WORKING AND VERIFIED | Carried forward. Local projections. |
| Dashboard | Profile settings | WORKING AND VERIFIED | WORKING AND VERIFIED | Carried forward. Local validated preferences. |
| Dashboard | Privacy settings | WORKING AND VERIFIED | WORKING AND VERIFIED | Carried forward. Local settings. |
| Dashboard | Account data export | WORKING AND VERIFIED | WORKING AND VERIFIED | Carried forward. Local owner-scoped export. |
| Organizations | Organization creation | WORKING AND VERIFIED | WORKING AND VERIFIED | Carried forward. Local self-managed tenant. |
| Organizations | Organization membership | WORKING AND VERIFIED | WORKING AND VERIFIED | Carried forward. Local explicit invite acceptance. |
| Organizations | Staff invitations | WORKING AND VERIFIED | WORKING AND VERIFIED | Carried forward. Local wallet-bound acceptance. |
| Organizations | Role management | WORKING AND VERIFIED | WORKING AND VERIFIED | Carried forward. Owner/admin/staff local role checks. |
| Organizations | Organization inventory | WORKING AND VERIFIED | WORKING AND VERIFIED | Carried forward. Local tenant inventory. |
| Organizations | Found-property management | WORKING AND VERIFIED | WORKING AND VERIFIED | Carried forward. Local custody tracking. |
| Organizations | Claims management | PARTIALLY IMPLEMENTED | PARTIALLY IMPLEMENTED | Carried forward. Internal custody review; personal claim evidence is outside organization access. |
| Organizations | Recovery management | PARTIALLY IMPLEMENTED | PARTIALLY IMPLEMENTED | Carried forward. Internal handover state; no tenant-linked personal recovery or payment workflow. |
| Organizations | Organization analytics | WORKING AND VERIFIED | WORKING AND VERIFIED | Carried forward. Basic tenant inventory status counts only. |
| Organizations | Tenant isolation | WORKING AND VERIFIED | WORKING AND VERIFIED | Carried forward. Local forced RLS and role tests. |
| General | Light mode | WORKING AND VERIFIED | WORKING AND VERIFIED | Carried forward. Browser coverage. |
| General | Dark mode | WORKING AND VERIFIED | WORKING AND VERIFIED | Carried forward. Browser coverage. |
| General | Mobile responsiveness | PARTIALLY IMPLEMENTED | PARTIALLY IMPLEMENTED | Carried forward. Seven width emulations; full gated/manual accessibility and performance still pending. |
| General | Working navigation | PARTIALLY IMPLEMENTED | PARTIALLY IMPLEMENTED | Header, hero and closing use unified onboarding. Additional gated entry points and linked journeys remain open. |
| General | Error states | PARTIALLY IMPLEMENTED | PARTIALLY IMPLEMENTED | Improved wrong-origin, backend and initial database messages. Full failure taxonomy remains open. |
| General | Loading states | WORKING AND VERIFIED | WORKING AND VERIFIED | Carried forward. Suspense and local loading states. |
| General | Database persistence | WORKING AND VERIFIED | WORKING AND VERIFIED | Carried forward. Isolated PostgreSQL migration and persistence verified locally. |
| General | Secure private storage | IMPLEMENTED BUT CONFIGURATION BLOCKED | IMPLEMENTED BUT CONFIGURATION BLOCKED | Durable adapter added and verified with isolated HTTP fixtures. Requires hosted private bucket, restore and retention validation. |
| General | Public privacy controls | WORKING AND VERIFIED | WORKING AND VERIFIED | Carried forward. Local public projection and moderation tests. |
| General | Abuse reporting | PARTIALLY IMPLEMENTED | PARTIALLY IMPLEMENTED | Carried forward. Intake/queues exist; production moderation ownership and runbook missing. |
| General | Documentation | PARTIALLY IMPLEMENTED | PARTIALLY IMPLEMENTED | Carried forward. Phase docs exist; stale UI copy and incomplete live/deployment evidence. |

**Local verification: 72 of 105 (68.6%).** Live signed flows, hosted readiness and qualification remain open.
