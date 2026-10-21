# Verification packet (P1 sample): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-17-025-013 [P1] GAP facet F06
- Files: src/modules/courses/quiz-validation.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/QuizSubmitRequestDTO.java:13-25 — answers1..200, optional shownQuestionIds200
- Expected fix: Protect question-set freshness with version token or IDs

## G2-17-025-033 [P1] GAP facet F17
- Files: src/modules/courses/quiz-attempt-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/QuizSubmitRequestDTO.java:18-24 — shownQuestionIds stale question set gives 409
- Expected fix: Pin authored revision at attempted submission

## G2-1-031-043 [P1] GAP facet F13
- Files: src/app/(authenticated)/learn/profile/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/learn/profile.js:133-144: hard error centered 40px padding and Retry.
- Expected fix: Add explicit fatal Retry state.

## G2-19-027-033 [P1] GAP facet F10
- Files: src/modules/courses/course-service.ts
- Legacy: Legacy `deleteCourse` soft marks isDeleted, blocks any lesson/content, updates search cache and records COURSE_DELETE; CourseController.java:405-445; CourseServiceImpl.java:168-185,223-231
- Expected fix: Check all dependent lessons/progress and cache invalidation under transaction; preserve reversible record state.

## G2-12-003-033 [P1] GAP facet F07
- Files: src/components/courses/admin-course-create-panel.tsx
- Legacy: AntD required messages Enter a course name, Enter short display name, Enter heading, Enter course description `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:46-70`
- Expected fix: Provide each exact field error

## G2-18-016-023 [P1] GAP facet F12
- Files: src/modules/courses/quiz-attempt-service.ts
- Legacy: QuizServiceImpl.java:535-550 enforces active/enabled/PUBLISHED/due/max attempts
- Expected fix: Verify active/enabled legacy flags fully represented by quiz/lesson visibility and CLOSED states

## G2-18-016-033 [P1] GAP facet F20
- Files: src/modules/courses/quiz-attempt-service.ts
- Legacy: QuizServiceImpl.java:298-305 uses Asia/Kolkata local due date
- Expected fix: Test dueAt ingestion and IST boundary including midnight; never assume UTC wall-clock interpretation

## G2-14-003-033 [P1] GAP facet F07
- Files: src/modules/courses/super-admin-student-course-progress.ts, src/app/(authenticated)/admin/course-progress/students/page.tsx
- Legacy: Legacy pair not taught returns This course is not taught in this class; vNext offering read validates tenant but not exact legacy pair message — `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:105-113`
- Expected fix: Enforce section teaching binding and show exact invalid pair error

## G2-18-018-013 [P1] GAP facet F05
- Files: src/modules/courses/lesson-service.ts, src/db/schema/courses.ts
- Legacy: Lesson `getMaxSequenceByCourseId` ignores soft-deleted (`LessonRepository.java:30-33`).
- Expected fix: Compute next sequence from active lessons automatically where old form omitted sequence; avoid accidental 0 duplicate.

## G2-19-026-013 [P1] GAP facet F06
- Files: (none, new feature)
- Legacy: Legacy super admin bulk allows up to 1000 DISTINCT students (ModuleAccessService:579-585)
- Expected fix: Provide chunking or batch job to handle 1000 students while retaining atomic guarantees

## G2-15-003-033 [P1] GAP facet F06
- Files: src/components/courses/admin-learning-structure-actions.tsx
- Legacy: Edit modal retains course selector and visible switch, name; sequence unchanged in payload (`sections/Lessons.js:284-316,531-540`).
- Expected fix: Restore course reassignment and visible control; move direct order edit to reorder tool.

## G2-15-006-043 [P1] GAP facet F11
- Files: src/modules/courses/learner-course-service.ts
- Legacy: Legacy course visibility determined by published/enabled/locked flags, elective actionability (courseListingUtils.js:109-120; courseHref:7-15)
- Expected fix: Explicitly gate published/locked/prerequisite states as legacy where authorized

