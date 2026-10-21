# Work packet (wave 2): edit src/app/(authenticated)/college/lecture-halls/page.tsx

25 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/lecture-hall-controller.md, docs/audit/gap2/lane-9/college-admin-lecture-halls.md, docs/audit/gap2/lane-14/u013-lecture-hall-search-controller.md

## G2-4-027-012  [P2] GAP  facet F03  effort M
- Legacy: AntD table small 10 rows, showTotal x-y of total (`docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:413-421`)
- vNext now: Server pagination + count paragraph + standalone nav (`src/app/(authenticated)/college/lecture-halls/page.tsx:177-205`)
- Fix: Align compact table density, 10 page size and total copy.

## G2-4-027-048  [P2] GAP  facet F13  effort M
- Legacy: Loading overlay, read failure Alert Retry, distinct failed empty text (`docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:68-82,411-421`)
- vNext now: Invalid filters ErrorState; load failures throw to route error (`src/app/(authenticated)/college/lecture-halls/page.tsx:53-67,70-84`)
- Fix: Provide specific list retry banner and non-empty-table failure state.

## G2-4-027-049  [P2] GAP  facet F13  effort M
- Legacy: College/dept lookup failures keep selection disabled with Retry Alert (`docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:84-109,306-310`)
- vNext now: Server departments list failure prevents entire page (`src/app/(authenticated)/college/lecture-halls/page.tsx:70-84`)
- Fix: Offer department-select fallback without losing hall list.

## G2-4-027-051  [P2] GAP  facet F14  effort M
- Legacy: Client CSV toolbar exports filtered visible columns (`docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:390-409`)
- vNext now: Server Export CSV separately; cap via service (`src/app/(authenticated)/college/lecture-halls/page.tsx:95-100`)
- Fix: Match filename, column set and filter semantics.

## G2-9-017-001  [P2] GAP  facet F01  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/lecture-halls.js:8-15` — /college-admin/lecture-halls sets activeMenuItem lecture-halls.
- vNext now: `src/app/(authenticated)/college/lecture-halls/page.tsx:34-40` — /college/lecture-halls independent App Router route.
- Fix: Preserve sidebar selection and academic-group route mapping.

## G2-9-017-002  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/lecture-halls.js:32-40` — AdminGroupShell group academic and AdminLayout wrap LectureHalls.
- vNext now: `src/app/(authenticated)/college/lecture-halls/page.tsx:93-103` — PageHeader and server filter area, no old group tab strip.
- Fix: Render old academic grouped tab strip and shell.

## G2-9-017-004  [P2] GAP  facet F01  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:300-305` — Page title Lecture Halls above two columns.
- vNext now: `src/app/(authenticated)/college/lecture-halls/page.tsx:94-103` — PageHeader Lecture Halls plus description and Export CSV.
- Fix: Match title placement and legacy heading spacing.

## G2-9-017-006  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:301-307` — Left create Card xs24 lg10, right Existing Rooms Card xs24 lg14 in Row gutter24.
- vNext now: `src/app/(authenticated)/college/lecture-halls/page.tsx:93-193` — Filters/results stacked full width; create form inside modal.
- Fix: Restore side-by-side create card/table grid on desktop.

## G2-9-017-008  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:387-415` — Existing Lecture Halls / Rooms Card holds AdminTableToolbar, Alert, Table.
- vNext now: `src/app/(authenticated)/college/lecture-halls/page.tsx:177-195` — Results section, count, manager table and separate pagination.
- Fix: Use legacy titled card with search/refresh/export at top.

## G2-9-017-010  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:413-422` — Table loading overlay, page size10 with chooser.
- vNext now: `src/app/(authenticated)/college/lecture-halls/page.tsx:70-90` — Server loads before page; 25 per page with separate controls.
- Fix: Restore load skeleton and 10-page size choices.

## G2-9-017-013  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:387-395` — AdminTableToolbar Search halls, Refresh and Export CSV.
- vNext now: `src/app/(authenticated)/college/lecture-halls/page.tsx:99-100` — CSV action in page head, search among external filters, no Refresh.
- Fix: Move search/export into table toolbar and add Refresh.

## G2-9-017-016  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:410-413` — Error alert Could not load lecture halls + Retry.
- vNext now: `src/app/(authenticated)/college/lecture-halls/page.tsx:53-67` — Only invalid filter ErrorState; server data failure delegated route boundary.
- Fix: Add table-scoped failure banner and Retry.

