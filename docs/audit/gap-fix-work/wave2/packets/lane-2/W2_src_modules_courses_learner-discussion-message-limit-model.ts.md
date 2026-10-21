# Work packet (wave 2): edit src/modules/courses/learner-discussion-message-limit-model.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/l12-u009-course-classroom-discussion.md

## G2-12-009-022  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:632-649`
- vNext now: `src/modules/courses/learner-discussion-message-limit-model.ts:1-5`
- Fix: Legacy Input.TextArea maxLength4000, vNext shared max3900 and service Zod/DB 4000; 100-character parity mismatch.

## G2-12-009-082  [P2] GAP  facet F23  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:633-648`
- vNext now: `src/modules/courses/learner-discussion-message-limit-model.ts:1-5`
- Fix: Legacy max4000 input and vNext max3900; decide to restore 4000 or explicitly retain reduced cap.
