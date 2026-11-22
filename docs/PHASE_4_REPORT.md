# Phase 4 implementation report

Closed out 19 November 2026, Africa/Lagos. Tests ran 18 November. The local implementation is ready for a human-approved Diana testnet trial. Genuine authentication and registration receipts remain pending.

## Delivered behavior

- My Items includes category and status filters, an authenticated mobile registration wizard, private evidence and photos, a separate public photo, receipt and version history, editing, archiving and marking missing.
- Registration binds the authenticated wallet and a salted, versioned item commitment to one exact native payment of **100000 uqor (0.10 test QOR)**. Gas and possible first-use key registration are separate. The supplied treasury `qor1ez7wqp5ala5ph5nx95n6tdedrccsacqndfjgx3` passed SDK checksum validation and is configured locally. Other installations use server-only `REGISTRATION_TREASURY`.
- The server checks the exact raw transaction, successful Diana block inclusion, sender, treasury, amount, memo and hybrid signature evidence, including local ML-DSA verification. It commits the receipt, registered status and active QR tag in one PostgreSQL transaction. Authentication and registration share a unique receipt ledger. The original commitment is immutable and later edits create off-chain versions.
- An approval reservation survives reloads. Verification retries use the existing hash. Failed or expired intents require manual reconciliation if the hash cannot be recovered. This avoids offering another payment when the previous broadcast outcome is uncertain.
- A 256-bit random recovery token supports QR preview, SVG download, isolated printing, copy, sharing and revocation by rotation or archive. The wallet-free finder page displays only approved fields and accepts rate-limited anonymous one-way requests. Formal claims, replies and handover remain outside this implementation. Registration records a timestamped assertion. It cannot establish legal title or physical possession.

See [setup and live trial instructions](PHASE_4_SETUP.md) and [registration design](ITEM_REGISTRATION_DESIGN.md) for canonical encoding, encryption, authorization and reconciliation.

## Verification

| Check | Result |
|---|---|
| TypeScript, ESLint, production build | Passed |
| Unit and integration | 144 passed with none skipped, including real PostgreSQL 18.7 and synthetic chain receipts |
| Full Chromium regression | 48 passed with none skipped |
| Final screenshot and Phase 4 rerun | 7 passed |
| Built Node app | Guest restrictions, CSP, private-file denial and bundle secret check passed |
| QR | Both screen and print captures decoded to the expected synthetic URL |
| Dependencies | Runtime audit found zero advisories. The existing picomatch advisory affects the development toolchain. |

Tests cover cross-account access, duplicate receipt rejection across payment and authentication, wrong signer, treasury, amount, memo and chain, failed transactions, missing hybrid verification, retry after indexing delay, QR entropy and revocation, private field leakage and malicious uploads. Browser checks cover desktop and mobile in both themes and include automated accessibility checks.

Screenshots use synthetic records. See the [mobile wizard](evidence/phase4/wizard-390-light-MOCK.png), [desktop item and QR](evidence/phase4/registered-1440-dark-MOCK.png), [finder page](evidence/phase4/finder-mobile-MOCK.png), [print tag](evidence/phase4/print-tag-MOCK.png) and [evidence index](evidence/phase4/README.md).

## Live evidence and deployment

Genuine wallet approval, authentication and registration hashes, and canonical live receipts are pending. The user must approve each QoreX prompt. No test QOR was sent during this work. A loopback recovery URL is suitable for local browser testing. Scan testing from a separate phone requires an origin reachable from that phone.

The [Quantum Pass requirements](https://build.qorechain.io/prizes) still call for a testnet deployment. Native-only eligibility remains unresolved, and no official organizer clarification has been obtained. The [QoreX integration docs](https://docs.qorechain.io/developer-tools/qorex-integrations/) still list native broadcasting as supported and browser EVM sending as unavailable. The native registration path is implemented locally. The meaningful registry option remains conditional on organizer guidance and a supported deployment and interaction path. See [blockchain integration](BLOCKCHAIN_INTEGRATION.md) and the [reference refresh](evidence/phase4/reference-refresh.json).

PHASE 4 IMPLEMENTED — LIVE VERIFICATION PENDING
