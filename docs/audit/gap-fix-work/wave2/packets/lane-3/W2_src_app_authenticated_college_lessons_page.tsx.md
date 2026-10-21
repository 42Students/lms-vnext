# Work packet (wave 2): edit src/app/(authenticated)/college/lessons/page.tsx

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/lesson-search-controller.md, docs/audit/gap2/lane-14/l18-u018-lesson.md, docs/audit/gap2/lane-17/college-admin-lessons.md, docs/audit/gap2/lane-18/u002-superadmin-lessons.md

## G2-13-013-002  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lessons/LessonSearchController.java:48-52` GET /search query/limit/courseId optional
- vNext now: `src/app/(authenticated)/admin/lessons/page.tsx:57-84` /admin/lessons page q/status/page; `src/app/(authenticated)/college/lessons/page.tsx:17-65` college page filters
- Fix: Expose full-search entry with legacy courseId/global mode or document role-specific route replacement

## G2-18-018-001  [P2] GAP  facet F01  effort M
- Legacy: Lesson is an academic structure under `course_id`; UI authored in admin Lessons console; `LessonController.java:56-73,139-174`.
- vNext now: `src/app/(authenticated)/college/lessons/page.tsx:17-80` entry; content under learning path (`src/db/schema/courses.ts:320-328`).
- Fix: Verify old breadcrumb/selected course → new offering/path selection preserving legacy course context while retaining vNext path architecture.

## G2-18-018-004  [P2] GAP  facet F03  effort S
- Legacy: Response property `courseSlug` is computed-only, not persisted (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Lesson.java:26-28`; LessonServiceImpl.java:174-184).
- vNext now: `src/db/schema/courses.ts:320-328` has learningPathId but no `courseSlug`; UI filters `src/app/(authenticated)/college/lessons/page.tsx:27-40` include courseCode.
- Fix: Show original course slug/code beside lesson or retain route resolver so admin can reach same lesson from a course.

## G2-18-018-043  [P2] GAP  facet F18  effort M
- Legacy: Error/field copy `Lesson name is required`, max255 and name conflict; labels use lessonName (`LessonDTO.java:14-16`; LessonServiceImpl.java:123-127).
- vNext now: `src/modules/courses/validation.ts:248-288` uses `name`; `src/app/(authenticated)/college/lessons/page.tsx:57` title `Lessons`.
- Fix: Compare literal labels/toasts in `docs/audit/legacy-copy-{A,B}.md`, avoid showing `learning path` jargon on admin lesson row.

## G2-17-007-001  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/college-admin/lessons.js:9-25 — `/college-admin/lessons` sets active Redux menu item `lessons` and requires college assignment.
- vNext now: src/app/(authenticated)/college/lessons/page.tsx:17-20 — Route is `/college/lessons`; checks membership, not legacy `collegeId` scalar.
- Fix: Add verified old-path redirect and preserve selected-course deep-link semantics.

## G2-17-007-002  [P2] GAP  facet F01  effort S
- Legacy: docs/legacy-source/frontend/src/pages/college-admin/lessons.js:18-20 — No college: warning `Admin not assigned to a college` and a full contact-admin description.
- vNext now: src/app/(authenticated)/college/lessons/page.tsx:18 — Renders `CollegeCourseMissingScope` with different messaging.
- Fix: Render legacy warning title/description in missing-scope UI.

## G2-18-002-001  [P2] GAP  facet F01  effort M
- Legacy: Superadmin Lessons is a section under `/superadmin` and component also supports `/college-admin` based on router pathname. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:65-68`
- vNext now: vNext primary paths `/admin/lessons` and `/college/lessons`; `/superadmin/[...legacy]` redirects. `src/app/(authenticated)/admin/lessons/page.tsx:25-37`, `src/app/(authenticated)/college/lessons/page.tsx:17-19`, `src/app/(authenticated)/superadmin/[...legacy]/page.tsx:6-20`
- Fix: Preserve legacy URL deep-link including meaningful course filter; validate redirects before dropping query.
