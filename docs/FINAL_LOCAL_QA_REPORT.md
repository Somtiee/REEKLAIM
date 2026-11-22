# Final local QA

Evidence belongs in [phase9b](evidence/phase9b). Browser fixtures simulate wallet approval and receipt responses only. Human QoreX checks, actual signed receipts, assistive technology and physical-device testing require separate evidence.

Canonical host startup produced HTTP 200 for the application session and Diana balance. Host mismatch, foreign Origin and missing CSRF returned HTTP 403. The private config route also returned HTTP 403. [Canonical startup smoke](evidence/phase9b/canonical-restart.json)

The first full production browser run passed 60 of 64. The four failures were a passive wallet approval fixture that did not represent an authorized wallet, a CSP probe moved earlier by bundler chunking, and two selectors that matched both the dialog and page alerts. The focused retest passed all four after fixes. The CSP was retained. [Full initial run](evidence/phase9b/browser-results.json) · [Focused retest](evidence/phase9b/browser-retest.json)

The final full production browser suite passed all 64 cases and the separate Vite file guard passed. All 160 unit/integration cases passed, including isolated PostgreSQL and object-storage contract tests. TypeScript, ESLint and the production build passed. npm audit reported zero known vulnerabilities. No secret or mock wallet marker was found in the 29 scanned release files. [Final browser run](evidence/phase9b/browser-final.json) · [Vite guard](evidence/phase9b/dev-file-guard.json) · [Unit/integration](evidence/phase9b/unit-final.json) · [Audit](evidence/phase9b/dependency-audit.json) · [Bundle scan](evidence/phase9b/bundle-scan.json)

Selected visual evidence: [Phase 9A landing before remediation](evidence/phase9a/landing.png) · [Phase 9B mobile landing](evidence/phase9b/canonical-landing-mobile.png) · [Guest sign-in](evidence/phase9b/regression/regression/regression/auth/sign-in-guest.png) · [First-time form, synthetic wallet](evidence/phase9b/regression/regression/regression/auth/onboarding-390-light-MOCK.png)

Required hosted tests include origin behavior through the intended ingress, private object storage permissions, ciphertext backup/restore, hosted database roles, and live transaction reconciliation. Testnet verified-payment defaults remain disabled.

A fresh disposable PostgreSQL database applied and rechecked all 15 migrations and passed restricted role and forced RLS checks. [Migration rehearsal](evidence/phase9b/migrations.json)

The local production landing page had Lighthouse performance scores of 72 on mobile and 100 on desktop. Accessibility, best practices and SEO scored 100 in both profiles. LCP was 1.9 s mobile and 0.6 s desktop. Total blocking time was 1,290 ms mobile and 40 ms desktop. Both guest session requests returned 200. These are single-machine lab measurements. [Mobile](evidence/phase9b/lighthouse-mobile.json) · [Desktop](evidence/phase9b/lighthouse-desktop.json)

