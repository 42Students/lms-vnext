# Work packet (wave 2): edit src/components/courses/learner-course-discussion-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/l12-u009-course-classroom-discussion.md

## G2-12-009-070  [P2] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:115-123`
- vNext now: `src/components/courses/learner-course-discussion-model.ts:102-146`
- Fix: Legacy tombstone merges, vNext reconcile latest-window + hard delete and locallyDeletedIds. Different behavior if moderated old message outside newest page.
