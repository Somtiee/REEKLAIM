# Phase 9 quality assurance

The local unit and integration suite passed 158 of 158 tests. Database tests use dedicated synthetic databases and a synthetic receipt verifier where appropriate. The production Chromium suite uses the actual Node server and built frontend. Authenticated fixture scenarios intercept wallet or API responses and cannot establish live authentication, asset ownership or payment. [Unit output](evidence/phase9/unit-results.json) · [Browser output](evidence/phase9/browser-results.json) · [Playwright documentation](https://playwright.dev/docs/intro)

| Scenario | Coverage and limitation |
| --- | --- |
| A. Authenticate, register, generate QR and view evidence | Browser sign-in and registration/QR suites exercise separate fixture flows. Local integration tests bind registration to a server-side intent and verified fixture receipt. |
| B. Scan QR and report found | Browser anonymous QR intake fixture and local HTTP CSRF-bound intake. |
| C. Owner reviews report and coordinates recovery | Local integration covers owner-only reports, claims and messages. The synthetic owner’s browser submits a private message and confirms return. A single browser journey linking tag intake to owner coordination remains open. |
| D. Two unrelated marketplace users and claims | Local integration exercises two independent users, public projection and competing claims. Browser tests cover market filtering, match comparison and claim submission. |
| E. Confirm recovery and authorize reward | The owner browser fixture confirms a return after the finder’s confirmation, prepares a small zero-fee test reward, checks explicit consent, simulates approval and displays the fixture receipt. With the atomic feature gate off, the default fee-bearing amount is refused. Genuine wallet payment remains open. |
| F. Recipient accepts ownership transfer | Local integration verifies recipient consent, payment, reconciliation and stale QR invalidation. Browser coverage includes payer checkout and the recipient’s acceptance view. |
| G. Organization staff process property | Local integration checks staff versus manager and cross-tenant restrictions. A synthetic staff browser scenario records new property and checks that manager controls are absent. |
| H. Unauthorized actors | Local integration rejects unrelated actors, replay, mismatched receipts and unauthorized state changes. Browser tests cover guest gating and production file confinement. |

The main production regression passed 59 of 59, the additional fixture workflows passed 3 of 3, and the development file guard passed 1 of 1. That is 63 distinct Chromium cases alongside the 158 Vitest cases. The original production run preceded the last accessible-name, CSS and public-route split refinements. [Main suite](evidence/phase9/browser-results.json) · [Additional workflows](evidence/phase9/workflows.json) · [Development file guard](evidence/phase9/dev-file-guard.json)

One interim retest failed a wallet scenario when a concurrent build regenerated hashed assets while Chromium was using the earlier index. A clean run passed all 62 production browser cases. The final targeted run passed all seven cases, including a new regression that verifies reload recovery after a route chunk fails. Including the development guard, 64 distinct browser cases passed across runs. In deployment, retain the previous fingerprinted assets for in-flight sessions. [Interim retest](evidence/phase9/final-browser-retest.json) · [Clean full run](evidence/phase9/browser-final.json) · [Final targeted retest](evidence/phase9/candidate-retest.json)

Visual review used Chromium captures and emulation at 360, 390, 430, 768, 1024, 1440 and 1920 CSS pixels. Landing captures cover both themes across all requested widths. Selected gated views use narrower width/theme combinations. Files ending in `MOCK` contain synthetic account or transaction data.

- [Dark mobile landing](evidence/phase9/regression/regression/regression/regression/regression/hero-390-dark.png) · [Light desktop landing](evidence/phase9/regression/regression/regression/regression/regression/hero-1440-light.png) · [Marketplace](evidence/phase9/marketplace-390.png)
- [Registration wizard](evidence/phase9/regression/regression/regression/regression/wizard-390-light-MOCK.png) · [Item detail and QR](evidence/phase9/regression/regression/regression/regression/registered-1440-dark-MOCK.png) · [Claim detail](evidence/phase9/regression/regression/claim-1440-MOCK.png)
- [Recovery coordination](evidence/phase9/recovery-390-MOCK.png) · [Checkout](evidence/phase9/regression/regression/mobile-checkout-MOCK.png) · [Desktop dashboard](evidence/phase9/regression/overview-1440-MOCK.png) · [Organization staff view](evidence/phase9/organization-390-MOCK.png)
