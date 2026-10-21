# Work packet (wave 2): edit src/app/api/placements/tpo/students/nudges/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/tpo-students-hub-controller.md

## G2-4-022-019  [P2] GAP  facet F06  effort M
- Legacy: Legacy bulk nudge takes free message string. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentsHubController.java:85-89`)
- vNext now: New nudge POST uses own validated service and in-app delivery. (`src/app/api/placements/tpo/students/nudges/route.ts:7-16`; `src/modules/placements/tpo-student-nudge-send-service.ts:15-26`)
- Fix: Verify exact message length/default and recipient affordance.
