# Work packet (wave 2): edit src/modules/activity/super-admin-audit-export-model.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-audit.md

## G2-10-003-046  [P2] GAP  facet F14  effort S
- Legacy: Legacy Export downloads only loaded rows as activity-category-YYYY-MM-DD.csv `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:156-175`
- vNext now: New export endpoint fetches up to 1000 matching rows as super-admin-activity-ist.csv `src/modules/activity/super-admin-audit-export-model.ts:5-39` `src/app/api/activity/admin-export/route.ts:6-17`
- Fix: Make export scope explicit and preserve expected filename or label all-matching export

## G2-10-003-047  [P2] GAP  facet F14  effort M
- Legacy: Legacy CSV columns Time Who What Item Action key IP `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:159-174`
- vNext now: New CSV columns Occurred At IST Module Importance Event Type Subject Type ID Label Summary Actor Name and no IP `src/modules/activity/super-admin-audit-export-model.ts:23-39`
- Fix: Add authorized IP and humanized What fields or document removed sensitive fields with export schema notice
