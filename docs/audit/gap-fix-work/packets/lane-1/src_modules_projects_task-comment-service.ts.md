# Work packet: edit src/modules/projects/task-comment-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/project-task-comment.md

## G2-12-017-021  [P1] GAP  facet F06  effort M
- Legacy: Old comments permitted for any active project member, no mentor/assignee-only restriction `docs/legacy-source/frontend/src/components/Projects/modals/TaskDetailsModal.jsx:164-172`
- vNext now: New canPost prop gated by upstream, service forbids OBSERVER `src/components/projects/project-task-comments.tsx:12-14,75-94` `src/modules/projects/task-comment-service.ts:33-39`
- Fix: Confirm non-assignee project membership gets write access, not only owner/mentor.

## G2-12-017-041  [P1] MISSING  facet F12  effort S
- Legacy: Task status snapshots record when system updates happen `docs/legacy-source/backend/src/main/resources/db/migration/V77__project_task_comment_actions.sql:1-4,16-24`
- vNext now: New task comment write doesn't capture task.status in comment `src/modules/projects/task-comment-service.ts:46-61`
- Fix: Add status snapshot capture and preserve action causality.

## G2-12-017-062  [P1] GAP  facet F23  effort M
- Legacy: Old stored historical author and task progress snapshots `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTaskComment.java:22-41`
- vNext now: New joins mutable user name and lacks progress data `src/modules/projects/task-comment-service.ts:20-31`
- Fix: Persist immutable author/task event metadata, avoid retroactive history drift.
