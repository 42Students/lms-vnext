# Work packet: edit src/components/college/college-faculty-csv-import.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/college-admin-teachers.md

## G2-6-001-035  [P2] GAP  facet F08  effort S
- Legacy: Old successful CSV parse toast `Parsed N row(s)...` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:620-626`
- vNext now: New CSV preview shows `N valid; N invalid` alert `src/components/college/college-faculty-csv-import.tsx:105-117`
- Fix: Retain parse acknowledgment before validation report
