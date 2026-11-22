# ReeKlaim contributor instructions

ReeKlaim — Find what's lost. Prove what's yours.

## Scope and source of truth

This repository contains Phase 0 planning and Phases 1–8 implementation. The user explicitly authorized Phase 4 and supplied the public registration treasury `qor1ez7wqp5ala5ph5nx95n6tdedrccsacqndfjgx3`, validated and configured only in ignored local runtime settings. Read docs/PHASE_4_REPORT.md, docs/PHASE_4_SETUP.md and docs/ITEM_REGISTRATION_DESIGN.md before further work. The user explicitly authorized Phase 5 marketplace and reporting. Read docs/PHASE_5_REPORT.md and docs/MARKETPLACE_DESIGN.md. The user explicitly authorized Phase 6 claims and matching. Read docs/PHASE_6_REPORT.md and docs/CLAIMS_DESIGN.md. Phase 7 was authorized and implemented locally. See docs/PHASE_7_REPORT.md and docs/PAYMENTS_DESIGN.md. Phase 8 was authorized and implemented locally. See docs/PHASE_8_REPORT.md and docs/WORKSPACE_DESIGN.md. Do not proceed automatically to Phase 9. Real QoreX capability/approval and genuine authentication/registration receipts remain pending; fixtures never close that gate. Native-only hackathon deployment eligibility remains unresolved. Preserve the Phase 2 design system, Phase 3 authentication, original adapter and Diana guards. .local contains private database files/credentials and must never be committed or served. Never edit applied migrations; add the next numbered file.

## Non-negotiable constraints

- Budget $0: open-source tooling and eligible free tiers only. Never enable paid plans, metered billing, commercial AI services or purchased domains.
- QoreChain testnet only: native `qorechain-diana`, EVM `9800`; reject mainnet and other networks at browser, server and deployment boundaries. Use only the three testnet endpoints documented in the architecture.
- Only QoreX authenticates accounts. Connection, provider flags, an address, and a submitted hash are not authentication. Never accept MetaMask, email/password or Google as substitutes.
- Never request, receive, log, commit or store user recovery phrases, private keys or ML-DSA secret keys. Developer contract deployment, if needed, is a human-controlled isolated testnet workflow.
- Do not fabricate API names, SDK functionality, contract addresses, transaction evidence, partnerships, testimonials or usage figures.
- Use the genuine `create-qorechain-dapp` tool for the implementation. Preserve its generated baseline, command, version, hashes and modifications; do not replace it with an unrelated project and claim compliance.
- Recheck official documentation AND the resolved installed package source before using APIs. QoreSign library signing is not proof of a released QoreX signing capability. Mock tests are not live wallet evidence.
- Use integer `uqor` and decimal strings at boundaries. No floating-point money. No arbitrary treasury; paid features stay disabled until a human supplies a validated testnet address.
- All payments need explicit wallet approval. Disclose application fees, gas, and possible first-use key registration separately. No escrow claim without implemented and tested escrow.
- No personal data, raw evidence, serials, private image URLs or exact location on-chain. Random salted commitments are not encryption or anonymization.
- Registration is a timestamped ownership assertion, not legal title. Off-chain authorization and recovery decisions must enforce the state machine.
- Publish original work under MIT with a real LICENSE file at release. Preserve upstream Apache-2.0 obligations and maintain `THIRD_PARTY_NOTICES.md`, README credits and `AI_USAGE.md`.

## Engineering practices

Use TypeScript strict mode, React, server-side Zod validation and parameterized SQL. Server is the authorization boundary. Keep secrets outside `VITE_*`, public bundles, logs and version control. Use secure cookie sessions, CSRF defense, durable rate limits and fail-closed chain verification. Test cross-user access, replay races, tampered payments, receipt parsing, and forbidden state transitions before adding breadth.

Use `rg` for search. Keep diffs scoped. Do not discard user changes. Never deploy or transact to mainnet. Record dates, source revisions and limitations. Update the acceptance matrix with actual results, not aspirations. Do not run wallet mocks against a production verification bypass. Do not contact organizers, publish source, or send messages externally without explicit user instructions.

## Working sequence

Follow the dependency gates in `docs/EXECUTION_PHASES.md`. Prove the wallet/authentication/receipt vertical slice before building the full dashboard or organization portal. Stop dependent work when a gate fails; continue independent documentation or UI work with clearly labeled fixtures. Do not mark deployment or hybrid evidence complete until independently observed on testnet.
