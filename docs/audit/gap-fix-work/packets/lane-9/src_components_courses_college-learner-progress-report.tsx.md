# Work packet: edit src/components/courses/college-learner-progress-report.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-course-progress-controller.md, docs/audit/gap2/lane-8/college-course-progress.md

## G2-2-015-080  [P1] GAP  facet F12  effort M
- Legacy: Legacy zero measurable items returns null average and no learners, with precise explanatory message `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:153-161`
- vNext now: College response converts zero-denominator to averageCompletion 0, UI shows 0% `src/modules/courses/college-learner-progress-service.ts:154-170` `src/components/courses/college-learner-progress-report.tsx:65-70`
- Fix: Use no-measure value, display note rather than 0% for no-work course

## G2-2-015-026  [P2] GAP  facet F07  effort S
- Legacy: invalid paired class/course server error surfaced via getCourseProgress (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:146-159`)
- vNext now: new invalid report selection returns report:null not error, without class-course matching warning (`src/modules/courses/college-learner-progress-service.ts:59-65; src/components/courses/college-learner-progress-report.tsx:61-63`)
- Fix: Differentiate forged IDs from ordinary no-selection, show explicit invalid selection feedback

## G2-8-008-026  [P2] GAP  facet F07  effort S
- Legacy: invalid paired class/course server error surfaced via getCourseProgress (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:146-159`)
- vNext now: new invalid report selection returns report:null not error, without class-course matching warning (`src/modules/courses/college-learner-progress-service.ts:59-65; src/components/courses/college-learner-progress-report.tsx:61-63`)
- Fix: Differentiate forged IDs from ordinary no-selection, show explicit invalid selection feedback
