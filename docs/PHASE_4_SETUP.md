# Phase 4 local review and live verification

18 November 2026. This is a local implementation, not a public deployment. Genuine wallet and chain acceptance remains pending.

## Start

```powershell
cd D:\REEKLAIM
. .\scripts\Use-Node22.ps1
npm.cmd run db:setup
npm.cmd run dev
```

Reuse the existing development server at `http://127.0.0.1:5173`. Use that exact origin for wallet permissions/cookies. The dedicated PostgreSQL 18.7 cluster stays on loopback port 55439. Preserve the ignored `.local` configuration and encryption keys; never paste them into chat. Migrations 004–005 extend the existing schema without changing migrations 001–003.

The human supplied **qor1ez7wqp5ala5ph5nx95n6tdedrccsacqndfjgx3** as the controlled Diana treasury in this chat. Its Bech32 checksum/20-byte payload was validated with the installed official SDK, and it was saved in ignored local server configuration as `treasuryAddress`. This is a human assertion of control, not an independently observed treasury signature. An address alone does not establish a network; every payment uses Diana guards.

On another installation, set server environment `REGISTRATION_TREASURY` to your explicitly approved treasury. There is no default collection address. Missing treasury disables payment intents. Never use a `VITE_` variable for server configuration. Fee and treasury snapshots are retained with existing intents; a changed config does not rewrite a transaction already approved. Before rotating treasury/origin, reconcile outstanding intents and make the operator change explicit. Old-origin intents require review at their original origin; no alternate-origin payment is silently generated.

## Review the item journey

1. At `/sign-in`, connect an official QoreX native account selected on Diana. Review the separate 1 uqor authentication self-transfer, gas and possible first-use PQ key registration. Human approval and independent server verification are required; connection never unlocks private records.
2. Open `/app/items`. The wizard saves a private draft with optional private evidence/photo and a separate public-safe photo. All finder visibility defaults are off. Review image content yourself: stripping metadata cannot remove a visible document number or home address.
3. Attach/edit before requesting an intent. Review **100000 uqor = 0.10 test QOR**, exact treasury and canonical memo. Gas and possible first-use wallet costs are extra. Explicit consent and QoreX approval are required.
4. The server reserves the approval attempt durably before calling the wallet. Once started, a page refresh cannot offer another payment for that intent. If QoreX rejects, times out or the page closes, inspect QoreX history. Enter the existing hash and use **Verify / reconcile existing hash**, which never broadcasts.
5. Successful canonical verification atomically saves the shared unique receipt, marks registration confirmed and activates the random recovery token. Download the SVG, copy/share the link or print the isolated tag page. Open the finder page without a wallet. A phone can only reach a URL accessible from that phone; a loopback URL belongs to that device and is not a public demo. Configure an authorized HTTPS deployment before distributing real tags.
6. Regeneration immediately invalidates the old link. Mark missing updates the finder status; it does not create a directory listing or claim. Archive removes the public page and revokes the tag; the chain receipt remains permanent.

The finder can send an anonymous, one-way message saved for the keeper's private item page. It requires a short-lived pre-session cookie, exact Origin/CSRF and durable limits, but no wallet/account. No two-way reply or handover promise is made. Claims, disputes, transfer, escrow, rewards and organization workflows are outside Phase 4.

## Reconciliation and manual stops

There is one durable registration intent per item. Repeated intent requests return that same intent. One candidate hash can be bound; a different hash is refused. Indexer/network failure remains pending, with the same-hash retry available. An exact committed transaction with nonzero result records failed status and never creates a tag. Neither state automatically replaces the intent or requests another fee.

An intent has a 15-minute signing window. Reconciliation may happen later if the transaction block time was within that original window and newer than its observed starting height. Expiry disables new approval; it does not discard evidence of a payment. If no recoverable hash exists, do not keep paying or manually flip the row to confirmed. An operator must establish the chain outcome before any exceptional replacement/refund decision. A self-service safe replacement workflow is deliberately unavailable; user rejection cannot prove to the server that nothing was broadcast. There is no scheduled worker: rechecks are user-triggered and bounded.

## Genuine evidence still required

Use only a fresh native Diana test account funded from the free official faucet. The human must inspect the actual released extension/capabilities and approve the sign-in and registration prompts. Never export or share recovery phrases, private keys or ML-DSA secrets. Save genuine hashes only after they exist, with canonical REST/raw transaction/block identity, exact transfer/memo, registered key, successful result, hybrid event and local PQ verification. A synthetic fixture or wallet `shield` response is not evidence.

No genuine authentication or registration receipt was obtained in this task. The supplied treasury does not close that gate. The real event/receipt format and wallet first-use behavior must still be observed; unknown forms fail closed. Production HTTPS, persistent storage/key custody, backup/restore, retention and independent security/privacy review remain release requirements.

## Repeat checks

`npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd test`, `npm.cmd run build`, `npm.cmd run test:e2e`. Integration tests use separate `reeklaim_phase3_tests` and `reeklaim_phase4_tests` databases in the dedicated cluster; they never truncate the application database. A skipped integration suite is not a passing acceptance run.

For built-client review, start `npm.cmd start` in a separate shell with `APP_ORIGIN=http://127.0.0.1:4173` and `PORT=4173`, then run `npx.cmd tsx scripts/verify-phase4.ts`. This smoke uses actual local guest APIs and checks secrets in memory without printing them. It does not authenticate a real user or send a payment.
