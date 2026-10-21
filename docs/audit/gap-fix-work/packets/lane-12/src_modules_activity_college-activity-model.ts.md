# Work packet: edit src/modules/activity/college-activity-model.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-audit.md

## G2-9-001-024  [P1] GAP  facet F06  effort M
- Legacy: Date default 30d (`docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:64-68`)
- vNext now: No from/to default; first load all history (`src/modules/activity/college-activity-model.ts:10-24`)
- Fix: Initialize last-30-day IST window.

## G2-9-001-028  [P2] GAP  facet F07  effort M
- Legacy: Invalid category returns 400 Unknown activity category: x (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminAuditController.java:170-175`)
- vNext now: Strict Zod enum leads Invalid activity filters (`src/modules/activity/college-activity-model.ts:11-12`)
- Fix: Show concrete category error if malformed.
