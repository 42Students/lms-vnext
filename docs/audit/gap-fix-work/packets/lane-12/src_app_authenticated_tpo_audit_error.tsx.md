# Work packet: edit src/app/(authenticated)/tpo/audit/error.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-audit.md

## G2-11-006-034  [P1] GAP  facet F08  effort M
- Legacy: Failed refetch with last rows shows `This refresh failed. Showing the last successful load.` and Retry. `docs/legacy-source/frontend/src/pages/tpo/audit.js:117`
- vNext now: Route error boundary replaces records with fatal view. `src/app/(authenticated)/tpo/audit/error.tsx:18`
- Fix: Keep stale data and display retryable inline alert.

## G2-11-006-051  [P1] GAP  facet F13  effort M
- Legacy: Old rows remain visible when refresh fails; closable Alert says stale data. `docs/legacy-source/frontend/src/pages/tpo/audit.js:117`
- vNext now: Route thrown error replaces page content. `src/app/(authenticated)/tpo/audit/error.tsx:17`
- Fix: Introduce stale-while-revalidate with retry banner.

## G2-11-006-030  [P2] GAP  facet F07  effort M
- Legacy: Load failure: server message/error, fallback `Could not load the audit log`, shown inline. `docs/legacy-source/frontend/src/pages/tpo/audit.js:58`
- vNext now: Route ErrorState uses generic description, no actual server text. `src/app/(authenticated)/tpo/audit/error.tsx:17`
- Fix: Use safe but specific error text and matching state.
