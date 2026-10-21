# Work packet: edit src/app/api/courses/lessons/route.ts

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/lesson-search-controller.md, docs/audit/gap2/lane-17/college-admin-lessons.md

## G2-13-013-001  [P1] MISSING  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lessons/LessonSearchController.java:18-22` provides GET /api/v2/lessons/search and /stats; POST /refresh
- vNext now: `src/app/api/courses/lessons/route.ts:12-30` /api/courses/lessons GET/POST is path-based CRUD, not global search/stats/refresh
- Fix: Restore lesson-search API as scoped typed route(s) or document a replacement endpoint and update all callers

## G2-13-013-025  [P1] GAP  facet F10  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lessons/LessonSearchController.java:48-79` GET /search calls requirePrincipal, requireAccessCourse, cache.search, filters courseId
- vNext now: `src/app/api/courses/lessons/route.ts:12-27` GET /api/courses/lessons calls listCourseLessons by learningPathId
- Fix: Build search endpoint with independent indexed read, course/tenant scope check and DTO mapping

## G2-13-013-031  [P1] GAP  facet F11  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lessons/LessonSearchController.java:96-101` POST refresh requireSuperAdmin, NOT necessarily global
- vNext now: `src/app/api/courses/lessons/route.ts:30-45` POST lesson create uses courses.manage permission via `src/modules/courses/lesson-service.ts:132-135`
- Fix: Never treat refresh and lesson-create as same privileged operation; preserve separate authorization

## G2-13-013-057  [P1] MISSING  facet F23  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lessons/LessonSearchController.java:82-102` search stats and manual refresh exposed, vNext no equivalent public endpoints
- vNext now: `src/app/api/courses/lessons/route.ts:12-53` GET/POST CRUD only; `src/app/(authenticated)/admin/lessons/page.tsx:25-125` chosen-college page, no global stats
- Fix: Either implement scoped search/stats compatibility endpoints or explicitly retire with traced callers

## G2-17-007-043  [P1] GAP  facet F10  effort L
- Legacy: docs/legacy-source/frontend/src/api/Services/AdminService.js:560-580 — Legacy `/api/v1/lesson/create` POST, `/fetch?courseId=` GET, `/update/{id}` PUT, `/delete/{id}` DELETE.
- vNext now: src/app/api/courses/lessons/route.ts:10-42 — vNext GET/POST `/api/courses/lessons` using `learningPathId`, no same route PUT/DELETE.
- Fix: Map edit/delete to relevant per-ID routes and expose UI, explicitly translate old course to offering/path IDs.

## G2-13-013-019  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lessons/LessonSearchController.java:61-62` 403 error exact 'courseId is required (or use GLOBAL superadmin mode)'
- vNext now: `src/app/api/courses/lessons/route.ts:25-27` generic apiErrorResponse for missing UUID/path; `src/app/(authenticated)/admin/lessons/page.tsx:30-34` 'Invalid lesson filters'
- Fix: Maintain explicit courseId-required denial semantics or migrate clients to path-based 400/403 copy

## G2-13-013-023  [P3] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lessons/LessonSearchController.java:79` success exact 'Lessons retrieved'; `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lessons/LessonSearchController.java:93` 'Stats retrieved'; `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lessons/LessonSearchController.java:101` 'Cache refreshed'
- vNext now: `src/app/api/courses/lessons/route.ts:24` /api/courses/lessons returns data only; `src/app/(authenticated)/admin/lessons/page.tsx:85` stat line without toast
- Fix: For compatibility, map legacy success strings or update API client expectation
