# Work packet (wave 2): edit src/app/(authenticated)/admin/lecture-halls/page.tsx

24 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-lecture-halls.md, docs/audit/gap2/lane-19/lecture-hall-entity.md, docs/audit/gap2/lane-6/superadmin-sections-lecture-halls.md

## G2-10-018-001  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/lecture-halls.js:7-28 — Page in SuperAdminLayout academic group shell; missing scope shows yellow warning.
- vNext now: src/app/(authenticated)/admin/lecture-halls/page.tsx:20-28 — PageHeader + EmptyState no equivalent group shell/warning styling.
- Fix: Restore group-level tabs and warning banner.

## G2-10-018-004  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:300-305 — H1 'Lecture Halls' followed directly by two-column cards.
- vNext now: src/app/(authenticated)/admin/lecture-halls/page.tsx:67-87 — PageHeader with explanatory subtitle, then search filters, results.
- Fix: Match headline and two-column placement.

## G2-10-018-006  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:386-423 — Table card title 'Existing Lecture Halls / Rooms' with search/Refresh/Export toolbar.
- vNext now: src/app/(authenticated)/admin/lecture-halls/page.tsx:88-143 — Results section with count, standalone filters/export/refresh.
- Fix: Match card header, toolbar and count alignment.

## G2-10-018-019  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:45-54 — Client search matches room name, type (and description) case-insensitive over full fetched list.
- vNext now: src/app/(authenticated)/admin/lecture-halls/page.tsx:88-140 — Search q and advanced status/room/dept/capacity/upcoming filters on SQL server.
- Fix: Preserve searchable fields and fast clear behavior.

## G2-10-018-020  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:413-421 — Client Table defaults 10/page, size changer, range 'a-b of total'.
- vNext now: src/modules/academics/super-admin-lecture-hall-directory-model.ts:9-26; src/app/(authenticated)/admin/lecture-halls/page.tsx:140-153 — Server 10/page and 10/25/50/100 options (advanced filter), separate paginator.
- Fix: Put size chooser and range within table footer.

## G2-10-018-021  [P2] GAP  facet F05  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:47-54 — Search updates list as user types, without Submit.
- vNext now: src/app/(authenticated)/admin/lecture-halls/page.tsx:88-104 — GET form requires Search click.
- Fix: Clone immediate filtering or explicitly document retained submit.

## G2-10-018-029  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:391-408 — Export filtered client CSV lecture-halls.csv with id,name,capacity,roomType,departmentId,description.
- vNext now: src/app/(authenticated)/admin/lecture-halls/page.tsx:128-137 — Server CSV honors new filters; row schema and field casing may differ.
- Fix: Match exact header order, filename, filtered selection.

## G2-10-018-048  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:391-407 — AdminTableToolbar browser CSV of filteredData.
- vNext now: src/app/(authenticated)/admin/lecture-halls/page.tsx:128-138 — Dedicated admin lecture-halls CSV route using same query.
- Fix: Compare export columns, row cap, date/escaping.

## G2-10-018-059  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:303-307 — Missing college shows single warning before create/list.
- vNext now: src/app/(authenticated)/admin/lecture-halls/page.tsx:20-27 — EmptyState after PageHeader and no create controls.
- Fix: Match warning shell.

## G2-10-018-064  [P2] GAP  facet F16  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:303-386 — Left form spans lg10/24, right table lg14/24, Row gutter24.
- vNext now: src/app/(authenticated)/admin/lecture-halls/page.tsx:67-112 — Filters/full-width list vertical, no split.
- Fix: Match 10/14 split at large.

## G2-10-018-072  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:386-395 — Exact 'Existing Lecture Halls / Rooms' table card + 'Search halls'.
- vNext now: src/app/(authenticated)/admin/lecture-halls/page.tsx:135-140 — Results section has only count label, no card heading; placeholder same.
- Fix: Restore heading and toolbar.

## G2-10-018-076  [P2] GAP  facet F19  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:391-408 — CSV export processes client filtered rows, no endpoint.
- vNext now: src/app/(authenticated)/admin/lecture-halls/page.tsx:128-138 — Server export endpoint likely bounded; validate full query match.
- Fix: Verify row selection and export cap.

## G2-10-018-082  [P2] GAP  facet F21  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:391-408 — AdminTableToolbar supplies Refresh, Export and search.
- vNext now: src/app/(authenticated)/admin/lecture-halls/page.tsx:128-138 — New route renders Search/Filters/CSV/Refresh from server GET.
- Fix: Align header and failure states.

