# Phase 9 accessibility report

WCAG 2.2 AA was the target. Automated scans cover a subset of criteria. [W3C WCAG guidance](https://www.w3.org/WAI/standards-guidelines/wcag/)

- The standalone production landing page passed the axe run with WCAG 2.x A/AA tags and a Chromium keyboard test that focuses the skip link, activates it and verifies focus on the main landmark. [Landing axe output](evidence/phase9/axe-landing.json)
- The browser regression includes contrast and landmark checks for public pages and representative synthetic item, QR and wallet screens. It exercises mobile modal focus, Escape, arrow-key theme changes, persisted preference and reduced-motion styles. [Production browser run](evidence/phase9/browser-results.json)
- Route loading now exposes a status announcement and preserves the public or workspace main landmark while the module loads. QR alternatives continue to offer a recovery link and print/download actions.

| Finding | Severity | Evidence, fix and retest |
| --- | --- | --- |
| Demo card image links omitted their visible status | Low | Initial Lighthouse flagged visible “Demo listing” and “Lost” or “Found” text missing from the links’ accessible names. The link now derives its name from its visible badges and photo alternative or an illustrated item’s text alternative. |
| Offscreen skip link intruded into some full-page captures | Low | Pre-change screenshots of the scrolled recovery and organization views showed the unfocused link. The hidden state now clips it while retaining normal keyboard focus. The production keyboard check still verifies skip-link activation. |

The final Lighthouse runs passed the demo card link-name audit and the Chromium retest verified keyboard activation of the skip link. The separate desktop keyboard walkthrough remains open because the in-app browser could not connect to the local server. Screen-reader combinations, physical touch, complete WCAG 2.2 target-size coverage and a criterion-by-criterion conformance review remain outstanding. [Lighthouse evidence](PERFORMANCE_REPORT.md) · [Chromium retest](evidence/phase9/candidate-retest.json)
