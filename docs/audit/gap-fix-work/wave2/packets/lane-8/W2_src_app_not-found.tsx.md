# Work packet (wave 2): edit src/app/not-found.tsx

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/cross-graceful-states.md, docs/audit/gap2/lane-20/404.md, docs/audit/gap2/lane-20/api-hello.md

## G2-1-037-001  [P2] GAP  facet F01  effort S
- Legacy: legacy pages/404.js:49-82 role-aware layout and home
- vNext now: src/app/not-found.tsx:3-7 public GracefulScreen always home /
- Fix: Preserve authenticated 404 shell and role home

## G2-1-037-004  [P2] GAP  facet F02  effort S
- Legacy: legacy pages/404.js:16-45 70vh centered giant teal 404
- vNext now: src/app/not-found.tsx:3-7 branded screen without numeral
- Fix: Match old 404 geometry and 4rem numeral

## G2-1-037-007  [P2] GAP  facet F03  effort S
- Legacy: legacy pages/404.js:29-43 Page Not Found and Go back
- vNext now: src/app/not-found.tsx:4-6 Page not found and no Go back
- Fix: Restore exact capitalization and button

## G2-1-037-037  [P2] GAP  facet F11  effort S
- Legacy: legacy pages/404.js:75-82 authenticated role shell
- vNext now: src/app/not-found.tsx:3-7 public only
- Fix: Use role shell for authenticated 404

## G2-20-001-006  [P2] GAP  facet F02  effort S
- Legacy: Section order: 404 → Page Not Found → description → 2 actions; `docs/legacy-source/frontend/src/pages/404.js:28-44`
- vNext now: Header logo → ! icon → Page not found → description → 1 action → footer; `src/components/public/graceful-screen.tsx:21-53`, `src/app/not-found.tsx:3-7`
- Fix: Render numeric 404 first, then h2 heading, paragraph, and both actions in legacy order.

## G2-20-001-009  [P2] GAP  facet F03  effort S
- Legacy: Second-level heading `Page Not Found` 1.5rem #1a1d21; `docs/legacy-source/frontend/src/pages/404.js:29`
- vNext now: PageHeader h1 `Page not found`, 30px/600 #172033; `src/app/not-found.tsx:4`, `src/components/ui/page-header.tsx:31-38`
- Fix: Use legacy h2 text/case at 24px and legacy heading color on this error type.

## G2-20-003-022  [P2] MISSING  facet F18  effort S
- Legacy: Only authored copy: JSON `Not found`; `docs/legacy-source/frontend/src/pages/api/hello.js:2`
- vNext now: No authored /api/hello copy; general public not-found page says `Page not found` and a longer paragraph; `src/app/not-found.tsx:3-7`
- Fix: Preserve exact capitalization/spelling in response JSON; do not substitute the HTML page wording.

## G2-1-037-055  [P3] GAP  facet F18  effort S
- Legacy: legacy pages/404.js:29-31 Page Not Found exact wording
- vNext now: src/app/not-found.tsx:4-6 Page not found
- Fix: Match case and punctuation

## G2-20-001-013  [P3] GAP  facet F04  effort S
- Legacy: Legacy description ends `available.` and has max-width 420px; `docs/legacy-source/frontend/src/pages/404.js:30-32`
- vNext now: Identical description text but CSS max-width 390px and 14px/24px; `src/app/not-found.tsx:5`, `src/components/public/public-screen.module.css:20`
- Fix: Increase 404-specific description max width from 390px to 420px.

## G2-20-001-036  [P3] GAP  facet F18  effort S
- Legacy: Exact heading case `Page Not Found`; `docs/legacy-source/frontend/src/pages/404.js:29`
- vNext now: Exact heading `Page not found`; `src/app/not-found.tsx:4`
- Fix: Change to `Page Not Found` for legacy string parity.
