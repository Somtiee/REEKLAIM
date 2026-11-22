# Phase 9 performance report

The production entry JavaScript chunk fell from 458,442 to 297,054 bytes after separating the workspace, sign-in, marketplace, recovery, component gallery and secondary public routes. That is roughly a 35% reduction. Landing loaded 318,618 decoded JavaScript bytes including shared chunks at all seven audited widths. [Chromium navigation evidence](evidence/phase9/chromium-navigation.json)

The vendored SDK still produces a 2.65 MB chunk, approximately 502 KB gzip according to Vite. It is deferred from the public landing route. Its broad package export and retained receipt functionality make the first wallet interaction and some feature routes heavier. The supported integration and its verification are preserved.

The production build uses a local, preloaded 27 KB variable font and lazy directory imagery. PostgreSQL directory queries retain bounded pages and existing filter indexes. Private API responses remain `no-store, private`. Public directory freshness and cache invalidation were left unchanged because listings can be unpublished or moderated; no data-dependent performance claim is made without a populated production-sized dataset.

## Lighthouse

Lighthouse 13.6 audited the landing page on the local production build. These are single-run lab results. Both final profiles received HTTP 200 from the guest-session endpoint and passed the accessible-name and CSP diagnostics. An earlier run recorded HTTP 503 while the local PostgreSQL service was stopped. [Earlier mobile report](evidence/phase9/lighthouse-candidate-mobile.json) · [Earlier desktop report](evidence/phase9/lighthouse-candidate-desktop.json)

| Profile | Performance | Accessibility | Best practices | SEO | LCP | Total blocking time | CLS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Mobile | 74 | 100 | 100 | 100 | 1.2 s | 1,610 ms | 0 |
| Desktop | 87 | 100 | 100 | 100 | 0.3 s | 300 ms | 0 |

Blocking time remains the main performance issue in these samples, especially on mobile. The lab results cover Chromium on one machine. Hosted latency, production load, and accessibility on assistive technology remain unverified. [Mobile report](evidence/phase9/lighthouse-healthy-mobile.json) · [Desktop report](evidence/phase9/lighthouse-healthy-desktop.json)
