# Phase 1 report

**PHASE 1 IMPLEMENTED — LIVE VERIFICATION PENDING**

Date: 17 November 2026, Africa/Lagos. Technical foundation implemented and automated checks passed. No real QoreX account was connected, no transaction was signed/broadcast, no genuine transaction hash or hybrid receipt was obtained, and no app/contract was deployed. Phase 2 was not started. Full authentication persistence remains reserved for Phase 3 by the latest user instruction.

## Scaffold, environment and integration

The existing root contained Phase 0 documents and was preserved. Inspected Node 25.3.0/npm 11.4.1/Git 2.53.0. The official scaffolder's engine is Node >=20, so the initial CLI run was supported. For application/test tools, downloaded portable **Node 22.23.5**, SHA-256 verified against official Node distribution checksums; tested with **npm 10.9.9**. No global installation or system PATH changes were made.

The published CLI tarball for `create-qorechain-dapp@0.14.0` was SHA-512 checked against npm metadata. Ran `--help`, observed all seven available templates, chose `fullstack-web` and executed:

```powershell
node "$env:TEMP\reeklaim-phase1\official-cli\package\dist\index.js" "$env:TEMP\reeklaim-phase1\reeklaim-scaffold" --template fullstack-web --network testnet --package-manager npm --no-install --yes
```

Exit code 0; actual CLI output reported successful creation. Integrated generated files directly at `D:\REEKLAIM`, avoiding nested app directories. The generated `.env` was not copied; original scaffold README is retained separately. [Scaffold provenance](research/phase1-scaffold.json) records output and before-edit hashes. The existing React root/entry and Vite/TypeScript scaffold were extended, with the unrestricted development proxy replaced by a narrow server adapter. Git initialized on `main`; no commits, remote, publication or push created. MIT LICENSE added for original work, with Apache-2.0 template attribution preserved.

## Files created and modified

| Area | Files |
|---|---|
| Repository/scaffold | `.gitignore`, `.npmrc`, `.env.example`, `LICENSE`, `README.md`, `package.json`, `package-lock.json`, `index.html`, `tsconfig.json`, `vite.config.ts`, `src/main.tsx`, `src/vite-env.d.ts` |
| Original shell | `src/App.tsx`, `src/styles.css`, `src/components/Button.tsx`, `src/components/WalletCard.tsx` |
| Chain/domain | `src/lib/network.ts`, `amounts.ts`, `proof.ts`, `receipt.ts`, `api.ts` |
| Wallet/developer tools | `src/wallet/adapter.ts`, `WalletProvider.tsx`, `src/pages/ProofPage.tsx`, `server/chain.ts` |
| Checks/tooling | `eslint.config.js`, `vitest.config.ts`, `scripts/Use-Node22.ps1`, `scripts/check-network.mjs`, `tests/setup.ts`, `fixtures.ts`, `network.test.ts`, `receipt.test.ts`, `wallet.test.tsx`, `server.test.ts` |
| Updated documentation | `AGENTS.md`, `AI_USAGE.md`, `THIRD_PARTY_NOTICES.md`, `docs/BLOCKCHAIN_INTEGRATION.md`, `docs/HACKATHON_COMPLIANCE.md`, this report |
| Evidence | `docs/research/phase1-scaffold.json`, `phase1-reference-refresh.json`, `phase1-dependencies.json`, `phase1-http-checks.json`, `phase1-verification.json`, `scaffold-README.md`, `QORECHAIN-APACHE-2.0.txt` |

Other Phase 0 plans remain historical planning documents. Current implementation scope and phase sequencing are governed by the latest user instructions and this report. The file inventory in the verification manifest distinguishes previously existing documents from new/derived files.

## Installed official packages and decisions

