# Work packet (wave 2): edit src/app/global-error.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-20/500.md

## G2-20-002-001  [P2] GAP  facet F01  effort M
- Legacy: Legacy Next Pages Router custom HTTP-500 page `Custom500`, explicitly `nolayout=true`; `docs/legacy-source/frontend/src/pages/500.js:5-7,26`
- vNext now: App Router root `error.tsx` with client `reset`, and `global-error.tsx` rendering html/body; `src/app/error.tsx:1-11`, `src/app/global-error.tsx:1-15`
- Fix: Document different triggering semantics: verify production HTTP 500 and render exceptions both reach correct fallback; avoid treating generic error boundary as HTTP status page.

## G2-20-002-024  [P2] GAP  facet F11  effort S
- Legacy: 500.nolayout opts out of role layout; everyone sees a common anonymous screen; `docs/legacy-source/frontend/src/pages/500.js:5-26`
- vNext now: Global root uses public GracefulScreen, authenticated error boundary uses insideShell branch; `src/app/global-error.tsx:10-14`, `src/app/(authenticated)/error.tsx:5-10`
- Fix: Define whether protected render errors should stay in shell; ensure production HTTP 500 stays public when expected.