## G2-19-018-001  [P2] GAP  facet F01  effort M
- Legacy: Legacy section reachable in both College Admin and Super Admin lecture halls workspace, inline creation. `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:300-305`
- vNext now: vNext standalone college/admin pages open create dialog. `src/app/(authenticated)/admin/lecture-halls/page.tsx:68-71` `src/components/admin/lecture-hall-manager.tsx:188-192`
- Fix: Restore old create entry/section order.

## G2-19-018-004  [P2] GAP  facet F02  effort M
- Legacy: Legacy h1 and left create card, right existing halls card at lg breakpoint. `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:300-305` `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:386-390`
- vNext now: vNext filter section and manager list, creation is separate modal. `src/app/(authenticated)/admin/lecture-halls/page.tsx:68-71` `src/components/admin/lecture-hall-manager.tsx:188-192` `src/components/admin/lecture-hall-manager.tsx:250-266`
- Fix: Match legacy card and section anatomy.

## G2-19-018-008  [P2] GAP  facet F03  effort M
- Legacy: Independent college and department failure Alert Retry affordances. `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:306-310`
- vNext now: vNext manager has no corresponding partial lookup retry alert. `src/components/admin/lecture-hall-manager.tsx:188-200` `src/app/(authenticated)/admin/lecture-halls/page.tsx:36-42`
- Fix: Render lookup-specific warning and Retry separately from list state.

## G2-19-018-015  [P2] GAP  facet F05  effort M
- Legacy: Ant Table is small with pageSize=10, showSizeChanger, total range and x-max-content scroll. `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:413-422`
- vNext now: vNext server pagination with dedicated page controls. `src/app/(authenticated)/admin/lecture-halls/page.tsx:103-105` `src/app/(authenticated)/admin/lecture-halls/page.tsx:136-150`
- Fix: Align default rows and visible total text; compare horizontal scroll.

## G2-19-018-017  [P2] GAP  facet F05  effort M
- Legacy: Legacy toolbar Search/Refresh/CSV exports currently filtered client rows. `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:390-408`
- vNext now: vNext separate server filters/export endpoints and Refresh action. `src/app/(authenticated)/admin/lecture-halls/page.tsx:71-86` `src/app/(authenticated)/admin/lecture-halls/page.tsx:124-135`
- Fix: Match toolbar order and scoped CSV filter semantics.

## G2-19-018-043  [P2] GAP  facet F13  effort M
- Legacy: Legacy fetch failures expose Retry and distinct error-empty message. `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:68-82` `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:411-421`
- vNext now: vNext invalid-query ErrorState and list EmptyState; no matching retry in manager. `src/app/(authenticated)/admin/lecture-halls/page.tsx:36-42` `src/components/admin/lecture-hall-manager.tsx:194-200`
- Fix: Show request failure with Retry separately from zero rows.

## G2-19-018-049  [P2] GAP  facet F16  effort M
- Legacy: Legacy 24-col mobile and lg 10/14 create/list grid. `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:303-305` `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:386-387`
- vNext now: vNext list-first layout and mobile-safe dialog controls. `src/app/(authenticated)/admin/lecture-halls/page.tsx:71-88` `src/components/admin/lecture-hall-manager.tsx:250-282`
- Fix: Match desktop split and phone stacking geometry.

## G2-6-030-018  [P2] GAP  facet F05  effort M
- Legacy: Legacy default table 10 rows, showSizeChanger true, total range X-Y of N (LectureHalls.js:413-421).
- vNext now: vNext default page10, size [10,25,50,100], separate Page n of m and Showing x-y (super-admin-lecture-hall-directory-model.ts:13-18; admin/lecture-halls/page.tsx:136-150).
- Fix: Match pagination location, range copy and allowed sizes under table.

## G2-10-018-002  [P3] GAP  facet F01  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/lecture-halls.js:19-25 — Exact no-college message 'Select a college to continue', 'Choose a college in the header above to see its lecture halls.'
- vNext now: src/app/(authenticated)/admin/lecture-halls/page.tsx:20-27 — Title and description exact but EmptyState not Ant Alert.
- Fix: Match warning icon/border/layout.

## G2-10-018-069  [P3] GAP  facet F17  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:391-408 — AdminTableToolbar Search halls has accessible label and keyboard refresh.
- vNext now: src/app/(authenticated)/admin/lecture-halls/page.tsx:88-104 — Search field labeled Room name; manual Submit.
- Fix: Match accessible quicksearch.

## G2-10-018-070  [P3] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/lecture-halls.js:14-20 — Missing college exact 'Select a college to continue', description same.
- vNext now: src/app/(authenticated)/admin/lecture-halls/page.tsx:20-27 — Same strings, different presentation.
- Fix: Match Ant warning styling.
