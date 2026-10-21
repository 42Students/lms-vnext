# Work packet: edit src/modules/projects/pr-s2-04-task-fields-model.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/project-task-comment.md

## G2-12-017-019  [P1] GAP  facet F06  effort M
- Legacy: Old write DTO message @NotBlank, progressValue/int optional, commentType,taskStatusSnapshot `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/projects/ProjectTaskCommentUpsertDTO.java:7-14`
- vNext now: New body max4000, enum commentKind, mandatory expectedTaskUpdatedAt; no progress/status field `src/modules/projects/pr-s2-04-task-fields-model.ts:9-13`
- Fix: Preserve optional typed progress and status data in mutation contract.

## G2-12-017-024  [P1] MISSING  facet F07  effort M
- Legacy: Old comment types treated as string, system types explicitly supported `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/projects/ProjectTaskCommentUpsertDTO.java:11-14` `docs/legacy-source/frontend/src/components/Projects/modals/TaskDetailsModal.jsx:21-35`
- vNext now: New enum rejects REVIEW/BLOCKED/STATUS_UPDATE `src/modules/projects/pr-s2-04-task-fields-model.ts:9-13`
- Fix: Accept system events only from trusted task state actions, not human composer.

## G2-12-017-025  [P1] GAP  facet F07  effort M
- Legacy: Old comment may store progressValue and snapshot for quick action `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTaskComment.java:34-41`
- vNext now: New payload strict and drops both, rejects extra props `src/modules/projects/pr-s2-04-task-fields-model.ts:9-13`
- Fix: Extend source-backed command shape for system updates.

## G2-12-017-023  [P2] GAP  facet F07  effort S
- Legacy: Legacy message empty exact validation 'message is required' `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/projects/ProjectTaskCommentUpsertDTO.java:9-10`
- vNext now: New Zod min1 on body, UI hint 'Add a note before posting.' `src/modules/projects/pr-s2-04-task-fields-model.ts:9-13` `src/components/projects/project-task-comments.tsx:90-92`
- Fix: Map exact field validation text.
