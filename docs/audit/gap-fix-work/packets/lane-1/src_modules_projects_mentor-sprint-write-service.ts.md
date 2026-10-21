# Work packet: edit src/modules/projects/mentor-sprint-write-service.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/u017-project-sprint.md

## G2-14-017-029  [P1] GAP  facet F10  effort L
- Legacy: Legacy workspace startSprint,completeSprint,reopenSprint operations `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/ProjectWorkspaceService.java:94-111`
- vNext now: New start/complete service and mentor write transition flows `src/modules/projects/lifecycle-service.ts:134-399` `src/modules/projects/mentor-sprint-write-service.ts:89-176`
- Fix: Crosswalk all three transitions and no duplicate action paths

## G2-14-017-046  [P1] GAP  facet F15  effort M
- Legacy: Legacy entity contains creator/updater and lifecycle attribution `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectSprint.java:102-120`
- vNext now: New records activity transitions but not actor on sprint row `src/modules/projects/mentor-sprint-write-service.ts:167-176`
- Fix: Preserve provenance in durable event or projected columns

## G2-14-017-025  [P2] GAP  facet F08  effort S
- Legacy: Legacy entity no toasts, start/complete returns project DTO `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/ProjectWorkspaceService.java:94-111`
- vNext now: New transition returns sprint object, activity logged `src/modules/projects/mentor-sprint-write-service.ts:143-176`
- Fix: Map success state text and aggregate project refresh

## G2-14-017-026  [P2] GAP  facet F08  effort M
- Legacy: Legacy edit attribution changes startedBy/completedBy only at transitions `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectSprint.java:108-120`
- vNext now: New activity records transition but no columns `src/modules/projects/mentor-sprint-write-service.ts:167-176`
- Fix: Expose started/completed by/time from activity history
