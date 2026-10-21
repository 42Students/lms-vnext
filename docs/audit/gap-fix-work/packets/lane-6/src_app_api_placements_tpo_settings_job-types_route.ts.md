# Work packet: edit src/app/api/placements/tpo/settings/job-types/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/l19-u022-tpo-hub-controller.md

## G2-19-022-089  [P1] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoHubController.java:410-411 PUT save job-types collection
- vNext now: src/app/api/placements/tpo/settings/job-types/route.ts:7-15 POST create only
- Fix: Check bulk edit/reorder/disabled state equivalent
