# Testnet verification status

## Subsequent live sign-in report

Diana committed transaction `D590150FD678F0AEBA36FFE75F9F680C6D99BDDBFE47D51D1760351B647319CF` at block 10435720 with result code 0 and a verified hybrid event. The updated verifier independently validated the raw receipt and ML-DSA signature against the original local challenge in a read-only diagnostic. The challenge was already cancelled. This establishes live transaction verification and leaves live account creation and session issuance pending.

The later pending transaction also independently verified at height 10435766. The original signing window had closed. Retry accepts only a hash bound before that deadline while the same browser pre-session remains valid. The verifier still checks that the canonical block time satisfies the original challenge window. Cancelled challenges, fresh hashes submitted after the deadline, and revoked or expired browser sessions remain ineligible.

A subsequent local database check confirmed a real authenticated session and completed profile for the reported wallet. The session was revoked 16 seconds after issuance. Passive native-wallet refresh no longer treats an empty EVM account list or a temporary wallet read failure as an instruction to revoke a session. A fresh live sign-in after the fix still requires the owner's wallet approval.

Phase 9A observed genuine Diana health and a public balance read. Phase 9B retains the fixed endpoints, native qorechain-diana and EVM chain ID 9800. The post-Phase 9B authentication evidence is recorded above. A subsequent pre-publication check counted one authentication receipt and zero registration or other payment receipts in the local application database. Live paid registration, atomic rewards, and ownership transfer still need evidence. Synthetic wallet and receipt fixtures establish local behavior.

Keep DIANA_PAYMENT_COLLECTION_APPROVED and DIANA_ATOMIC_REWARDS_VERIFIED inactive. Complete each manual test in [Vincent's checklist](VINCENT_MANUAL_ACTIONS.md). Record successful canonical transaction bytes, height, code, exact ordered sends, hybrid extension or PQ signature evidence and pqc_hybrid_verify result. Use public-safe explorer links only after independent verification. Reconcile the same hash when indexing is delayed.

Quantum Pass calls for the scaffold, QoreX, testnet deployment and a hybrid-signed transaction. Whether the native architecture needs an original contract is unresolved. No organizer contact or contract implementation occurred. [Official criteria](https://build.qorechain.io/prizes) · [Rules](https://build.qorechain.io/rules) · [Hybrid Inspector](https://docs.qorechain.io/build-before-qday/workshop-1/apps/hybrid-inspector/)

