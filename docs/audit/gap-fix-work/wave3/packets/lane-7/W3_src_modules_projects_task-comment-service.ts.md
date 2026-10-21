# Work packet (wave 3): edit src/modules/projects/task-comment-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/project-task-comment.md

## G2-12-017-056  [P1] MISSING  facet F20  effort L
- Legacy: Old custom system event action comments persisted in same table `docs/legacy-source/frontend/src/components/Projects/modals/TaskDetailsModal.jsx:6-13`
- vNext now: New server post enforces human kind only, no automatic task status snapshot `src/modules/projects/pr-s2-04-task-fields-model.ts:9-13` `src/modules/projects/task-comment-service.ts:58-61`
- Fix: Add transactional system event rows when task state changes.
