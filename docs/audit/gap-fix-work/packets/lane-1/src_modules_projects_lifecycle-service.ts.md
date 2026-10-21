# Work packet: edit src/modules/projects/lifecycle-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/u017-project-sprint.md

## G2-14-017-029  [P1] GAP  facet F10  effort L
- Legacy: Legacy workspace startSprint,completeSprint,reopenSprint operations `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/ProjectWorkspaceService.java:94-111`
- vNext now: New start/complete service and mentor write transition flows `src/modules/projects/lifecycle-service.ts:134-399` `src/modules/projects/mentor-sprint-write-service.ts:89-176`
- Fix: Crosswalk all three transitions and no duplicate action paths
