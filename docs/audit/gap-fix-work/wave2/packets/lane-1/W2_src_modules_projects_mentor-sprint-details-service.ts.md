# Work packet (wave 2): edit src/modules/projects/mentor-sprint-details-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/u017-project-sprint.md

## G2-14-017-040  [P2] GAP  facet F12  effort M
- Legacy: Legacy version numeric concurrency `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectSprint.java:122-128`
- vNext now: New timestamp CAS on update `src/modules/projects/mentor-sprint-details-service.ts:59-65` `src/modules/projects/mentor-sprint-write-service.ts:117-119`
- Fix: Document revision migration and error semantics
