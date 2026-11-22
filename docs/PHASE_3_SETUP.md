# Phase 3 setup and manual verification

18 November 2026. $0 local development. No hosted Supabase account, paid plan or public deployment is required for this implementation.

## Local development already configured on this machine

1. Use Node 22 (`. .\scripts\Use-Node22.ps1`). Dependencies are installed; a clean checkout uses `npm.cmd ci --ignore-scripts`.
2. `npm.cmd run db:setup` starts only `.local/postgres` on loopback 55439 and applies the versioned migrations. It prefers the downloaded `.local/postgres-18.7-tools/pgsql/bin`; otherwise set `POSTGRES_BIN` to an installed current PostgreSQL binary directory. The initially installed system 18.0 is not an approved production version. Standalone 18.7 came from [official EDB binaries](https://www.enterprisedb.com/download-postgresql-binaries), source/hash in `evidence/phase3/postgres-binary.json`. It is ignored local tooling, not redistributed in source. No existing PostgreSQL service was altered.
3. Generated admin and runtime configuration are separate ignored files under `.local`. Do not print, commit, upload or paste their contents. The app reads only runtime configuration; migration/test tools use the separate local admin connection. On another machine generate fresh keys/credentials; never reuse this machine's generated values.
4. Start `npm.cmd run dev`; if 5173 is already running, reuse it. Open `http://127.0.0.1:5173/sign-in`. APP_ORIGIN is exact, including port. Do not switch between localhost and 127.0.0.1 midway.
5. Public browsing remains open. The private workspace requires genuine authentication; no test login or mock-auth environment flag exists.

The dev server denies `.local`, `.env`, encoded/private filesystem paths and server files, and its filesystem allowlist includes only frontend/public/dependency roots plus index.html. Git ignore alone is not access control.

## Real QoreX acceptance — human approval required

Use a fresh standard native coin-118 **Diana testnet-only** account. Keep all recovery/private/PQ material in your own custody; no agent/server needs it. Use official [QoreX installation resources](https://docs.qorechain.io/qorex/overview/) and [testnet faucet](https://dashboard.qorechain.io/faucet). Test QOR has no monetary value. Check the installed version/capabilities manually; source documentation is not live runtime evidence.

1. Select Diana in QoreX (native `qorechain-diana`, EVM 9800), unlock and approve only the site connection. The page still says not authenticated.
2. Click **Request sign-in challenge**. Check the exact origin, native wallet, Diana label, memo and five-minute expiry. No transaction is requested by this step.
3. Review **1 uqor / 0.000001 test QOR to your own address**, application fee zero, separate gas and possible first-use key registration. No reliable live fee quote is asserted. Confirm the test-account consent checkbox.
4. Click **Request approval in QoreX**. Personally inspect and approve the wallet's final transaction and fee. Cancel any different network, recipient, amount or unexpected operation. Never automatically approve wallet windows.
5. The server reads canonical RPC/REST, block/time, registered possession-proven PQ key and locally verifies the ML-DSA layer. It then atomically consumes the challenge and issues a new opaque cookie. Only after success does the private account/onboarding appear.
6. Choose a private alias in the onboarding modal. Use synthetic PNG/JPEG/WebP or UTF-8 text only when reviewing uploads. Verify logout and account-switch revocation.
7. Record the actual wallet version/capabilities, public address, genuine hash, canonical code/height/memo, raw hash, hybrid event/schema and verifier result in sanitized live evidence **only after observed**. No live evidence is currently present.

If indexing/verification fails, retry the **existing hash**. If a page was interrupted before the server received the hash, use **Already approved in QoreX? Recover verification.** Copy the authentication hash from the wallet; do not send again just because a response was lost. Expired challenges cannot create sessions; a fresh challenge requires fresh explicit approval. If the real wallet/receipt schema or first-use key-possession behavior differs, stop and inspect it; the parser remains fail closed. Do not weaken signer/message/nonce/domain checks to make a demo appear successful.

## Hosted PostgreSQL / optional Supabase

No credentials are needed for the completed isolated local tests. For an authorized hosted setup, first confirm an eligible $0 project and no billing upgrade. Create a PostgreSQL database, then set `MIGRATION_DATABASE_URL` **only in an operator shell**. Use TLS with certificate verification (`sslmode=verify-full`, provider CA where required). Run `npm.cmd run db:migrate` as the schema/migration owner. Applied migration checksums are immutable.

Migrations create `reeklaim_auth` and `reeklaim_runtime` with NOLOGIN by default. An authorized DB operator must enable LOGIN and assign independent strong credentials securely (e.g. `psql` interactive `\password reeklaim_auth` and `\password reeklaim_runtime`). Do not embed passwords in committed SQL or chat. These roles must have no superuser/BYPASSRLS/DDL privileges. The migration owner must not be the app connection.

Configure server environment fields from `.env.example`: exact HTTPS `APP_ORIGIN`, `AUTH_DATABASE_URL`, `DATABASE_URL`, independent 32-byte hex `AUTH_CSRF_SECRET` and `PRIVATE_STORAGE_KEY`, and absolute persistent `PRIVATE_STORAGE_DIRECTORY`. Generate cryptographic keys locally with a secure random generator and store them in the authorized host secret manager. Set `NODE_ENV=production`. Do not prefix secrets with `VITE_`, publish service-role keys or hand credentials to the browser. The two database roles target the same database.

This implementation uses direct PostgreSQL and encrypted server files, not Supabase Auth or an assumed Storage policy. Custom cookies do not set Supabase `auth.uid()`. If a future adapter uses Supabase Storage secret/service-role access, it must retain server authorization and private buckets; that adapter is not claimed here. Current signed downloads additionally require the active account cookie and are revoked by logout.

## Standalone serving and HTTPS

Run `npm.cmd run build`, then `npm.cmd start` in the configured environment. The Node adapter serves only `dist`, prioritizes APIs, provides CSP/security headers and keeps developer proof unavailable in production. Its default binding is loopback; place it behind an authorized HTTPS reverse proxy that preserves the configured Host. Secure cookies depend on the configured HTTPS origin, never untrusted forwarded headers. Actual HTTPS proxy/cookie/extension compatibility remains a deployment smoke-test requirement.

For a local built-client review on this machine:

```powershell
$env:APP_ORIGIN = 'http://127.0.0.1:4173'
$env:PORT = '4173'
npm.cmd start
```

These variables affect only that shell; local HTTP deliberately uses separate development cookie names. Do not call this an HTTPS production deployment. `PRIVATE_STORAGE_DIRECTORY` must be on a persistent private filesystem, not an ephemeral serverless function disk. Keep keys and encrypted backups separately protected; test restore before accepting real private data. After any DB restore, revoke restored sessions/pre-sessions and cancel pending challenges before reopening sign-in. `database/cleanup.sql` is an operator-only limited auth cleanup, not an evidence-retention/legal-policy substitute.

## Repeat checks and shutdown

`npm.cmd test`, `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd run build`, `npm.cmd run test:e2e`. Integration tests require the isolated cluster and use only `reeklaim_phase3_tests`; a clean environment without local DB config reports these as skipped, which is **not** a passing integration acceptance run. This machine's recorded run has no skips. Browser setup: `npx.cmd playwright install chromium`. Node smoke: start the built-client server at 4173 and run `npx.cmd tsx scripts/verify-phase3.ts`.

Stop a foreground Node/Vite server with Ctrl+C. To stop only this dedicated DB, use its `pg_ctl.exe stop -D D:\REEKLAIM\.local\postgres -m fast -w`. Never stop or delete another PostgreSQL service or data directory. Preserve `.local` keys with encrypted data; losing the storage key loses the documents. This task does not proceed to Phase 4.
