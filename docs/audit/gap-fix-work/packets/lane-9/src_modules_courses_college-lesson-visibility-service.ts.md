# Work packet: edit src/modules/courses/college-lesson-visibility-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/l18-u018-lesson.md

## G2-18-018-045  [P1] GAP  facet F20  effort M
- Legacy: Legacy JPA @Version Long optimistic lock version nullable on new entity; documented merge/persist hazard (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Lesson.java:30-41`).
- vNext now: `src/db/schema/courses.ts:320-365` has NO version column; `lesson-service.ts:201-215` does not condition UPDATE on updatedAt.
- Fix: Add expectedUpdatedAt/version to edit DTO and conditional update in same transaction, like visibility writer `college-lesson-visibility-service.ts:57-69`; report stale conflict.
