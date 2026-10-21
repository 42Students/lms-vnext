# Work packet (wave 2): edit src/components/public/public-screen.module.css

18 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-20/404.md, docs/audit/gap2/lane-20/500.md, docs/audit/gap2/lane-20/enterprises.md, docs/audit/gap2/lane-20/home.md, docs/audit/gap2/lane-20/universities.md

## G2-20-001-005  [P2] GAP  facet F02  effort M
- Legacy: One centered 70vh panel with inline #fafbfc background and 2rem padding; `docs/legacy-source/frontend/src/pages/404.js:16-26`
- vNext now: Full 100dvh three-row shell with centered 510px bordered card; `src/components/public/graceful-screen.tsx:20-28`, `src/components/public/public-screen.module.css:2-16`
- Fix: Introduce a 404-specific presentation matching borderless 70vh panel, center alignment, and 32px padding while preserving responsive safe areas.

## G2-20-001-008  [P2] GAP  facet F03  effort S
- Legacy: Large visible `404` text, 4rem/800 teal #1e9aa8; `docs/legacy-source/frontend/src/pages/404.js:28`
- vNext now: Visible `!` badge (22px) instead of 404 numeral; `src/components/public/graceful-screen.tsx:29`, `src/components/public/public-screen.module.css:17-18`
- Fix: Replace public error icon with prominent 404 numeral, legacy weight and color.

## G2-20-001-011  [P2] GAP  facet F03  effort S
- Legacy: Default secondary button `ln-btn ln-btn--default`; primary link `ln-btn ln-btn--pri`; `docs/legacy-source/frontend/src/pages/404.js:34-43`
- vNext now: Primary anchor only; CSS `min-height:36px`, radius 9, #0a7c88; `src/components/public/graceful-screen.tsx:41-44`, `src/components/public/public-screen.module.css:24-29`
- Fix: Provide the missing secondary button and match legacy classes' effective size, colors, hover and focus via targeted styling proof.

## G2-20-002-004  [P2] GAP  facet F02  effort S
- Legacy: One full-viewport 100vh center-aligned column; #fafbfc background, 2rem padding; `docs/legacy-source/frontend/src/pages/500.js:7`
- vNext now: 3-row 100dvh layout with centered bounded card, header and footer on #f1f4f9; `src/components/public/graceful-screen.tsx:20-55`, `src/components/public/public-screen.module.css:2-16`
- Fix: Use 500-specific borderless centered column, 32px padding, #fafbfc base and no ancillary rows.

## G2-20-002-007  [P2] GAP  facet F03  effort S
- Legacy: Large `500` h1, 4rem/800 #1e9aa8; `docs/legacy-source/frontend/src/pages/500.js:8`
- vNext now: Icon `!` at font-size22, 54px box; `src/components/public/graceful-screen.tsx:29`, `src/components/public/public-screen.module.css:17-18`
- Fix: Show 500 as an h1 visual numeral at 64px/800 and legacy teal.

## G2-20-002-008  [P2] GAP  facet F03  effort S
- Legacy: Subheading `Server Error` at 1.5rem #1a1d21; `docs/legacy-source/frontend/src/pages/500.js:9`
- vNext now: Title `This page is temporarily unavailable` or stale `Updating your page`; font30 #172033; `src/components/public/graceful-error-boundary.tsx:64-68`, `src/components/public/public-screen.module.css:19`
- Fix: Use legacy 24px `Server Error` secondary heading specifically for 500 presentation.

## G2-20-001-007  [P3] GAP  facet F02  effort S
- Legacy: Background `#fafbfc`; `docs/legacy-source/frontend/src/pages/404.js:25`
- vNext now: Page `--lms-page-background` fallback `#f1f4f9`, white card; `src/components/public/public-screen.module.css:2-16`
- Fix: Apply legacy 404 background #fafbfc and remove card white-on-grey split for this screen.

## G2-20-001-013  [P3] GAP  facet F04  effort S
- Legacy: Legacy description ends `available.` and has max-width 420px; `docs/legacy-source/frontend/src/pages/404.js:30-32`
- vNext now: Identical description text but CSS max-width 390px and 14px/24px; `src/app/not-found.tsx:5`, `src/components/public/public-screen.module.css:20`
- Fix: Increase 404-specific description max width from 390px to 420px.

