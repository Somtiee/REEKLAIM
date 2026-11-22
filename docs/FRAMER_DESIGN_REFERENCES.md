# Framer design-reference analysis

Pre-implementation study: 17 November 2026. All five Marketplace listings and live preview HTML were read. Playwright Chromium rendered each preview at 1440×1000 and 390×844; both screenshots were captured and visually inspected before ReeKlaim UI implementation. Reference screenshots remain outside the repository in `%TEMP%\reeklaim-phase2\reference-screenshots` to avoid redistributing restricted template assets. The original-source URLs below are attribution, not endorsement.

| Reference | Observed design principles | Original ReeKlaim translation |
|---|---|---|
| [Capable — Praha](https://www.framer.com/marketplace/templates/capable/) / [preview](https://capable.framer.website/) | Compact navigation; large, high-contrast typography; device composition makes the product concrete. Mobile keeps the core message and product composition. | An editorial **split** hero with an original phone, belonging, QR and found-notification composition; concise human copy and a genuine interactive demo. No template art, stats or testimonials. |
| [Meo — Umair Khan](https://www.framer.com/marketplace/templates/meo/) / [preview](https://meo.framer.ai/) | Restrained controls, generous whitespace and a legible real-looking dashboard. At mobile, row metadata simplifies and actions stack. | Compact app sidebar and a clear organization-preview table. Gate private data; all illustrative rows carry demo labels. Avoid copying its interface, client names, mock counts or simulated adoption. |
| [Gallery — Charu Consul](https://www.framer.com/marketplace/templates/gallery/) / [preview](https://gallerytemplate.framer.website/) | Image-led cards, consistent metadata, category/location filters, broad gutters and a compact mobile icon navigation. | Responsive lost/found directory with actual interactive search/chips/location/date filters and explicit demo data; no private contact or precise address. |
| [Shifter — Framebite](https://www.framer.com/marketplace/templates/shifter/) / [preview](https://jobshifter.framer.website/) | Prominent search and category browsing; clear listing metadata and action placement. The captured mobile header showed overlapping labels/search content. | Adopt search hierarchy and consistent listing rows, **avoid** its observed mobile header collision. Use a focus-contained drawer and full-size controls. |
| [Fluxframe — Brice Deguigne](https://www.framer.com/marketplace/templates/fluxframe/) / [preview](https://fluxframe.framer.website/) | Distinct section rhythm, crisp framing and process/workflow presentation. Mobile simplifies the navigation and hero. | Four-step recovery explanation, stronger rule/divider rhythm and an original structured product demo. No scrolling claim strip, copied workflow art or testimonials. |

## Composition decisions made before implementation

Use the brand's Midnight/Cloud as the primary reading contrast, with Violet/Lavender for actions, scan frames and selection. A warm neutral product stage and a restrained emerald success state humanize the recovery story. One self-hosted open-source variable font limits network dependencies. Headline, supporting text, interactive preview, marketplace and organization preview each have a different visual job; avoid repeating a bento layout.

All CTAs lead to public exploration, a clearly identified demo, an informational page or the gated app shell. No preview grants authentication, publishes a report, moves funds or invents a receipt. A connected wallet is labeled **not authenticated**. Fees remain proposals until collection is implemented/verified in Phase 7. Existing real-wallet/hybrid proof remains pending.

## Research limits and licenses

The captures establish rendered entry layouts at two viewport sizes, not a full audit of the templates. Preview HTML supplied deeper section/navigation content. Animation timing and performance were not benchmarked; captures used reduced-motion mode. ReeKlaim's animations and all seven required widths will be tested independently.

[Marketplace](https://www.framer.com/marketplace/templates/) and [Community Terms 1.0](https://www.framer.com/legal/community-terms/1.0) were reviewed. Listings show Limited licensing. No template was purchased/remixed/imported. No Framer source, images, screenshots, graphics, text, branding or component exports enter the public code/assets. Use general hierarchy, layout rhythm and interaction principles with original implementation.
