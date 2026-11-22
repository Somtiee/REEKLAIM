# Phase 6 secure claims, matching and recovery coordination

19 November 2026, Africa/Lagos.

## Delivered

- A private possible-matches dashboard compares an account’s own open lost listings with public found reports and explains its weighted scores. Users can compare reports, dismiss a suggestion or start a claim. Compatibility filters and a bounded candidate window limit irrelevant suggestions.
- The submission wizard captures relationship, ownership explanation, distinguishing traits, optional serial and details, and explicitly shared receipt or photo files. The found report’s existing custodian becomes the reviewer. Opening a case or approving a claimant does not transfer title or pay rewards.
- The participant inbox exposes recent claim activity. Findings, evidence requests, messages, moderator reports and return confirmations are reflected in a private timeline. Claim state transitions require the authorized actor and current revision. Database uniqueness and transactional locks enforce a single approval while preserving competing claims for separate review.
- The registered path decrypts the immutable initial snapshot, recomputes the commitment and envelope memo, and fetches and validates the original hybrid transaction using the existing canonical Diana verifier. Missing, invalid or unavailable evidence cannot produce a verified label. A private typed serial is compared only after that verification. Unregistered items rely on evidence-based human review.
- Proof and message data are encrypted at rest and segregated from public listings. File links bind the claim, file, actor and session for 60 seconds, with authorization at both signing and serving. Migrations 009–011 preserve earlier migration checksums.

See [API inventory, state rules and moderation commands](CLAIMS_DESIGN.md).

## Validation

- TypeScript, ESLint and production build passed. The existing large SDK chunk warning remains.
- The unit and integration suite passed **148 tests**, with none skipped. It includes real isolated PostgreSQL with synthetic wallet receipts. New cases cover false suggestions, insufficient narratives, cross-account claim and evidence access, public data leakage, invalid registration commitments, signature expiry, stale versions, competing approvals and two-party handover. Existing photo decoding tests cover malicious file inputs. See [unit results](evidence/phase6/unit-results.json).
- The supplied Hybrid Inspector link returned 404. The official workshop version and the other requested references returned HTTP 200. See [reference retrieval](evidence/phase6/references.json).
- The focused Chromium rerun passed all 13 authentication and claims cases. The new cases cover guest denial and the comparison-to-submission journey at 390 and 1440 pixels. See the [focused run](evidence/phase6/auth-claims-rerun.json), [mobile claim](evidence/phase6/claim-390-MOCK.png), and [desktop comparison](evidence/phase6/compare-1440-MOCK.png). Screenshots contain synthetic records.
- The final interface rerun passed all four targeted cases, including the claims captures and the 768px landing view. See the [final browser rerun](evidence/phase6/final-browser-rerun.json).
- The [full browser run](evidence/phase6/playwright-results.json) passed 49 of 54 cases. Four sign-in fixture timing failures and one landing image failure passed in the focused reruns. All 54 cases passed across the recorded runs. The complete run did not pass in a single invocation.
- The read-only moderation queue completed on the application database and returned no queued cases.

## Boundaries

The phase implements claim flows locally and does not depend on paid services. Genuine Diana receipt verification with an actual user wallet and authorization is still outstanding from the earlier phases. Synthetic receipts do not establish live network behavior, ownership or hackathon eligibility. The original chain recheck can return unavailable if historical signature-key data is inaccessible. No public deployment or on-chain claim action was performed.

Claims require a published lost report and a published found report at submission. Match confidence is a similarity score. A submitted claim or receipt does not establish factual ownership. The operator queue is local. Push and email notifications, automatic moderation, reward payout, and production retention policy are outside this phase.

**PHASE 6 COMPLETE**
