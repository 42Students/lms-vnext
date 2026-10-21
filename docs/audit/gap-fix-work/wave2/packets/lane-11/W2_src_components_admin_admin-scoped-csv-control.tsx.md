# Work packet (wave 2): edit src/components/admin/admin-scoped-csv-control.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/superadmin-faculty-section.md

## G2-6-002-069  [P2] GAP  facet F14  effort M
- Legacy: Old roster export faculty.csv columns Name/Mobile/Email/Type/Gender/Status of visible data `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1283-1305`
- vNext now: New admin CSV export capped 250 and filename super-admin-faculty-ist.csv `src/app/(authenticated)/admin/faculty/page.tsx:33-35` `src/components/admin/admin-scoped-csv-control.tsx:4-23`
- Fix: Provide legacy visible export with same columns and filename alongside capped full matching export
