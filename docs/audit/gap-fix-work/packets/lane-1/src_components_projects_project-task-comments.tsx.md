# Work packet: edit src/components/projects/project-task-comments.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/project-task-comment.md

## G2-12-017-021  [P1] GAP  facet F06  effort M
- Legacy: Old comments permitted for any active project member, no mentor/assignee-only restriction `docs/legacy-source/frontend/src/components/Projects/modals/TaskDetailsModal.jsx:164-172`
- vNext now: New canPost prop gated by upstream, service forbids OBSERVER `src/components/projects/project-task-comments.tsx:12-14,75-94` `src/modules/projects/task-comment-service.ts:33-39`
- Fix: Confirm non-assignee project membership gets write access, not only owner/mentor.

## G2-12-017-030  [P1] MISSING  facet F08  effort S
- Legacy: Legacy progress system actions rendered as a timeline with status icons `docs/legacy-source/frontend/src/components/Projects/modals/TaskDetailsModal.jsx:569-580`
- vNext now: New no system types, no timeline in comment panel `src/components/projects/project-task-comments.tsx:47-95`
- Fix: Restore activity timeline with source-driven details.

## G2-12-017-023  [P2] GAP  facet F07  effort S
- Legacy: Legacy message empty exact validation 'message is required' `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/projects/ProjectTaskCommentUpsertDTO.java:9-10`
- vNext now: New Zod min1 on body, UI hint 'Add a note before posting.' `src/modules/projects/pr-s2-04-task-fields-model.ts:9-13` `src/components/projects/project-task-comments.tsx:90-92`
- Fix: Map exact field validation text.
