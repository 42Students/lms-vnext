# Work packet: edit src/modules/admin-ui/super-admin-people-filter-options.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/superadmin-students.md

## G2-19-001-021  [P1] GAP  facet F05  effort M
- Legacy: Legacy filters program→batch→class cascade and clear dependents `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:896-909`,1504-1511
- vNext now: vNext directory Program, Batch, Class independently selected (no dependent option filtering) `src/components/admin/admin-scoped-read-page.tsx:165-174`; `src/modules/admin-ui/super-admin-people-filter-options.ts:19-33`
- Fix: Filter Batch options by selected Program and Class options by selected Batch; reset stale children.