## G2-9-017-024  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:43-52` — Search client-side name OR raw roomType lowercase substrings.
- vNext now: `src/app/(authenticated)/college/lecture-halls/page.tsx:103-128` — Server filters q, status, roomType, department, capacity, upcoming.
- Fix: Include roomType in q search or explain separate selector.

## G2-9-017-027  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:386-395` — Toolbar search/refresh/export client-filtered current results.
- vNext now: `src/app/(authenticated)/college/lecture-halls/page.tsx:93-107` — Server search + Export CSV query route, no table refresh.
- Fix: Match toolbar and ensure export respects filters.

## G2-9-017-028  [P2] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:418-423` — Pagination showTotal N-M of T, horizontal scroll x max-content.
- vNext now: `src/app/(authenticated)/college/lecture-halls/page.tsx:177-209` — Results count and Page x of y, 25 fixed.
- Fix: Display same range format and table density.

## G2-9-017-053  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LectureHallController.java:115-128` — GET /api/v1/lectureHall/fetchByCollege?collegeId; also fetchByDept.
- vNext now: `src/app/(authenticated)/college/lecture-halls/page.tsx:70-83` — Direct listLectureHalls service per signed-in college, multiple structured filters.
- Fix: Preserve same scoped view, avoid unduly hiding archived rows.

## G2-9-017-056  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lecturehalls/LectureHallSearchController.java:48-93` — Legacy v2 search default limit15 cap200, room query via cache.
- vNext now: `src/app/(authenticated)/college/lecture-halls/page.tsx:70-81` — New list pagination25 and SQL filters.
- Fix: Reconcile behavior when search >15 or >200 results.

## G2-9-017-066  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:410-425` — Table inline loading spinner and error Retry, preserves shared layout.
- vNext now: `src/app/(authenticated)/college/lecture-halls/page.tsx:52-67` — Invalid filters state, no dedicated skeleton shown in route.
- Fix: Add table skeleton/loading and retry.

## G2-9-017-068  [P2] MISSING  facet F14  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:390-397` — Refresh toolbar action refetches lecture halls.
- vNext now: `src/app/(authenticated)/college/lecture-halls/page.tsx:94-102` — Only Export CSV, no Refresh button.
- Fix: Add Refresh affordance.

## G2-9-017-073  [P2] GAP  facet F16  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:301-305` — Two-column xs24/lg10 and lg14 cards.
- vNext now: `src/app/(authenticated)/college/lecture-halls/page.tsx:93-207` — Full-width stacked filter then results.
- Fix: Restore lg split and responsive stack.

## G2-9-017-079  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:300-305` — Page heading Lecture Halls, cards Create New Lecture Hall / Room and Existing Lecture Halls / Rooms.
- vNext now: `src/app/(authenticated)/college/lecture-halls/page.tsx:94-103` — Page header Lecture Halls, sections Lecture hall filters/results.
- Fix: Restore old card title wording.

## G2-9-017-084  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:43-52` — Client search filters complete fetched data instantly.
- vNext now: `src/app/(authenticated)/college/lecture-halls/page.tsx:70-81` — Server q filter with 25 page; no debounce.
- Fix: Allow immediate search or debounce, do not require Filter button for single q.

## G2-9-017-091  [P2] GAP  facet F21  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:5-16` — FE imports create/get/getByCollege/getDepartments/update/delete; no cache page filter API.
- vNext now: `src/app/(authenticated)/college/lecture-halls/page.tsx:18-21` — Service listLectureHalls and listDepartments; CSV endpoint.
- Fix: Preserve independent service error handling.

## G2-14-013-054  [P3] GAP  facet F17  effort S
- Legacy: Legacy API returns room name as displayName fallback `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lecturehalls/LectureHallSearchDTO.java:22-27`
- vNext now: New name non-null; input room name has label `src/db/schema/lecture-halls.ts:10-21` `src/app/(authenticated)/college/lecture-halls/page.tsx:105-109`
- Fix: Provide accessible fallback for null migrated names

## G2-14-013-056  [P3] GAP  facet F18  effort S
- Legacy: Legacy stats text Stats retrieved `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lecturehalls/LectureHallSearchController.java:113-114`
- vNext now: New page title Lecture Halls `src/app/(authenticated)/college/lecture-halls/page.tsx:95-100`
- Fix: Maintain stats compatibility text, not page heading
