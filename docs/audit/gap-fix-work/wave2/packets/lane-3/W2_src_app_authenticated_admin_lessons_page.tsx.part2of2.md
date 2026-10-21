# Work packet (wave 2): edit src/app/(authenticated)/admin/lessons/page.tsx (part 2 of 2)

30 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/u002-superadmin-lessons.md, docs/audit/gap2/lane-2/admin-lesson-bulk-controller.md, docs/audit/gap2/lane-13/lesson-search-controller.md, docs/audit/gap2/lane-15/u003-superadmin-lessons.md

## G2-18-002-024  [P2] GAP  facet F04  effort S
- Legacy: Legacy all-courses listing includes failed course names count and warnings, not false zero. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:170-195`
- vNext now: vNext aggregate list is one DB query; either success or error state. `src/app/(authenticated)/admin/lessons/page.tsx:41-52`, `src/modules/courses/college-learning-directory-service.ts:70-190`
- Fix: Show partial-count state only for partial source failures; whole-query failure stays error.

## G2-18-002-027  [P2] GAP  facet F05  effort M
- Legacy: Legacy no course selected means empty list until course filter or opt-in all courses. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:107-110`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:142-153`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:524-526`
- vNext now: vNext lists all current-college lessons by default. `src/app/(authenticated)/admin/lessons/page.tsx:41-55`, `src/app/(authenticated)/admin/lessons/page.tsx:92-117`
- Fix: Add scoped course-first view or explicitly approve all-college default in parity matrix.

## G2-18-002-028  [P2] GAP  facet F05  effort M
- Legacy: Legacy page sizes 10/25/50/100 and saved in localStorage `admin-lessons-page-size`. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:19-20`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:112-115`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:519-523`
- vNext now: vNext superadmin fixed 25 per page, no size chooser. `src/app/(authenticated)/admin/lessons/page.tsx:118-122`, `src/modules/courses/admin-learning-read-model.ts:2-7`
- Fix: Enable 10/25/50/100 and remember preference safely; preserve navigation links.

## G2-18-002-031  [P2] GAP  facet F05  effort S
- Legacy: Legacy table column named `Students see it` shows Visible or Hidden. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:397-398`
- vNext now: vNext status field says `ACTIVE` or `ARCHIVED` and separate per-row visibility chip. `src/app/(authenticated)/admin/lessons/page.tsx:94-111`
- Fix: Use legacy header `Students see it` and derived visibility label for direct parity.

## G2-18-002-032  [P2] GAP  facet F05  effort M
- Legacy: Legacy CSV uses filteredData only, all currently loaded rows regardless of page, columns id,lessonName,courseId,sequence,active,enabled. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:434-441`
- vNext now: vNext Export endpoint downloads server-filtered lessons, different columns including path/status/etc. `src/app/(authenticated)/admin/lessons/page.tsx:58-63`, `src/modules/courses/college-lessons-export-model.ts:46-57`
- Fix: Match name and column order; preserve original values or publish versioned export column contract.

## G2-18-002-079  [P2] GAP  facet F13  effort M
- Legacy: Legacy initial load uses TableSkeleton 8 rows x 5 columns, refreshing status labels. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:458-465`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:506-508`
- vNext now: vNext page-level loader and server-rendered list; no inline 8x5 table skeleton on admin list. `src/app/(authenticated)/admin/lessons/page.tsx:41-52`
- Fix: Render table-shaped skeleton and refreshing label without losing loaded rows.

## G2-18-002-082  [P2] GAP  facet F13  effort S
- Legacy: Legacy no filter course state `Choose a course, or opt in to all-courses view.` `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:524-526`
- vNext now: vNext all-college default `No lessons found` for empty total. `src/app/(authenticated)/admin/lessons/page.tsx:117-118`
- Fix: Distinguish unselected from zero records if course-first UX reinstated.

## G2-18-002-083  [P2] GAP  facet F13  effort S
- Legacy: Legacy search empty `No matching lessons. Clear search to see the course.` `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:524-526`
- vNext now: vNext generic `No lessons found. The current college and filters have no recorded lessons.` `src/app/(authenticated)/admin/lessons/page.tsx:117-118`
- Fix: Show explicit search reset call-to-action and query-aware empty copy.

## G2-18-002-084  [P2] GAP  facet F13  effort M
- Legacy: Legacy partial/stale list retained with warning + Retry. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:194-201`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:460-465`
- vNext now: vNext list service rejection displays full ErrorState `Lessons unavailable`. `src/app/(authenticated)/admin/lessons/page.tsx:46-52`
- Fix: Preserve safe stale list only where authorized and current scope confirmed.

## G2-18-002-086  [P2] GAP  facet F14  effort M
- Legacy: Legacy CSV export filtered lesson rows includes id,lessonName,courseId,sequence,active,enabled. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:434-441`
- vNext now: vNext superadmin server CSV export, college filtered export with different columns and limit. `src/app/(authenticated)/admin/lessons/page.tsx:58-63`, `src/modules/courses/college-lessons-export-model.ts:4-57`
- Fix: Provide legacy format preset or versioned export with column names/order and BOM tests.

