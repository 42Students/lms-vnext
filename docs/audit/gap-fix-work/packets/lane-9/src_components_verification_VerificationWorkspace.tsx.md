# Work packet: edit src/components/verification/VerificationWorkspace.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-verification.md

## G2-10-024-011  [P1] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:357-377 — DataTable 9 columns Student, Roll, Batch, Branch(hidden), Section, Status, Marksheets, date, By/reason, Review.
- vNext now: src/components/verification/VerificationWorkspace.tsx:84-109 — Vertical cards by learner; no Ant column header/filter row.
- Fix: Recreate tabular columns, selectable rows, bulk toolbar

## G2-10-024-021  [P1] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:356-377 — Queue uses TpoDataTable with local search/filter/sort/export.
- vNext now: src/components/verification/SuperAdminVerificationPanel.tsx:81-86; src/components/verification/VerificationWorkspace.tsx:61-109 — Vertically listed paginated cards, URL server filters.
- Fix: Recreate dense sortable table and filter header

## G2-10-024-105  [P1] GAP  facet F23  effort M
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:401-433 — Legacy dense table with integrated actions.
- vNext now: src/components/verification/VerificationWorkspace.tsx:84-109; src/components/verification/SuperAdminVerificationPanel.tsx:72-129 — New list/cards and separate Filter/Bulk disclosures.
- Fix: Recompose parity surface
