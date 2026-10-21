# Work packet: edit src/components/ui/data-table.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/cross-10-list-conventions.md

## G2-10-031-013  [P1] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:260,285,293-295 — Name, Drives and Last active sortable; default Last active descend.
- vNext now: src/components/ui/data-table.tsx:8-35,95-102 — DataTable column has aria-sort but no sort handler API.
- Fix: Add canonical sortable column controls with default and persisted order.

## G2-10-031-021  [P1] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:827-835 — row selection with disabled draft rows, supports bulk action.
- vNext now: src/components/ui/data-table.tsx:25-35,39-95 — generic DataTable has no rowSelection prop.
- Fix: Add checkbox row-selection and resource-specific bulk controls.
