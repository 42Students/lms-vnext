# Work packet (wave 2): edit src/app/(authenticated)/error.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-20/500.md

## G2-20-002-024  [P2] GAP  facet F11  effort S
- Legacy: 500.nolayout opts out of role layout; everyone sees a common anonymous screen; `docs/legacy-source/frontend/src/pages/500.js:5-26`
- vNext now: Global root uses public GracefulScreen, authenticated error boundary uses insideShell branch; `src/app/global-error.tsx:10-14`, `src/app/(authenticated)/error.tsx:5-10`
- Fix: Define whether protected render errors should stay in shell; ensure production HTTP 500 stays public when expected.
