# Phase 10 deployment runbook

Release remains blocked. Confirm the preferred alias reeklaim.vercel.app or fallback getreeklaim.vercel.app in the target Vercel account. A public HTTP result does not establish alias availability.

## Vercel staging

1. Use an eligible Vercel Hobby account for non-commercial use and leave billing and real monetization disabled. Sign in in the account owner's browser or with the CLI credential flow. The installed CLI reported 50.12.3 with no active credentials. Use a reviewed CLI supporting the June 2026 Node server entrypoint. Select the intended project with access-controlled staging. [Hobby](https://vercel.com/docs/plans/hobby) · [Terms](https://vercel.com/legal/terms) · [Node server support](https://vercel.com/changelog/deploy-node-servers-with-zero-configuration)
2. Use the explicit candidate configuration with `vercel --local-config vercel.phase10.json build` once the staging project is available. Select a compatible Node 22 patch release. Verify the generated function includes dist/index.html, its assets and the Linux sharp binary. The root Node entry uses the existing same-origin API and SPA handling, document CSP and security headers. The build command is npm run build, its output is dist, and the candidate function timeout is 60 seconds.
3. Set APP_ORIGIN to the actual exact HTTPS staging host. Confirm incoming Host and Origin and raw request bodies, including near-limit uploads and downloads. Test secure cookies and routing after a direct refresh. Protect staging before allowing browser traffic. [Functions limits](https://vercel.com/docs/functions/limitations)
4. Check production request identity across independent clients and function instances. Existing per-IP rate limits use the Node socket peer. If the gateway supplies a shared peer, verify a trusted platform IP adapter or equivalent ingress control before exposure. Verify pool budgets across instances and keep logs free of cookies, CSRF data, evidence URLs and request bodies.
5. Run the [hosted smoke checklist](PRODUCTION_SMOKE_TEST.md) and live owner/finder walkthrough. If testing a paid testnet flow requires changing a gate, use a separately authorized, access-controlled staging project and the verified treasury. Keep public production collection and automatic publication disabled until approval.

If Vercel Functions cannot meet the checks at zero cost, the supported alternate topology is the existing standalone npm start Node app on an eligible free Node host with a single HTTPS origin and durable external private storage. Provider capacity and suitability still need confirmation.

## Supabase and migrations

1. In Supabase select a dedicated Free staging project. Record its project reference and region. Use Connect to confirm the exact database host, database and operator role and configure verified TLS. The runtime checks PostgreSQL meets its security patch floor. Back up the target before making changes. [Database connection](https://supabase.com/docs/guides/database/connecting-to-postgres)
2. In the operator shell only set NODE_ENV=production, MIGRATION_DATABASE_URL with sslmode=verify-full and the approved MIGRATION_EXPECTED_HOST, MIGRATION_EXPECTED_DATABASE and MIGRATION_EXPECTED_ROLE. Use a migration connection that supports session-level advisory locks. Run `npm run db:migrate -- --check` for read-only identity and TLS validation. Then run `npm run db:migrate` only on the approved target. The runner checks existing migration checksums and applies unapplied SQL in order.
3. Enable login on the migration-created reeklaim_auth and reeklaim_runtime roles with separate passwords through the provider's secure operator workflow. Confirm each hosted connection resolves to the corresponding role and that the reeklaim schema is absent from exposed Data API schemas. Test forced RLS with two synthetic accounts. [Securing database data](https://supabase.com/docs/guides/database/secure-data)
4. Create a private Storage bucket without browser grants. Configure server-only bucket credentials and confirm anonymous denial. ReeKlaim encrypts objects before upload and rechecks account and session on download. Rehearse restoring database references and encrypted objects together before cutover. [Storage access controls](https://supabase.com/docs/guides/storage/security/access-control)

## Runtime environment

| Setting | Value |
| --- | --- |
| NODE_ENV and APP_ORIGIN | production and the exact assigned HTTPS origin |
| AUTH_DATABASE_URL and DATABASE_URL | Separate restricted connections with sslmode=verify-full |
| AUTH_CSRF_SECRET and PRIVATE_STORAGE_KEY | Independent 32-byte random keys encoded as hex |
| PRIVATE_OBJECT_ORIGIN, PRIVATE_OBJECT_BUCKET and PRIVATE_OBJECT_KEY | Approved Supabase project origin, private bucket and server-only credential |
| PRIVATE_STORAGE_DIRECTORY | Absolute path outside web roots. Required by config in bucket mode |
| REGISTRATION_TREASURY | Operator-confirmed Diana address when applicable |
| DIANA_PAYMENT_COLLECTION_APPROVED and DIANA_ATOMIC_REWARDS_VERIFIED | Leave unset pending genuine receipt validation |

The browser uses relative API URLs. Keep secrets out of VITE variables, source and logs. Keep migration credentials in the operator shell. [Environment variables](https://vercel.com/docs/environment-variables)
