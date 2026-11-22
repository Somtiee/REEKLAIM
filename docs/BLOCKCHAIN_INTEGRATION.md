# Blockchain integration

## Phase 4 implementation and deployment review — 18 November 2026

Registration uses exact native `MsgSend` of **100000 uqor** to the human-supplied, SDK-validated treasury **qor1ez7wqp5ala5ph5nx95n6tdedrccsacqndfjgx3** on Diana. `REGISTRATION_TREASURY` is optional server configuration with no default; missing configuration disables payment. Canonical `rk:reg:v1:` memos bind the owner, snapshot/version, treasury, fee, origin, time/height window and random intent. Independent raw/REST/block/key/event/local-PQ verification must succeed before atomically activating a QR tag. Auth keeps its separate exact self-send wrapper; both purposes share the replay ledger. [Registration design](ITEM_REGISTRATION_DESIGN.md).

All nine Phase 4 official references were refreshed over HTTPS with status/hash metadata in `evidence/phase4/reference-refresh.json`. Quantum Pass still asks for testnet deployment; no official organizer clarification of native-only eligibility has been obtained. EVM browser sending remains documented as unavailable in current QoreX integrations; source/typing inspection confirms native `signAndBroadcast` and the 256-byte memo bound. The meaningful original registry branch below remains conditional. No contract was added/deployed, no security bypass attempted, and no deployment path falsely marked tested. Native functionality is retained while the eligibility gate stays open. Genuine wallet approvals and transactions remain unobserved.

Explorer transaction links use the documented `/tx/{hash}` and explicitly instruct the user to select Testnet in the header. No invented network URL selector is used.


Research date: 17 November 2026. No wallet signing, contract deployment or ReeKlaim transaction has been performed.

## Phase 1 implementation update — 17 November 2026

The official `fullstack-web` scaffold is now genuinely generated and integrated at the repository root. Installed direct SDK 0.14.0/qorex-types 0.1.0 and development-only official mock 0.1.0; exact installed source was checked. SDK pulls EVM 0.14.0/PQC 0.2.3 transitively; the mock pulls QoreSign 0.1.0. QoreSign 0.2.0 and qorechain/react were evaluated but not directly installed. Historical Phase 0 package research below remains distinct from these resolved dependencies.

Implemented centralized Diana-only guards, typed QoreX provider/adapter, fixed loopback GET read backend and `/dev/qorechain` self-transfer proof. The original unrestricted Vite proxy was replaced; developer proof code is excluded from production and receipt API disabled in preview. Exact 1 uqor native self-send requires UI consent plus wallet approval. Independent server verification reads both REST and RPC, matches the signed raw-byte hash/payment and validates chain hybrid verdict evidence. It never authenticates a user.

Fresh actual RPC + REST reads succeeded as diana at height **10260959**, checked `2026-11-17T14:50:38.180Z`; EVM `eth_chainId` returned `0x2648` (9800). These reads supersede Phase 0's endpoint-specific failures. No real wallet balance/PQ state or transaction is claimed. All 51 automated tests passed; they use synthetic fixtures/the official mock, never live proof. Browser automation stopped because it could not determine Chrome's URL safely; installed real-wallet capabilities remain pending. Full authentication persistence is reserved for Phase 3 by the latest user instruction.

See [Phase 1 report](PHASE_1_REPORT.md), [scaffold provenance](research/phase1-scaffold.json), [HTTP evidence](research/phase1-http-checks.json), [verification summary](research/phase1-verification.json) and [installed dependencies](research/phase1-dependencies.json). **Status: PHASE 1 IMPLEMENTED — LIVE VERIFICATION PENDING.** No deployment or genuine ReeKlaim transaction hash exists yet.

## Exact official kit selection

| Kit | Verified published version | Planned use |
|---|---|---|
| `create-qorechain-dapp` | 0.14.0 | Required genuine CLI; select `fullstack-web` |
| `@qorechain/sdk` | 0.14.0 | Network configuration, native message encoding/reads and integer denomination utilities |
| `@qorechain/qorex-types` | 0.1.0 | Required native wallet discovery, capability checks, `qorexSignAndBroadcast` |
| `@qorechain/qoresign` | 0.2.0 | Server-side PQ verification research; SIWQ only when wallet support is proven |
| `@qorechain/qorex-wallet-mock` | 0.1.0 in official kit list | Development-only interface testing; reverify installed package before use |
| `@qorechain/qorex-synpress` | 0.1.0 in official kit list | Optional Playwright mock fixtures; real extension mode currently unavailable per docs |
| `@qorechain/evm` | 0.14.0 in official kit list | Conditional original-contract branch only; inspect/install if gate opens |

