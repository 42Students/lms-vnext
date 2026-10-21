# Work packet: edit src/modules/courses/college-learning-directory-service.ts

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/lesson-search-controller.md, docs/audit/gap2/lane-15/u003-superadmin-lessons.md, docs/audit/gap2/lane-17/college-admin-lessons.md

## G2-13-013-007  [P1] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lessons/LessonSearchDTO.java:13-25` DTO fields id Integer, lessonName,courseId,courseSlug,courseName,active
- vNext now: `src/modules/courses/college-learning-directory-service.ts:76-91` and `src/modules/courses/college-learning-directory-model.ts:162-182` UUID id,name,learningPathId,courseCode/cohort/period/status etc; no courseSlug
- Fix: Define compatibility mapping for legacy DTO including courseSlug and active when consumers depend on it

## G2-13-013-008  [P1] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lessons/LessonSearchCache.java:46-55` loads all active lessons and joins course name,slug from CourseRepository.findAll
- vNext now: `src/modules/courses/college-learning-directory-service.ts:91-108` SQL joins live offerings/paths/courses/cohorts, not all course lessons
- Fix: Document deleted/archived/offering path inclusion differences; add dedicated global search read where necessary

## G2-13-013-012  [P1] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/core/GenericSearchCache.java:118-188` exact match then prefix then fuzzy (edit distance ≤2 if few results), score descending
- vNext now: `src/modules/courses/college-learning-directory-service.ts:161-171` ILIKE substring search, sorts courseName/cohortName/sequence/id
- Fix: Implement exact/prefix/fuzzy ranking and relevance sort for autocomplete search surface

## G2-13-013-029  [P1] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lessons/LessonSearchController.java:53-68` GLOBAL only unrestricted; all other actors must pass courseId with requireAccessCourse
- vNext now: `src/modules/courses/college-learning-directory-service.ts:36-58` only selected superadmin college or college admin membership; `src/modules/courses/lesson-service.ts:62-91` course offering read roles
- Fix: Restore role-specific global-superadmin search and narrow course-scoped access, including learners/faculty if legacy allowed

## G2-13-013-033  [P1] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lessons/LessonSearchCache.java:50-55` filter l.isActive before loading (not isDeleted check)
- vNext now: `src/modules/courses/college-learning-directory-service.ts:109-110` only ACTIVE default; `src/db/schema/courses.ts:332-335` status and visibleToStudents
- Fix: Clarify mapping legacy active/is_deleted/enabled to vNext ACTIVE/ARCHIVED/visible flags and exclude soft-deleted where intended

## G2-15-003-016  [P1] GAP  facet F04  effort M
- Legacy: Unknown course renders `Course name unavailable (ID …)` (`sections/Lessons.js:218-221`).
- vNext now: Inner-joined course with no orphan diagnostic (`college-learning-directory-service.ts:91-107`; `admin/lessons/page.tsx:98-99`).
- Fix: Report orphan lesson/path references without silently suppressing record, with remediation hint.

## G2-17-007-050  [P1] GAP  facet F11  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonController.java:139-160 — Legacy validates superadmin JWT college/org scope plus course admin rights.
- vNext now: src/modules/courses/college-learning-directory-service.ts:34-51 — Read route requires COLLEGE_ADMIN/courses.read, with selected-SA scope alternate.
- Fix: Review admin impersonation/read pathways, align scoped edit/delete visibility with acting-college policy.
