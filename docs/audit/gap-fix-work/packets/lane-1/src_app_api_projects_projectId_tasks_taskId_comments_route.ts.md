# Work packet: edit src/app/api/projects/[projectId]/tasks/[taskId]/comments/route.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/project-task-comment.md

## G2-12-017-026  [P2] GAP  facet F07  effort S
- Legacy: Legacy response not found/forbidden/bad request wrappers `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProjectWorkspaceController.java:542-553,627-639`
- vNext now: New apiErrorResponse normalized errors `src/app/api/projects/[projectId]/tasks/[taskId]/comments/route.ts:8-18`
- Fix: Map source-specific codes and correct 400/403/404 response copy.

## G2-12-017-027  [P2] GAP  facet F08  effort S
- Legacy: GET success 'Project task comments retrieved' `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProjectWorkspaceController.java:542-550`
- vNext now: New GET JSON {comments} without success message `src/app/api/projects/[projectId]/tasks/[taskId]/comments/route.ts:8-11`
- Fix: Preserve response status/text for old clients.

## G2-12-017-028  [P2] GAP  facet F08  effort S
- Legacy: POST success 'Project task comment added' and returns full comment list `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProjectWorkspaceController.java:627-636`
- vNext now: New POST 201 {comment} single created entity `src/app/api/projects/[projectId]/tasks/[taskId]/comments/route.ts:13-17`
- Fix: Document response adapter and client refresh expectation.
