# Work packet (wave 2): edit drizzle/0034_course_discussions.sql

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/u001-faculty-course-tab.md

## G2-18-001-104  [P2] GAP  facet F22  effort M
- Legacy: Legacy classroom messages fetched by courseId/classId rather than delivery UUID. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClassroomController.java:28-46`
- vNext now: vNext course_discussion_messages keyed by delivery UUID, sender membership, timestamps, pinned index and text length 1..4000. `src/db/schema/discussions.ts:16-70`, `drizzle/0034_course_discussions.sql:1-24`
- Fix: Map classroom thread uniqueness per class/course/term and preserve chronological order/cursor/pin on migration if needed.