| Package | Resolved version | Decision |
|---|---|---|
| `@qorechain/sdk` | 0.14.0 | Direct runtime dependency; inspected installed declarations/JS/network preset/units; native testnet configuration and address/denomination utilities |
| `@qorechain/qorex-types` | 0.1.0 | Direct runtime dependency; official native discovery/capability/broadcast APIs |
| `@qorechain/qorex-wallet-mock` | 0.1.0 | Dev-only; current profile, mainnet disabled, network blocked in tests |
| `@qorechain/qoresign` | 0.1.0 | Transitive dev dependency of the official mock; not a real-wallet SIWQ integration |
| `@qorechain/evm` | 0.14.0 | Transitive SDK dependency; no EVM transaction/contract path added |
| `@qorechain/pqc` | 0.2.3 | Transitive dependency, no user key generation/collection feature |
| `@qorechain/react` | Evaluated 0.14.0, not installed | Direct typed native provider is sufficient; avoid a second wallet state/signing model |
| QoreSign latest | Evaluated 0.2.0, not directly installed | Server SIWQ library availability does not establish released-wallet message signing; no unused direct crypto kit added |

Pinned direct versions plus resolved transitive versions/integrity in `package-lock.json`; [installed license inventory](research/phase1-dependencies.json) includes 311 packages with declared licenses. React 18.3.1 retained from scaffold. Build tools upgraded after inspecting engines/peers: TypeScript 5.9.3 (compatible with TypeScript ESLint), Vite 8.3.8/plugin-react 6.3.0, Vitest 5.1.0, jsdom 31.0.1; Zod 4.6.7 validates boundaries. No paid libraries/services enabled.

## Actual live endpoint observations

Through the running fixed backend at `2026-11-17T14:50:38.180Z` (**15:50 WAT**):

| Read | Actual result |
|---|---|
| Native RPC `/status` | Success; `qorechain-diana`, not catching up, height **10260959**, block time `2026-11-17T14:50:36.965801391Z` |
| REST `/cosmos/base/tendermint/v1beta1/node_info` | Success; `qorechain-diana` matched native RPC |
| EVM `eth_chainId` | Success; `0x2648` = **9800** |

These fresh observations supersede the selective Phase 0 403 results for these reads. No user wallet balance or actual account PQ registration was observed because no real wallet connected. Fixed balance/PQC handlers are implemented and their real-account responses remain a live acceptance check. HTTP source transformation and both app routes returned 200. Arbitrary proxy input was rejected, nonexistent broadcast route returned 404, production-preview receipt route returned 404 and POST returned 405. [Actual HTTP records](research/phase1-http-checks.json).

## Wallet integration capabilities

Implemented official `getQorexNative`, `hasCapability` and `qorexSignAndBroadcast` with typed adapter/context. Handles missing extension, connect/disconnect locally, pending approvals, public address, real-balance read/unavailable state, errors, wrong-network reads, account changes and unsupported capability. Rechecks account/network before each signature and on focus/periodic connected refresh because current docs report no wallet events. No MetaMask fallback or wallet secrets are accepted.

The developer proof is limited to a standard native coin-118 account and a fixed 1 uqor self-send with an original random memo. User reviews sender/recipient, amount, app fee zero, unknown final network fee and possible first-use key-registration cost before requesting QoreX approval. Backend reads only allowlisted official paths, rejects caller upstream overrides, non-loopback hosts/cross-site access and writes, disallows redirects, and bounds time/response size. There is no server broadcast route or deployment script.

## Hybrid proof verification and limits

The server requires successful committed receipt/positive height, exact hash/memo/single MsgSend/denom/amount/recipient, correct classical signer-derived address, 64-byte classical signature, exactly one ML-DSA-87 extension with algorithm 1 and 4,627-byte signature, plus a unique `pqc_hybrid_verify` event whose address/algorithm/status match. It separately retrieves RPC raw transaction bytes, matches their SHA-256/hash/height/success and decodes the raw payment/memo and compares its encoded PQ signature layer against the REST evidence. A wallet `shield` string never grants success.

This is independent official REST/RPC verification of validator-reported signature verification; it is not a local full cryptographic/consensus proof or an authentication verifier. The exact real wallet/receipt shape has not yet been observed, so parsing deliberately fails closed if it differs. An ordinary EVM transaction is never labeled hybrid by this page. Only actually verified results can be downloaded as proof. **Genuine ReeKlaim transaction hash: none. Hybrid on-chain evidence: none yet.** Synthetic fixtures are confined to tests, not stored as live evidence.

## Authentication capability check

