# Work packet (wave 3): edit src/modules/academics/program-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/l18-u026-new-program-controller.md

## G2-18-026-060  [P1] MISSING  facet F23  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NewProgramController.java:213-222 detailed embedded program_structure/courses endpoint
- vNext now: src/modules/academics/program-service.ts:138-205 basic directory, no nested structure response
- Fix: Restore safe program detail tree in new route
