# Work packet (wave 2): edit src/db/schema/discussions.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/u001-faculty-course-tab.md, docs/audit/gap2/lane-3/l12-u009-course-classroom-discussion.md, docs/audit/gap2/lane-5/u020-discussions.md

## G2-18-001-104  [P2] GAP  facet F22  effort M
- Legacy: Legacy classroom messages fetched by courseId/classId rather than delivery UUID. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClassroomController.java:28-46`
- vNext now: vNext course_discussion_messages keyed by delivery UUID, sender membership, timestamps, pinned index and text length 1..4000. `src/db/schema/discussions.ts:16-70`, `drizzle/0034_course_discussions.sql:1-24`
- Fix: Map classroom thread uniqueness per class/course/term and preserve chronological order/cursor/pin on migration if needed.

## G2-12-009-078  [P2] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:99-101`
- vNext now: `src/db/schema/discussions.ts:34-76`
- Fix: Legacy FACULTY/LEARNER sender role with numeric ID; vNext senderRole enum LEARNER/FACULTY/ADMIN and membership key, enforce same-college FK path.

## G2-5-020-008  [P2] GAP  facet F04  effort M
- Legacy: Legacy contentText nullable, no length in entity `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Discussions.java:19-21`
- vNext now: Registered messageText required 1–4000 chars; staged lesson text 1–5000 `src/db/schema/discussions.ts:37-51,77-80` `src/db/schema/db05-lesson-discussions.staged.ts:43-68`
- Fix: Choose explicit lesson max and expose error text before posting.

## G2-5-020-009  [P2] GAP  facet F04  effort M
- Legacy: Legacy sequence int supplied by caller `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Discussions.java:20-23`
- vNext now: Registered delivery chat has chronological createdAt, no sequence; staged lesson has int sequence default0 `src/db/schema/discussions.ts:38-51` `src/db/schema/db05-lesson-discussions.staged.ts:38-41`
- Fix: Preserve sequence ordering/deduplication for lesson discussion list.

## G2-5-020-046  [P2] GAP  facet F22  effort M
- Legacy: Legacy repository `JpaRepository<Discussions, Long>` despite BaseModel int id `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/DiscussionRepository.java:10-14`
- vNext now: VNext UUID PK, strict FK to course delivery `src/db/schema/discussions.ts:16-27`
- Fix: Handle legacy integer/Long mismatch during migration and API compatibility.
