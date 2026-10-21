# Work packet: edit src/modules/projects/mentor-sprint-delete-service.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/u017-project-sprint.md

## G2-14-017-014  [P1] GAP  facet F05  effort L
- Legacy: Legacy reads active sprints only by isDeleted false `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectSprintRepository.java:16-20`
- vNext now: New has no soft-delete column, planned delete hard-removes sprint `src/db/schema/projects.ts:328-395` `src/modules/projects/mentor-sprint-delete-service.ts:51-52`
- Fix: Preserve history/tombstones for intentionally removed legacy sprints

## G2-14-017-015  [P1] GAP  facet F05  effort L
- Legacy: Legacy findAllByProjectId includes soft-deleted for template merge `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectSprintRepository.java:22-25`
- vNext now: New hard delete removes planned sprint completely `src/modules/projects/mentor-sprint-delete-service.ts:51-52`
- Fix: Retain explicit deletedByWorkspace tombstone semantics

## G2-14-017-033  [P1] GAP  facet F10  effort L
- Legacy: Legacy deleted workspace sprint remains tombstone so template merge ignores it `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectSprint.java:41-42` `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectSprintRepository.java:22-25`
- vNext now: New planned sprint delete removes row `src/modules/projects/mentor-sprint-delete-service.ts:51-52`
- Fix: Add deleted intent persistence or template exclusion ledger

## G2-14-017-056  [P1] GAP  facet F20  effort L
- Legacy: Legacy deletedByWorkspace allows template merge distinguish absence `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectSprint.java:41-42` `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectSprintRepository.java:22-25`
- vNext now: New hard deletion erases distinction `src/modules/projects/mentor-sprint-delete-service.ts:51-52`
- Fix: Persist deletion tombstones or explicit suppressed keys
