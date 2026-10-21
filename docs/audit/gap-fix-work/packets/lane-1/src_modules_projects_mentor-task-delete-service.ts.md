# Work packet: edit src/modules/projects/mentor-task-delete-service.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/project-task.md

## G2-13-017-003  [P1] GAP  facet F01  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectTaskRepository.java:15-26` active vs all rows separately for deletion-aware template merge
- vNext now: `src/modules/projects/mentor-task-delete-service.ts:14-57` hard-delete task after audit event; no persisted tombstone per old row
- Fix: Add durable deleted-template-item suppression/tombstone mapping when merging templates into workspace

## G2-13-017-019  [P1] GAP  facet F05  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectTaskRepository.java:21-26` all rows includes soft-deleted to suppress template fallback
- vNext now: `src/modules/projects/mentor-task-delete-service.ts:34-55` task deletions remove actual row; metadata activity event only
- Fix: Provide durable suppression key for deleted template tasks in workspace synthesis

## G2-13-017-037  [P1] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTask.java:23` deletedByWorkspace bool distinguishes deletion source
- vNext now: `src/modules/projects/mentor-task-delete-service.ts:34-55` activity metadata deleted:true lacks deleted-by-workspace marker
- Fix: Record deletion-source category and template-suppression provenance in durable data

## G2-13-017-038  [P1] GAP  facet F12  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTask.java:23-24` deletedByWorkspace false and BaseModel isDeleted false are distinct flags
- vNext now: `src/modules/projects/mentor-task-delete-service.ts:54-55` hard delete, `src/db/schema/projects.ts:397-449` no soft-delete fields
- Fix: Preserve distinction between soft-delete and workspace suppression in parity data model

## G2-13-017-061  [P1] GAP  facet F23  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTask.java:23-24` deletedByWorkspace and `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BaseModel.java:36-37` isDeleted flags
- vNext now: `src/db/schema/projects.ts:397-449` lacks tombstone; `src/modules/projects/mentor-task-delete-service.ts:54-55` deletes row
- Fix: Close template resurrection/suppression parity before shipping workspace task deletion
