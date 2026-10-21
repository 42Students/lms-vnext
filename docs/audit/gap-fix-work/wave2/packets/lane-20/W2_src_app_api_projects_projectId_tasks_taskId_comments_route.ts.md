# Work packet (wave 2): edit src/app/api/projects/[projectId]/tasks/[taskId]/comments/route.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/project-task-comment.md

## G2-12-017-033  [P2] GAP  facet F10  effort M
- Legacy: Legacy GET/POST /{projectId}/tasks/items/{taskId}/comments `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProjectWorkspaceController.java:542-550,627-635`
- vNext now: New GET/POST /api/projects/[projectId]/tasks/[taskId]/comments `src/app/api/projects/[projectId]/tasks/[taskId]/comments/route.ts:7-17`
- Fix: Map path and JSON compatibility for legacy deep-link clients.

## G2-12-017-039  [P2] GAP  facet F12  effort M
- Legacy: Old soft deletion isDeleted inherited and repository filters active only `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BaseModel.java:36-37` `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectTaskCommentRepository.java:14-15`
- vNext now: New table has no deletion flag, no DELETE route for comments `src/db/schema/projects.ts:500-530` `src/app/api/projects/[projectId]/tasks/[taskId]/comments/route.ts:8-18`
- Fix: Define retention and migration of deleted old comments.