## G2-18-002-092  [P2] GAP  facet F16  effort M
- Legacy: Legacy desktop Row Col width lg10/14 and xs full width. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:410-434`
- vNext now: vNext single column with responsive filter grid and action rows. `src/app/(authenticated)/admin/lessons/page.tsx:64-84`, `src/app/(authenticated)/admin/lessons/page.tsx:92-117`
- Fix: At >=992px restore 10/14 split; at phone stack cards and keep visible search/action.

## G2-18-002-093  [P2] GAP  facet F16  effort M
- Legacy: Legacy table has horizontal scrolling max-content and small touch targets Antd Buttons. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:509-520`
- vNext now: vNext no table, link/Button mobile min height 44px. `src/app/(authenticated)/admin/lessons/page.tsx:65-78`, `src/components/courses/admin-learning-structure-actions.tsx:494-518`
- Fix: Render horizontally scrollable data table on narrow view with 44px hit targets, preserve content density.

## G2-18-002-096  [P2] GAP  facet F17  effort S
- Legacy: Legacy Edit/Delete aria-label includes lesson name, AntD Form labels tied to controls. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:399-404`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:37-60`
- vNext now: vNext LessonActions Edit and More controls inside expandable Actions disclosure. `src/app/(authenticated)/admin/lessons/page.tsx:102-111`, `src/components/courses/admin-learning-structure-actions.tsx:494-518`
- Fix: Ensure action names include row-specific lesson identity in accessible name and focus moves into Dialog.

## G2-18-002-104  [P2] GAP  facet F18  effort S
- Legacy: Legacy table header `Students see it`, displayed `Visible` or `Hidden`. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:397-398`
- vNext now: vNext `ACTIVE`/`ARCHIVED` and path/offer badges in cards. `src/app/(authenticated)/admin/lessons/page.tsx:94-101`
- Fix: Use equivalent visible/hidden wording with effective computed flag.

## G2-18-002-106  [P2] GAP  facet F19  effort S
- Legacy: Legacy page-size preference persists across visits; up to 100 rows. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:112-115`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:519-523`
- vNext now: vNext superadmin fixed 25, college query supports 10/25/50/100. `src/app/(authenticated)/admin/lessons/page.tsx:118-122`, `src/modules/courses/college-learning-directory-model.ts:8-14`
- Fix: Bring page size chooser to superadmin to match legacy and college admin.

## G2-2-018-001  [P2] GAP  facet F01  effort M
- Legacy: Lessons.js:65-68,407-410 switches `/superadmin` vs `/college-admin` and uses selected college
- vNext now: src/app/(authenticated)/admin/lessons/page.tsx:25-40 supports `/admin/lessons`; college path not included in this bulk UI
- Fix: Expose equivalent college-admin bulk lesson action and correct role menu/route.

## G2-2-018-002  [P2] GAP  facet F01  effort M
- Legacy: Lessons.js:434-454 lesson selection follows course picker and an opt-in all-courses mode
- vNext now: src/app/(authenticated)/admin/lessons/page.tsx:64-84 search/status filters; no course-first opt-in all-courses selection
- Fix: Retain course-first browse and a labelled all-courses choice.

## G2-2-018-004  [P2] GAP  facet F02  effort M
- Legacy: Lessons.js:407-433 two-column Create New Lesson and Lessons cards
- vNext now: src/app/(authenticated)/admin/lessons/page.tsx:57-116 filter/create/bulk/details in one vertical flow
- Fix: Restore original create/list hierarchy and bulk controls attached to list.

## G2-2-018-010  [P2] GAP  facet F04  effort M
- Legacy: Lessons.js:390-404 list columns Lesson Name, Course, Order, Students see it, Actions plus conditional reorder
- vNext now: src/app/(authenticated)/admin/lessons/page.tsx:92-116 displays article layout with status/path/offering/content counts
- Fix: Provide legacy ordered columns, selection checkbox and row actions.

## G2-2-018-013  [P2] GAP  facet F05  effort M
- Legacy: Lessons.js:509-523 AntD selection retains keys across paging; page-size 10/25/50/100 persisted
- vNext now: src/app/(authenticated)/admin/lessons/page.tsx:118-123 fixed 25/page; super-admin-lesson-bulk-visibility.tsx:15-16 selection local to page
- Fix: Offer per-page size choices and preserved selection across pages or clearly disallow.

## G2-2-018-015  [P2] GAP  facet F05  effort M
- Legacy: Lessons.js:390-405 conditional drag order, per-row edit/delete; bulk checkbox in same table
- vNext now: src/app/(authenticated)/admin/lessons/page.tsx:92-111 actions in per-row `<details>` and bulk in separate list
- Fix: Embed row select + controls and reorder consistently within list.

## G2-2-018-045  [P2] GAP  facet F13  effort M
- Legacy: Lessons.js:506-527 skeleton, no-course selection, no results search, and load errors distinct
- vNext now: src/app/(authenticated)/admin/lessons/page.tsx:30-51,117 has filters error, missing college, no lessons
- Fix: Preserve distinct choose-course, per-course empty and partial-load blocking states.

## G2-2-018-052  [P2] GAP  facet F16  effort M
- Legacy: Lessons.js:410-433 `xs=24 lg=10/14` form/table; Table scroll x max-content line518
- vNext now: src/app/(authenticated)/admin/lessons/page.tsx:64-84 responsive form; super-admin-lesson-bulk-visibility.tsx:39-51 2-column list + stacked buttons
- Fix: Match large 10/14 split and phone horizontal-scrolling tabular selection.

## G2-13-013-044  [P3] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lessons/LessonSearchController.java:79` 'Lessons retrieved', `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lessons/LessonSearchController.java:93` 'Stats retrieved', `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lessons/LessonSearchController.java:101` 'Cache refreshed'
- vNext now: `src/app/api/courses/lessons/route.ts:24` {lessons} result without strings; `src/app/(authenticated)/admin/lessons/page.tsx:31` etc page title 'Lessons'
- Fix: Map legacy API wording when supporting historical clients; no need add to modern UI toast

