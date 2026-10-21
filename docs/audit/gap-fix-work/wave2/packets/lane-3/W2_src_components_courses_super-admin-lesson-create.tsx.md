# Work packet (wave 2): edit src/components/courses/super-admin-lesson-create.tsx

23 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/u003-superadmin-lessons.md, docs/audit/gap2/lane-18/u002-superadmin-lessons.md

## G2-15-003-005  [P2] GAP  facet F02  effort M
- Legacy: Legacy create form visible on arrival inside card (`sections/Lessons.js:411-430`).
- vNext now: `SuperAdminLessonCreate` collapsed inside details with `Add Lesson` summary (`super-admin-lesson-create.tsx:39-64`).
- Fix: Keep full create panel exposed with card header and primary submission.

## G2-15-003-012  [P2] GAP  facet F03  effort S
- Legacy: Create title `Create New Lesson`, button `Create Lesson & Add Another` (`sections/Lessons.js:411-429`).
- vNext now: Create summary/button both `Add Lesson` (`super-admin-lesson-create.tsx:40-42,61-64`).
- Fix: Use exact create panel heading and button copy; preserve course/visibility on repeated create.

## G2-15-003-014  [P2] GAP  facet F04  effort S
- Legacy: Course option displays courseName/course_name/short_title fallback `Course {id}` (`sections/Lessons.js:39-45`).
- vNext now: Picker labels `courseName · cohortName · periodName` (`super-admin-lesson-create.tsx:43-49`).
- Fix: Show legacy course primary label and put cohort/period in secondary text if needed.

## G2-15-003-028  [P2] GAP  facet F06  effort S
- Legacy: LessonName required, whitespace forbidden, max255; errors `Enter a lesson name`, `Maximum 255 characters`; placeholder `e.g., Introduction to Arrays` (`sections/Lessons.js:46-51`).
- vNext now: Name HTML required/maxLength255 with no placeholder, trimmed submit (`super-admin-lesson-create.tsx:51-53,21-36`).
- Fix: Restore placeholder and inline validation texts.

## G2-15-003-029  [P2] GAP  facet F06  effort M
- Legacy: Form Course field label `Course`, placeholder `Select course`, searchable options (`sections/Lessons.js:37-45`).
- vNext now: `Course / Offering` native Select preselects paths[0] (`super-admin-lesson-create.tsx:12-17,43-50`).
- Fix: Do not preselect arbitrary first path; require explicit course selection with searchable picker.

## G2-15-003-031  [P2] GAP  facet F06  effort M
- Legacy: New lesson appended via sequence0 (backend appends), helper copy `A new lesson is appended to its course. You can reorder lessons after saving.` (`sections/Lessons.js:52-55,264-269`).
- vNext now: Client fetches existing max sequence+1 and refuses >10000; no helper (`super-admin-lesson-create.tsx:26-36,42-64`).
- Fix: Use server-owned append semantics and helper, avoid race from client GET+POST sequence calculation.

## G2-15-003-061  [P2] GAP  facet F13  effort S
- Legacy: Loading courses error `Courses could not be loaded` Retry, no courses `No courses in this college yet` (`sections/Lessons.js:412-418`).
- vNext now: Picker error warning `Lesson creation options are temporarily unavailable`; no paths `Open a course offering...` (`admin/lessons/page.tsx:89-90`; `super-admin-lesson-create.tsx:39`).
- Fix: Restore separate course-list failure vs zero-course states, link `Go to Courses`.

## G2-15-003-074  [P2] GAP  facet F18  effort S
- Legacy: Create form `Lesson Name`, `Visible to students`, `Select course`, sample placeholder (`sections/Lessons.js:37-61`).
- vNext now: Create `Course / Offering`, `Lesson name`, `Description (optional)`, no visibility switch (`super-admin-lesson-create.tsx:40-59`).
- Fix: Restore exact caps/labels/help copy.

## G2-18-002-004  [P2] GAP  facet F01  effort S
- Legacy: Legacy `Go to Courses` deep-link appears inside no-courses Alert. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:413-418`
- vNext now: vNext empty create options says `Open a course offering to create its first lesson.` `src/components/courses/super-admin-lesson-create.tsx:39-42`
- Fix: Add visible Go to Courses action when no college courses or no eligible offering paths.

## G2-18-002-006  [P2] GAP  facet F02  effort S
- Legacy: Legacy `Create New Lesson` card always visible with three controls and submit. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:410-431`
- vNext now: vNext creation is collapsed under `Add Lesson` details summary. `src/components/courses/super-admin-lesson-create.tsx:39-65`
- Fix: Show create form by default and use original card title and button position.

