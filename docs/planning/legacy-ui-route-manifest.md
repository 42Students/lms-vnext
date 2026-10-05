# Legacy UI Route Manifest — frozen parity baseline

> **STALE FOR FINAL CLOSURE — 2026-10-05**
>
> This frozen manifest is still useful historical evidence but is no longer current. Current observed `lms2-fe/prod-2026` is `008d113ddd9f515df65ae7fe90dba360938314f6`, 115 commits ahead of this manifest's source SHA. Real routes added since this snapshot include `/college-admin/verification`, `/superadmin/verification`, `/tpo/verification`, `/tpo/batches`, and `/tpo/batches/[batchId]`.
>
> Do not use this file for final cutover closure until it is regenerated/re-audited against the frozen cutover oracle. See `docs/planning/clone-parity-protocol.md`.

**Legacy repository:** `42Students/lms2-fe`  
**Branch:** `prod-2026`  
**Audited SHA:** `38cdd38e592a6f416c8e8e99ce36438f548ed577`  
**Generated/audited:** 2026-10-04  
**Non-API files under `src/pages`:** 294

This manifest is the mechanical backstop for `docs/planning/account-surface-parity.md`. The matrix describes product behavior. This file answers the simpler question: **did every legacy Pages Router file get classified?**

A file classified as `LEGACY_PAGE_ARTIFACT`, `FRAMEWORK`, `TEST_ONLY` or `REDIRECT_STUB` must not be silently copied as product UI. A file classified as account/shared/ops/marketing/error must have an explicit matrix decision before parity closes.

## Classification counts

- **ACCOUNT_PRODUCT:** 1
- **ACCOUNT_PRODUCT:COLLEGE_ADMIN:** 58
- **ACCOUNT_PRODUCT:FACULTY:** 12
- **ACCOUNT_PRODUCT:HR:** 9
- **ACCOUNT_PRODUCT:LEARNER:** 20
- **ACCOUNT_PRODUCT:MENTOR:** 4
- **ACCOUNT_PRODUCT:SUPER_ADMIN:** 67
- **ACCOUNT_PRODUCT:TPO:** 21
- **ERROR_SURFACE:** 2
- **FRAMEWORK:** 2
- **LEGACY_PAGE_ARTIFACT:** 65
- **OPS_TOOL:** 4
- **PUBLIC_MARKETING:** 5
- **REDIRECT_STUB:** 16
- **SHARED_PRODUCT:** 7
- **TEST_ONLY:** 1

## Full manifest

