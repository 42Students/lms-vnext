# Work packet (wave 3): edit src/modules/placements/college-drive-applications-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-job-controller.md

## G2-2-016-076  [P1] MISSING  facet F05  effort L
- Legacy: Applications GET filters applicationStatus,minScore,maxScore, appliedAfter/before, source, department/program/batch, search `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:445-484`
- vNext now: New filters include q,status,source,stage,department/program/cohort,screening; no score or date range `src/modules/placements/college-drive-applications-model.ts:3-13`
- Fix: Add min/max score and applied date-range filters with same inclusive boundaries
