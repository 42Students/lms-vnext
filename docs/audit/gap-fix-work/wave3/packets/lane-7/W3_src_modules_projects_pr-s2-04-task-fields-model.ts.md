# Work packet (wave 3): edit src/modules/projects/pr-s2-04-task-fields-model.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/project-task-comment.md

## G2-12-017-002  [P1] MISSING  facet F01  effort L
- Legacy: Old task detail separates Activity and Comments from same persisted stream `docs/legacy-source/frontend/src/components/Projects/modals/TaskDetailsModal.jsx:6-13,173-182`
- vNext now: New stores only human NOTE/PROGRESS_UPDATE/FLAG_FOR_MENTOR comment stream `src/modules/projects/pr-s2-04-task-fields-model.ts:9-13` `src/db/schema/projects.ts:545-547`
- Fix: Retain task status/review/block system events in the Activity stream linked to comments.

## G2-12-017-056  [P1] MISSING  facet F20  effort L
- Legacy: Old custom system event action comments persisted in same table `docs/legacy-source/frontend/src/components/Projects/modals/TaskDetailsModal.jsx:6-13`
- vNext now: New server post enforces human kind only, no automatic task status snapshot `src/modules/projects/pr-s2-04-task-fields-model.ts:9-13` `src/modules/projects/task-comment-service.ts:58-61`
- Fix: Add transactional system event rows when task state changes.

## G2-12-017-061  [P1] MISSING  facet F23  effort L
- Legacy: Old task status activity and human discussion are logically same record stream, differentiated in UI `docs/legacy-source/frontend/src/components/Projects/modals/TaskDetailsModal.jsx:6-13,173-182`
- vNext now: New comment source excludes system activity and progress snapshot `src/modules/projects/pr-s2-04-task-fields-model.ts:9-13` `src/db/schema/projects.ts:500-530`
- Fix: Reinstate unified comment/activity source semantics or explicit lossless join.