| Legacy file | URL-shaped route | Classification | Audit disposition |
| --- | --- | --- | --- |
| `src/pages/_app.js` | `/_app` | FRAMEWORK | Next.js framework file; not a product surface. |
| `src/pages/_document.js` | `/_document` | FRAMEWORK | Next.js framework file; not a product surface. |
| `src/pages/404.js` | `/404` | ERROR_SURFACE | Custom error experience; explicitly decide/implement in vNext. |
| `src/pages/500.js` | `/500` | ERROR_SURFACE | Custom error experience; explicitly decide/implement in vNext. |
| `src/pages/ai-grading.js` | `/ai-grading` | SHARED_PRODUCT | Shared/public/protected product surface; must be represented in matrix. |
| `src/pages/auth/handoff.js` | `/auth/handoff` | SHARED_PRODUCT | Shared/public/protected product surface; must be represented in matrix. |
| `src/pages/college-admin/assignments.js` | `/college-admin/assignments` | ACCOUNT_PRODUCT:COLLEGE_ADMIN | Must be represented by College Admin matrix. |
| `src/pages/college-admin/attendance.js` | `/college-admin/attendance` | ACCOUNT_PRODUCT:COLLEGE_ADMIN | Must be represented by College Admin matrix. |
| `src/pages/college-admin/audit.js` | `/college-admin/audit` | ACCOUNT_PRODUCT:COLLEGE_ADMIN | Must be represented by College Admin matrix. |
| `src/pages/college-admin/batch-promotion.js` | `/college-admin/batch-promotion` | ACCOUNT_PRODUCT:COLLEGE_ADMIN | Must be represented by College Admin matrix. |
| `src/pages/college-admin/batches.js` | `/college-admin/batches` | ACCOUNT_PRODUCT:COLLEGE_ADMIN | Must be represented by College Admin matrix. |
| `src/pages/college-admin/calendar.js` | `/college-admin/calendar` | ACCOUNT_PRODUCT:COLLEGE_ADMIN | Must be represented by College Admin matrix. |
| `src/pages/college-admin/classes.js` | `/college-admin/classes` | ACCOUNT_PRODUCT:COLLEGE_ADMIN | Must be represented by College Admin matrix. |
| `src/pages/college-admin/companies/index.js` | `/college-admin/companies` | ACCOUNT_PRODUCT:COLLEGE_ADMIN | Must be represented by College Admin matrix. |
| `src/pages/college-admin/course-progress.js` | `/college-admin/course-progress` | ACCOUNT_PRODUCT:COLLEGE_ADMIN | Must be represented by College Admin matrix. |
| `src/pages/college-admin/courses.js` | `/college-admin/courses` | ACCOUNT_PRODUCT:COLLEGE_ADMIN | Must be represented by College Admin matrix. |
| `src/pages/college-admin/courses/[id].js` | `/college-admin/courses/[id]` | ACCOUNT_PRODUCT:COLLEGE_ADMIN | Must be represented by College Admin matrix. |
| `src/pages/college-admin/dashboard.js` | `/college-admin/dashboard` | ACCOUNT_PRODUCT:COLLEGE_ADMIN | Must be represented by College Admin matrix. |
| `src/pages/college-admin/departments.js` | `/college-admin/departments` | ACCOUNT_PRODUCT:COLLEGE_ADMIN | Must be represented by College Admin matrix. |
| `src/pages/college-admin/electives.js` | `/college-admin/electives` | ACCOUNT_PRODUCT:COLLEGE_ADMIN | Must be represented by College Admin matrix. |
| `src/pages/college-admin/faculty-assignment.js` | `/college-admin/faculty-assignment` | ACCOUNT_PRODUCT:COLLEGE_ADMIN | Must be represented by College Admin matrix. |
| `src/pages/college-admin/hiring-dashboard.js` | `/college-admin/hiring-dashboard` | ACCOUNT_PRODUCT:COLLEGE_ADMIN | Must be represented by College Admin matrix. |
| `src/pages/college-admin/index.js` | `/college-admin` | REDIRECT_STUB | No standalone product job; preserve only if route compatibility is intentionally needed. |
| `src/pages/college-admin/jobs/[jobId]/applications.js` | `/college-admin/jobs/[jobId]/applications` | ACCOUNT_PRODUCT:COLLEGE_ADMIN | Must be represented by College Admin matrix. |
| `src/pages/college-admin/jobs/[jobId]/index.js` | `/college-admin/jobs/[jobId]` | ACCOUNT_PRODUCT:COLLEGE_ADMIN | Must be represented by College Admin matrix. |
| `src/pages/college-admin/jobs/[jobId]/interviews.js` | `/college-admin/jobs/[jobId]/interviews` | ACCOUNT_PRODUCT:COLLEGE_ADMIN | Must be represented by College Admin matrix. |
| `src/pages/college-admin/jobs/[jobId]/settings.js` | `/college-admin/jobs/[jobId]/settings` | ACCOUNT_PRODUCT:COLLEGE_ADMIN | Must be represented by College Admin matrix. |
| `src/pages/college-admin/jobs/[jobId]/shortlisted.js` | `/college-admin/jobs/[jobId]/shortlisted` | ACCOUNT_PRODUCT:COLLEGE_ADMIN | Must be represented by College Admin matrix. |
| `src/pages/college-admin/jobs/all.js` | `/college-admin/jobs/all` | ACCOUNT_PRODUCT:COLLEGE_ADMIN | Must be represented by College Admin matrix. |
| `src/pages/college-admin/jobs/index.js` | `/college-admin/jobs` | ACCOUNT_PRODUCT:COLLEGE_ADMIN | Must be represented by College Admin matrix. |
| `src/pages/college-admin/lecture-halls.js` | `/college-admin/lecture-halls` | ACCOUNT_PRODUCT:COLLEGE_ADMIN | Must be represented by College Admin matrix. |
| `src/pages/college-admin/lesson-content.js` | `/college-admin/lesson-content` | ACCOUNT_PRODUCT:COLLEGE_ADMIN | Must be represented by College Admin matrix. |
| `src/pages/college-admin/lessons.js` | `/college-admin/lessons` | ACCOUNT_PRODUCT:COLLEGE_ADMIN | Must be represented by College Admin matrix. |
| `src/pages/college-admin/people.js` | `/college-admin/people` | ACCOUNT_PRODUCT:COLLEGE_ADMIN | Must be represented by College Admin matrix. |
| `src/pages/college-admin/profile.js` | `/college-admin/profile` | ACCOUNT_PRODUCT:COLLEGE_ADMIN | Must be represented by College Admin matrix. |
| `src/pages/college-admin/programs.js` | `/college-admin/programs` | ACCOUNT_PRODUCT:COLLEGE_ADMIN | Must be represented by College Admin matrix. |
| `src/pages/college-admin/projects/at-risk/index.js` | `/college-admin/projects/at-risk` | ACCOUNT_PRODUCT:COLLEGE_ADMIN | Must be represented by College Admin matrix. |
| `src/pages/college-admin/projects/audit/index.js` | `/college-admin/projects/audit` | ACCOUNT_PRODUCT:COLLEGE_ADMIN | Must be represented by College Admin matrix. |
| `src/pages/college-admin/projects/index.js` | `/college-admin/projects` | ACCOUNT_PRODUCT:COLLEGE_ADMIN | Must be represented by College Admin matrix. |
| `src/pages/college-admin/projects/readiness/index.js` | `/college-admin/projects/readiness` | ACCOUNT_PRODUCT:COLLEGE_ADMIN | Must be represented by College Admin matrix. |
| `src/pages/college-admin/projects/submissions/index.js` | `/college-admin/projects/submissions` | ACCOUNT_PRODUCT:COLLEGE_ADMIN | Must be represented by College Admin matrix. |
| `src/pages/college-admin/projects/templates/[templateId].js` | `/college-admin/projects/templates/[templateId]` | ACCOUNT_PRODUCT:COLLEGE_ADMIN | Must be represented by College Admin matrix. |
| `src/pages/college-admin/projects/templates/index.js` | `/college-admin/projects/templates` | ACCOUNT_PRODUCT:COLLEGE_ADMIN | Must be represented by College Admin matrix. |
| `src/pages/college-admin/projects/workspaces/[workspaceId]/audit.js` | `/college-admin/projects/workspaces/[workspaceId]/audit` | ACCOUNT_PRODUCT:COLLEGE_ADMIN | Must be represented by College Admin matrix. |
| `src/pages/college-admin/projects/workspaces/[workspaceId]/delivery.js` | `/college-admin/projects/workspaces/[workspaceId]/delivery` | ACCOUNT_PRODUCT:COLLEGE_ADMIN | Must be represented by College Admin matrix. |
| `src/pages/college-admin/projects/workspaces/[workspaceId]/index.js` | `/college-admin/projects/workspaces/[workspaceId]` | ACCOUNT_PRODUCT:COLLEGE_ADMIN | Must be represented by College Admin matrix. |
| `src/pages/college-admin/projects/workspaces/[workspaceId]/meetings.js` | `/college-admin/projects/workspaces/[workspaceId]/meetings` | ACCOUNT_PRODUCT:COLLEGE_ADMIN | Must be represented by College Admin matrix. |
| `src/pages/college-admin/projects/workspaces/[workspaceId]/overview.js` | `/college-admin/projects/workspaces/[workspaceId]/overview` | ACCOUNT_PRODUCT:COLLEGE_ADMIN | Must be represented by College Admin matrix. |
| `src/pages/college-admin/projects/workspaces/[workspaceId]/readiness.js` | `/college-admin/projects/workspaces/[workspaceId]/readiness` | ACCOUNT_PRODUCT:COLLEGE_ADMIN | Must be represented by College Admin matrix. |
| `src/pages/college-admin/projects/workspaces/[workspaceId]/resources.js` | `/college-admin/projects/workspaces/[workspaceId]/resources` | ACCOUNT_PRODUCT:COLLEGE_ADMIN | Must be represented by College Admin matrix. |
| `src/pages/college-admin/projects/workspaces/[workspaceId]/sprints.js` | `/college-admin/projects/workspaces/[workspaceId]/sprints` | ACCOUNT_PRODUCT:COLLEGE_ADMIN | Must be represented by College Admin matrix. |
| `src/pages/college-admin/projects/workspaces/[workspaceId]/summary.js` | `/college-admin/projects/workspaces/[workspaceId]/summary` | ACCOUNT_PRODUCT:COLLEGE_ADMIN | Must be represented by College Admin matrix. |
| `src/pages/college-admin/projects/workspaces/[workspaceId]/tasks.js` | `/college-admin/projects/workspaces/[workspaceId]/tasks` | ACCOUNT_PRODUCT:COLLEGE_ADMIN | Must be represented by College Admin matrix. |
| `src/pages/college-admin/projects/workspaces/[workspaceId]/team.js` | `/college-admin/projects/workspaces/[workspaceId]/team` | ACCOUNT_PRODUCT:COLLEGE_ADMIN | Must be represented by College Admin matrix. |
| `src/pages/college-admin/projects/workspaces/deleted.js` | `/college-admin/projects/workspaces/deleted` | ACCOUNT_PRODUCT:COLLEGE_ADMIN | Must be represented by College Admin matrix. |
| `src/pages/college-admin/projects/workspaces/index.js` | `/college-admin/projects/workspaces` | ACCOUNT_PRODUCT:COLLEGE_ADMIN | Must be represented by College Admin matrix. |
| `src/pages/college-admin/projects/workspaces/new.js` | `/college-admin/projects/workspaces/new` | ACCOUNT_PRODUCT:COLLEGE_ADMIN | Must be represented by College Admin matrix. |
| `src/pages/college-admin/projects/workspaces/reassign-mentor.js` | `/college-admin/projects/workspaces/reassign-mentor` | ACCOUNT_PRODUCT:COLLEGE_ADMIN | Must be represented by College Admin matrix. |
| `src/pages/college-admin/quizzes.js` | `/college-admin/quizzes` | ACCOUNT_PRODUCT:COLLEGE_ADMIN | Must be represented by College Admin matrix. |
| `src/pages/college-admin/semester-courses.js` | `/college-admin/semester-courses` | ACCOUNT_PRODUCT:COLLEGE_ADMIN | Must be represented by College Admin matrix. |
| `src/pages/college-admin/semesters.js` | `/college-admin/semesters` | ACCOUNT_PRODUCT:COLLEGE_ADMIN | Must be represented by College Admin matrix. |
| `src/pages/college-admin/student-groups.js` | `/college-admin/student-groups` | ACCOUNT_PRODUCT:COLLEGE_ADMIN | Must be represented by College Admin matrix. |
| `src/pages/college-admin/student-groups/[id].js` | `/college-admin/student-groups/[id]` | ACCOUNT_PRODUCT:COLLEGE_ADMIN | Must be represented by College Admin matrix. |
| `src/pages/college-admin/students.js` | `/college-admin/students` | ACCOUNT_PRODUCT:COLLEGE_ADMIN | Must be represented by College Admin matrix. |
| `src/pages/college-admin/teachers.js` | `/college-admin/teachers` | ACCOUNT_PRODUCT:COLLEGE_ADMIN | Must be represented by College Admin matrix. |
| `src/pages/company-share/[token].js` | `/company-share/[token]` | SHARED_PRODUCT | Shared/public/protected product surface; must be represented in matrix. |
| `src/pages/Dashboard/course/Attendance/AbsentPresntBtnCol.js` | `/Dashboard/course/Attendance/AbsentPresntBtnCol` | LEGACY_PAGE_ARTIFACT | Reusable implementation component stored under Pages Router; do not clone the accidental URL. |
| `src/pages/Dashboard/course/Attendance/attendance.js` | `/Dashboard/course/Attendance/attendance` | LEGACY_PAGE_ARTIFACT | Reusable implementation component stored under Pages Router; do not clone the accidental URL. |
| `src/pages/Dashboard/course/Attendance/AttendanceReport.js` | `/Dashboard/course/Attendance/AttendanceReport` | LEGACY_PAGE_ARTIFACT | Reusable implementation component stored under Pages Router; do not clone the accidental URL. |
| `src/pages/Dashboard/course/Attendance/NameWithDp.js` | `/Dashboard/course/Attendance/NameWithDp` | LEGACY_PAGE_ARTIFACT | Reusable implementation component stored under Pages Router; do not clone the accidental URL. |
| `src/pages/Dashboard/course/Attendance/StudentAttendanceView.jsx` | `/Dashboard/course/Attendance/StudentAttendanceView` | LEGACY_PAGE_ARTIFACT | Reusable implementation component stored under Pages Router; do not clone the accidental URL. |
| `src/pages/Dashboard/course/Attendance/TakeAttendance.js` | `/Dashboard/course/Attendance/TakeAttendance` | LEGACY_PAGE_ARTIFACT | Reusable implementation component stored under Pages Router; do not clone the accidental URL. |
| `src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx` | `/Dashboard/course/Attendance/TeacherAttendanceView` | LEGACY_PAGE_ARTIFACT | Reusable implementation component stored under Pages Router; do not clone the accidental URL. |
| `src/pages/Dashboard/course/Classroom/classroom.js` | `/Dashboard/course/Classroom/classroom` | LEGACY_PAGE_ARTIFACT | Reusable implementation component stored under Pages Router; do not clone the accidental URL. |
| `src/pages/Dashboard/course/Home/Home.js` | `/Dashboard/course/Home/Home` | LEGACY_PAGE_ARTIFACT | Reusable implementation component stored under Pages Router; do not clone the accidental URL. |
| `src/pages/Dashboard/course/Home/HomeEditDrawer.js` | `/Dashboard/course/Home/HomeEditDrawer` | LEGACY_PAGE_ARTIFACT | Reusable implementation component stored under Pages Router; do not clone the accidental URL. |
| `src/pages/Dashboard/course/Sudent/student.js` | `/Dashboard/course/Sudent/student` | LEGACY_PAGE_ARTIFACT | Reusable implementation component stored under Pages Router; do not clone the accidental URL. |
| `src/pages/Dashboard/course/syllabus/liveclass.js` | `/Dashboard/course/syllabus/liveclass` | LEGACY_PAGE_ARTIFACT | Reusable implementation component stored under Pages Router; do not clone the accidental URL. |
| `src/pages/Dashboard/course/syllabus/PdfViewerModal.jsx` | `/Dashboard/course/syllabus/PdfViewerModal` | LEGACY_PAGE_ARTIFACT | Reusable implementation component stored under Pages Router; do not clone the accidental URL. |
| `src/pages/Dashboard/course/syllabus/resource.js` | `/Dashboard/course/syllabus/resource` | LEGACY_PAGE_ARTIFACT | Reusable implementation component stored under Pages Router; do not clone the accidental URL. |
| `src/pages/Dashboard/course/syllabus/syllabus.js` | `/Dashboard/course/syllabus/syllabus` | LEGACY_PAGE_ARTIFACT | Reusable implementation component stored under Pages Router; do not clone the accidental URL. |
| `src/pages/Dashboard/course/syllabus/syllabusDetail.js` | `/Dashboard/course/syllabus/syllabusDetail` | LEGACY_PAGE_ARTIFACT | Reusable implementation component stored under Pages Router; do not clone the accidental URL. |
| `src/pages/Dashboard/course/syllabus/video.js` | `/Dashboard/course/syllabus/video` | LEGACY_PAGE_ARTIFACT | Reusable implementation component stored under Pages Router; do not clone the accidental URL. |
| `src/pages/Dashboard/course/syllabus/viewSubmissionsModal.jsx` | `/Dashboard/course/syllabus/viewSubmissionsModal` | LEGACY_PAGE_ARTIFACT | Reusable implementation component stored under Pages Router; do not clone the accidental URL. |
| `src/pages/Dashboard/course/syllabus/youtube.js` | `/Dashboard/course/syllabus/youtube` | LEGACY_PAGE_ARTIFACT | Reusable implementation component stored under Pages Router; do not clone the accidental URL. |
| `src/pages/e2e/superadmin-login.js` | `/e2e/superadmin-login` | TEST_ONLY | Legacy E2E helper; replace with vNext test harness, not product UI. |
| `src/pages/enterprises.js` | `/enterprises` | PUBLIC_MARKETING | Public website surface; explicit vNext ownership decision required. |
| `src/pages/home.js` | `/home` | PUBLIC_MARKETING | Public website surface; explicit vNext ownership decision required. |
| `src/pages/hr-invite/[token].js` | `/hr-invite/[token]` | ACCOUNT_PRODUCT:HR | Must be represented by HR/Public matrix. |
| `src/pages/hr/calendar.js` | `/hr/calendar` | ACCOUNT_PRODUCT:HR | Must be represented by HR/Public matrix. |
| `src/pages/hr/colleges/index.js` | `/hr/colleges` | REDIRECT_STUB | No standalone product job; preserve only if route compatibility is intentionally needed. |
| `src/pages/hr/company.js` | `/hr/company` | ACCOUNT_PRODUCT:HR | Must be represented by HR/Public matrix. |
| `src/pages/hr/drives/[jobId].js` | `/hr/drives/[jobId]` | ACCOUNT_PRODUCT:HR | Must be represented by HR/Public matrix. |
| `src/pages/hr/drives/index.js` | `/hr/drives` | ACCOUNT_PRODUCT:HR | Must be represented by HR/Public matrix. |
| `src/pages/hr/drives/new.js` | `/hr/drives/new` | ACCOUNT_PRODUCT:HR | Must be represented by HR/Public matrix. |
| `src/pages/hr/home.js` | `/hr/home` | ACCOUNT_PRODUCT:HR | Must be represented by HR/Public matrix. |
| `src/pages/hr/index.js` | `/hr` | REDIRECT_STUB | No standalone product job; preserve only if route compatibility is intentionally needed. |
| `src/pages/hr/messages.js` | `/hr/messages` | ACCOUNT_PRODUCT:HR | Must be represented by HR/Public matrix. |
| `src/pages/hr/profile.js` | `/hr/profile` | ACCOUNT_PRODUCT:HR | Must be represented by HR/Public matrix. |
| `src/pages/index.js` | `/` | SHARED_PRODUCT | Shared/public/protected product surface; must be represented in matrix. |
| `src/pages/learn/allAssignments.js` | `/learn/allAssignments` | ACCOUNT_PRODUCT:LEARNER | Must be represented by Learner matrix. |
| `src/pages/learn/allQuizzes.js` | `/learn/allQuizzes` | ACCOUNT_PRODUCT:LEARNER | Must be represented by Learner matrix. |
| `src/pages/learn/attendance.js` | `/learn/attendance` | ACCOUNT_PRODUCT:LEARNER | Must be represented by Learner matrix. |
| `src/pages/learn/calendar.js` | `/learn/calendar` | ACCOUNT_PRODUCT:LEARNER | Must be represented by Learner matrix. |
| `src/pages/learn/courses/[courseId]/[...courseTab].js` | `/learn/courses/[courseId]/[...courseTab]` | ACCOUNT_PRODUCT:LEARNER | Must be represented by Learner matrix. |
| `src/pages/learn/courses/[courseId]/index.js` | `/learn/courses/[courseId]` | ACCOUNT_PRODUCT:LEARNER | Must be represented by Learner matrix. |
| `src/pages/learn/courses/index.js` | `/learn/courses` | ACCOUNT_PRODUCT:LEARNER | Must be represented by Learner matrix. |
| `src/pages/learn/index.js` | `/learn` | REDIRECT_STUB | No standalone product job; preserve only if route compatibility is intentionally needed. |
| `src/pages/learn/my-placements/applications.js` | `/learn/my-placements/applications` | ACCOUNT_PRODUCT:LEARNER | Must be represented by Learner matrix. |
| `src/pages/learn/my-placements/assessments.js` | `/learn/my-placements/assessments` | ACCOUNT_PRODUCT:LEARNER | Must be represented by Learner matrix. |
| `src/pages/learn/my-placements/calendar.js` | `/learn/my-placements/calendar` | ACCOUNT_PRODUCT:LEARNER | Must be represented by Learner matrix. |
| `src/pages/learn/my-placements/index.js` | `/learn/my-placements` | ACCOUNT_PRODUCT:LEARNER | Must be represented by Learner matrix. |
| `src/pages/learn/my-placements/interviews.js` | `/learn/my-placements/interviews` | ACCOUNT_PRODUCT:LEARNER | Must be represented by Learner matrix. |
| `src/pages/learn/my-placements/jobs/[jobId].js` | `/learn/my-placements/jobs/[jobId]` | ACCOUNT_PRODUCT:LEARNER | Must be represented by Learner matrix. |
| `src/pages/learn/my-placements/jobs/index.js` | `/learn/my-placements/jobs` | ACCOUNT_PRODUCT:LEARNER | Must be represented by Learner matrix. |
| `src/pages/learn/my-placements/placement.js` | `/learn/my-placements/placement` | ACCOUNT_PRODUCT:LEARNER | Must be represented by Learner matrix. |
| `src/pages/learn/my-placements/rules.js` | `/learn/my-placements/rules` | ACCOUNT_PRODUCT:LEARNER | Must be represented by Learner matrix. |
| `src/pages/learn/notifications.js` | `/learn/notifications` | ACCOUNT_PRODUCT:LEARNER | Must be represented by Learner matrix. |
| `src/pages/learn/profile.js` | `/learn/profile` | ACCOUNT_PRODUCT:LEARNER | Must be represented by Learner matrix. |
| `src/pages/learn/projects/[projectId].js` | `/learn/projects/[projectId]` | ACCOUNT_PRODUCT:LEARNER | Must be represented by Learner matrix. |
| `src/pages/learn/projects/index.js` | `/learn/projects` | ACCOUNT_PRODUCT:LEARNER | Must be represented by Learner matrix. |
| `src/pages/login.js` | `/login` | SHARED_PRODUCT | Shared/public/protected product surface; must be represented in matrix. |
| `src/pages/mentor/allQuizzes.js` | `/mentor/allQuizzes` | REDIRECT_STUB | No standalone product job; preserve only if route compatibility is intentionally needed. |
| `src/pages/mentor/calendar.js` | `/mentor/calendar` | ACCOUNT_PRODUCT:MENTOR | Must be represented by Mentor matrix. |
| `src/pages/mentor/contacts/[contactsTab].js` | `/mentor/contacts/[contactsTab]` | REDIRECT_STUB | No standalone product job; preserve only if route compatibility is intentionally needed. |
| `src/pages/mentor/contacts/index.js` | `/mentor/contacts` | REDIRECT_STUB | No standalone product job; preserve only if route compatibility is intentionally needed. |
| `src/pages/mentor/courses/[courseId]/[...courseTab].js` | `/mentor/courses/[courseId]/[...courseTab]` | REDIRECT_STUB | No standalone product job; preserve only if route compatibility is intentionally needed. |
| `src/pages/mentor/courses/[courseId]/index.js` | `/mentor/courses/[courseId]` | REDIRECT_STUB | No standalone product job; preserve only if route compatibility is intentionally needed. |
| `src/pages/mentor/courses/index.js` | `/mentor/courses` | REDIRECT_STUB | No standalone product job; preserve only if route compatibility is intentionally needed. |
| `src/pages/mentor/fileExplorer.js` | `/mentor/fileExplorer` | REDIRECT_STUB | No standalone product job; preserve only if route compatibility is intentionally needed. |
| `src/pages/mentor/index.js` | `/mentor` | ACCOUNT_PRODUCT | Conditional mentor landing: opens Projects when enabled, otherwise unavailable-state + Notifications. |
| `src/pages/mentor/notifications.js` | `/mentor/notifications` | ACCOUNT_PRODUCT:MENTOR | Must be represented by Mentor matrix. |
| `src/pages/mentor/profile.js` | `/mentor/profile` | REDIRECT_STUB | No standalone product job; preserve only if route compatibility is intentionally needed. |
| `src/pages/mentor/projects/[projectId].js` | `/mentor/projects/[projectId]` | ACCOUNT_PRODUCT:MENTOR | Must be represented by Mentor matrix. |
| `src/pages/mentor/projects/index.js` | `/mentor/projects` | ACCOUNT_PRODUCT:MENTOR | Must be represented by Mentor matrix. |
| `src/pages/platform.js` | `/platform` | PUBLIC_MARKETING | Public website surface; explicit vNext ownership decision required. |
| `src/pages/privacy-policy.js` | `/privacy-policy` | SHARED_PRODUCT | Shared/public/protected product surface; must be represented in matrix. |
| `src/pages/quiz.js` | `/quiz` | SHARED_PRODUCT | Shared/public/protected product surface; must be represented in matrix. |
| `src/pages/request-demo.js` | `/request-demo` | PUBLIC_MARKETING | Public website surface; explicit vNext ownership decision required. |
| `src/pages/superadmin-login.js` | `/superadmin-login` | ACCOUNT_PRODUCT:SUPER_ADMIN | Must be represented by Super Admin matrix. |
| `src/pages/superadmin/assignments.js` | `/superadmin/assignments` | ACCOUNT_PRODUCT:SUPER_ADMIN | Must be represented by Super Admin matrix. |
| `src/pages/superadmin/attendance.js` | `/superadmin/attendance` | ACCOUNT_PRODUCT:SUPER_ADMIN | Must be represented by Super Admin matrix. |
| `src/pages/superadmin/audit.js` | `/superadmin/audit` | ACCOUNT_PRODUCT:SUPER_ADMIN | Must be represented by Super Admin matrix. |
| `src/pages/superadmin/batch-promotion.js` | `/superadmin/batch-promotion` | ACCOUNT_PRODUCT:SUPER_ADMIN | Must be represented by Super Admin matrix. |
| `src/pages/superadmin/batches.js` | `/superadmin/batches` | ACCOUNT_PRODUCT:SUPER_ADMIN | Must be represented by Super Admin matrix. |
| `src/pages/superadmin/calendar.js` | `/superadmin/calendar` | ACCOUNT_PRODUCT:SUPER_ADMIN | Must be represented by Super Admin matrix. |
| `src/pages/superadmin/classes.js` | `/superadmin/classes` | ACCOUNT_PRODUCT:SUPER_ADMIN | Must be represented by Super Admin matrix. |
| `src/pages/superadmin/companies/index.js` | `/superadmin/companies` | ACCOUNT_PRODUCT:SUPER_ADMIN | Must be represented by Super Admin matrix. |
| `src/pages/superadmin/course-progress.js` | `/superadmin/course-progress` | ACCOUNT_PRODUCT:SUPER_ADMIN | Must be represented by Super Admin matrix. |
| `src/pages/superadmin/courses.js` | `/superadmin/courses` | ACCOUNT_PRODUCT:SUPER_ADMIN | Must be represented by Super Admin matrix. |
| `src/pages/superadmin/dashboard.js` | `/superadmin/dashboard` | ACCOUNT_PRODUCT:SUPER_ADMIN | Must be represented by Super Admin matrix. |
| `src/pages/superadmin/departments.js` | `/superadmin/departments` | ACCOUNT_PRODUCT:SUPER_ADMIN | Must be represented by Super Admin matrix. |
| `src/pages/superadmin/electives.js` | `/superadmin/electives` | ACCOUNT_PRODUCT:SUPER_ADMIN | Must be represented by Super Admin matrix. |
| `src/pages/superadmin/faculty-assignment.js` | `/superadmin/faculty-assignment` | ACCOUNT_PRODUCT:SUPER_ADMIN | Must be represented by Super Admin matrix. |
| `src/pages/superadmin/features.js` | `/superadmin/features` | ACCOUNT_PRODUCT:SUPER_ADMIN | Must be represented by Super Admin matrix. |
| `src/pages/superadmin/hiring-dashboard.js` | `/superadmin/hiring-dashboard` | ACCOUNT_PRODUCT:SUPER_ADMIN | Must be represented by Super Admin matrix. |
| `src/pages/superadmin/hr.js` | `/superadmin/hr` | ACCOUNT_PRODUCT:SUPER_ADMIN | Must be represented by Super Admin matrix. |
| `src/pages/superadmin/index.js` | `/superadmin` | REDIRECT_STUB | No standalone product job; preserve only if route compatibility is intentionally needed. |
| `src/pages/superadmin/jobs/[jobId]/applications.js` | `/superadmin/jobs/[jobId]/applications` | ACCOUNT_PRODUCT:SUPER_ADMIN | Must be represented by Super Admin matrix. |
| `src/pages/superadmin/jobs/[jobId]/index.js` | `/superadmin/jobs/[jobId]` | ACCOUNT_PRODUCT:SUPER_ADMIN | Must be represented by Super Admin matrix. |
| `src/pages/superadmin/jobs/[jobId]/interviews.js` | `/superadmin/jobs/[jobId]/interviews` | ACCOUNT_PRODUCT:SUPER_ADMIN | Must be represented by Super Admin matrix. |
| `src/pages/superadmin/jobs/[jobId]/settings.js` | `/superadmin/jobs/[jobId]/settings` | ACCOUNT_PRODUCT:SUPER_ADMIN | Must be represented by Super Admin matrix. |
| `src/pages/superadmin/jobs/[jobId]/shortlisted.js` | `/superadmin/jobs/[jobId]/shortlisted` | ACCOUNT_PRODUCT:SUPER_ADMIN | Must be represented by Super Admin matrix. |
| `src/pages/superadmin/jobs/all.js` | `/superadmin/jobs/all` | ACCOUNT_PRODUCT:SUPER_ADMIN | Must be represented by Super Admin matrix. |
| `src/pages/superadmin/jobs/index.js` | `/superadmin/jobs` | ACCOUNT_PRODUCT:SUPER_ADMIN | Must be represented by Super Admin matrix. |
| `src/pages/superadmin/lecture-halls.js` | `/superadmin/lecture-halls` | ACCOUNT_PRODUCT:SUPER_ADMIN | Must be represented by Super Admin matrix. |
| `src/pages/superadmin/lesson-content.js` | `/superadmin/lesson-content` | ACCOUNT_PRODUCT:SUPER_ADMIN | Must be represented by Super Admin matrix. |
| `src/pages/superadmin/lessons.js` | `/superadmin/lessons` | ACCOUNT_PRODUCT:SUPER_ADMIN | Must be represented by Super Admin matrix. |
| `src/pages/superadmin/module-access.js` | `/superadmin/module-access` | ACCOUNT_PRODUCT:SUPER_ADMIN | Must be represented by Super Admin matrix. |
| `src/pages/superadmin/people.js` | `/superadmin/people` | ACCOUNT_PRODUCT:SUPER_ADMIN | Must be represented by Super Admin matrix. |
| `src/pages/superadmin/programs.js` | `/superadmin/programs` | ACCOUNT_PRODUCT:SUPER_ADMIN | Must be represented by Super Admin matrix. |
| `src/pages/superadmin/projects/at-risk/index.js` | `/superadmin/projects/at-risk` | ACCOUNT_PRODUCT:SUPER_ADMIN | Must be represented by Super Admin matrix. |
| `src/pages/superadmin/projects/audit/index.js` | `/superadmin/projects/audit` | ACCOUNT_PRODUCT:SUPER_ADMIN | Must be represented by Super Admin matrix. |
| `src/pages/superadmin/projects/index.js` | `/superadmin/projects` | ACCOUNT_PRODUCT:SUPER_ADMIN | Must be represented by Super Admin matrix. |
| `src/pages/superadmin/projects/readiness/index.js` | `/superadmin/projects/readiness` | ACCOUNT_PRODUCT:SUPER_ADMIN | Must be represented by Super Admin matrix. |
| `src/pages/superadmin/projects/submissions/index.js` | `/superadmin/projects/submissions` | ACCOUNT_PRODUCT:SUPER_ADMIN | Must be represented by Super Admin matrix. |
| `src/pages/superadmin/projects/templates/[templateId]/colleges.js` | `/superadmin/projects/templates/[templateId]/colleges` | ACCOUNT_PRODUCT:SUPER_ADMIN | Must be represented by Super Admin matrix. |
| `src/pages/superadmin/projects/templates/[templateId]/index.js` | `/superadmin/projects/templates/[templateId]` | ACCOUNT_PRODUCT:SUPER_ADMIN | Must be represented by Super Admin matrix. |
| `src/pages/superadmin/projects/templates/[templateId]/overview.js` | `/superadmin/projects/templates/[templateId]/overview` | ACCOUNT_PRODUCT:SUPER_ADMIN | Must be represented by Super Admin matrix. |
| `src/pages/superadmin/projects/templates/[templateId]/resources.js` | `/superadmin/projects/templates/[templateId]/resources` | ACCOUNT_PRODUCT:SUPER_ADMIN | Must be represented by Super Admin matrix. |
| `src/pages/superadmin/projects/templates/[templateId]/sprints.js` | `/superadmin/projects/templates/[templateId]/sprints` | ACCOUNT_PRODUCT:SUPER_ADMIN | Must be represented by Super Admin matrix. |
| `src/pages/superadmin/projects/templates/[templateId]/tasks.js` | `/superadmin/projects/templates/[templateId]/tasks` | ACCOUNT_PRODUCT:SUPER_ADMIN | Must be represented by Super Admin matrix. |
| `src/pages/superadmin/projects/templates/[templateId]/versions.js` | `/superadmin/projects/templates/[templateId]/versions` | ACCOUNT_PRODUCT:SUPER_ADMIN | Must be represented by Super Admin matrix. |
| `src/pages/superadmin/projects/templates/index.js` | `/superadmin/projects/templates` | ACCOUNT_PRODUCT:SUPER_ADMIN | Must be represented by Super Admin matrix. |
| `src/pages/superadmin/projects/templates/new.js` | `/superadmin/projects/templates/new` | ACCOUNT_PRODUCT:SUPER_ADMIN | Must be represented by Super Admin matrix. |
| `src/pages/superadmin/projects/workspaces/[workspaceId]/audit.js` | `/superadmin/projects/workspaces/[workspaceId]/audit` | ACCOUNT_PRODUCT:SUPER_ADMIN | Must be represented by Super Admin matrix. |
| `src/pages/superadmin/projects/workspaces/[workspaceId]/delivery.js` | `/superadmin/projects/workspaces/[workspaceId]/delivery` | ACCOUNT_PRODUCT:SUPER_ADMIN | Must be represented by Super Admin matrix. |
| `src/pages/superadmin/projects/workspaces/[workspaceId]/index.js` | `/superadmin/projects/workspaces/[workspaceId]` | ACCOUNT_PRODUCT:SUPER_ADMIN | Must be represented by Super Admin matrix. |
| `src/pages/superadmin/projects/workspaces/[workspaceId]/meetings.js` | `/superadmin/projects/workspaces/[workspaceId]/meetings` | ACCOUNT_PRODUCT:SUPER_ADMIN | Must be represented by Super Admin matrix. |
| `src/pages/superadmin/projects/workspaces/[workspaceId]/overview.js` | `/superadmin/projects/workspaces/[workspaceId]/overview` | ACCOUNT_PRODUCT:SUPER_ADMIN | Must be represented by Super Admin matrix. |
| `src/pages/superadmin/projects/workspaces/[workspaceId]/readiness.js` | `/superadmin/projects/workspaces/[workspaceId]/readiness` | ACCOUNT_PRODUCT:SUPER_ADMIN | Must be represented by Super Admin matrix. |
| `src/pages/superadmin/projects/workspaces/[workspaceId]/resources.js` | `/superadmin/projects/workspaces/[workspaceId]/resources` | ACCOUNT_PRODUCT:SUPER_ADMIN | Must be represented by Super Admin matrix. |
| `src/pages/superadmin/projects/workspaces/[workspaceId]/sprints.js` | `/superadmin/projects/workspaces/[workspaceId]/sprints` | ACCOUNT_PRODUCT:SUPER_ADMIN | Must be represented by Super Admin matrix. |
| `src/pages/superadmin/projects/workspaces/[workspaceId]/summary.js` | `/superadmin/projects/workspaces/[workspaceId]/summary` | ACCOUNT_PRODUCT:SUPER_ADMIN | Must be represented by Super Admin matrix. |
| `src/pages/superadmin/projects/workspaces/[workspaceId]/tasks.js` | `/superadmin/projects/workspaces/[workspaceId]/tasks` | ACCOUNT_PRODUCT:SUPER_ADMIN | Must be represented by Super Admin matrix. |
| `src/pages/superadmin/projects/workspaces/[workspaceId]/team.js` | `/superadmin/projects/workspaces/[workspaceId]/team` | ACCOUNT_PRODUCT:SUPER_ADMIN | Must be represented by Super Admin matrix. |
| `src/pages/superadmin/projects/workspaces/deleted.js` | `/superadmin/projects/workspaces/deleted` | ACCOUNT_PRODUCT:SUPER_ADMIN | Must be represented by Super Admin matrix. |
| `src/pages/superadmin/projects/workspaces/index.js` | `/superadmin/projects/workspaces` | ACCOUNT_PRODUCT:SUPER_ADMIN | Must be represented by Super Admin matrix. |
| `src/pages/superadmin/projects/workspaces/new.js` | `/superadmin/projects/workspaces/new` | ACCOUNT_PRODUCT:SUPER_ADMIN | Must be represented by Super Admin matrix. |
| `src/pages/superadmin/projects/workspaces/reassign-mentor.js` | `/superadmin/projects/workspaces/reassign-mentor` | ACCOUNT_PRODUCT:SUPER_ADMIN | Must be represented by Super Admin matrix. |
| `src/pages/superadmin/quizzes.js` | `/superadmin/quizzes` | ACCOUNT_PRODUCT:SUPER_ADMIN | Must be represented by Super Admin matrix. |
| `src/pages/superadmin/sections/AdminResources.js` | `/superadmin/sections/AdminResources` | LEGACY_PAGE_ARTIFACT | Reusable implementation component stored under Pages Router; do not clone the accidental URL. |
| `src/pages/superadmin/sections/AdminUsers.js` | `/superadmin/sections/AdminUsers` | LEGACY_PAGE_ARTIFACT | Reusable implementation component stored under Pages Router; do not clone the accidental URL. |
| `src/pages/superadmin/sections/Assignments.js` | `/superadmin/sections/Assignments` | LEGACY_PAGE_ARTIFACT | Reusable implementation component stored under Pages Router; do not clone the accidental URL. |
| `src/pages/superadmin/sections/Attendance.js` | `/superadmin/sections/Attendance` | LEGACY_PAGE_ARTIFACT | Reusable implementation component stored under Pages Router; do not clone the accidental URL. |
| `src/pages/superadmin/sections/AuditHub.js` | `/superadmin/sections/AuditHub` | LEGACY_PAGE_ARTIFACT | Reusable implementation component stored under Pages Router; do not clone the accidental URL. |
| `src/pages/superadmin/sections/AuditLogs.js` | `/superadmin/sections/AuditLogs` | LEGACY_PAGE_ARTIFACT | Reusable implementation component stored under Pages Router; do not clone the accidental URL. |
| `src/pages/superadmin/sections/Batches.js` | `/superadmin/sections/Batches` | LEGACY_PAGE_ARTIFACT | Reusable implementation component stored under Pages Router; do not clone the accidental URL. |
| `src/pages/superadmin/sections/BatchPromotion.js` | `/superadmin/sections/BatchPromotion` | LEGACY_PAGE_ARTIFACT | Reusable implementation component stored under Pages Router; do not clone the accidental URL. |
| `src/pages/superadmin/sections/Classes.js` | `/superadmin/sections/Classes` | LEGACY_PAGE_ARTIFACT | Reusable implementation component stored under Pages Router; do not clone the accidental URL. |
| `src/pages/superadmin/sections/CollegeBranding.js` | `/superadmin/sections/CollegeBranding` | LEGACY_PAGE_ARTIFACT | Reusable implementation component stored under Pages Router; do not clone the accidental URL. |
| `src/pages/superadmin/sections/Colleges.js` | `/superadmin/sections/Colleges` | LEGACY_PAGE_ARTIFACT | Reusable implementation component stored under Pages Router; do not clone the accidental URL. |
| `src/pages/superadmin/sections/Companies.js` | `/superadmin/sections/Companies` | LEGACY_PAGE_ARTIFACT | Reusable implementation component stored under Pages Router; do not clone the accidental URL. |
| `src/pages/superadmin/sections/CourseProgress.js` | `/superadmin/sections/CourseProgress` | LEGACY_PAGE_ARTIFACT | Reusable implementation component stored under Pages Router; do not clone the accidental URL. |
| `src/pages/superadmin/sections/Courses.js` | `/superadmin/sections/Courses` | LEGACY_PAGE_ARTIFACT | Reusable implementation component stored under Pages Router; do not clone the accidental URL. |
| `src/pages/superadmin/sections/Dashboard.js` | `/superadmin/sections/Dashboard` | LEGACY_PAGE_ARTIFACT | Reusable implementation component stored under Pages Router; do not clone the accidental URL. |
| `src/pages/superadmin/sections/Departments.js` | `/superadmin/sections/Departments` | LEGACY_PAGE_ARTIFACT | Reusable implementation component stored under Pages Router; do not clone the accidental URL. |
| `src/pages/superadmin/sections/DrivesLanding.js` | `/superadmin/sections/DrivesLanding` | LEGACY_PAGE_ARTIFACT | Reusable implementation component stored under Pages Router; do not clone the accidental URL. |
| `src/pages/superadmin/sections/Faculty.js` | `/superadmin/sections/Faculty` | LEGACY_PAGE_ARTIFACT | Reusable implementation component stored under Pages Router; do not clone the accidental URL. |
| `src/pages/superadmin/sections/FacultyAssignment.js` | `/superadmin/sections/FacultyAssignment` | LEGACY_PAGE_ARTIFACT | Reusable implementation component stored under Pages Router; do not clone the accidental URL. |
| `src/pages/superadmin/sections/FeatureControlsHub.js` | `/superadmin/sections/FeatureControlsHub` | LEGACY_PAGE_ARTIFACT | Reusable implementation component stored under Pages Router; do not clone the accidental URL. |
| `src/pages/superadmin/sections/HiringDashboard.js` | `/superadmin/sections/HiringDashboard` | LEGACY_PAGE_ARTIFACT | Reusable implementation component stored under Pages Router; do not clone the accidental URL. |
| `src/pages/superadmin/sections/HrAccounts.js` | `/superadmin/sections/HrAccounts` | LEGACY_PAGE_ARTIFACT | Reusable implementation component stored under Pages Router; do not clone the accidental URL. |
| `src/pages/superadmin/sections/InterviewEditForm.js` | `/superadmin/sections/InterviewEditForm` | LEGACY_PAGE_ARTIFACT | Reusable implementation component stored under Pages Router; do not clone the accidental URL. |
| `src/pages/superadmin/sections/InterviewFeedbackForm.js` | `/superadmin/sections/InterviewFeedbackForm` | LEGACY_PAGE_ARTIFACT | Reusable implementation component stored under Pages Router; do not clone the accidental URL. |
| `src/pages/superadmin/sections/InterviewForm.js` | `/superadmin/sections/InterviewForm` | LEGACY_PAGE_ARTIFACT | Reusable implementation component stored under Pages Router; do not clone the accidental URL. |
| `src/pages/superadmin/sections/JobApplications.js` | `/superadmin/sections/JobApplications` | LEGACY_PAGE_ARTIFACT | Reusable implementation component stored under Pages Router; do not clone the accidental URL. |
| `src/pages/superadmin/sections/JobForm.js` | `/superadmin/sections/JobForm` | LEGACY_PAGE_ARTIFACT | Reusable implementation component stored under Pages Router; do not clone the accidental URL. |
| `src/pages/superadmin/sections/Jobs.js` | `/superadmin/sections/Jobs` | LEGACY_PAGE_ARTIFACT | Reusable implementation component stored under Pages Router; do not clone the accidental URL. |
| `src/pages/superadmin/sections/LectureHalls.js` | `/superadmin/sections/LectureHalls` | LEGACY_PAGE_ARTIFACT | Reusable implementation component stored under Pages Router; do not clone the accidental URL. |
| `src/pages/superadmin/sections/LessonContent.js` | `/superadmin/sections/LessonContent` | LEGACY_PAGE_ARTIFACT | Reusable implementation component stored under Pages Router; do not clone the accidental URL. |
| `src/pages/superadmin/sections/Lessons.js` | `/superadmin/sections/Lessons` | LEGACY_PAGE_ARTIFACT | Reusable implementation component stored under Pages Router; do not clone the accidental URL. |
| `src/pages/superadmin/sections/ManageCollegeDrawer.js` | `/superadmin/sections/ManageCollegeDrawer` | LEGACY_PAGE_ARTIFACT | Reusable implementation component stored under Pages Router; do not clone the accidental URL. |
| `src/pages/superadmin/sections/ModuleAccess.js` | `/superadmin/sections/ModuleAccess` | LEGACY_PAGE_ARTIFACT | Reusable implementation component stored under Pages Router; do not clone the accidental URL. |
| `src/pages/superadmin/sections/Organizations.js` | `/superadmin/sections/Organizations` | LEGACY_PAGE_ARTIFACT | Reusable implementation component stored under Pages Router; do not clone the accidental URL. |
| `src/pages/superadmin/sections/PeopleDirectory.js` | `/superadmin/sections/PeopleDirectory` | LEGACY_PAGE_ARTIFACT | Reusable implementation component stored under Pages Router; do not clone the accidental URL. |
| `src/pages/superadmin/sections/Programs.js` | `/superadmin/sections/Programs` | LEGACY_PAGE_ARTIFACT | Reusable implementation component stored under Pages Router; do not clone the accidental URL. |
| `src/pages/superadmin/sections/Projects.js` | `/superadmin/sections/Projects` | LEGACY_PAGE_ARTIFACT | Reusable implementation component stored under Pages Router; do not clone the accidental URL. |
| `src/pages/superadmin/sections/Quizzes.js` | `/superadmin/sections/Quizzes` | LEGACY_PAGE_ARTIFACT | Reusable implementation component stored under Pages Router; do not clone the accidental URL. |
| `src/pages/superadmin/sections/ReadinessGate.js` | `/superadmin/sections/ReadinessGate` | LEGACY_PAGE_ARTIFACT | Reusable implementation component stored under Pages Router; do not clone the accidental URL. |
| `src/pages/superadmin/sections/SemesterCourseMapping.js` | `/superadmin/sections/SemesterCourseMapping` | LEGACY_PAGE_ARTIFACT | Reusable implementation component stored under Pages Router; do not clone the accidental URL. |
| `src/pages/superadmin/sections/SemesterManagement.js` | `/superadmin/sections/SemesterManagement` | LEGACY_PAGE_ARTIFACT | Reusable implementation component stored under Pages Router; do not clone the accidental URL. |
| `src/pages/superadmin/sections/StudentPlacementLookup.js` | `/superadmin/sections/StudentPlacementLookup` | LEGACY_PAGE_ARTIFACT | Reusable implementation component stored under Pages Router; do not clone the accidental URL. |
| `src/pages/superadmin/sections/Students.js` | `/superadmin/sections/Students` | LEGACY_PAGE_ARTIFACT | Reusable implementation component stored under Pages Router; do not clone the accidental URL. |
| `src/pages/superadmin/sections/TenantDomains.js` | `/superadmin/sections/TenantDomains` | LEGACY_PAGE_ARTIFACT | Reusable implementation component stored under Pages Router; do not clone the accidental URL. |
| `src/pages/superadmin/sections/TenantSettings.js` | `/superadmin/sections/TenantSettings` | LEGACY_PAGE_ARTIFACT | Reusable implementation component stored under Pages Router; do not clone the accidental URL. |
| `src/pages/superadmin/sections/TenantsHub.js` | `/superadmin/sections/TenantsHub` | LEGACY_PAGE_ARTIFACT | Reusable implementation component stored under Pages Router; do not clone the accidental URL. |
| `src/pages/superadmin/semester-courses.js` | `/superadmin/semester-courses` | ACCOUNT_PRODUCT:SUPER_ADMIN | Must be represented by Super Admin matrix. |
| `src/pages/superadmin/semesters.js` | `/superadmin/semesters` | ACCOUNT_PRODUCT:SUPER_ADMIN | Must be represented by Super Admin matrix. |
| `src/pages/superadmin/settings.js` | `/superadmin/settings` | ACCOUNT_PRODUCT:SUPER_ADMIN | Must be represented by Super Admin matrix. |
| `src/pages/superadmin/students.js` | `/superadmin/students` | ACCOUNT_PRODUCT:SUPER_ADMIN | Must be represented by Super Admin matrix. |
| `src/pages/superadmin/teachers.js` | `/superadmin/teachers` | ACCOUNT_PRODUCT:SUPER_ADMIN | Must be represented by Super Admin matrix. |
| `src/pages/superadmin/tenants.js` | `/superadmin/tenants` | ACCOUNT_PRODUCT:SUPER_ADMIN | Must be represented by Super Admin matrix. |
| `src/pages/teacher/allAssignments.js` | `/teacher/allAssignments` | ACCOUNT_PRODUCT:FACULTY | Must be represented by Faculty matrix. |
| `src/pages/teacher/allQuizzes.js` | `/teacher/allQuizzes` | ACCOUNT_PRODUCT:FACULTY | Must be represented by Faculty matrix. |
| `src/pages/teacher/calendar.js` | `/teacher/calendar` | ACCOUNT_PRODUCT:FACULTY | Must be represented by Faculty matrix. |
| `src/pages/teacher/contacts/[contactsTab].js` | `/teacher/contacts/[contactsTab]` | ACCOUNT_PRODUCT:FACULTY | Must be represented by Faculty matrix. |
| `src/pages/teacher/contacts/index.js` | `/teacher/contacts` | ACCOUNT_PRODUCT:FACULTY | Must be represented by Faculty matrix. |
| `src/pages/teacher/courses/[courseId]/[...courseTab].js` | `/teacher/courses/[courseId]/[...courseTab]` | ACCOUNT_PRODUCT:FACULTY | Must be represented by Faculty matrix. |
| `src/pages/teacher/courses/[courseId]/index.js` | `/teacher/courses/[courseId]` | ACCOUNT_PRODUCT:FACULTY | Must be represented by Faculty matrix. |
| `src/pages/teacher/courses/index.js` | `/teacher/courses` | ACCOUNT_PRODUCT:FACULTY | Must be represented by Faculty matrix. |
| `src/pages/teacher/fileExplorer.js` | `/teacher/fileExplorer` | REDIRECT_STUB | No standalone product job; preserve only if route compatibility is intentionally needed. |
| `src/pages/teacher/index.js` | `/teacher` | REDIRECT_STUB | No standalone product job; preserve only if route compatibility is intentionally needed. |
| `src/pages/teacher/notifications.js` | `/teacher/notifications` | ACCOUNT_PRODUCT:FACULTY | Must be represented by Faculty matrix. |
| `src/pages/teacher/profile.js` | `/teacher/profile` | ACCOUNT_PRODUCT:FACULTY | Must be represented by Faculty matrix. |
| `src/pages/teacher/report/assignment/[contentId].js` | `/teacher/report/assignment/[contentId]` | ACCOUNT_PRODUCT:FACULTY | Must be represented by Faculty matrix. |
| `src/pages/teacher/report/quiz/[quizId].js` | `/teacher/report/quiz/[quizId]` | ACCOUNT_PRODUCT:FACULTY | Must be represented by Faculty matrix. |
| `src/pages/tpo/audit.js` | `/tpo/audit` | ACCOUNT_PRODUCT:TPO | Must be represented by TPO matrix. |
| `src/pages/tpo/calendar.js` | `/tpo/calendar` | ACCOUNT_PRODUCT:TPO | Must be represented by TPO matrix. |
| `src/pages/tpo/companies.js` | `/tpo/companies` | ACCOUNT_PRODUCT:TPO | Must be represented by TPO matrix. |
| `src/pages/tpo/drive-day/[roundId].js` | `/tpo/drive-day/[roundId]` | ACCOUNT_PRODUCT:TPO | Must be represented by TPO matrix. |
| `src/pages/tpo/drive-day/index.js` | `/tpo/drive-day` | ACCOUNT_PRODUCT:TPO | Must be represented by TPO matrix. |
| `src/pages/tpo/drives/[jobId].js` | `/tpo/drives/[jobId]` | ACCOUNT_PRODUCT:TPO | Must be represented by TPO matrix. |
| `src/pages/tpo/drives/[jobId]/edit.js` | `/tpo/drives/[jobId]/edit` | ACCOUNT_PRODUCT:TPO | Must be represented by TPO matrix. |
| `src/pages/tpo/drives/index.js` | `/tpo/drives` | ACCOUNT_PRODUCT:TPO | Must be represented by TPO matrix. |
| `src/pages/tpo/drives/new.js` | `/tpo/drives/new` | ACCOUNT_PRODUCT:TPO | Must be represented by TPO matrix. |
| `src/pages/tpo/home.js` | `/tpo/home` | ACCOUNT_PRODUCT:TPO | Must be represented by TPO matrix. |
| `src/pages/tpo/index.js` | `/tpo` | REDIRECT_STUB | No standalone product job; preserve only if route compatibility is intentionally needed. |
| `src/pages/tpo/leads/[leadId].js` | `/tpo/leads/[leadId]` | ACCOUNT_PRODUCT:TPO | Must be represented by TPO matrix. |
| `src/pages/tpo/leads/index.js` | `/tpo/leads` | ACCOUNT_PRODUCT:TPO | Must be represented by TPO matrix. |
| `src/pages/tpo/messages.js` | `/tpo/messages` | ACCOUNT_PRODUCT:TPO | Must be represented by TPO matrix. |
| `src/pages/tpo/more.js` | `/tpo/more` | ACCOUNT_PRODUCT:TPO | Must be represented by TPO matrix. |
| `src/pages/tpo/notifications.js` | `/tpo/notifications` | ACCOUNT_PRODUCT:TPO | Must be represented by TPO matrix. |
| `src/pages/tpo/profile.js` | `/tpo/profile` | ACCOUNT_PRODUCT:TPO | Must be represented by TPO matrix. |
| `src/pages/tpo/reports/[name].js` | `/tpo/reports/[name]` | ACCOUNT_PRODUCT:TPO | Must be represented by TPO matrix. |
| `src/pages/tpo/reports/index.js` | `/tpo/reports` | ACCOUNT_PRODUCT:TPO | Must be represented by TPO matrix. |
| `src/pages/tpo/requests.js` | `/tpo/requests` | ACCOUNT_PRODUCT:TPO | Must be represented by TPO matrix. |
| `src/pages/tpo/settings.js` | `/tpo/settings` | ACCOUNT_PRODUCT:TPO | Must be represented by TPO matrix. |
| `src/pages/tpo/students/index.js` | `/tpo/students` | ACCOUNT_PRODUCT:TPO | Must be represented by TPO matrix. |
| `src/pages/tracker/index.js` | `/tracker` | OPS_TOOL | Operational issue/logging product; explicit ownership decision required. |
| `src/pages/tracker/issues/[issueId].js` | `/tracker/issues/[issueId]` | OPS_TOOL | Operational issue/logging product; explicit ownership decision required. |
| `src/pages/tracker/issues/index.js` | `/tracker/issues` | OPS_TOOL | Operational issue/logging product; explicit ownership decision required. |
| `src/pages/tracker/logs.js` | `/tracker/logs` | OPS_TOOL | Operational issue/logging product; explicit ownership decision required. |
| `src/pages/universities.js` | `/universities` | PUBLIC_MARKETING | Public website surface; explicit vNext ownership decision required. |

## Refresh rule

When `lms2-fe/prod-2026` moves materially:
1. regenerate/re-audit this manifest;
2. diff added/removed routes;
3. add every new real product route to the parity matrix before implementing unrelated vNext UI;
4. do not mark final parity complete against an older legacy SHA.
