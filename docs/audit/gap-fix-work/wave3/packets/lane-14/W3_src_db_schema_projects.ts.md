# Work packet (wave 3): edit src/db/schema/projects.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/project-task-comment.md, docs/audit/gap2/lane-4/project-workspace-model.md

## G2-12-017-002  [P1] MISSING  facet F01  effort L
- Legacy: Old task detail separates Activity and Comments from same persisted stream `docs/legacy-source/frontend/src/components/Projects/modals/TaskDetailsModal.jsx:6-13,173-182`
- vNext now: New stores only human NOTE/PROGRESS_UPDATE/FLAG_FOR_MENTOR comment stream `src/modules/projects/pr-s2-04-task-fields-model.ts:9-13` `src/db/schema/projects.ts:545-547`
- Fix: Retain task status/review/block system events in the Activity stream linked to comments.

## G2-12-017-059  [P1] MISSING  facet F22  effort L
- Legacy: Staged schema models commenterUserId,type,name,progressValue,snapshot,deletedAt but explicitly not active `src/db/schema/project-audit-staged.ts:1-7,88-121`
- vNext now: Registered schema omits these despite staging detail `src/db/schema/projects.ts:500-530`
- Fix: Reconcile W03 staged schema with registered real table; no duplicate table migration.

## G2-12-017-061  [P1] MISSING  facet F23  effort L
- Legacy: Old task status activity and human discussion are logically same record stream, differentiated in UI `docs/legacy-source/frontend/src/components/Projects/modals/TaskDetailsModal.jsx:6-13,173-182`
- vNext now: New comment source excludes system activity and progress snapshot `src/modules/projects/pr-s2-04-task-fields-model.ts:9-13` `src/db/schema/projects.ts:500-530`
- Fix: Reinstate unified comment/activity source semantics or explicit lossless join.

## G2-4-017-019  [P1] MISSING  facet F04  effort L
- Legacy: Legacy bulkLearnerId optional integer marks auto-generated unique per-learner workspace. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectWorkspace.java:96-101`)
- vNext now: New instances have no bulkLearnerId field; uniqueness by college+slug and teamGroupId. (`src/db/schema/projects.ts:172-239`)
- Fix: Add DB idempotency constraint for bulk per-learner class workspace creation.

## G2-4-017-048  [P1] MISSING  facet F12  effort L
- Legacy: Legacy class per-learner bulk uniqueness tracked by bulkLearnerId column. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectWorkspace.java:96-101`)
- vNext now: New no equivalent field/constraint on projectInstances. (`src/db/schema/projects.ts:172-241`)
- Fix: Add composite unique bulk-source key or idempotency table before bulk creation.

## G2-4-017-073  [P1] MISSING  facet F22  effort L
- Legacy: Legacy bulkLearnerId supports duplicate prevention; new project does not have it. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectWorkspace.java:96-101`)
- vNext now: New unique team group prevents group duplicate, not same learner per class. (`src/db/schema/projects.ts:235-240`)
- Fix: Enforce per-learner bulk uniqueness at DB boundary.
