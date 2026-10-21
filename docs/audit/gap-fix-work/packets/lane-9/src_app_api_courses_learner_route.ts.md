# Work packet: edit src/app/api/courses/learner/route.ts

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/student-course-controller.md

## G2-3-025-001  [P1] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/StudentCourseController.java:23-43`
- vNext now: `src/app/api/courses/learner/route.ts:10-19`
- Fix: Preserve a scoped student identifier or explicitly document that all learner reads now resolve the authenticated membership, including access-denied behavior.

## G2-3-025-023  [P1] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/StudentCourseController.java:40-41`
- vNext now: `src/app/api/courses/learner/route.ts:10-19`
- Fix: Legacy accepts optional integer semesterId query and reconciles foreign/deleted IDs; vNext API exposes no semester selector/query parameter.

## G2-3-025-026  [P1] MISSING  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/StudentCourseController.java:98-102`
- vNext now: `src/app/api/courses/learner/route.ts:10-19`
- Fix: Implement authorized class-specific read equivalent where required by faculty/admin consumers; no classId in the learner API.

## G2-3-025-034  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/api/Services/SemesterService.js:49-67`
- vNext now: `src/app/api/courses/learner/route.ts:10-19`
- Fix: Legacy has GET byStudent, GET byStudent semesters and GET byClass; vNext exposes only GET /api/courses/learner (with server-side setup reads). Build/record 3-to-many endpoint mapping.

## G2-3-025-071  [P1] MISSING  facet F23  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/StudentCourseController.java:98-125`
- vNext now: `src/app/api/courses/learner/route.ts:10-19`
- Fix: Legacy dedicated byClass endpoint is absent from this vNext endpoint; verify independent faculty roster API before declaring entire feature absent.

## G2-3-025-027  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/StudentCourseController.java:58-69`
- vNext now: `src/app/api/courses/learner/route.ts:19-22`
- Fix: Map 403 {status:ERROR,message:Access denied} and 500 An error occurred to the vNext typed error response, including visible recovery copy.

## G2-3-025-031  [P3] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/StudentCourseController.java:53-57`
- vNext now: `src/app/api/courses/learner/route.ts:19-19`
- Fix: Legacy success envelope has status OK, message OK, data; vNext returns {courses} without those fields. Document response contract with adapters.
