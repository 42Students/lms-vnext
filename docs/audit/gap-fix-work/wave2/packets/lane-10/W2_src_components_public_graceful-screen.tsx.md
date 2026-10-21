# Work packet (wave 2): edit src/components/public/graceful-screen.tsx

24 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/cross-graceful-states.md, docs/audit/gap2/lane-20/404.md, docs/audit/gap2/lane-20/500.md

## G2-1-037-003  [P2] GAP  facet F01  effort S
- Legacy: legacy pages/500.js:11-21 Go back and Go to Home
- vNext now: src/components/public/graceful-screen.tsx:41-44 Try again and Home
- Fix: Restore safe Go back on server errors

## G2-1-037-043  [P2] GAP  facet F13  effort S
- Legacy: legacy pages/404.js:34-44 Go back and Home
- vNext now: src/components/public/graceful-screen.tsx:41-44 retry/home
- Fix: Add browser back

## G2-1-037-048  [P2] GAP  facet F16  effort S
- Legacy: legacy pages/404.js:16-45 centered 2rem with 4rem numeral
- vNext now: src/components/public/graceful-screen.tsx:20-54 CSS-backed branded card
- Fix: Screenshot match at 375 and 1280

## G2-1-037-073  [P2] GAP  facet F23  effort S
- Legacy: legacy pages/404.js:28-43 giant numeral action page
- vNext now: src/components/public/graceful-screen.tsx:20-54 branded panel
- Fix: Clone old error anatomy when required

## G2-20-001-003  [P2] GAP  facet F01  effort S
- Legacy: Two explicit actions: browser-history `Go back` and role-aware `Go to home`; `docs/legacy-source/frontend/src/pages/404.js:33-44`
- vNext now: Public recovery only `Go to home`, no history action; `src/components/public/graceful-screen.tsx:41-44`
- Fix: Restore secondary `Go back` using a client handler with safe home fallback on empty history.

## G2-20-001-005  [P2] GAP  facet F02  effort M
- Legacy: One centered 70vh panel with inline #fafbfc background and 2rem padding; `docs/legacy-source/frontend/src/pages/404.js:16-26`
- vNext now: Full 100dvh three-row shell with centered 510px bordered card; `src/components/public/graceful-screen.tsx:20-28`, `src/components/public/public-screen.module.css:2-16`
- Fix: Introduce a 404-specific presentation matching borderless 70vh panel, center alignment, and 32px padding while preserving responsive safe areas.

## G2-20-001-006  [P2] GAP  facet F02  effort S
- Legacy: Section order: 404 → Page Not Found → description → 2 actions; `docs/legacy-source/frontend/src/pages/404.js:28-44`
- vNext now: Header logo → ! icon → Page not found → description → 1 action → footer; `src/components/public/graceful-screen.tsx:21-53`, `src/app/not-found.tsx:3-7`
- Fix: Render numeric 404 first, then h2 heading, paragraph, and both actions in legacy order.

## G2-20-001-008  [P2] GAP  facet F03  effort S
- Legacy: Large visible `404` text, 4rem/800 teal #1e9aa8; `docs/legacy-source/frontend/src/pages/404.js:28`
- vNext now: Visible `!` badge (22px) instead of 404 numeral; `src/components/public/graceful-screen.tsx:29`, `src/components/public/public-screen.module.css:17-18`
- Fix: Replace public error icon with prominent 404 numeral, legacy weight and color.

## G2-20-001-011  [P2] GAP  facet F03  effort S
- Legacy: Default secondary button `ln-btn ln-btn--default`; primary link `ln-btn ln-btn--pri`; `docs/legacy-source/frontend/src/pages/404.js:34-43`
- vNext now: Primary anchor only; CSS `min-height:36px`, radius 9, #0a7c88; `src/components/public/graceful-screen.tsx:41-44`, `src/components/public/public-screen.module.css:24-29`
- Fix: Provide the missing secondary button and match legacy classes' effective size, colors, hover and focus via targeted styling proof.

## G2-20-001-015  [P2] GAP  facet F06  effort S
- Legacy: No text/selection form fields or submit/cancel flow; two click actions only; `docs/legacy-source/frontend/src/pages/404.js:33-44`
- vNext now: No form fields on shared 404; single link in actions; `src/components/public/graceful-screen.tsx:41-44`
- Fix: Treat history-back as its own type=button action, not a form submit.

## G2-20-001-019  [P2] MISSING  facet F10  effort S
- Legacy: Back click calls `window.history.back()` without checking history; `docs/legacy-source/frontend/src/pages/404.js:34-40`
- vNext now: No history side effect available; `src/components/public/graceful-screen.tsx:41-44`
- Fix: Add guarded client history.back with fallback to role home for direct visits.

## G2-20-001-034  [P2] GAP  facet F17  effort S
- Legacy: Semantic h1 numeric 404 followed by h2 heading and native button/link; `docs/legacy-source/frontend/src/pages/404.js:28-43`
- vNext now: Public uses PageHeader h1 message and aria-hidden icon; native link in main; `src/components/public/graceful-screen.tsx:28-44`, `src/components/ui/page-header.tsx:31-38`
- Fix: Preserve accessible named heading but restore expected 404 numeral; decide whether numeral h1 or decorative and keep one screen-reader page title.

