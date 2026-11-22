# Phase 7 verified recovery and Diana payments

19 November 2026, Africa/Lagos.

- Return confirmation uses both verified case participants and the private coordination thread for appointment instructions. Resolution updates the linked item and public reports and retains the timeline. A reward is never required for completion.
- Transfers require an eligible registered item, its current owner, separate acceptance by the intended verified recipient and a verified transaction for the exact 0.05 test QOR fee. Settlement changes ownership in one transaction with receipt insertion, listing archive and old QR revocation. The original registration remains historical. The new owner receives clean metadata and can issue a new recovery tag.
- Voluntary rewards bind the finder from the resolved case. Finder principal is a fixed integer amount and the platform fee is an additional 2%, rounded down to a whole uqor. Five test QOR therefore quotes a total of 5.10 test QOR before gas. The 0.10 test QOR registration fee is preserved. Sign-in, reporting, claim submission and recovery confirmation have no application fee.
- The review screen displays the exact sends, addresses, treasury, gas disclosure, consent and receipt. The history includes the account’s registration and authentication receipts and participant-visible payment operations.
- The existing human-supplied treasury matches ignored local configuration. Production collection requires the explicit operator flag. A second flag gates atomic checkout for a nonzero reward fee until proven with a genuine human-approved QoreX test. Combined payments are disabled by default. A zero-fee reward can use one exact send.
- Timeout and failure paths retain the original intent and candidate hash. A transaction verifier checks both raw and REST data, Diana block context and hybrid proof, and rejects partial, wrong or duplicate settlement. Reservations never produce automatic wallet retries.

See the [fee rules, API and operator instructions](PAYMENTS_DESIGN.md). Migration 012 adds participant-scoped payment operations and receipts, item locking and the transactional ownership change.

## Results

TypeScript, ESLint and the production build passed. The unit and isolated PostgreSQL integration suite passed **155 tests**, with none skipped. Added tests cover integer rounding, refusal before consent, exact atomic message verification, wrong payer and destinations, partial sends, failed settlement, duplicate rewards, authorization, acceptance, retry after an indexing timeout, concurrent finalization, former-owner denial and QR invalidation. Synthetic fixtures do not broadcast. See [unit results](evidence/phase7/unit-results.json).

The mobile Chromium checkout passed against the built Node application. The test used a keyless wallet-interface fixture and shows checkout consent and the resulting synthetic receipt. The earlier development-server run timed out before rendering. See [browser results](evidence/phase7/browser-results.json), [mobile checkout](evidence/phase7/mobile-checkout-MOCK.png), and [mobile receipt](evidence/phase7/mobile-receipt-MOCK.png).

The eight official references returned HTTP 200. See the [reference metadata](evidence/phase7/references.json). Native QoreX uses the current installed integration’s encoded message list. Live atomic execution is still unverified.

## Live limits

No live wallet approval, payout, transfer or public deployment was performed. The two-party return confirmation is off-chain. A dedicated recovery code is optional and was not added. Known failures and reservations with an ambiguous chain outcome require manual reconciliation before a replacement. No escrow, automatic refund or reward guarantee is provided.

**PHASE 7 IMPLEMENTED — LIVE VERIFICATION PENDING**
