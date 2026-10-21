# Work packet: edit src/modules/courses/college-learner-progress-service.ts

12 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-course-progress-controller.md, docs/audit/gap2/lane-2/admin-learner-progress-controller.md, docs/audit/gap2/lane-4/learner-content-progress-model.md, docs/audit/gap2/lane-8/college-course-progress.md

## G2-2-015-052  [P1] GAP  facet F19  effort M
- Legacy: legacy fetch all classes/courses then individual per-pair progress; local refresh (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:77-95,136-164`)
- vNext now: new choices capped 2000, learners 2001 then truncated to 2000 (`src/modules/courses/college-learner-progress-service.ts:32-53,69-91`)
- Fix: Surface truncation of class choices as well as learner rows; avoid silently hiding valid classes

## G2-2-015-077  [P1] GAP  facet F12  effort M
- Legacy: Only quizzes with PUBLISHED, active, enabled and undeleted enter denominator `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:68-72`
- vNext now: College query includes PUBLISHED or CLOSED quizzes `src/modules/courses/college-learner-progress-service.ts:112-120`
- Fix: Define CLOSED-course quiz denominator parity and exclude unless old behavior intentionally changed

## G2-2-015-079  [P1] GAP  facet F12  effort M
- Legacy: Legacy video, assignments, quizzes each clamped to current denominator before percent `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:188-195`
- vNext now: College counts distinct rows and divides their sum by present item total without clamp `src/modules/courses/college-learner-progress-service.ts:153-162`
- Fix: Clamp all three done counters to denominators and keep percentage within 0–100

## G2-2-015-080  [P1] GAP  facet F12  effort M
- Legacy: Legacy zero measurable items returns null average and no learners, with precise explanatory message `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:153-161`
- vNext now: College response converts zero-denominator to averageCompletion 0, UI shows 0% `src/modules/courses/college-learner-progress-service.ts:154-170` `src/components/courses/college-learner-progress-report.tsx:65-70`
- Fix: Use no-measure value, display note rather than 0% for no-work course

## G2-2-015-096  [P1] GAP  facet F23  effort M
- Legacy: Legacy no-work reports null average with explicit reason `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:153-161`
- vNext now: College suppresses that note and computes 0% `src/modules/courses/college-learner-progress-service.ts:154-170`
- Fix: Document and restore dropped guard; a dashboard must not claim 0% where no work exists

## G2-2-017-059  [P1] GAP  facet F22  effort M
- Legacy: Admin counts only latest attempt if completed `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/LearnerContentProgressRepository.java:89-99`
- vNext now: College reads all completed progress rows without max attempt `src/modules/courses/college-learner-progress-service.ts:125-131`
- Fix: Rank latest attempt first, then filter completed

## G2-4-019-019  [P1] GAP  facet F05  effort M
- Legacy: Legacy completed counts current attempt only to avoid exceeding 100 percent on retakes. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/LearnerContentProgressRepository.java:82-99`)
- vNext now: New college report counts completed rows without attempt filter. (`src/modules/courses/college-learner-progress-service.ts:125-153`)
- Fix: Exclude older attempt completions when reporting learner progress.

## G2-4-019-040  [P1] GAP  facet F10  effort M
- Legacy: Legacy course progress admin counts only current attempt across measured content and submitted assessments. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:62-86`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/LearnerContentProgressRepository.java:82-99`)
- vNext now: New report reads completed progress rows without attempt dimension. (`src/modules/courses/college-learner-progress-service.ts:123-161`)
- Fix: Scope report by current attempt for retakes.

## G2-4-019-063  [P1] GAP  facet F19  effort M
- Legacy: Legacy batch max500 avoids silently truncated content results. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerContentProgressServiceImpl.java:218-225`)
- vNext now: New college report caps learners at2000 but slices, with no displayed completeness warning in service excerpt. (`src/modules/courses/college-learner-progress-service.ts:89-92`)
- Fix: Do not quietly truncate large learner progress reports; expose partial warning.

## G2-8-008-052  [P1] GAP  facet F19  effort M
- Legacy: legacy fetch all classes/courses then individual per-pair progress; local refresh (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:77-95,136-164`)
- vNext now: new choices capped 2000, learners 2001 then truncated to 2000 (`src/modules/courses/college-learner-progress-service.ts:32-53,69-91`)
- Fix: Surface truncation of class choices as well as learner rows; avoid silently hiding valid classes

## G2-2-015-026  [P2] GAP  facet F07  effort S
- Legacy: invalid paired class/course server error surfaced via getCourseProgress (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:146-159`)
- vNext now: new invalid report selection returns report:null not error, without class-course matching warning (`src/modules/courses/college-learner-progress-service.ts:59-65; src/components/courses/college-learner-progress-report.tsx:61-63`)
- Fix: Differentiate forged IDs from ordinary no-selection, show explicit invalid selection feedback

## G2-8-008-026  [P2] GAP  facet F07  effort S
- Legacy: invalid paired class/course server error surfaced via getCourseProgress (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:146-159`)
- vNext now: new invalid report selection returns report:null not error, without class-course matching warning (`src/modules/courses/college-learner-progress-service.ts:59-65; src/components/courses/college-learner-progress-report.tsx:61-63`)
- Fix: Differentiate forged IDs from ordinary no-selection, show explicit invalid selection feedback
