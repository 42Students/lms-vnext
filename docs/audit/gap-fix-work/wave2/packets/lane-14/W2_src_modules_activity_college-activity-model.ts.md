# Work packet (wave 2): edit src/modules/activity/college-activity-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-audit.md

## G2-9-001-066  [P2] GAP  facet F20  effort M
- Legacy: Local today/midnight converted to UTC since value (`docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:41-48`)
- vNext now: IST calendar shortcuts (`src/modules/activity/college-activity-model.ts:67-96`)
- Fix: Test timezone boundaries at 00:00 IST and server locales.
