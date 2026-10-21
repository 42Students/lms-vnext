# Work packet (wave 2): edit src/modules/courses/college-learning-directory-service.ts

15 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/lesson-search-controller.md, docs/audit/gap2/lane-14/course-progress.md, docs/audit/gap2/lane-15/u003-superadmin-lessons.md, docs/audit/gap2/lane-17/college-admin-lessons.md, docs/audit/gap2/lane-18/u002-superadmin-lessons.md

## G2-13-013-013  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/core/GenericSearchCache.java:194-219` blank query yields popularity/usage order; `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lessons/LessonSearchCache.java:36-41` no popularity field, so usage counts matter
- vNext now: `src/modules/courses/college-learning-directory-service.ts:166-171` blank q yields alphabetical course and cohort order
- Fix: Specify empty-query default: popularity-first search vs alphabetical directory; preserve in search adapter

## G2-13-013-015  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/core/GenericSearchCache.java:164-176` fuzzy matching when score candidates fewer than5 and query len≥3
- vNext now: `src/modules/courses/college-learning-directory-service.ts:161-163` ILIKE query, no edit-distance matching
- Fix: Add fuzzy fallback only for autocomplete requests with server-enforced result cap

## G2-13-013-026  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lessons/LessonSearchController.java:82-94` GET /stats returns cache.size for global superadmin
- vNext now: `src/modules/courses/college-learning-directory-service.ts:166-190` scoped SQL count result and paged totals
- Fix: Provide global count with active lesson semantics, independent of selected college and page

## G2-13-013-035  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/core/GenericSearchCache.java:313-351` exact100, starts80, word starts60, contains40, usage boosts up to10
- vNext now: `src/modules/courses/college-learning-directory-service.ts:161-171` boolean ILIKE and alphabetical sort, no score
- Fix: Implement relevance scoring per documented weights for search API while keeping directory alphabetical

## G2-13-013-048  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/core/GenericSearchCache.java:118-189` synchronized search guards cache mutations
- vNext now: `src/modules/courses/college-learning-directory-service.ts:166-172` concurrent separate SQL count/page may see different snapshots
- Fix: Use consistent snapshot where exact search result/count relationship matters, or document eventual consistency

## G2-13-013-055  [P2] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/LessonRepository.java:11-15` getLessons scoped by course_id and is_deleted, `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lessons/LessonSearchCache.java:50` uses findAll + l.isActive only
- vNext now: `src/modules/courses/college-learning-directory-service.ts:91-108` joins paths/offerings/active college; migration `drizzle/0004_courses_c2_learning.sql:69-77` FK and indexes
- Fix: Document archived/deleted filtering mismatch in search vs normal course APIs

## G2-14-003-040  [P2] GAP  facet F10  effort M
- Legacy: Legacy metadata GET courses, classes and teaching assignments; vNext listCollegeCourseProgress and filters options instead — `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:57-134`
- vNext now: `src/app/(authenticated)/admin/course-progress/page.tsx:36-38`; `src/modules/courses/college-learning-directory-service.ts:213-235`
- Fix: Add class/course metadata queries with permission/tenant enforcement

## G2-15-003-017  [P2] GAP  facet F04  effort S
- Legacy: Legacy sorted courseId ASC then lesson.sequence ASC then lesson.id ASC (`sections/Lessons.js:22-29,160-166`).
- vNext now: SQL sorted courseName ASC, cohortName ASC, sequence ASC, lesson ID ASC (`college-learning-directory-service.ts:166-172`).
- Fix: Reconcile default order; match source ordering or clearly document approved semantic sort.

## G2-15-003-023  [P2] GAP  facet F05  effort S
- Legacy: Toolbar search name only, exact placeholder `Search lessons` and live client filter (`sections/Lessons.js:221-223,433-441`).
- vNext now: GET query matches lesson name OR course name OR code, placeholder `Lesson or course`, length max100 (`admin/lessons/page.tsx:64-68`; `college-learning-directory-service.ts:161-163`).
- Fix: Use exact placeholder; optionally keep broader matching as documented enhancement.

## G2-15-003-025  [P2] GAP  facet F05  effort M
- Legacy: Default page size25, selectable 10/25/50/100, persisted `admin-lessons-page-size` localStorage (`sections/Lessons.js:19-20,98-115,519-523`).
- vNext now: Server fixed 25 per page, text `25 per page`, links Pagination (`admin/lessons/page.tsx:118-123`; `college-learning-directory-service.ts:166-172`).
- Fix: Restore page size selector with persistence and count-range copy.

## G2-15-003-078  [P2] GAP  facet F19  effort M
- Legacy: Toolbar live searches full fetched course lesson list in memory (`sections/Lessons.js:221-223`).
- vNext now: Server `q` pushed to SQL, page 25 (`college-learning-directory-service.ts:161-172`).
- Fix: Support matching scroll/page reset when search changes; check all-results count.

## G2-17-007-051  [P2] GAP  facet F12  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:24-31 — Client sorts by numeric course, then sequence, then numeric lesson ID.
- vNext now: src/modules/courses/college-learning-directory-service.ts:61-83 — DB query joins offerings/paths and pages at database layer.
- Fix: Write explicit stable default sort parity contract; tie-break by course, sequence, id.

## G2-18-002-024  [P2] GAP  facet F04  effort S
- Legacy: Legacy all-courses listing includes failed course names count and warnings, not false zero. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:170-195`
- vNext now: vNext aggregate list is one DB query; either success or error state. `src/app/(authenticated)/admin/lessons/page.tsx:41-52`, `src/modules/courses/college-learning-directory-service.ts:70-190`
- Fix: Show partial-count state only for partial source failures; whole-query failure stays error.

## G2-18-002-025  [P2] GAP  facet F05  effort M
- Legacy: Legacy default lessons sorted numeric courseId then sequence then numeric lessonId. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:21-29`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:160-165`
- vNext now: vNext sorted courseName, cohortName, sequence, UUID id. `src/modules/courses/college-learning-directory-service.ts:166-170`
- Fix: When strict parity required, sort by legacy course ordering where mapping exists; otherwise document new stable sort and compare visually.

## G2-18-002-021  [P3] GAP  facet F04  effort S
- Legacy: Legacy course name fallback `Course name unavailable (ID N)` when filtered course vanished. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:218-221`
- vNext now: vNext aggregates joined existing course and displays courseName/code. `src/app/(authenticated)/admin/lessons/page.tsx:98-101`, `src/modules/courses/college-learning-directory-service.ts:76-89`
- Fix: Preserve explicit missing-parent warning only for anomalous records; normal join stays authoritative.
