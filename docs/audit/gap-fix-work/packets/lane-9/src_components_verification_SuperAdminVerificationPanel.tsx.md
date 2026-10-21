# Work packet: edit src/components/verification/SuperAdminVerificationPanel.tsx

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-verification.md

## G2-10-024-021  [P1] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:356-377 — Queue uses TpoDataTable with local search/filter/sort/export.
- vNext now: src/components/verification/SuperAdminVerificationPanel.tsx:81-86; src/components/verification/VerificationWorkspace.tsx:61-109 — Vertically listed paginated cards, URL server filters.
- Fix: Recreate dense sortable table and filter header

## G2-10-024-025  [P1] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:423-429 — Table picks all/selected from filtered current view, no 20 selection cap.
- vNext now: src/components/verification/SuperAdminVerificationPanel.tsx:44-46,73-79,87-105 — Sequence and bulk restricted to max20 page rows.
- Fix: Match scope of bulk audience and communicate explicit new cap

## G2-10-024-060  [P1] GAP  facet F12  effort M
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:248-251 — Bulk verify excludes missing marksheets OR missing Identity document based on blindProblem.
- vNext now: src/components/verification/SuperAdminVerificationPanel.tsx:44-46 — Skips only missingMarksheet, not missingIdentityProof.
- Fix: Exclude missing identity proof from blind verification too

## G2-10-024-105  [P1] GAP  facet F23  effort M
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:401-433 — Legacy dense table with integrated actions.
- vNext now: src/components/verification/VerificationWorkspace.tsx:84-109; src/components/verification/SuperAdminVerificationPanel.tsx:72-129 — New list/cards and separate Filter/Bulk disclosures.
- Fix: Recompose parity surface

## G2-10-024-040  [P2] GAP  facet F08  effort M
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:269-270 — Bulk success reports exact successes/failures and student-notified copy.
- vNext now: src/components/verification/SuperAdminVerificationPanel.tsx:57-60 — Generic 'X verified or sent back; Y not applied'.
- Fix: Show action-specific counts/failed reason and notification wording

## G2-10-024-041  [P2] GAP  facet F08  effort S
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:436-438 — Stopping early shows 'Stopped at N of M...' info toast.
- vNext now: src/components/verification/SuperAdminVerificationPanel.tsx:39-43 — stopSequence closes silently.
- Fix: Warn remaining count on interrupted review run
