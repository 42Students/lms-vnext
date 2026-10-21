# Work packet (wave 3): edit src/components/admin/admin-scoped-read-page.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/superadmin-faculty-section.md

## G2-6-002-047  [P1] MISSING  facet F09  effort L
- Legacy: Old audit trail modal 800 and Profile modal 860, with row icon buttons `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1517-1539`
- vNext now: New row actions contain edit/lifecycle/transfer and a generic Open details link `src/app/(authenticated)/admin/faculty/page.tsx:36-44` `src/components/admin/admin-scoped-read-page.tsx:245-265`
- Fix: Expose audit/profile modals or parity detail navigation with original triggers
