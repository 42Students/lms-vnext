# Work packet (wave 2): edit src/modules/projects/pr-s2-04-task-fields-model.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/project-task-comment.md

## G2-12-017-006  [P2] GAP  facet F03  effort S
- Legacy: Legacy human comment types NOTE,PROGRESS,NEEDS_HELP, labels Note/Progress update/Flag for mentor `docs/legacy-source/frontend/src/components/Projects/modals/TaskDetailsModal.jsx:21-28`
- vNext now: New NOTE,PROGRESS_UPDATE,FLAG_FOR_MENTOR `src/modules/projects/pr-s2-04-task-fields-model.ts:9-13` `src/components/projects/project-task-comments.tsx:8-9`
- Fix: Keep exact visual labels and normalize persisted enum aliases.

## G2-12-017-051  [P2] GAP  facet F18  effort S
- Legacy: Legacy 'Progress update' and 'Flag for mentor', backend codes PROGRESS/NEEDS_HELP `docs/legacy-source/frontend/src/components/Projects/modals/TaskDetailsModal.jsx:21-28`
- vNext now: New labels on enum codes PROGRESS_UPDATE/FLAG_FOR_MENTOR `src/modules/projects/pr-s2-04-task-fields-model.ts:9-13`
- Fix: Keep user-visible words and migrate enum aliases.