## G2-13-013-047  [P3] GAP  facet F19  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lessons/LessonSearchController.java:70` Math.min(limit,200) cap, default15
- vNext now: `src/modules/courses/college-learning-directory-model.ts:12` 100 max page size, default25; `src/app/(authenticated)/admin/lessons/page.tsx:119` fixed25
- Fix: Publish endpoint-specific caps (autocomplete 15 up to200; directory 25 up to100) distinctly

## G2-15-003-002  [P3] GAP  facet F01  effort S
- Legacy: No selected college: yellow Alert `Select a college to continue`, description `Choose a college in the header above to see its lessons.` (`superadmin/lessons.js:10-21`).
- vNext now: EmptyState same title and description with PageHeader (`admin/lessons/page.tsx:35-39`).
- Fix: Match alert warning icon and bordered treatment, keep exact copy.

## G2-18-002-020  [P3] GAP  facet F04  effort S
- Legacy: Legacy lesson name fallback `Untitled lesson`. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:22-24`
- vNext now: vNext DB has required lesson name and renders raw `lesson.name`. `src/app/(authenticated)/admin/lessons/page.tsx:95-96`, `src/db/schema/courses.ts:328-330`
- Fix: Supply `Untitled lesson` only when corrupted/legacy-mapped record is blank.

## G2-18-002-021  [P3] GAP  facet F04  effort S
- Legacy: Legacy course name fallback `Course name unavailable (ID N)` when filtered course vanished. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:218-221`
- vNext now: vNext aggregates joined existing course and displays courseName/code. `src/app/(authenticated)/admin/lessons/page.tsx:98-101`, `src/modules/courses/college-learning-directory-service.ts:76-89`
- Fix: Preserve explicit missing-parent warning only for anomalous records; normal join stays authoritative.

## G2-18-002-080  [P3] GAP  facet F13  effort S
- Legacy: Legacy no college state shows `Select a college to manage Lessons`. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:407-409`
- vNext now: vNext `Select a college to continue` EmptyState. `src/app/(authenticated)/admin/lessons/page.tsx:35-40`
- Fix: Use exact legacy warning copy.

## G2-18-002-087  [P3] GAP  facet F14  effort S
- Legacy: Legacy export button is built-in AdminTableToolbar `lessons.csv`, no download on initial list load. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:434-441`
- vNext now: vNext Export is header link invoking `/api/admin/lessons/export`. `src/app/(authenticated)/admin/lessons/page.tsx:58-63`
- Fix: Place control in card toolbar, keep explicit click to export.
