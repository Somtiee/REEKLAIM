# Product requirements

## Phase 4 delivered slice — 18 November 2026

Authenticated private inventory, multi-step drafts, all ten requested category groups, optional private evidence/photo and separate public photo, versioned salted commitments, exact 0.10 test QOR registration intents, verification-only activation, random rotatable tags, SVG download/isolated print, public finder projection, anonymous one-way contact intake, private receipt/version history, edit/archive/mark-missing are implemented locally. Live wallet acceptance remains pending. Full directory publication, claims/replies/handovers, rewards, transfer and organizations remain future phases; no public scan can change ownership. [Current report](PHASE_4_REPORT.md).


ReeKlaim — **Find what's lost. Prove what's yours.**

## Users and priorities

The hackathon centers on individuals and finders. Families and pet owners can use ordinary single-account item records; no shared custody is implied. Universities, schools, airports, airlines, hotels, transport operators, events and businesses are future organization customers. Institutional logos or adoption must not be invented.

| Priority | Capability | Acceptance criteria |
|---|---|---|
| P0 | Landing | Original responsive explanation, register/QR/report/recover steps, directory entry, fee table, privacy/safety, FAQ and real product preview; no fake social proof |
| P0 | QoreX sign-in | Connection is visibly separate from verified identity; server-tested challenge, wrong-network denial, rejection/expiry recovery, logout and fee disclosure |
| P0 | Register belonging | All requested categories available; cryptographically random internal ID and separate public recovery token; draft only until independently verified anchor/payment; timestamp, status and receipt |
| P0 | QR | Encode canonical HTTPS recovery URL; owner download and print; anonymous scan works; no owner address/contact exposed by the page; damaged/rotated tag has safe state |
| P0 | Found report | Optional safe description + country/city; no wallet required; rate limits, acknowledgement and limited report continuation token; owner notified in app |
| P0 | Directory | Lost/found tabs; search; category/country/city/date filters; moderated photo, status, optional testnet reward; listing detail and simple category/city suggestions |
| P0 | Claims and return | Authenticated claims with private evidence; authorized approval/rejection; coordination thread; dispute freeze; actor-bound return confirmation and recovery history |
| P0 | Dashboard | Wallet + verified session + live/stale balance state; belongings/missing/found/claims/history; in-app notifications, actual transactions and privacy preferences; mobile navigation |
| P0 | Trust and safety | Per-resource authorization, reporting/moderation, hidden distinguishing details, no PII on-chain and no legal-title assertion |
| P1 | Transfer | Current owner authorization and recipient acceptance with verified anchors; 0.05 QOR application fee; no unilateral server/client reassignment |
| P1 | Optional reward | Owner approval, integer amounts, 2% disclosed fee, atomic two-message transaction proven in real QoreX; no escrow |
| P2 | Organization portal | Inventory, found management, owner/admin/staff roles, recovery history and basic actual analytics after core proof |
| Future | Startup breadth | Family delegated access, bulk imports, multi-site teams, localization, advanced matching and institution integration |

P0 registration includes the proposed 0.10 testnet QOR fee only when a user-supplied treasury is configured. Without it, disable registration payment and explain configuration; no fallback donation address. P1 features must be omitted or visibly unavailable until their gates pass, not simulated as functioning.

## Item and listing fields

Categories: phones, laptops, wallets, keys, luggage, bags, documents, company assets, pets and other. Private owner record: name, category, description, evidence references, optional serial/receipt, optional private photos, preferences. Public projection: deliberately selected generic description/photo, status, country/city, date range and optional reward. Documents should never show legible IDs; pet listings should avoid home locations. Withhold distinguishing marks for claims.

Registration generates separate random identifiers, a canonical commitment, chain receipt and application timestamp. An item's physical existence and prior ownership remain unverified unless supporting review establishes more. Duplicate descriptions are allowed; a serial match is a review signal, not authority to steal an existing record.

## Core journeys

1. Owner selects QoreX, explicitly approves disclosed testnet authentication, receives a verified session, enters an item privately, previews the public card and fees, approves the registration transaction, waits for independent confirmation and prints the QR.
2. Finder scans without wallet installation, sees a minimal public card, sends a coarse found report and keeps an optional short-lived continuation credential. Contact details are optional, private and never automatically shared. Owner gets an in-app notification.
3. Owner/finder coordinate in the permitted thread. A claimant answers private distinguishing questions and uploads evidence. The relevant authorized owner or found-report custodian reviews; self-approval and cross-item evidence access are denied.
4. Owner approves a recovery case; both sides confirm physical return when possible. Anonymous finder can acknowledge via the limited report credential. Owner-only closure is labeled as such if the other side is unavailable. Return is never an ownership transfer. Disputed cases freeze mutations and rewards.

## Recovery state machine

Separate item status from claims. Item statuses: `registered`, `missing`, `recovery_pending`, `returned`, `archived`. Found reports have `open`, `matched`, `closed`, `hidden` independently; scanning alone never marks an item returned or changes its owner.

| Claim transition | Actor and conditions | Side effects |
|---|---|---|
| none → submitted | Verified claimant, non-owner, eligible listing; or owner opens a case from an anonymous found report | Private evidence and participants bound to this case |
| submitted → under_review | Authorized record owner/custodian | Read only relevant case evidence |
| under_review → approved | Reviewer is not claimant; item/case locked; no other approved active case | Set `recovery_pending`; allow coordination |
| submitted/under_review → rejected | Authorized reviewer, reason | No owner/status reassignment; evidence retention clock |
| submitted/under_review → withdrawn | Claimant | Close case; no return event |
| approved → disputed | Either participant, reason | Freeze handover/transfer/reward |
| disputed → approved/rejected | Authorized moderator with recorded resolution and no self-interest | Audited resolution, not automatic legal adjudication |
| approved → returned | Owner confirmation plus other-party acknowledgement, or explicitly labeled owner-only closure after review | Item `returned`, close listing, record confirmation mode |

All transitions require server authorization, expected row version and a DB transaction. Invalid/stale actions return conflict. A single approved case per item is enforced in the database. Owner may mark an ordinary registered item missing; only a completed case may produce a recovery-history return. An owner finding their own missing item uses a labeled self-recovery action, not a fabricated finder claim.

## Nonfunctional acceptance

Test at 360, 768 and 1440 CSS px, keyboard-only and reduced-motion settings. Meet WCAG 2.2 AA targets; check contrast, semantics, focus and error announcement. Public routes remain useful when QoreX is absent. Pending receipts, empty inventory, stale balance, rejected wallet prompt, offline chain and expired sessions each have actionable UI. Target public LCP under 2.5 seconds in a documented mobile lab profile; record measured results instead of claiming compliance beforehand.

Public read queries are bounded and paginated. Mutations are validated and throttled. Every private resource is denied to another account in integration tests. No real personal belongings/photos or user evidence in demo fixtures. Display testnet labels at every payment/receipt entry point.

## Phase 6 claims and matching

Phase 6 adds explainable lost/found suggestions and a private intake, evidence review and handover workflow for a signed-in claimant and finder. Each claimant must select an owned published lost report. Both participants confirm a return. Claim approval does not transfer ownership or initiate a reward.

## Phase 8 workspace

The actor-scoped personal dashboard connects item, case and payment records with in-app notifications and preferences. Self-managed organizations support explicit invitations, role-controlled inventory and internal claim and recovery review. Organizations have no institutional verification badge.