Reviewed official current documentation and installed QoreX declarations: arbitrary signing is documented as refused; no supported third-party `signSiwq` wallet method is established; dashboard-only `connectProof` cannot be used by ReeKlaim. QoreSign signing functions are library APIs requiring wallet-held keys, not third-party extension methods. Real installed QoreX version/capabilities remain unknown because UI inspection could not proceed. Do not describe this as an observed rejection from the user's actual wallet.

No session, login cookie or identity privilege is granted from connection, a supplied address/hash, or developer proof. The [secure native challenge plan](AUTHENTICATION_DESIGN.md) remains selected: fresh server nonce bound to wallet/session/domain/testnet/expiry, exact explicitly approved self-send, independent verification, atomic consumption and secure cookies. Persistence and full authentication are reserved for Phase 3 by the current instruction. SIWQ prototype is conditional on a future genuine supported released-wallet signing flow.

## Automated and build results

| Check | Observed outcome |
|---|---|
| Dependency installation | 311 packages added with scripts disabled; lockfile generated; initial npm audit: 0 vulnerabilities |
| Type checking | Passed, including production-build `tsc --noEmit` |
| ESLint | Passed; final run recorded in verification manifest |
| Vitest | **4 files, 51 tests passed**; final run 16.96 seconds |
| Production build | Passed, 1,137 transformed modules; JS ~2,890.12 kB / gzip 578.42 kB; large-chunk warning remains |
| Dev HTTP | Root/dev route and transformed React source 200; real testnet health success |
| Production debug exclusion | Proof UI markers/public mnemonic absent from JS; preview receipt 404, write 405 |
| Browser visual/real-wallet check | **Not completed**: computer-use tool could not confidently determine Chrome's URL and stopped. No bypass attempted |

Tests cover network config/mainnet refusal, exact integer balances, detection/disconnected state, official-mock approval rejection/no broadcast, explicit-consent guard, capability/account change, synthetic receipt success/failure/wrong chain and missing/malformed/tampered hybrid evidence, plus fixed-proxy boundaries. No mock was funded or permitted a real network request.

Initial test-worker startup was denied by the sandbox (`spawn EPERM`); an approved local-worker run succeeded. One test initially attempted a mainnet switch that the official mock itself refused; it was corrected to simulate only the read result, keeping `allowMainnet:false`. An initial Windows encoding error in `index.html` was corrected to UTF-8 before the successful build. No unresolved test/compiler/lint errors remain. The large SDK bundle should be reduced before consumer launch; visual/responsive QA and actual browser execution remain pending.

## Start commands and manual approval boundary

```powershell
cd D:\REEKLAIM
. .\scripts\Use-Node22.ps1
npm.cmd run dev
```

Open [developer proof](http://localhost:5173/dev/qorechain). Follow the [README's manual QoreX steps](../README.md#manual-live-proof--user-approval-required): use a fresh native testnet wallet, fund via official faucet, connect, confirm network/balance, prepare the self-transfer, check consent and request approval. **The user must personally review/approve QoreX's final network fee and transaction.** Do not request private material. After approval, let the page independently verify and download the genuine proof JSON; if verification fails, retain the actual hash and diagnose rather than resend automatically.

The local dev server is left running for this handoff. No browser tab was successfully opened through automation. Port 5173 uses strict binding, so do not start a second copy. Stop with Ctrl+C in the owning process, or ask the agent to stop its local dev server. The separate production-preview check is stopped after verification.

## Remaining gates

1. User installs/unlocks/selects genuine QoreX Diana native account and approves a testnet proof; observe real version/capabilities/balance/PQ state.
2. Capture and independently verify an actual hybrid transaction; validate exact real event/extension schema and save genuine evidence.
3. Complete browser visual/responsive/runtime checks after the computer-use restriction is resolved or by human review.
4. Organizer clarification on native-only “deploy on testnet” remains a later compliance gate; this task did not deploy anything or add a decorative contract.
5. Future treasury, free hosting/database and event registration are not needed for the self-send page but remain product/release gates.

The technical foundation is reviewable and locally runnable. **Do not mark PHASE 1 COMPLETE until the required real-wallet and live-proof gates pass.**