## G2-20-001-038  [P2] MISSING  facet F18  effort S
- Legacy: Buttons exactly `Go back` and `Go to home`; `docs/legacy-source/frontend/src/pages/404.js:39-43`
- vNext now: Only `Go to home`; `src/components/public/graceful-screen.tsx:10,41-44`
- Fix: Add exact `Go back` label as secondary action.

## G2-20-001-045  [P2] MISSING  facet F23  effort S
- Legacy: Legacy Go back deliberately prevents dead end; `docs/legacy-source/frontend/src/pages/404.js:33-40`
- vNext now: Dropped in shared recovery; `src/components/public/graceful-screen.tsx:41-44`
- Fix: Restore safe Go back action; no intentional-removal rationale found in source.

## G2-20-002-002  [P2] GAP  facet F01  effort S
- Legacy: Go back uses browser history; Go to Home targets `/`; `docs/legacy-source/frontend/src/pages/500.js:11-21`
- vNext now: Root fallback has `Try again` and `Go to home` to `/`; no history action; `src/app/error.tsx:10`, `src/components/public/graceful-error-boundary.tsx:70-94`, `src/components/public/graceful-screen.tsx:41-44`
- Fix: Restore safe Go back in HTTP 500 presentation while retaining reset as an optional extra for render exceptions.

## G2-20-002-004  [P2] GAP  facet F02  effort S
- Legacy: One full-viewport 100vh center-aligned column; #fafbfc background, 2rem padding; `docs/legacy-source/frontend/src/pages/500.js:7`
- vNext now: 3-row 100dvh layout with centered bounded card, header and footer on #f1f4f9; `src/components/public/graceful-screen.tsx:20-55`, `src/components/public/public-screen.module.css:2-16`
- Fix: Use 500-specific borderless centered column, 32px padding, #fafbfc base and no ancillary rows.

## G2-20-002-005  [P2] GAP  facet F02  effort S
- Legacy: Exact order: 500 → Server Error → explanation → horizontal two-action row; `docs/legacy-source/frontend/src/pages/500.js:8-23`
- vNext now: ! icon → dynamic error title → paragraph → request reference → retry + home; `src/components/public/graceful-error-boundary.tsx:64-94`, `src/components/public/graceful-screen.tsx:27-45`
- Fix: Match numeric error hierarchy and action order; segregate incident references as later enhancement only if approved.

## G2-20-002-007  [P2] GAP  facet F03  effort S
- Legacy: Large `500` h1, 4rem/800 #1e9aa8; `docs/legacy-source/frontend/src/pages/500.js:8`
- vNext now: Icon `!` at font-size22, 54px box; `src/components/public/graceful-screen.tsx:29`, `src/components/public/public-screen.module.css:17-18`
- Fix: Show 500 as an h1 visual numeral at 64px/800 and legacy teal.

## G2-20-002-034  [P2] GAP  facet F17  effort S
- Legacy: Native button with no explicit aria-label but visible Go back; Link has visible label; `docs/legacy-source/frontend/src/pages/500.js:12-21`
- vNext now: Try again button plus labelled Home link and Copy reference button; `src/components/public/graceful-screen.tsx:35-44`
- Fix: Reintroduce native history-back control in keyboard tab sequence.

## G2-20-002-035  [P2] GAP  facet F17  effort S
- Legacy: Semantic h1 `500` and h2 `Server Error`; `docs/legacy-source/frontend/src/pages/500.js:8-9`
- vNext now: One PageHeader h1 with generic title, exclamation icon aria-hidden; `src/components/public/graceful-screen.tsx:28-30`, `src/components/ui/page-header.tsx:31-38`
- Fix: Preserve visible 500 and Server Error hierarchy; ensure screen reader gets one meaningful error heading.

## G2-20-002-048  [P2] MISSING  facet F23  effort S
- Legacy: Legacy 500 numeral, Server Error and back link remain primary identifiers; `docs/legacy-source/frontend/src/pages/500.js:8-21`
- vNext now: Those are absent/replaced; `src/components/public/graceful-error-boundary.tsx:64-94`, `src/components/public/graceful-screen.tsx:28-44`
- Fix: Restore legacy identifiers on the exact 500 state, while preserving new logging/retry behind progressive enhancement.

## G2-1-037-051  [P3] GAP  facet F17  effort S
- Legacy: legacy pages/404.js:28-43 h1 404 and h2 Page Not Found
- vNext now: src/components/public/graceful-screen.tsx:28-31 PageHeader title
- Fix: Match heading hierarchy

## G2-20-002-009  [P3] GAP  facet F03  effort S
- Legacy: Secondary outlined pill back button: #fff, #1e9aa8 text/border, 999px radius, padding12px 24px, weight600; `docs/legacy-source/frontend/src/pages/500.js:12-17`
- vNext now: Secondary shared style: 9px radius, border #d6dbe3, text #0a7c88, padding7px16px; `src/components/public/graceful-screen.tsx:41-44`, `src/components/public/public-screen.module.css:24-29`
- Fix: Restore rounded pill legacy outline/padding for HTTP 500 back button.

## G2-20-002-038  [P3] GAP  facet F18  effort S
- Legacy: Exact button labels `Go back` and `Go to Home` (capital H); `docs/legacy-source/frontend/src/pages/500.js:17,20`
- vNext now: Exact labels `Try again` and `Go to home`; `src/components/public/graceful-error-boundary.tsx:83-87`, `src/components/public/graceful-screen.tsx:10,42-44`
- Fix: Restore `Go back` and capitalization `Go to Home` in 500 route.
