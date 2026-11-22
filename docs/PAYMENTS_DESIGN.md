# Phase 7 Diana payments and recovery

## Payment rules

| Action | Application fee |
|---|---:|
| Item registration | 100000 uqor (0.10 test QOR) |
| Registered item ownership transfer | 50000 uqor (0.05 test QOR) |
| Voluntary finder reward | Floor of 2% of principal, added to principal |
| Sign-in, reporting, claims, and return confirmation | Zero |

All payment arithmetic uses integer base units. Reward principal is between 1 and 100000000 uqor. A reward of 5 test QOR quotes a fee of 0.10 and a total of 5.10 before gas. A reward under 50 uqor rounds to zero fee, so the checkout can use one exact send. No funds are held on an advertised reward. The finder sees a receipt only after confirmed settlement.

The previously authorized registration treasury is reused from REGISTRATION_TREASURY or the local ignored runtime configuration. No address is invented. Production intent creation and wallet approval reservation require DIANA_PAYMENT_COLLECTION_APPROVED=yes after operator treasury and network verification. Existing hash reconciliation stays available when collection is disabled. Nonzero-fee rewards require DIANA_ATOMIC_REWARDS_VERIFIED=yes after a controlled live two-message QoreX trial. Leave it unset until that trial succeeds. There is no split-send fallback.

## Recovery, transfer and reconciliation

Both claim participants confirm the return. The encrypted case thread carries appointment and safe handover instructions. Resolution marks the linked item returned, updates the existing QR projection, closes both linked listings as recovered, and preserves the case timeline. A reward is optional and offered separately by the verified claimant to the original finder. Recovery completion itself is an off-chain participant record.

Transfer offers bind an eligible item version and a recipient with an existing verified wallet account. Only that recipient can accept, and only the current owner can prepare and authorize the fee. Pending transfer checkout prevents item edits and can be cancelled before a wallet approval is reserved. The final SQL transaction records the globally unique receipt, archives old public listings, revokes old tags, and changes the owner of the same item. The new owner receives clean private metadata and can generate a new QR tag. Original registration snapshots and the prior owner's private evidence stay private. Both participants can see the transfer receipt in their own transaction history.

The server prepares a randomized commitment over purpose, accounts, recipients and ordered sends, reference, expiry, exact origin and Diana. The browser validates the quote and prompts native QoreX only after consent and a durable approval reservation. The canonical server verifier checks raw and REST messages, payer, treasury, finder, denom, amounts, order, memo, successful block inclusion and local ML-DSA verification. It accepts no extra or partial sends. Both payment types share receipt uniqueness with authentication and registration. An identical repeated verification is idempotent.

A candidate hash is bound on first verification. The browser also keeps the returned hash for the current tab. A timeout, ambiguous extension response, insufficient funds or wallet refusal never causes a second automated send. Check wallet history and reconcile the original hash. A confirmed nonzero chain result records failure and prevents automatic replacement. A reservation without a recoverable hash, a stale finalization or a wrong bound hash requires operator reconciliation. There is no automatic refund or replacement mechanism.

## API

Authenticated GET /api/payments returns participant-scoped transfer and reward operations, plus the account's registration and sign-in receipts. POST /api/payments creates a reward or transfer offer. POST /api/payments/:id/accept, /cancel, /prepare, /approval and /verify perform the scoped actions with CSRF and rate limits. The web server never holds a signing key and does not broadcast. Migration 012 adds payment operations, RLS, the shared receipt association and atomic transfer/recovery functions.
