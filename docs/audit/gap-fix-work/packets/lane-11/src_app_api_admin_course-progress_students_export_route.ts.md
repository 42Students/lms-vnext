# Work packet: edit src/app/api/admin/course-progress/students/export/route.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/course-progress.md, docs/audit/gap2/lane-2/admin-course-progress-controller.md

## G2-14-003-015  [P1] MISSING  facet F04  effort M
- Legacy: Legacy student row Roll number column and CSV roll; vNext student detail omits roll in query, table and export — `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:166-168,212-224`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:199-209`
- vNext now: `src/modules/courses/super-admin-student-course-progress.ts:78-114`; `src/app/(authenticated)/admin/course-progress/students/page.tsx:50-64`; `src/app/api/admin/course-progress/students/export/route.ts:19-25`
- Fix: Join learnerProfiles.rollNumber and expose in table and CSV between Student and Videos

## G2-14-003-057  [P1] GAP  facet F14  effort M
- Legacy: Legacy CSV columns learnerId/name/rollNumber/videos/videoTotal/assignments/assignmentTotal/quizzes/quizTotal/percent; vNext Student/Videos/Assignments/Quizzes/Progress (%) only — `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:212-224`
- vNext now: `src/app/api/admin/course-progress/students/export/route.ts:19-26`
- Fix: Export exact 10-field roster CSV plus IDs and denominators

## G2-2-015-083  [P1] MISSING  facet F14  effort M
- Legacy: Legacy CSV has learnerId, name, rollNumber, 3 completed and 3 denominators, percent `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:207-225`
- vNext now: Super Admin student CSV has only Student, Videos, Assignments, Quizzes, Progress `src/app/api/admin/course-progress/students/export/route.ts:19-26`
- Fix: Add learner identifier, roll and per-kind denominator columns
