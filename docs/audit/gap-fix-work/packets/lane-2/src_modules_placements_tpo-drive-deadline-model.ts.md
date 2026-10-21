# Work packet: edit src/modules/placements/tpo-drive-deadline-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-job-controller.md

## G2-2-016-091  [P2] GAP  facet F07  effort S
- Legacy: Deadline blank/invalid/past exact 400 messages for newDeadline `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:366-384`
- vNext now: New model uses ISO timestamp with offset and semantic codes for past/not-later `src/modules/placements/tpo-drive-deadline-model.ts:6-18`
- Fix: Map invalid/required/past dates to exact actionable UI errors, including not-later case