## G2-16-008-073 [P1] GAP facet F23
- Files: src/components/courses/learner-course-workspace.tsx
- Legacy: `syllabus.js:1054-1109`: lock/expired/missed/live status clearly signaled in collapsed row.
- Expected fix: Surface row badges and disabled states before click.

## G2-17-006-013 [P1] GAP facet F04
- Files: src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx
- Legacy: docs/legacy-source/frontend/src/utils/courseUtils/contentAvailability.js:53-84 hides explicit unpublished/inactive; locked items non-actionable with detailed reason.
- Expected fix: Define historical read-only as approved product change vs old visible/actionable check; preserve informative availability reason.

## G2-17-003-013 [P1] MISSING facet F04
- Files: src/components/courses/super-admin-content-authoring.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:365-398 extracts actual video file duration from metadata when available.
- Expected fix: Restore duration detection and confirmation for successful video uploads.

## G2-18-007-053 [P1] GAP facet F10
- Files: src/components/courses/college-content-authoring-control.tsx
- Legacy: Old class-specific reorder submits lessonId,classId,orderedContentIds (`LessonContent.js:940-965`).
- Expected fix: Use whole-section ordered-content endpoint with atomic validation.

## G2-18-002-073 [P1] GAP facet F12
- Files: src/components/courses/super-admin-lesson-create.tsx
- Legacy: Legacy new lesson auto-appends per course when sequence=0. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:264-268`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LessonServiceImpl.java:130-136`
- Expected fix: Make sequence allocation atomic in DB transaction to avoid duplicate-sequence race on simultaneous creates.

## G2-18-003-013 [P1] GAP facet F03
- Files: src/components/courses/admin-course-create-panel.tsx
- Legacy: Legacy Preview Image 100px with Change/Upload/Remove controls. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:76-84`
- Expected fix: Implement signed-image upload preview/remove with same role/access and cancel semantics.

## G2-18-003-073 [P1] GAP facet F12
- Files: src/modules/courses/validation.ts
- Legacy: Legacy course name required, name max255, shortTitle required max64, code optional max40. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:46-61`
- Expected fix: Implement compatibility mapping, field messages and explicit normalized constraints.

## G2-19-003-013 [P1] GAP facet F04
- Files: src/app/(authenticated)/admin/course-progress/students/page.tsx, src/modules/courses/super-admin-student-course-progress.ts
- Legacy: Video, assignment, quiz cells show completed/total denominators `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:169-185`
- Expected fix: Validate equivalent class denominator under multi-section offerings.

## G2-19-003-063 [P1] GAP facet F19
- Files: src/modules/courses/super-admin-student-course-progress.ts
- Legacy: Legacy full class roster, table client-page20 `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:132-215` `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:379-386`
- Expected fix: Implement server paging with true totals and no truncation.

## G2-19-002-013 [P1] GAP facet F04
- Files: src/components/courses/super-admin-content-directory-page.tsx
- Legacy: Legacy columns Title Type Order Students Content Action `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:967-1082`
- Expected fix: Render six named legacy table columns and status/link cells, with responsive fallback.

## G2-19-002-063 [P1] GAP facet F13
- Files: src/components/courses/super-admin-content-directory-page.tsx
- Legacy: Legacy no college shows warning + GLOBAL Video policy exception `docs/legacy-source/frontend/src/pages/superadmin/lesson-content.js:38-63`
- Expected fix: Match no-college policy exception while forbidding college content access.

## G2-2-015-073 [P1] GAP facet F10
- Files: src/modules/courses/super-admin-student-course-progress.ts
- Legacy: Legacy loads completed video counts only for latest attempt `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/LearnerContentProgressRepository.java:89-99`
- Expected fix: Add explicit attempt-scope version semantics or verified period reset of prior completions

## G2-2-017-023 [P1] MISSING facet F08
- Files: src/modules/courses/progress-service.ts
- Legacy: Audit only for real new attempt, not no-progress branch `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminLearnerProgressController.java:110-124`
- Expected fix: Record admin retake event only when new rows actually inserted
