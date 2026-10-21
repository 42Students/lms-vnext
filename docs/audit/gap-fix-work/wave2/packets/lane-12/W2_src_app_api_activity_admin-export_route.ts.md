# Work packet (wave 2): edit src/app/api/activity/admin-export/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-audit.md

## G2-10-003-046  [P2] GAP  facet F14  effort S
- Legacy: Legacy Export downloads only loaded rows as activity-category-YYYY-MM-DD.csv `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:156-175`
- vNext now: New export endpoint fetches up to 1000 matching rows as super-admin-activity-ist.csv `src/modules/activity/super-admin-audit-export-model.ts:5-39` `src/app/api/activity/admin-export/route.ts:6-17`
- Fix: Make export scope explicit and preserve expected filename or label all-matching export
