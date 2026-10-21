# Work packet (wave 2): edit src/modules/projects/mentor-sprint-write-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/u017-project-sprint.md

## G2-14-017-036  [P2] GAP  facet F11  effort M
- Legacy: Legacy project status gates permit mentor actions in active workspace `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/ProjectWorkspaceService.java:94-111`
- vNext now: New denies ARCHIVED and COMPLETED project `src/modules/projects/mentor-sprint-write-service.ts:96-104`
- Fix: Document exact historical permitted project status matrix

## G2-14-017-040  [P2] GAP  facet F12  effort M
- Legacy: Legacy version numeric concurrency `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectSprint.java:122-128`
- vNext now: New timestamp CAS on update `src/modules/projects/mentor-sprint-details-service.ts:59-65` `src/modules/projects/mentor-sprint-write-service.ts:117-119`
- Fix: Document revision migration and error semantics
