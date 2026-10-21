# Work packet (wave 2): edit src/modules/courses/lesson-service.ts

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/l18-u018-lesson.md, docs/audit/gap2/lane-17/college-admin-lessons.md, docs/audit/gap2/lane-18/u002-superadmin-lessons.md, docs/audit/gap2/lane-20/lesson-controller.md

## G2-18-018-011  [P2] GAP  facet F05  effort S
- Legacy: `getLessons` query excludes deleted, ORDER BY `sequence ASC, id ASC` (`LessonRepository.java:13-15`).
- vNext now: `src/modules/courses/lesson-service.ts:92-110` ORDER BY `sequence ASC, name ASC`.
- Fix: On tied historical sequence, define same stable tie-break (legacy old id; vNext id or deterministic import order) and label order.

## G2-18-018-030  [P2] GAP  facet F10  effort M
- Legacy: Admin audit emits `LESSON_CREATE`, `LESSON_REORDER` (`LessonController.java:119-127,166-174`).
- vNext now: `src/modules/courses/lesson-service.ts:151-164,400-420` records `COURSES_LESSON_CREATED/REORDERED`.
- Fix: Map audit event codes, actor, scope and metadata to export/activity-log labels; preserve user-visible old wording.

## G2-18-018-048  [P2] GAP  facet F21  effort S
- Legacy: JPA auditing listener and Spring timestamps update entity (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Lesson.java:13-15`; docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BaseModel.java:28-34).
- vNext now: Postgres `createdAt/updatedAt` default now; vNext service explicitly sets updatedAt and activity event (`src/db/schema/courses.ts:335-344`; lesson-service.ts:201-228).
- Fix: Ensure automatic updatedAt for EVERY mutation including direct SQL and archive/restore, then compare activity-log labels.

## G2-17-007-059  [P2] GAP  facet F14  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:542-550 — Delete prompt mentions uploaded files retained, progress/submissions retained.
- vNext now: src/modules/courses/lesson-service.ts:172-205 — Archive sets lesson status `ARCHIVED`, no file deletion.
- Fix: Use precise archive vs deletion language in confirmation and document storage retention.

## G2-18-002-065  [P2] GAP  facet F10  effort M
- Legacy: Legacy delete DELETE `/api/v1/lesson/delete/:id` soft deletes parent and contents; restore separate POST. `docs/legacy-source/frontend/src/api/Services/AdminService.js:579-590`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LessonServiceImpl.java:344-392`
- vNext now: vNext DELETE `/api/courses/lessons/:id` archives lesson, restore service toggles ARCHIVED→ACTIVE. `src/app/api/courses/lessons/[lessonId]/route.ts:43-65`, `src/modules/courses/lesson-service.ts:238-336`
- Fix: Document retention differences, file preservation and restored child visibility; keep no hard deletes.

## G2-18-002-066  [P2] GAP  facet F10  effort M
- Legacy: Legacy reorder PUT `/api/v1/lesson/reorder` full list IDs; controller audits LESSON_REORDER. `docs/legacy-source/frontend/src/api/Services/AdminService.js:615-617`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonController.java:77-125`
- vNext now: vNext POST `/api/courses/lessons/reorder` per-item UP/DOWN, also POST `/reorder-all` for full list, audit activity in service. `src/app/api/courses/lessons/reorder/route.ts:9-19`, `src/app/api/courses/lessons/reorder-all/route.ts:8-15`, `src/modules/courses/lesson-service.ts:338-421`
- Fix: Use reorder-all from drag/table mode with full expected order optimistic check.

## G2-18-002-075  [P2] GAP  facet F12  effort M
- Legacy: Legacy course move detects destination duplicate and preserves nonnegative sequence unless collided. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LessonServiceImpl.java:278-335`
- vNext now: vNext parent path immutable and sequence 0..10000 validation. `src/components/courses/admin-learning-structure-actions.tsx:516-605`, `src/modules/courses/lesson-service.ts:171-235`
- Fix: Keep parent immutable explicitly, and validate row order uniqueness before edit response.

## G2-18-002-078  [P2] GAP  facet F12  effort M
- Legacy: Legacy delete soft-archives children with deleted_with_lesson marker; restore only parent-archived contents. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LessonServiceImpl.java:344-392`
- vNext now: vNext archive toggles parent status ARCHIVED; child rows remain and restore reactivates parent if valid. `src/modules/courses/lesson-service.ts:238-336`
- Fix: Document child visibility/status on archive/restore and preserve independently hidden children.

## G2-18-002-117  [P2] GAP  facet F21  effort M
- Legacy: Legacy file-upload cleanup is best effort on delete and restoration policy remains nuanced. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LessonServiceImpl.java:344-392`
- vNext now: vNext archive has no file deletion and can restore parent, retaining storage references. `src/modules/courses/lesson-service.ts:238-336`
- Fix: Audit orphan file retention and delivery signed URL lifecycle separately before replacing delete copy.

## G2-18-002-122  [P2] GAP  facet F22  effort M
- Legacy: Legacy soft delete `is_deleted` and child deleted_with_lesson marker. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LessonServiceImpl.java:344-392`
- vNext now: vNext archive status enum with parent path and child retained, restore service. `src/modules/courses/lesson-service.ts:238-336`, `src/db/schema/courses.ts:332-334`
- Fix: Specify archive/restore semantics for individual vs parent-hidden contents and preserve no-resurrection policy.

## G2-20-026-001  [P2] GAP  facet F01  effort M
- Legacy: Legacy /api/v1/lesson create/fetch/fetchAll docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonController.java:132-216
- vNext now: New course learning path lessons service src/modules/courses/lesson-service.ts:52-167
- Fix: Map routes and parent path

## G2-20-026-005  [P2] GAP  facet F05  effort S
- Legacy: Legacy fetchAllPaged page0 by default docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonController.java:227-292
- vNext now: New lessons sorted sequence,name ascending src/modules/courses/lesson-service.ts:96-116
- Fix: Map page size/filter sorting

## G2-20-026-006  [P2] GAP  facet F06  effort M
- Legacy: Create LessonDTO docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonController.java:132-161
- vNext now: New createCourseLessonInputSchema src/modules/courses/lesson-service.ts:120-145
- Fix: Map every field, sequence and visibility

## G2-20-026-011  [P2] GAP  facet F10  effort M
- Legacy: Create/edit/delete/restores audit docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonController.java:160-170,508-621,641-658
- vNext now: New activity events on create/update/restore src/modules/courses/lesson-service.ts:156-163,221-228,323-329
- Fix: Verify archive and reorder audit

## G2-20-026-013  [P2] GAP  facet F12  effort M
- Legacy: Legacy deleted restore doesn't recover content docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonController.java:641-658
- vNext now: New restore preserves historical progress src/modules/courses/lesson-service.ts:299-329
- Fix: Check content visibility on restore

## G2-20-026-021  [P2] GAP  facet F19  effort M
- Legacy: Old fetchAllPaged paged docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonController.java:227-292
- vNext now: New scoped list sorted ASC src/modules/courses/lesson-service.ts:52-119
- Fix: Batch and paginate college-wide

## G2-20-026-023  [P2] GAP  facet F21  effort M
- Legacy: Old course slug resolver and lessonService docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonController.java:38-51
- vNext now: New lesson path ancestry locks src/modules/courses/lesson-service.ts:7-24
- Fix: Trace faculty content and learner roster

## G2-17-007-046  [P3] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonController.java:118-124 — Legacy reorder writes admin audit event `LESSON_REORDER` on success.
- vNext now: src/modules/courses/lesson-service.ts:235-246 — vNext reorder writes `COURSES_LESSON_REORDERED` activity event.
- Fix: Map audit taxonomy if audit log parity/reporting needs legacy event names.

## G2-20-026-015  [P3] GAP  facet F13  effort S
- Legacy: Legacy fetch lesson missing 404 docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonController.java:295-310
- vNext now: New LESSON_NOT_FOUND src/modules/courses/lesson-service.ts:176-190
- Fix: Map empty/404 UI

## G2-20-026-020  [P3] GAP  facet F18  effort S
- Legacy: Old 'Lesson deleted successfully' docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonController.java:573-612
- vNext now: New archive returns status, no literal copy src/modules/courses/lesson-service.ts:238-294
- Fix: Restore success copy
