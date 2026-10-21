# Work packet (wave 2): edit src/components/ui/page-header.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-20/404.md, docs/audit/gap2/lane-20/500.md

## G2-20-001-009  [P2] GAP  facet F03  effort S
- Legacy: Second-level heading `Page Not Found` 1.5rem #1a1d21; `docs/legacy-source/frontend/src/pages/404.js:29`
- vNext now: PageHeader h1 `Page not found`, 30px/600 #172033; `src/app/not-found.tsx:4`, `src/components/ui/page-header.tsx:31-38`
- Fix: Use legacy h2 text/case at 24px and legacy heading color on this error type.

## G2-20-001-034  [P2] GAP  facet F17  effort S
- Legacy: Semantic h1 numeric 404 followed by h2 heading and native button/link; `docs/legacy-source/frontend/src/pages/404.js:28-43`
- vNext now: Public uses PageHeader h1 message and aria-hidden icon; native link in main; `src/components/public/graceful-screen.tsx:28-44`, `src/components/ui/page-header.tsx:31-38`
- Fix: Preserve accessible named heading but restore expected 404 numeral; decide whether numeral h1 or decorative and keep one screen-reader page title.

## G2-20-002-035  [P2] GAP  facet F17  effort S
- Legacy: Semantic h1 `500` and h2 `Server Error`; `docs/legacy-source/frontend/src/pages/500.js:8-9`
- vNext now: One PageHeader h1 with generic title, exclamation icon aria-hidden; `src/components/public/graceful-screen.tsx:28-30`, `src/components/ui/page-header.tsx:31-38`
- Fix: Preserve visible 500 and Server Error hierarchy; ensure screen reader gets one meaningful error heading.
