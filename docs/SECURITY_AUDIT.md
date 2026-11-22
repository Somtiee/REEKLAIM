# Phase 9 security audit

19 November 2026. Scope includes source, the standalone Node release build and isolated local PostgreSQL with synthetic identities. The release checks do not transact on Diana or exercise external targets. [Threat model](SECURITY_THREAT_MODEL.md) · [OWASP Top 10](https://owasp.org/www-project-top-ten/) · [OWASP API Security](https://owasp.org/www-project-api-security/)

## Findings and retests

| ID | Severity | Evidence | Remediation and retest |
| --- | --- | --- | --- |
| S9-01 | Medium | The config validator and PostgreSQL driver interpreted repeated TLS settings differently. The driver also supported a query-level host override outside the validator’s host check. | Require one hostname in the URL authority, reject duplicate `sslmode` settings and refuse disabled Node certificate verification in production. Synthetic valid and ambiguous configuration tests passed. |
| S9-02 | Medium | Node URL parsing could retain a malformed credential-bearing connection string in a startup exception. | Return fixed configuration errors without original values or attached parser causes. Error regression passed with synthetic input. |
| S9-03 | Low | Vite’s default client environment prefix exposed future variables under `VITE_` to application modules. ReeKlaim needs only Vite’s built-in mode flags. | Disable user-defined client prefixes. Production build and local release scan completed. |
| S9-04 | Low | The standalone SPA served its index for some dot-prefixed filenames that lacked a recognized extension. The static server also left control characters and Windows-specific separators to path resolution. No file disclosure was observed. | Reject decoded dot-prefixed segments, alternate separators, colons and control characters before file lookup. Production HTTP privacy regression passed. |
| S9-05 | Medium, open | The deployment trust chain remains unverified. No real extension receipt, deployed HTTPS origin or production database/volume configuration was supplied. | Keep collection gates in place and complete the live rehearsals in the release checklist. Retest pending. |
| S9-06 | Medium, open | The local rate limit keys use socket peer addresses. Behind a shared reverse proxy this can group unrelated visitors under one limiter. Hosted backup, recovery, moderation and retention have not been rehearsed. | Confirm the deployment ingress applies a verified client limit and test shared-IP behavior. Document and rehearse incident, backup and data-handling procedures on the actual host. Retest pending. |
| S9-07 | Low | Lighthouse flagged a CSP issue. Chromium DevTools identified a blocked Zod JIT capability probe in the client entry chunk. The browser blocked it as intended. | Configure client-side Zod to use the non-JIT parser before schema initialization. The final Chromium diagnostic test passed with strict CSP. |

## Local control evidence

| Boundary | Evidence and remaining scope |
| --- | --- |
| Authentication and sessions | Isolated PostgreSQL tests exercised replay, reuse, foreign browser binding, concurrent consumption, session token rotation and expiry, logout and origin/CSRF. Receipt fixtures exercise wrong signer, wrong chain, missing or invalid hybrid proof and mismatched intent. Genuine QoreX flow over HTTPS remains open. |
| Authorization and tenancy | Real SQL tests verify forced RLS, missing/wrong actor, role restrictions, pooled identity reset, cross-account evidence, cross-tenant isolation, invite acceptance and concurrent claim review. The application trusts the server to assign actor context. |
| Uploads and public exposure | MIME and decoding tests reject invalid content. Image re-encoding strips metadata. Private objects are encrypted and downloads require the right user/session within the link’s lifetime. QR and marketplace tests cover field projection, revoked tags, anonymous intake and private record visibility. Hosted storage permissions remain open. |
| Browser and API | React text rendering, strict body schemas, parameterized queries, same-origin checks, no CORS enablement, guarded notification links, fixed upstream URLs and redirect rejection were reviewed. Private APIs set `no-store`. Source review is the evidence for unrestricted redirects and general stored XSS prevention. A complete per-route adversarial test matrix was not executed. |
| Blockchain and money | Local tests cover native Diana enforcement, exact signer/fee/recipient/memo/messages, globally unique hash use, recipient consent, preserved candidate hashes and interrupted wallet requests. The wallet owns signing. Required live hybrid signature, reconciliation and atomic reward verification remain open. |
| Migrations | A fresh disposable database applied and rechecked 15 migration checksums, 35 tables, 90 indexes and 61 foreign keys. Restricted role/forced RLS check passed. Existing data was not reset. Backup and restore with actual operational volumes and keys remain open. |
| Client artifact and dependencies | Scanned the build’s HTML, JavaScript, CSS and data files for runtime passwords, storage/session secrets, mock markers and private-key markers, with zero hits. npm audit reported zero known advisories in this run. All 344 components in the CycloneDX inventory include licence metadata. Inventory metadata does not by itself satisfy redistribution obligations. |

[Unit and integration results](evidence/phase9/unit-results.json) · [Migration rehearsal](evidence/phase9/migrations.json) · [Bundle scan](evidence/phase9/bundle-scan.json) · [Dependency audit](evidence/phase9/dependency-audit.json) · [Dependency and licence inventory](evidence/phase9/dependency-inventory.json)

No critical or high application security findings were identified within the reviewed scope. The audit used local source review and selected negative checks. Public release still depends on live evidence and operational validation. [Release checklist](RELEASE_CHECKLIST.md)
