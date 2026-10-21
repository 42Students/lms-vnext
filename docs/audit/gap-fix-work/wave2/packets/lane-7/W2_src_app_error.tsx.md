# Work packet (wave 2): edit src/app/error.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-20/500.md

## G2-20-002-001  [P2] GAP  facet F01  effort M
- Legacy: Legacy Next Pages Router custom HTTP-500 page `Custom500`, explicitly `nolayout=true`; `docs/legacy-source/frontend/src/pages/500.js:5-7,26`
- vNext now: App Router root `error.tsx` with client `reset`, and `global-error.tsx` rendering html/body; `src/app/error.tsx:1-11`, `src/app/global-error.tsx:1-15`
- Fix: Document different triggering semantics: verify production HTTP 500 and render exceptions both reach correct fallback; avoid treating generic error boundary as HTTP status page.

## G2-20-002-002  [P2] GAP  facet F01  effort S
- Legacy: Go back uses browser history; Go to Home targets `/`; `docs/legacy-source/frontend/src/pages/500.js:11-21`
- vNext now: Root fallback has `Try again` and `Go to home` to `/`; no history action; `src/app/error.tsx:10`, `src/components/public/graceful-error-boundary.tsx:70-94`, `src/components/public/graceful-screen.tsx:41-44`
- Fix: Restore safe Go back in HTTP 500 presentation while retaining reset as an optional extra for render exceptions.