First four tarballs were downloaded and SHA-512 checked in Phase 0; their distributed source was inspected without project installation. Other rows are documented published versions, not inspected installed dependencies. All versions must be pinned/resolved and source checked in Phase 1. `@qorechain/react`, RainbowKit, Interchain Kit and cosmos-kit are not necessary for the selected direct native adapter. QoreSeal, Asset Kit, RDK, wallet-adapter and chain-bridge do not become required merely because they appear in the kit catalog.

CLI registry offers seven templates: `evm-solidity`, `fullstack-web`, `rollup-app`, `foundry`, `hardhat`, `viem-wagmi`, `cosmwasm`. `scaffold-eth-extension` appears as repository material but is not an advertised CLI template ID. The actual temporary probe command and file hashes are in [Phase 0 evidence](research/phase0-evidence.json). For the real app, retain a before/after baseline and README attribution rather than claiming the temporary probe is the delivered scaffold.

## QoreX capability boundary

| Surface | Source-confirmed behavior | ReeKlaim decision |
|---|---|---|
| Native | `enable`, `getKey`, `listAccounts`, encoded `signAndBroadcast` | Primary path; check actual installed runtime capability |
| Native `signDirect` | Requires an already-present PQ layer in current builds | Cannot build a normal user signing flow with this; secret PQ key stays in wallet |
| Native arbitrary message | `signArbitrary` present but refused | No assumed SIWQ/off-chain sign-in |
| Dashboard pairing | `connectProof`, `executeTransfer`, `executeRequest` origin restricted | Never use these third-party or spoof the dashboard origin |
| EVM | Accounts/chain/connect, switch only to wallet-selected network | No assumed `personal_sign`, typed-data signing or `eth_sendTransaction` |
| Events | Account/chain events not yet emitted per integration source | Re-read on focus/pre-sign; never rely on listener-only state |
| Identity/discovery | Native injection; EIP-6963 `network.qore.qorex`, no `window.ethereum` alias | Provider identity is a hint, not cryptographic proof |
| Tests | Mock has different rdns and additional planned functionality | Production never accepts mock proofs or a test bypass |

