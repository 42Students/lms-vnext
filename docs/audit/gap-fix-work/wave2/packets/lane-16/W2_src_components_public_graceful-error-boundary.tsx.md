# Work packet (wave 2): edit src/components/public/graceful-error-boundary.tsx

13 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/cross-graceful-states.md, docs/audit/gap2/lane-20/500.md

## G2-1-037-005  [P2] GAP  facet F02  effort S
- Legacy: legacy pages/500.js:7-23 giant 500 and plain #fafbfc page
- vNext now: src/components/public/graceful-error-boundary.tsx:64-93 card
- Fix: Match 500 layout/header

## G2-1-037-008  [P2] GAP  facet F03  effort S
- Legacy: legacy pages/500.js:8-21 Server Error and Go to Home
- vNext now: src/components/public/graceful-error-boundary.tsx:64-88 different title
- Fix: Restore exact 500 headline

## G2-1-037-046  [P2] GAP  facet F15  effort S
- Legacy: legacy api/ApiMethod.js:12-13 clientErrorReporting and reportAuthFailureMidAction
- vNext now: src/components/public/graceful-error-boundary.tsx:38-50 render error telemetry
- Fix: Cover mid-action auth loss telemetry

## G2-1-037-056  [P2] GAP  facet F18  effort S
- Legacy: legacy pages/500.js:9-10 Server Error exact wording
- vNext now: src/components/public/graceful-error-boundary.tsx:64-68 temporarily unavailable
- Fix: Restore 500 heading

## G2-20-002-002  [P2] GAP  facet F01  effort S
- Legacy: Go back uses browser history; Go to Home targets `/`; `docs/legacy-source/frontend/src/pages/500.js:11-21`
- vNext now: Root fallback has `Try again` and `Go to home` to `/`; no history action; `src/app/error.tsx:10`, `src/components/public/graceful-error-boundary.tsx:70-94`, `src/components/public/graceful-screen.tsx:41-44`
- Fix: Restore safe Go back in HTTP 500 presentation while retaining reset as an optional extra for render exceptions.

## G2-20-002-005  [P2] GAP  facet F02  effort S
- Legacy: Exact order: 500 → Server Error → explanation → horizontal two-action row; `docs/legacy-source/frontend/src/pages/500.js:8-23`
- vNext now: ! icon → dynamic error title → paragraph → request reference → retry + home; `src/components/public/graceful-error-boundary.tsx:64-94`, `src/components/public/graceful-screen.tsx:27-45`
- Fix: Match numeric error hierarchy and action order; segregate incident references as later enhancement only if approved.

## G2-20-002-008  [P2] GAP  facet F03  effort S
- Legacy: Subheading `Server Error` at 1.5rem #1a1d21; `docs/legacy-source/frontend/src/pages/500.js:9`
- vNext now: Title `This page is temporarily unavailable` or stale `Updating your page`; font30 #172033; `src/components/public/graceful-error-boundary.tsx:64-68`, `src/components/public/public-screen.module.css:19`
- Fix: Use legacy 24px `Server Error` secondary heading specifically for 500 presentation.

## G2-20-002-020  [P2] MISSING  facet F10  effort S
- Legacy: Browser back uses `window.history.back()`; `docs/legacy-source/frontend/src/pages/500.js:12-17`
- vNext now: No back; error boundary reset callback triggers render retry; `src/components/public/graceful-error-boundary.tsx:82-94`
- Fix: Implement safe back control; don't conflate reset with history navigation.

## G2-20-002-037  [P2] GAP  facet F18  effort S
- Legacy: Exact title `Server Error`; `docs/legacy-source/frontend/src/pages/500.js:9`
- vNext now: Exact render-failure title `This page is temporarily unavailable`; `src/components/public/graceful-error-boundary.tsx:64-65`
- Fix: Set literal `Server Error` on parity 500; keep distinct stale-build copy if needed.

## G2-20-002-044  [P2] GAP  facet F21  effort M
- Legacy: 500.js itself has no vendor/queue/job; global AppErrorBoundary separately reports React errors; `docs/legacy-source/frontend/src/pages/500.js:1-26`, `docs/legacy-source/frontend/src/pages/_app.js:24-42`
- vNext now: New shared boundary POSTs observability event; API logError client.error; `src/components/public/graceful-error-boundary.tsx:32-50`, `src/app/api/client-errors/route.ts:75-85`
- Fix: Map old `reportReactBoundaryError` to new client report fields and alert routing; verify equivalent operational diagnostics without duplicate events.

## G2-20-002-048  [P2] MISSING  facet F23  effort S
- Legacy: Legacy 500 numeral, Server Error and back link remain primary identifiers; `docs/legacy-source/frontend/src/pages/500.js:8-21`
- vNext now: Those are absent/replaced; `src/components/public/graceful-error-boundary.tsx:64-94`, `src/components/public/graceful-screen.tsx:28-44`
- Fix: Restore legacy identifiers on the exact 500 state, while preserving new logging/retry behind progressive enhancement.

## G2-20-002-013  [P3] GAP  facet F04  effort S
- Legacy: Explanation exact `Something went wrong on our side. Please try again in a moment.`, maxWidth420; `docs/legacy-source/frontend/src/pages/500.js:10`
- vNext now: Normal root render fallback same body text, maxWidth390; stale chunk different body; `src/components/public/graceful-error-boundary.tsx:66-68`, `src/components/public/public-screen.module.css:20`
- Fix: Use 420px text measure for non-stale 500; reserve update copy for stale chunks.

## G2-20-002-038  [P3] GAP  facet F18  effort S
- Legacy: Exact button labels `Go back` and `Go to Home` (capital H); `docs/legacy-source/frontend/src/pages/500.js:17,20`
- vNext now: Exact labels `Try again` and `Go to home`; `src/components/public/graceful-error-boundary.tsx:83-87`, `src/components/public/graceful-screen.tsx:10,42-44`
- Fix: Restore `Go back` and capitalization `Go to Home` in 500 route.
