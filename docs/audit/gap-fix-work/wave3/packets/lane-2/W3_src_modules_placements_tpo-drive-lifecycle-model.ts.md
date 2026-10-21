# Work packet (wave 3): edit src/modules/placements/tpo-drive-lifecycle-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/job-lifecycle-service.md

## G2-8-011-023  [P1] MISSING  facet F12  effort L
- Legacy: REQUEST→DRAFT,SENT_BACK,REJECTED,CANCELLED (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobLifecycleService.java:18-24`)
- vNext now: no corresponding unified request-state transition in primary drive lifecycle (`src/modules/placements/tpo-drive-lifecycle-model.ts:3-9,38-45`)
- Fix: Model request path and decisions in recruiter/TPO workflow, preserve allowed graph