## G2-18-002-033  [P2] GAP  facet F06  effort M
- Legacy: Legacy create Course Select searchable with option labels courseName fallback short title/course ID. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:37-44`
- vNext now: vNext Course / Offering Select over eligible learning paths, label course·cohort·period. `src/components/courses/super-admin-lesson-create.tsx:43-50`, `src/modules/courses/super-admin-learning-path-picker.ts:9-23`
- Fix: Keep field label `Course` and searchable list, but resolve selected offering safely if course has multiple periods.

## G2-18-002-057  [P2] GAP  facet F09  effort M
- Legacy: Legacy Create form always in fixed Card and edit via 520px Modal. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:410-431`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:531-540`
- vNext now: vNext Create inline in details, edit Dialog via LessonActions. `src/components/courses/super-admin-lesson-create.tsx:39-65`, `src/components/courses/admin-learning-structure-actions.tsx:516-562`
- Fix: Match card/dialog chrome, padding, cancel and close semantics.

## G2-18-002-061  [P2] GAP  facet F09  effort M
- Legacy: Legacy course picker Antd dropdown searchable. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:39-45`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:443-449`
- vNext now: vNext native Select list of offering paths without search. `src/components/courses/super-admin-lesson-create.tsx:43-50`
- Fix: Enable searchable combobox and keyboard arrow selection with long-list virtualization where useful.

## G2-18-002-062  [P2] GAP  facet F10  effort M
- Legacy: Legacy create POST `/api/v1/lesson/create` with lesson_name, course_id/slug, sequence=0, active and enabled. `docs/legacy-source/frontend/src/api/Services/AdminService.js:559-563`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:255-268`
- vNext now: vNext GET lessons to compute next sequence then POST `/api/courses/lessons` with learningPathId, name, description, sequence. `src/components/courses/super-admin-lesson-create.tsx:21-35`, `src/app/api/courses/lessons/route.ts:30-51`
- Fix: Map semantics and avoid two round trips by server-chosen append sequence to prevent races.

## G2-18-002-074  [P2] GAP  facet F12  effort M
- Legacy: Legacy max length 255 at UI+DTO, case-insensitive lesson uniqueness per course. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:46-50`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/LessonDTO.java:11-18`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LessonServiceImpl.java:120-127`
- vNext now: vNext name max255 and unique lower(name) per learningPath, so same name allowed in another offering. `src/components/courses/super-admin-lesson-create.tsx:51-54`, `src/db/schema/courses.ts:351-357`
- Fix: Document that uniqueness scope changed from course to offering; decide expected cross-section duplicate treatment.

## G2-18-002-081  [P2] GAP  facet F13  effort S
- Legacy: Legacy no courses state `No courses in this college yet` with Go to Courses. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:413-418`
- vNext now: vNext create `Open a course offering to create its first lesson.` `src/components/courses/super-admin-lesson-create.tsx:39-42`
- Fix: Show no-course and no-active-path as distinct states with actionable destinations.

## G2-18-002-101  [P2] GAP  facet F18  effort S
- Legacy: Legacy switch `Visible to students`, helper `Off hides this lesson and its content from students; staff still see it.` `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:56-60`
- vNext now: vNext create omits switch; list uses `Bulk lesson visibility` wording. `src/components/courses/super-admin-lesson-create.tsx:42-63`, `src/components/courses/super-admin-lesson-bulk-visibility.tsx:30-35`
- Fix: Show same switch and helper in create/edit; do not conflate content-only bulk.

## G2-18-002-103  [P2] GAP  facet F18  effort S
- Legacy: Legacy `Create Lesson & Add Another` success says `Created lesson “...”.` `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:268-270`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:426-429`
- vNext now: vNext `Add Lesson` with no toast. `src/components/courses/super-admin-lesson-create.tsx:30-38`, `src/components/courses/super-admin-lesson-create.tsx:60-63`
- Fix: Restore primary action wording and named success.

## G2-18-002-121  [P2] GAP  facet F22  effort M
- Legacy: Legacy new lesson sequence appends to max integer, sequence starts at 1. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LessonServiceImpl.java:130-136`
- vNext now: vNext uses zero-based sequence and max at 10000, SQL sequence >=0 check. `src/components/courses/super-admin-lesson-create.tsx:27-29`, `src/db/schema/courses.ts:360-365`
- Fix: Normalize display +1 on reads, map legacy 1-based values to 0-based DB; enforce cap at server.

## G2-18-002-010  [P3] GAP  facet F03  effort S
- Legacy: Legacy create CTA exact `Create Lesson & Add Another` with Plus icon. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:423-429`
- vNext now: vNext summary+button both `Add Lesson`, no Plus icon. `src/components/courses/super-admin-lesson-create.tsx:40-42`, `src/components/courses/super-admin-lesson-create.tsx:60-63`
- Fix: Use exact primary CTA and plus glyph, preserve form for repeated entry.

## G2-18-002-034  [P3] GAP  facet F06  effort S
- Legacy: Legacy Lesson Name required/whitespace max 255 placeholder `e.g., Introduction to Arrays`. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:46-51`
- vNext now: vNext required maxLength255 but lacks sample placeholder. `src/components/courses/super-admin-lesson-create.tsx:51-54`
- Fix: Add the exact sample placeholder and matching validation text.

## G2-18-002-099  [P3] GAP  facet F18  effort S
- Legacy: Legacy create heading `Create New Lesson`. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:410-412`
- vNext now: vNext `Add Lesson` as collapsed summary and primary button. `src/components/courses/super-admin-lesson-create.tsx:40-63`
- Fix: Use exact heading and button copy.

## G2-18-002-100  [P3] GAP  facet F18  effort S
- Legacy: Legacy required field label `Lesson Name`, placeholder `e.g., Introduction to Arrays`. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:46-51`
- vNext now: vNext `Lesson name`, no placeholder. `src/components/courses/super-admin-lesson-create.tsx:51-54`
- Fix: Match casing and placeholder exactly.
