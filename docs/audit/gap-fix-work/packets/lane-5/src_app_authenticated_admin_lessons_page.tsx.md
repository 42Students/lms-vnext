# Work packet: edit src/app/(authenticated)/admin/lessons/page.tsx

18 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/lesson-search-controller.md, docs/audit/gap2/lane-15/u003-superadmin-lessons.md, docs/audit/gap2/lane-18/u002-superadmin-lessons.md, docs/audit/gap2/lane-2/admin-lesson-bulk-controller.md

## G2-13-013-003  [P1] MISSING  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lessons/LessonSearchController.java:82-102` search side routes stats and refresh, global/root entry
- vNext now: `src/app/(authenticated)/admin/lessons/page.tsx:25-45` selected-college lesson directory only; no refresh/stats controls
- Fix: Replace privileged stats/refresh with equivalent global lesson index administration action

## G2-13-013-018  [P1] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lessons/LessonSearchController.java:65-68` scoped superadmin can supply courseId and requireAccessCourse
- vNext now: `src/app/(authenticated)/admin/lessons/page.tsx:36-40` selected college required, `src/app/(authenticated)/college/lessons/page.tsx:19` membership required
- Fix: Add authorized global-superadmin lesson search without selected college for parity, with optional college/course filters

## G2-13-013-030  [P1] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lessons/LessonSearchController.java:82-93` stats only when global superadmin (collegeId and orgId null)
- vNext now: `src/app/(authenticated)/admin/lessons/page.tsx:36-40` selected-college superadmin required for directory
- Fix: Add global readonly stats permission separate from selected-college course management

## G2-13-013-057  [P1] MISSING  facet F23  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lessons/LessonSearchController.java:82-102` search stats and manual refresh exposed, vNext no equivalent public endpoints
- vNext now: `src/app/api/courses/lessons/route.ts:12-53` GET/POST CRUD only; `src/app/(authenticated)/admin/lessons/page.tsx:25-125` chosen-college page, no global stats
- Fix: Either implement scoped search/stats compatibility endpoints or explicitly retire with traced callers

## G2-15-003-016  [P1] GAP  facet F04  effort M
- Legacy: Unknown course renders `Course name unavailable (ID …)` (`sections/Lessons.js:218-221`).
- vNext now: Inner-joined course with no orphan diagnostic (`college-learning-directory-service.ts:91-107`; `admin/lessons/page.tsx:98-99`).
- Fix: Report orphan lesson/path references without silently suppressing record, with remediation hint.

## G2-15-003-060  [P1] GAP  facet F12  effort M
- Legacy: Legacy reorder disabled when searching, loading, errors or no selected course (`sections/Lessons.js:222-239`).
- vNext now: Move up/down available in each ACTIVE row; button disabled only canMoveUp and pending, canMoveDown always true (`admin/lessons/page.tsx:102-109`; `college-lesson-reorder-actions.tsx:11-19,45-50`).
- Fix: Disable reordering on filtered list/incomplete data and valid bottom boundary; enforce server order guards.

## G2-15-003-087  [P1] GAP  facet F22  effort L
- Legacy: Legacy `is_deleted` inherited soft deletion and restore exists (`LessonController.java:573-643`; `Lesson.java:18-28`).
- vNext now: `status=ARCHIVED` excludes default ACTIVE filter; no restore in displayed list actions (`courses.ts:332-335`; `admin/lessons/page.tsx:70-75,102-111`).
- Fix: Expose archived restore workflow with original path/sequence and content retention.

