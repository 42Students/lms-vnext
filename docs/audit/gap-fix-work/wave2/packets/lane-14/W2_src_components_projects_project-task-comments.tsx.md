# Work packet (wave 2): edit src/components/projects/project-task-comments.tsx

13 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/project-task-comment.md

## G2-12-017-001  [P2] GAP  facet F01  effort S
- Legacy: ProjectTaskComment entity stores projectId and projectTaskId, shown inside task detail modal `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTaskComment.java:10-20` `docs/legacy-source/frontend/src/components/Projects/modals/TaskDetailsModal.jsx:588-608`
- vNext now: New comment belongs to project/task and is behind 'Comments' expansion `src/db/schema/projects.ts:500-510` `src/components/projects/project-task-comments.tsx:47-51`
- Fix: Match always-visible Comments section in task modal instead of nested disclosure.

## G2-12-017-003  [P2] GAP  facet F02  effort S
- Legacy: Legacy task modal has separate Activity section and Comments section, each maxHeight320 scroll `docs/legacy-source/frontend/src/components/Projects/modals/TaskDetailsModal.jsx:569-580,588-608`
- vNext now: New Comments panel only with filter/select, no Activity timeline in comment component `src/components/projects/project-task-comments.tsx:47-95`
- Fix: Restore separated activity and comments sections with legacy spacing/scroll.

## G2-12-017-004  [P2] GAP  facet F02  effort S
- Legacy: Old comments tags, user and time on same row `docs/legacy-source/frontend/src/components/Projects/modals/TaskDetailsModal.jsx:609-621`
- vNext now: New user·time then kind label on second line `src/components/projects/project-task-comments.tsx:65-74`
- Fix: Restore inline author/tag/time row and exact badge colors.

## G2-12-017-005  [P2] GAP  facet F02  effort S
- Legacy: Legacy panel uses Ant Design Spin and Empty simple illustration `docs/legacy-source/frontend/src/components/Projects/modals/TaskDetailsModal.jsx:603-607`
- vNext now: New renders text No comments yet., no spinner inside open panel beyond busy button `src/components/projects/project-task-comments.tsx:24-33,62-64`
- Fix: Use old in-panel loading/empty treatment.

## G2-12-017-006  [P2] GAP  facet F03  effort S
- Legacy: Legacy human comment types NOTE,PROGRESS,NEEDS_HELP, labels Note/Progress update/Flag for mentor `docs/legacy-source/frontend/src/components/Projects/modals/TaskDetailsModal.jsx:21-28`
- vNext now: New NOTE,PROGRESS_UPDATE,FLAG_FOR_MENTOR `src/modules/projects/pr-s2-04-task-fields-model.ts:9-13` `src/components/projects/project-task-comments.tsx:8-9`
- Fix: Keep exact visual labels and normalize persisted enum aliases.

## G2-12-017-008  [P2] GAP  facet F03  effort M
- Legacy: Old author's name from stored commenterName snapshot `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTaskComment.java:28-29`
- vNext now: New authorName joins users.displayName at read time, fallback Project member `src/modules/projects/task-comment-service.ts:20-31` `src/components/projects/project-task-comments.tsx:65-69`
- Fix: Preserve name snapshots across user rename and membership removal.

## G2-12-017-017  [P2] GAP  facet F05  effort S
- Legacy: Old Activity + Comments separately filtered (activity newest-first) `docs/legacy-source/frontend/src/components/Projects/modals/TaskDetailsModal.jsx:173-182`
- vNext now: New comment feed oldest-first and same kind filter list `src/components/projects/project-task-comments.tsx:53-75`
- Fix: Restore newest-first view for Activity and Comments according to old UI.

## G2-12-017-020  [P2] GAP  facet F06  effort S
- Legacy: Legacy human composer textarea rows3 no maxLength, type NOTE default `docs/legacy-source/frontend/src/components/Projects/modals/TaskDetailsModal.jsx:628-637`
- vNext now: New Textarea maxLength4000, default NOTE, no explicit rows3 `src/components/projects/project-task-comments.tsx:15-19,76-94`
- Fix: Match default rows and affordance, keep sensible max-length check.

## G2-12-017-031  [P2] GAP  facet F09  effort S
- Legacy: Legacy task comments contained inside TaskDetailsModal always rendered `docs/legacy-source/frontend/src/components/Projects/modals/TaskDetailsModal.jsx:588-640`
- vNext now: New standalone expandable component via Comments button `src/components/projects/project-task-comments.tsx:47-51`
- Fix: Keep old task modal panel open and two-section layout.

## G2-12-017-043  [P2] GAP  facet F13  effort S
- Legacy: Legacy modal read errors suppress composer when taskDetailLoadError `docs/legacy-source/frontend/src/components/Projects/modals/TaskDetailsModal.jsx:603-629`
- vNext now: New 'could not load comments' keeps closed and shows error below button `src/components/projects/project-task-comments.tsx:24-33,95-96`
- Fix: Match inline error/retry state in task modal.

## G2-12-017-048  [P2] GAP  facet F16  effort S
- Legacy: Legacy two 320px max-height scroll lists inside modal `docs/legacy-source/frontend/src/components/Projects/modals/TaskDetailsModal.jsx:569-580,607-608`
- vNext now: New comments expand inside page with no explicit 320px scroll height `src/components/projects/project-task-comments.tsx:47-95`
- Fix: Match modal mobile height and scroll region.

## G2-12-017-050  [P2] GAP  facet F17  effort S
- Legacy: Legacy comment kind pill Tag is visually distinct `docs/legacy-source/frontend/src/components/Projects/modals/TaskDetailsModal.jsx:609-615`
- vNext now: New shows plain text label in paragraph `src/components/projects/project-task-comments.tsx:71-74`
- Fix: Use badge with accessible role/kind text.

## G2-12-017-052  [P3] GAP  facet F18  effort S
- Legacy: Old default fallback comment author 'Unknown' `docs/legacy-source/frontend/src/components/Projects/modals/TaskDetailsModal.jsx:609-612`
- vNext now: New fallback 'Project member' `src/components/projects/project-task-comments.tsx:65-69`
- Fix: Restore Unknown fallback or approved anonymization.
