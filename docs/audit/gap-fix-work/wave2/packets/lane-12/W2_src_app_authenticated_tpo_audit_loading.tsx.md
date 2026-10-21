# Work packet (wave 2): edit src/app/(authenticated)/tpo/audit/loading.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-audit.md

## G2-11-006-050  [P2] GAP  facet F13  effort M
- Legacy: On initial load uses DataTable spinner; failure is PanelError with Retry. `docs/legacy-source/frontend/src/pages/tpo/audit.js:114`
- vNext now: loading.tsx uses LoadingState, error.tsx uses ErrorState Retry. `src/app/(authenticated)/tpo/audit/loading.tsx:4`
- Fix: Clone legacy grid loading skeleton, spinner and error region.
