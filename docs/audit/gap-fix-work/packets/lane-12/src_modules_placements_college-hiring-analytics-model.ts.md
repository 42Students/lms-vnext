# Work packet: edit src/modules/placements/college-hiring-analytics-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-hiring-dashboard.md

## G2-9-008-047  [P1] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AdminJobService.java:170-195` — Legacy optional numeric job/college and date+department/program/batch/class filters
- vNext now: `src/modules/placements/college-hiring-analytics-model.ts:2-13` — Strict UUID season/job/department/program/cohort and ISO from/to, no class filter
- Fix: Add class-level report filter or explicitly document feature removal