## G2-20-001-032  [P3] GAP  facet F16  effort S
- Legacy: Actions wrap with gap 12, centered; panel min-height 70vh; no explicit media query in page source; `docs/legacy-source/frontend/src/pages/404.js:16-25,33`
- vNext now: At ≤767px card uses 24px/20px padding, stacked full-width actions, min-height 44px; `src/components/public/public-screen.module.css:39-50`
- Fix: Check 320, 375, 767, 768px side-by-side live; retain flex-wrap where legacy wraps rather than always stacking.

## G2-20-002-006  [P3] GAP  facet F02  effort S
- Legacy: Action gap exactly 12px, flex-wrap centered; `docs/legacy-source/frontend/src/pages/500.js:11`
- vNext now: Action gap 8px, centered, mobile column; `src/components/public/public-screen.module.css:23-24,39-50`
- Fix: Make 500 action gap 12px desktop and legacy flex-wrap behavior.

## G2-20-002-009  [P3] GAP  facet F03  effort S
- Legacy: Secondary outlined pill back button: #fff, #1e9aa8 text/border, 999px radius, padding12px 24px, weight600; `docs/legacy-source/frontend/src/pages/500.js:12-17`
- vNext now: Secondary shared style: 9px radius, border #d6dbe3, text #0a7c88, padding7px16px; `src/components/public/graceful-screen.tsx:41-44`, `src/components/public/public-screen.module.css:24-29`
- Fix: Restore rounded pill legacy outline/padding for HTTP 500 back button.

## G2-20-002-010  [P3] GAP  facet F03  effort S
- Legacy: Primary Home pill: teal #1e9aa8, white, 999px radius, padding12px24px, weight600; `docs/legacy-source/frontend/src/pages/500.js:19-21`
- vNext now: Primary background #0a7c88, 9px radius, padding7px16px, 650 weight; `src/components/public/public-screen.module.css:24-28`
- Fix: Set 500-specific primary button visual tokens to #1e9aa8/999px/12×24/600.

## G2-20-002-013  [P3] GAP  facet F04  effort S
- Legacy: Explanation exact `Something went wrong on our side. Please try again in a moment.`, maxWidth420; `docs/legacy-source/frontend/src/pages/500.js:10`
- vNext now: Normal root render fallback same body text, maxWidth390; stale chunk different body; `src/components/public/graceful-error-boundary.tsx:66-68`, `src/components/public/public-screen.module.css:20`
- Fix: Use 420px text measure for non-stale 500; reserve update copy for stale chunks.

## G2-20-002-032  [P3] GAP  facet F16  effort S
- Legacy: One flex-wrap action row at all sizes, no explicit media-query in component; `docs/legacy-source/frontend/src/pages/500.js:7,11`
- vNext now: At ≤767px actions stack and fill width, card paddings shrink; `src/components/public/public-screen.module.css:39-50`
- Fix: Verify computed legacy mobile CSS and adapt error-only styles to retain wrap rather than forced column.

## G2-20-002-033  [P3] GAP  facet F16  effort S
- Legacy: Page uses 100vh not small-viewport 100dvh; `docs/legacy-source/frontend/src/pages/500.js:7`
- vNext now: Root screen 100dvh; `src/components/public/public-screen.module.css:6`
- Fix: Check mobile browser chrome; decide strict viewport measurement versus improved dynamic units.

## G2-20-004-048  [P3] GAP  facet F14  effort S
- Legacy: Marketing logo uses `/assets/images/login/logoo.png` 44×44; `docs/legacy-source/frontend/src/components/marketing/MarketingHeader.jsx:22-29`
- vNext now: Uses `/assets/images/legacy-42lms-logo.svg` with CSS 151×37; `src/components/marketing/marketing-layout.tsx:16`, `src/components/public/public-screen.module.css:13`
- Fix: Use original 44px logo on marketing header rather than app sign-in wordmark.

## G2-20-005-047  [P3] GAP  facet F14  effort S
- Legacy: Logo uses square `/assets/images/login/logoo.png` 44px; `docs/legacy-source/frontend/src/components/marketing/MarketingHeader.jsx:22-29`
- vNext now: Wordmark SVG 151×37; `src/components/marketing/marketing-layout.tsx:16`, `src/components/public/public-screen.module.css:13`
- Fix: Use legacy square logo in marketing header or document updated branding exemption.

## G2-20-008-050  [P3] GAP  facet F14  effort S
- Legacy: Marketing brand uses original PNG logo 44x44; `docs/legacy-source/frontend/src/components/marketing/MarketingHeader.jsx:22-29`
- vNext now: New uses 151x37 legacy wordmark SVG; `src/components/marketing/marketing-layout.tsx:16`, `src/components/public/public-screen.module.css:13`
- Fix: Match original logo dimensions on university marketing header.