The integration page lists mobile 1.1.8, extension 0.3.8/Firefox 0.3.9 in its limitations section. These are documentation claims, not an observed installed wallet version. Workshop Guestbook prose describes EVM browser signing, which conflicts with the explicit integration limitations. Do not resolve that conflict by asserting a capability works. Prefer native Hybrid Inspector flow; test any newer released wallet before revising the matrix. [Integration docs](https://docs.qorechain.io/developer-tools/qorex-integrations/), [pinned provider source](https://github.com/qorechain/qorex-integrations/blob/bcb863fe457e3fe6eb825af6458d2430c7ac6c69/packages/types/src/providers.ts).

## Pinned network

| Setting | Value |
|---|---|
| Native chain | `qorechain-diana` |
| EVM chain | `9800` / `0x2648` |
| Consensus RPC | `https://rpc-testnet.qore.host` |
| REST | `https://api-testnet.qore.host` |
| EVM RPC | `https://evm-testnet.qore.host` |
| Native coin | `uqor`, exponent 6; 1 QOR = 1,000,000 uqor |
| Faucet | [Official faucet](https://dashboard.qorechain.io/faucet), human dashboard sign-in required |
| Explorer | [Official explorer](https://explore.qore.network), select Testnet; root currently defaults to mainnet |

`qor1` alone does not prove the network. Require chain identity from pinned node status plus wallet/testnet selection. Reject `qorechain-vladi`, EVM 9801 and all unsupported chains. Do not auto-switch using unsupported wallet-add-chain APIs. EVM uses 18 decimals, not the native six; native application amounts must never be sent through an EVM conversion accidentally.

Live read evidence: RPC block 10259320 and REST node-info reported diana; REST feature/wasm-parameter requests and EVM `eth_chainId` returned HTTP 403 in this environment. Thus EVM ID and upload policy are source-confirmed, not freshly verified live here. Resolve reachability before deployment. Docs advise first-use key registration and gas; do not hardcode historical fee estimates.

## On-chain versus off-chain

| On-chain, intentionally public | Off-chain, access controlled |
|---|---|
| Signer address, transaction time/height, amount/recipient, memo commitment | Owner profile, contact details, serials, receipts, private photos |
| Domain-separated item commitment and operation binding | Canonical record, random salt, public tag token mapping, ownership assertion review |
| Anchored handover/recovery assertion if explicitly approved | Claims, evidence grants, coordination messages, disputes, exact private location |
| Genuine PQ extension and verified event | Sessions, nonce/pre-session digests, consent logs, database state |

Commitments: SHA-256 over a versioned, unambiguous canonical envelope plus independent 32-byte random salt. Include operation type, random opaque record identity, expected owner/version and testnet binding. Do not expose public QR tokens as commitment input visible in the memo; keep locator and chain proof independent. Memo proposal `rk:reg:v1:<base64url digest>` or `rk:return:v1:<digest>` is ReeKlaim's own format, not a chain API.

Registration: create draft/intent, snapshot approved treasury and 100000 uqor application fee, show public preview and costs, ask QoreX to sign one bank send to treasury with commitment memo, then independently verify exact payer/recipient/amount/memo and hybrid proof before finalizing. No configured treasury means no paid broadcast. No personal data is sent in the memo. Return-confirmation application fee is zero; if an optional anchor requires a self-transfer, disclose gas and require separate approval. The core off-chain recovery confirmation remains usable without an undisclosed charge.

The chain commits a signed assertion, not an enforceable item registry. Server authorization determines active records and prevents app-level ownership changes. For later transfer, old owner signs the specific new-owner/version commitment; recipient separately authenticates and accepts the same intent before the server advances ownership. Old record/history remains immutable. A self-send cannot on its own enforce exclusive ownership globally.

## Receipts and verification

Implement one server verifier shared by authentication and operations, with stricter operation-specific allowlists. It retrieves `/cosmos/tx/v1beta1/txs/{HASH}` and raw transaction bytes through verified official read surfaces, checks committed code/height/hash, signer, exact expected messages, amounts, treasury, memo, event and hybrid extension. Never use a wallet `shield` string as proof. Require chain-emitted `pqc_hybrid_verify` status verified and expected signer attribution; examine both extension arrays without accepting duplicate/unknown hybrid layers. Local verification is additional defense where installed helpers support it, not a fabricated result. See [authentication verifier requirements](AUTHENTICATION_DESIGN.md).

Record network identity, tx hash, raw-byte digest, block height/time, expected operation, decoded send, extension type/algorithm, event attributes, verifier version, and independent REST/explorer check. Save sanitized actual JSON under `docs/evidence` only after a real operation. Current evidence contains no ReeKlaim transaction hash or contract address. Explorer links need a proven testnet route/selection; never fabricate a query parameter or assume root links select diana.

## Does native-only satisfy deployment?

[Quantum Pass prizes](https://build.qorechain.io/prizes) explicitly require deploy-on-testnet but do not explicitly require a contract. [Workshop overview](https://docs.qorechain.io/build-before-qday/overview/) describes native send-and-read apps as Quantum Pass learning material. **Inference:** native app functionality may qualify; **unresolved:** final submission checks might expect a contract/deployment address. Obtain written organizer guidance through a human before declaring compliance.

If a contract is required, propose an original `ReeKlaimRegistry` that enforces unique opaque registrations, controller ownership, versioned recovery anchors, two-step controller transfer and configured registration/transfer fees. It must be used by real product operations and covered by invariant tests; no decorative counter, token or unused deployment. Prefer Solidity/EVM because ordinary CosmWasm upload is documented governance-only. Use the genuine `hardhat` or `foundry` scaffold and a separate human-managed test-only coin-60 deployer. Opening a native hybrid EVM authorization window is distinct from an EVM transaction carrying a PQ signature.

Contract deployment is documented using QoreX to open a bounded window plus a local developer tool. This does not establish browser contract-write support. Do not give ReeKlaim user keys to deployment scripts. Before choosing this branch, prove a supported QoreX end-user write path or obtain organizer acceptance of a meaningful app-operated registry with explicitly documented trust. Restrict windows by blocks, count, value and target where supported; creation cannot use a target-only restriction that rejects deploys. Compile/test locally, deploy testnet only, record bytecode/artifact hash and actual address, then demonstrate useful interactions. If no safe supported path exists, record the blocker rather than downgrading authentication or copying keys.
