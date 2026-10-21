# Work packet (wave 2): edit src/modules/projects/task-comment-service.ts

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/project-task-comment.md

## G2-12-017-008  [P2] GAP  facet F03  effort M
- Legacy: Old author's name from stored commenterName snapshot `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTaskComment.java:28-29`
- vNext now: New authorName joins users.displayName at read time, fallback Project member `src/modules/projects/task-comment-service.ts:20-31` `src/components/projects/project-task-comments.tsx:65-69`
- Fix: Preserve name snapshots across user rename and membership removal.

## G2-12-017-011  [P2] GAP  facet F04  effort M
- Legacy: Old commenterName string snapshot max160 `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTaskComment.java:28-29`
- vNext now: New live users.displayName join and no saved name `src/modules/projects/task-comment-service.ts:20-31` `src/db/schema/projects.ts:511-520`
- Fix: Persist author-name snapshot or durable tombstone pseudonym.

## G2-12-017-034  [P2] GAP  facet F10  effort S
- Legacy: Old GET returns List<ProjectTaskCommentDTO> and POST refreshed List `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProjectWorkspaceController.java:542-550,627-636`
- vNext now: New GET returns array only, POST singleton plus updatedTaskAt `src/modules/projects/task-comment-service.ts:20-31,58-85`
- Fix: Make response contract explicit, update callers.

## G2-12-017-036  [P2] GAP  facet F11  effort M
- Legacy: Old active project membership allows teammate comments `docs/legacy-source/frontend/src/components/Projects/modals/TaskDetailsModal.jsx:164-172`
- vNext now: New requireProjectReadAccess plus OBSERVER denial and member college matching `src/modules/projects/task-comment-service.ts:33-39`
- Fix: Confirm observer definition matches old membership role; avoid silently disabling teammates.

## G2-12-017-037  [P2] GAP  facet F11  effort S
- Legacy: Old commenterId/type/name model snapshots sender role `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTaskComment.java:22-29`
- vNext now: New membership-derived sender and display name from users joins `src/modules/projects/task-comment-service.ts:20-31,58-61`
- Fix: Persist role/name snapshot without client writable sender.

## G2-12-017-042  [P2] GAP  facet F13  effort S
- Legacy: Old read may show body nullable and filters historical rows `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTaskComment.java:31-41` `docs/legacy-source/frontend/src/components/Projects/modals/TaskDetailsModal.jsx:603-624`
- vNext now: New body NOT NULL and all rows visible; deleted historical records not modelled `src/db/schema/projects.ts:516,541-544` `src/modules/projects/task-comment-service.ts:20-31`
- Fix: Offer migration fallback for legacy null/event rows.

## G2-12-017-054  [P2] GAP  facet F19  effort M
- Legacy: Old indexed project/task/is_deleted, sort by int id ASC `docs/legacy-source/backend/src/main/resources/db/migration/V76__project_task_comments.sql:13-16` `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectTaskCommentRepository.java:14-15`
- vNext now: New index taskId+createdAt and project+task composite FK, ascending read `src/db/schema/projects.ts:532-540` `src/modules/projects/task-comment-service.ts:28-31`
- Fix: Verify indexes support project-scoped reads and system timeline sorting.

## G2-12-017-016  [P3] GAP  facet F05  effort S
- Legacy: Old project/task active comments sorted id ASC `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectTaskCommentRepository.java:14-15`
- vNext now: New sorted createdAt ASC,id ASC `src/modules/projects/task-comment-service.ts:28-31`
- Fix: Verify timestamp collisions/backfills; preserve stable event sequence.
