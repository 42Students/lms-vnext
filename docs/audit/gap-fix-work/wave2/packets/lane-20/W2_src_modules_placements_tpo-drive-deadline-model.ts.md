# Work packet (wave 2): edit src/modules/placements/tpo-drive-deadline-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-job-controller.md

## G2-2-016-153  [P2] GAP  facet F20  effort M
- Legacy: Old local date-time parsing supports space replaced with T and uses server LocalDateTime.now `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:349-385`
- vNext now: New requires ISO offset and compares Date.parse against now `src/modules/placements/tpo-drive-deadline-model.ts:3-18`
- Fix: Normalize IST on UI and avoid local/offset ambiguity at midnight and DST