## G2-18-002-016  [P1] GAP  facet F03  effort M
- Legacy: Legacy row Visible/Hidden tag green/neutral based on active AND enabled. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:397-398`
- vNext now: vNext row StatusBadge ACTIVE/ARCHIVED, plus path/offering badge and content counts. `src/app/(authenticated)/admin/lessons/page.tsx:94-101`
- Fix: Show explicit `Students see it: Visible/Hidden` based on effective visibility (lesson flag+published path/content), not merely ACTIVE status.

## G2-18-002-023  [P1] GAP  facet F04  effort M
- Legacy: Legacy active+enabled Boolean controls student visibility. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:56-60`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:397-398`
- vNext now: vNext has status ACTIVE/ARCHIVED and `visibleToStudents` Boolean, plus path/offering/published content statuses. `src/db/schema/courses.ts:320-341`, `src/app/(authenticated)/admin/lessons/page.tsx:94-101`, `src/components/courses/college-lesson-visibility-controls.tsx:19-45`
- Fix: Define effective old active&&enabled to new lesson visible flag and archive semantics; avoid exposing unpublished lessons.

## G2-18-002-029  [P1] GAP  facet F05  effort M
- Legacy: Legacy hides pagination while in drag-sort mode, shows all rows of selected course. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:224-239`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:519-523`
- vNext now: vNext always paginates 25 and moves individual rows. `src/app/(authenticated)/admin/lessons/page.tsx:118-122`, `src/components/courses/college-lesson-reorder-actions.tsx:45-60`
- Fix: Implement all-course sequence reorder in one view/POST reorder-all to avoid unmovable rows beyond a page.

## G2-18-002-108  [P1] GAP  facet F19  effort M
- Legacy: Legacy full course reordering loads all lessons, disabled under active search. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:224-239`
- vNext now: vNext move-up/down per-row on paginated list can invoke server endpoint with expected sequence. `src/components/courses/college-lesson-reorder-actions.tsx:25-40`, `src/app/(authenticated)/admin/lessons/page.tsx:118-122`
- Fix: Expose full-order page or reorder-all with expected list to avoid stale/hidden neighbors.

## G2-2-018-011  [P1] GAP  facet F04  effort M
- Legacy: Lessons.js:397-398 green `Visible` or neutral `Hidden` computed active AND enabled
- vNext now: src/app/(authenticated)/admin/lessons/page.tsx:95-107 badge status and independent visibility control; selected bulk acts on content
- Fix: Compute student-visible status from lesson flags, not published-content count.

## G2-2-018-046  [P1] GAP  facet F13  effort M
- Legacy: Lessons.js:460-465 partial failure blocks destructive bulk even when stale prior data shown
- vNext now: src/app/(authenticated)/admin/lessons/page.tsx:85-91 can render list with filters failed; super-admin bulk receives no error flag
- Fix: Tie bulk action disabled state to completeness of source query.

## G2-13-013-019  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lessons/LessonSearchController.java:61-62` 403 error exact 'courseId is required (or use GLOBAL superadmin mode)'
- vNext now: `src/app/api/courses/lessons/route.ts:25-27` generic apiErrorResponse for missing UUID/path; `src/app/(authenticated)/admin/lessons/page.tsx:30-34` 'Invalid lesson filters'
- Fix: Maintain explicit courseId-required denial semantics or migrate clients to path-based 400/403 copy

## G2-13-013-020  [P2] MISSING  facet F07  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lessons/LessonSearchController.java:90-91` 403 'Use /search with courseId for scoped stats'
- vNext now: `src/app/(authenticated)/admin/lessons/page.tsx:36-39` 'Select a college to continue', no stats API route
- Fix: Publish replacement stats authorization error and guidance for scoped actor

## G2-18-002-046  [P2] GAP  facet F07  effort S
- Legacy: Legacy course fetch error `Courses could not be loaded` with Retry button. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:117-139`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:413-418`
- vNext now: vNext learning path picker failure shows `Lesson creation options are temporarily unavailable`. `src/app/(authenticated)/admin/lessons/page.tsx:54-55`, `src/app/(authenticated)/admin/lessons/page.tsx:89-90`
- Fix: Provide specific Retry for picker and preserve listing instead of disabling entire module.

## G2-18-002-047  [P2] GAP  facet F07  effort S
- Legacy: Legacy lesson list partial error warns `X course list(s) did not load`; retry retains loaded list. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:194-201`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:460-465`
- vNext now: vNext all list query failure shows ErrorState `Lessons unavailable` and Retry loading lessons. `src/app/(authenticated)/admin/lessons/page.tsx:46-52`
- Fix: If aggregate supports partial reads, report counts and stale-data caveat; if atomic keep clear full failure.

## G2-13-013-023  [P3] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lessons/LessonSearchController.java:79` success exact 'Lessons retrieved'; `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lessons/LessonSearchController.java:93` 'Stats retrieved'; `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lessons/LessonSearchController.java:101` 'Cache refreshed'
- vNext now: `src/app/api/courses/lessons/route.ts:24` /api/courses/lessons returns data only; `src/app/(authenticated)/admin/lessons/page.tsx:85` stat line without toast
- Fix: For compatibility, map legacy success strings or update API client expectation
