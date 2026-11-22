# Testnet economy

## Phase 4 current fee configuration — 18 November 2026

The registration fee is now implemented as the fixed string **100000 uqor = 0.10 test QOR**, with separate gas/first-use disclosure and explicit QoreX approval. The human supplied treasury `qor1ez7wqp5ala5ph5nx95n6tdedrccsacqndfjgx3`; its checksum/payload was validated and stored in ignored local server configuration. The actual environment name is `REGISTRATION_TREASURY`, superseding the historical proposal below. There is no arbitrary default, no actual observed collection, and no genuine receipt yet. Transfer/reward fees remain proposals.

Each intent snapshots its exact treasury; configuration changes do not rewrite an already-approved transaction. Operators must reconcile old intents before rotating treasury/origin. Durable approval reservation, one candidate hash and shared receipt uniqueness prevent automatic repeat payments after a timeout. An expired or known-failed intent requires reconciliation/manual review, never automatic repayment. No escrow/refund automation or fee-waiver mode is claimed. [Setup and manual boundary](PHASE_4_SETUP.md).


All amounts are **testnet QOR**, never USD. No mainnet deployment or real-money payment is in scope. Application fees below are product proposals, not QoreChain protocol fees.

## Denomination and fee policy

The distributed `@qorechain/sdk@0.14.0` network configuration defines `display: QOR`, `base: uqor`, `exponent: 6`. Its `toBase` and `fromBase` utilities operate on decimal strings with integer conversion. [Pinned SDK network source](https://github.com/qorechain/qorechain-sdk/blob/17292973f865b3c4a8c97a9a20b9b8ccbe7da013/packages/ts/src/config/networks.ts), [denomination source](https://github.com/qorechain/qorechain-sdk/blob/17292973f865b3c4a8c97a9a20b9b8ccbe7da013/packages/ts/src/utils/denom.ts). The actual published bundle was inspected; no runtime money conversion was executed in the app because there is no app yet.

| Action | Application fee | Native base units | Implementation priority |
|---|---|---|---|
| QoreX sign-in | 0 QOR | 0 | P0; proposed 1 uqor self-transfer proves control; gas separate |
| Lost/found report, browsing | Free | 0 | P0, off-chain |
| Registration + blockchain-backed QR | 0.10 QOR | 100000 uqor | P0 after treasury and receipt gates |
| Ownership transfer | 0.05 QOR | 50000 uqor | P1 after dual-consent protocol |
| Recovery claim | Free | 0 | P0, off-chain |
| Recovery confirmation | Free application action | 0 | P0; optional separate chain anchor has disclosed gas |
| Optional finder reward | Owner-selected R QOR | Integer R in uqor | P1 |
| Reward processing fee | 2% of reward principal | `floor(R_uqor * 200 / 10000)` | P1; added to owner debit, not deducted from finder |

Network gas and first-time PQ key registration are separate costs. The self-transfer principal returns to the same wallet and is not an application fee. A sender needs sufficient spendable balance for the wallet's validation and gas even for a self-transfer.

Use decimal input strings with at most six places; reject negatives, exponent notation, NaN, Infinity, unexpected leading signs and unsupported denomination. Parse via validated SDK `toBase` or equivalent checked integer logic; calculations use bigint, database numeric integer and JSON strings. Frontend validation is convenience; server recreates every amount. EVM balances have different units and are not used in native payments.

## Treasury gate

`REEKLAIM_TESTNET_TREASURY` must be explicitly supplied by the human project operator. No default, sample collection address or hardcoded third-party account. Verify valid `qor` address/20-byte payload, operator control and testnet configuration; an address can exist on both networks. A treasury change requires operator authorization, an audit record and invalidation of outstanding quoted intents. Never take treasury from a client request.

Absent treasury: paid registration, transfer and reward-fee broadcasts fail closed; browsing/reporting remain available. Do not silently waive a promised fee while presenting a paid receipt, and do not redirect fees to a developer wallet. An explicit product decision can later add a clearly labeled zero-fee mode, with its own evidence requirements.

## Optional reward transaction

Proposed policy: finder receives exactly R; platform receives fee F on top; owner's debit is `R + F + gas`. Example: R=1 QOR → R=1000000 uqor, F=20000 uqor (0.02 QOR), debit before gas=1.02 QOR. R=1 uqor → F=0 with rounding down; either disclose this rule or set a documented minimum before release. Default proposed reward minimum is 1 uqor; maximum is a configurable integer cap shown before approval.

After an undisputed confirmed return, an authenticated owner chooses the recipient (finder supplies and proves control of a testnet wallet if initially anonymous), amount and fee. Show exact addresses, principal, fee, gas estimate, total and the absence of escrow. The server issues a short-lived immutable intent bound to owner, case, recipient, treasury, chain, amounts and memo. No automatic reward on report/claim approval/return.

QoreX's documented native request accepts 1–32 encoded messages. Proposed atomic transaction: two `MsgSend` messages, owner → finder for R and owner → treasury for F, when F>0. Cosmos transaction atomicity is the intended mechanism, but exact real-wallet support and successful/failed two-message receipts must be observed before enabling it. When F=0, omit the zero-value send only under the explicitly verified intent shape. If atomic support is unavailable, disable the combined reward feature rather than imply two separate transfers are atomic or escrowed.

Server verification checks both messages, payer, recipients, amounts, intent memo, successful commitment and hybrid proof. Enforce unique operation/hash and mark paid only after verification. A lost response or delayed indexing stays pending and can reconcile without resending. A failed receipt is not paid. Rewards advertised on listings are nonbinding owner intentions, not reserved balances or guaranteed payouts.

## Required checks

Exact 0.10/0.05 conversions; six-place limits; zero and minimum reward rounding; very large amounts and configured bounds; no floating-point arithmetic; missing treasury; altered recipient/fee/chain; duplicate hash; wrong signer; failed message rollback; user cancellation; insufficient balance; first-use fee; index delay and DB failure after successful broadcast. All tests use synthetic data/testnet tokens. No funds moved in Phase 0.

## Phase 7 implementation

The current integer fee schedule, production treasury switch, atomic reward gate and reconciliation behavior are in [Phase 7 Diana payments](PAYMENTS_DESIGN.md). The live proof boundary remains open.
