# Source references and verification ledger

## Phase 4 reference refresh — 18 November 2026

All nine mandatory Phase 4 references were retrieved directly over HTTPS (HTTP 200) and their URL/status/body hashes recorded in `evidence/phase4/reference-refresh.json`. The web tool could read QoreX integrations but failed on fest prizes/rules; direct reads supplied those references. Installed QoreX types/source 0.1.0 and official SDK 0.14.0 were checked alongside documentation. Native broadcast and a 256-byte memo are documented; browser EVM writes remain unavailable. Explorer `/tx/{hash}` requires the Testnet header toggle.

The user has now supplied a public treasury, validated and configured locally. All other historical unresolved live/deployment/organizer gates below remain unresolved. No written organizer clarification was obtained and no external message sent. Full third-party pages were not vendored; the refresh retains retrieval metadata and review notes.


Reviewed 17 November 2026. Primary sources only for technical claims. “Verified” means the stated observation at the stated layer, never a claim that ReeKlaim has successfully integrated it. Official pages are mutable; repository links below pin the reviewed source revisions. Recheck the package actually installed and the live wallet before implementation.

## Mandatory competition resources

| ID | Source | Retrieval and finding |
|---|---|---|
| H1 | [Prizes](https://build.qorechain.io/prizes) | Web tool inaccessible; direct HTTPS 200. Quantum Pass requires official scaffold, QoreX, testnet deployment and a hybrid transaction; team 1–2. Contract specificity unresolved |
| H2 | [Rules](https://build.qorechain.io/rules) | Web tool inaccessible; direct HTTPS 200. Event originality, public MIT/Apache-2.0 code, README/image/video/addresses, eligibility and deadline |
| H3 | [Kits](https://build.qorechain.io/kits) | Web tool inaccessible; direct HTTPS 200. Current kit/package names and versions; catalog says registry refresh is hourly |
| H4 | [Projects](https://build.qorechain.io/projects) | Web tool inaccessible; direct HTTPS 200. Project directory context only; no copied projects or assumed approval of ReeKlaim |

The browser web tool's inability to retrieve H1–H4 did not prevent research: direct official-site retrieval succeeded. No unofficial mirror was substituted. Rules are not frozen and must be rechecked before submission.

## Mandatory QoreChain documentation

| ID | Source | Relevant finding and scope |
|---|---|---|
| Q1 | [Documentation home](https://docs.qorechain.io/) | Mainnet-oriented navigation/defaults; do not copy mainnet presets into ReeKlaim |
| Q2 | [Fest overview](https://docs.qorechain.io/build-before-qday/overview/) | Native hybrid send/read examples and timeline; suggests native-first fit but does not settle deployment checks |
| Q3 | [Workshop 1](https://docs.qorechain.io/build-before-qday/workshop-1/) | Scaffold/deploy/hybrid verification tutorial; EVM window authorization is distinct from EVM carrying a PQ signature |
| Q4 | [Prerequisites](https://docs.qorechain.io/build-before-qday/prerequisites/) | Test-only wallet/tool/faucet setup; avoid production wallet material |
| Q5 | [Hybrid Inspector](https://docs.qorechain.io/build-before-qday/workshop-1/apps/hybrid-inspector/) | Encoded native MsgSend, QoreX broadcast, REST receipt event/extension inspection and CORS proxy |
| Q6 | [Q-Day Guestbook](https://docs.qorechain.io/build-before-qday/workshop-1/apps/qday-guestbook/) | EVM contract + browser example; prose implies browser signing despite integration source limitations; not accepted as proof current store wallet sends work |
| Q7 | [QoreX integrations](https://docs.qorechain.io/developer-tools/qorex-integrations/) | Six packages, direct native broadcast, unsupported arbitrary/EVM signing, absent events, mock/extension-test limitations |
| Q8 | [QoreX overview](https://docs.qorechain.io/qorex/overview/) | Official non-custodial wallet and native hybrid signing; does not establish installed build behavior here |
| Q9 | [QoreSign SIWQ verification](https://docs.qorechain.io/qoresign/guides/sign-in/) | Server nonce/domain/time/chain/address/PQ verification; examples default to mainnet and must be overridden |
| Q10 | [SDK overview](https://docs.qorechain.io/sdk/overview/) | SDK family/current native flow and availability caveats; advertised features must be checked against live module state |
| Q11 | [Chain developer kit](https://docs.qorechain.io/developer-tools/chain-dev-sdk/) | Seven scaffold templates, EVM windows, native six vs EVM 18 decimals, governance-only CosmWasm upload |
| Q12 | [Deploy in five minutes](https://docs.qorechain.io/getting-started/deploy-in-5-minutes/) | Testnet EVM deployment path with coin-60 account and bounded authorization window; not a third-party browser signing guarantee |

All Q1–Q12 returned readable official web content; direct HTTPS copies were also read/inspected for decision-relevant sections. Some pages contain historical version/state claims and promotional feature lists alongside limitations. Prefer pinned distributed code and explicit limitations; record live gates rather than extrapolating from examples.

## Mandatory official repositories

| ID | Repository | Reviewed revision/material |
|---|---|---|
| R1 | [QoreChain organization](https://github.com/qorechain) | Organization/repository identity and public listings |
| R2 | [Build Before Q-Day](https://github.com/qorechain/build-before-qday) | `e54900cadafc1887d65fcc167613292d6d19a10f`; root README, tree and [Hybrid Inspector source](https://github.com/qorechain/build-before-qday/blob/e54900cadafc1887d65fcc167613292d6d19a10f/workshop-1/03-hybrid-inspector/src/App.tsx) |
| R3 | [QoreChain SDK](https://github.com/qorechain/qorechain-sdk) | `17292973f865b3c4a8c97a9a20b9b8ccbe7da013`; README/tree, [template registry](https://github.com/qorechain/qorechain-sdk/blob/17292973f865b3c4a8c97a9a20b9b8ccbe7da013/cli/src/templates.ts), fullstack template, network and denomination sources |
| R4 | [QoreX integrations](https://github.com/qorechain/qorex-integrations) | `bcb863fe457e3fe6eb825af6458d2430c7ac6c69`; README/tree, [providers](https://github.com/qorechain/qorex-integrations/blob/bcb863fe457e3fe6eb825af6458d2430c7ac6c69/packages/types/src/providers.ts), detection and native broadcast helper |
| R5 | [QoreSign](https://github.com/qorechain/qoresign) | `d146c7167a9afa5e94ee4a734bb44f842a2b4a0b`; README/tree and [network verification source](https://github.com/qorechain/qoresign/blob/d146c7167a9afa5e94ee4a734bb44f842a2b4a0b/packages/ts/src/network.ts) |

## Published package source inspection

| Package metadata | Version observed | Inspection |
|---|---|---|
| [create-qorechain-dapp](https://registry.npmjs.org/create-qorechain-dapp/0.14.0) | 0.14.0 | Tarball SHA-512 matched registry integrity; CLI/registry/argument/scaffold code inspected; actual CLI probe succeeded |
| [@qorechain/sdk](https://registry.npmjs.org/@qorechain/sdk/0.14.0) | 0.14.0 | Integrity matched; distributed network/denom implementation and declarations inspected; `uqor`, exponent 6, `toBase`/`fromBase` confirmed |
| [@qorechain/qorex-types](https://registry.npmjs.org/@qorechain/qorex-types/0.1.0) | 0.1.0 | Integrity matched; distributed capability constants/helpers/declarations checked; method presence does not imply current-wallet support |
| [@qorechain/qoresign](https://registry.npmjs.org/@qorechain/qoresign/0.2.0) | 0.2.0 | Integrity matched; distributed SIWQ/network verification exports inspected; signing requires wallet-held keys |

These packages were **downloaded/extracted for inspection**, not installed into this workspace. There is no app lockfile or node_modules. Registry integrity matching checks downloaded bytes against registry metadata; it is not a complete cryptographic publisher identity or vulnerability audit. Source and published tarball may differ; implementation must inspect the resolved installed version again. Full integrity values are in [the manifest](research/phase0-evidence.json).

## Network resources and actual probes

| Source | Observation |
|---|---|
| [Faucet](https://dashboard.qorechain.io/faucet) | Official page redirects to dashboard sign-in; no faucet request made. Workshop states test-token limits; no account/balance obtained |
| [Explorer](https://explore.qore.network) | Root rendered mainnet; Testnet selector exists. No ReeKlaim receipt was searched or claimed |
| [Testnet RPC status](https://rpc-testnet.qore.host/status) | Direct GET 200; network diana; height 10259320, time 2026-11-17T14:11:28.337153803Z, catching_up false |
| [REST node info](https://api-testnet.qore.host/cosmos/base/tendermint/v1beta1/node_info) | Direct GET 200; default_node_info.network diana |
| [REST protocol features](https://api-testnet.qore.host/qorechain/pqc/v1/protocol_features) | Direct GET returned HTTP 403; live features not verified here |
| [REST wasm parameters](https://api-testnet.qore.host/cosmwasm/wasm/v1/codes/params) | Direct GET returned HTTP 403; governance-only upload is documentary evidence, not a fresh parameter read |
| [Testnet EVM RPC](https://evm-testnet.qore.host) | Read-only JSON-RPC `eth_chainId` POST returned HTTP 403; 9800 confirmed from package/docs, not this live response |

Do not infer network downtime from these selective 403s or silently switch endpoints/networks. No chain transaction was signed or broadcast. Phase 1 must resolve reachability from the actual hosting environment and verify identity before enabling writes/authentication.

## Mandatory Framer sources

| ID | Listing and linked preview | Review outcome |
|---|---|---|
| D1 | [Capable](https://www.framer.com/marketplace/templates/capable/) · [preview](https://capable.framer.website/) | Readable listing and preview content; app/benefit/process/pricing hierarchy informs original landing |
| D2 | [Gallery](https://www.framer.com/marketplace/templates/gallery/) · [preview](https://gallerytemplate.framer.website/) | Readable listing and preview content; category/location/theme filtering and cards inform directory |
| D3 | [Meo](https://www.framer.com/marketplace/templates/meo/) · [preview](https://meo.framer.ai/) | Readable listing and preview content; product-first dashboard hierarchy informs presentation |
| D4 | [Shifter](https://www.framer.com/marketplace/templates/shifter/) · [preview](https://jobshifter.framer.website/) | Readable listing and preview content; search/category/listing hierarchy informs discovery |
| D5 | [Marketplace](https://www.framer.com/marketplace/templates/) | Readable category/template catalog; no template imported |
| D6 | [Community Terms 1.0](https://www.framer.com/legal/community-terms/1.0) | Readable terms including free-content distribution limits; general inspiration only, no MIT relicensing of template assets |

Marketplace screenshot-image fetches failed in the web tool. No screenshots/assets were imported and no rendered mobile/desktop behavior was verified. [UI specification](UI_UX_DESIGN.md) distinguishes observed preview content from proposed breakpoints/interactions. This is a planning-phase design study; visual QA belongs to implementation.

## Additional primary deployment references

- [Vercel Hobby](https://vercel.com/docs/plans/hobby), [pricing](https://vercel.com/pricing) and [fair use](https://vercel.com/docs/limits/fair-use-guidelines): free-host eligibility is not assumed for a startup/fee-bearing app. Verify the intended noncommercial event demo qualifies; no paid fallback authorized.
- [Supabase pricing](https://supabase.com/pricing): free tier currently advertises 500 MB DB, 1 GB storage, limited active projects and inactivity pausing. No service account/project was created. Recheck before deployment.

## Unresolved facts and verification rule

No installed real QoreX version/capability test, observed message-signing support, supplied treasury, organizer deployment interpretation, eligible public host, actual deployed URL, contract address or ReeKlaim transaction hash exists yet. Package defaults and tutorial prose must never fill those gaps with imaginary evidence. Record future successful and failed probes with timestamp, version, method, actual result and privacy-safe artifacts.
