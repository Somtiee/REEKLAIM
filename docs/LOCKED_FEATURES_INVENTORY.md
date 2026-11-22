# Locked features inventory

| Class | Surface | Actual predicate or gap | Resolution |
| --- | --- | --- | --- |
| A | Signup / dashboard transition | SignInPage.verify navigates /app before profile. Returning user revisiting sign-in still sees the profile form. Frontend auth.bound depends on an in-memory wallet account. | Unify flow, branch on onboardedAt, restore authorized wallet binding and handle account changes. |
| A | Public balance messaging | createChainMiddleware Host refusal still says Phase 1 developer adapter. | Separate public chain reads and development proof policy; preserve authoritative same-origin restrictions. |
| A | Demo/preview copy and duplicate actions | Layout, LandingPage, PublicPages, Marketplace contain Get started, Connect QoreX and dated reward/claim availability copy. | One onboarding CTA, preserve independently labeled demo data and independent Explore. Make production availability reflect actual backend state. |
| A | Org claim/recovery work | Organizations.tsx and server/workspace/organizations.ts implement internal custody and tenant roles; not shared personal evidence/reward workflow. | Explicitly design scoped consent and case lifecycle if richer workflow is required. |
| B | Private app, reports, evidence and moderation | AuthProvider.bound UI gate; server independently requires valid cookie, actor scope, CSRF, participants and RLS. | Retain. Guest public routes and anonymous QR intake are intentional separate surfaces. |
| B | Button disabled conditions | Busy, invalid inputs, missing consent, wrong role/state, missing capability, expired intents, payment awaiting receipt, no tag before registration. | Retain and improve explanations. Audit failures separately from locked states. |
| B | Demo and developer proof | src/demo, InteractivePreview and fake datasets; production bundles exclude import.meta.env.DEV proof route and dev proof endpoint. Wallet mocks exist in tests. | Preserve explicit demo labeling and development-only proof; never enable mock auth in production. |
| C | Paid registration and transfer, finder rewards | REGISTRATION_TREASURY and production DIANA_PAYMENT_COLLECTION_APPROVED=yes required. Development config has treasury; hosted config and approved evidence absent. | Prove exact live receipts and human sign-off, configure hosted roles/keys and keep default off. |
| C | Durable evidence and moderation | Local encrypted disk, no hosted durable private storage or staffed queue, retention/restore unproven. | Choose Node with durable volume, or adapt managed private storage with equivalent ACLs. |
| D | All protected signed actions | QoreX connect can succeed before native approval. Registration, transfer, reward and sign-in depend on user approval and live receipts. | Human testnet approvals only. Retain exact intent, chain proof and idempotent reconcile. |
| D/E | Atomic reward plus 2% fee | DIANA_ATOMIC_REWARDS_VERIFIED=yes required for nonzero fee and multiple sends. | Prove extension supports both ordered messages in one successful hybrid receipt. No split or auto-resend fallback. |
| E | Off-chain hybrid auth and eligibility | Current official wallet surface lacks verified SIWQ signing; Quantum Pass native-only deployment acceptance unknown. | Use published native path and get written organizer clarification. No contract or escrow claim until required and implemented. |
| E | Optional roadmap surfaces | Escrow, standalone recovery code, native mobile apps, imports, family sharing, institution verification/integrations and external notifications are absent or future scope. | Explicitly decide scope. No promise based on placeholder or roadmap. |

Reviewed feature switches and states in src, server, Vite and migrations. The auth/verification test injection, first-phase proof tools and isolated examples are distinct from runtime account creation.

