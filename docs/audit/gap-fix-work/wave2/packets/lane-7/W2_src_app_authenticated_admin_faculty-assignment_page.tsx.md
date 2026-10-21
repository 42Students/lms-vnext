# Work packet (wave 2): edit src/app/(authenticated)/admin/faculty-assignment/page.tsx

16 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/superadmin-faculty-assignment.md, docs/audit/gap2/lane-4/superadmin-sections-faculty-assignment.md

## G2-4-008-003  [P2] GAP  facet F01  effort M
- Legacy: No college shows warning `Select a college to continue`, description `Choose a college in the header above to see its faculty assignments.` (`docs/legacy-source/frontend/src/pages/superadmin/faculty-assignment.js:10-21`)
- vNext now: Title matches but helper formats `Faculty Assignments` as generic `people directory` due singular-only conditional. (`src/app/(authenticated)/admin/faculty-assignment/page.tsx:29-31;src/components/admin/admin-scoped-read-page.tsx:54-57`)
- Fix: Handle plural Faculty Assignments in no-college helper; render old warning style.

## G2-4-008-004  [P2] GAP  facet F02  effort M
- Legacy: Overview: PeoplePageOverview plus two-column Create teaching assignment card (lg10) / Current teaching assignments (lg14). (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:383-402;docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:476-514`)
- vNext now: Server AdminScopedReadPage full-width article list; intro collapsible create controls, no side-by-side cards. (`src/app/(authenticated)/admin/faculty-assignment/page.tsx:23-45;src/components/admin/admin-scoped-read-page.tsx:91-94;src/components/admin/admin-scoped-read-page.tsx:247-264`)
- Fix: Recreate legacy card geometry and title positions.

## G2-4-008-005  [P2] MISSING  facet F02  effort M
- Legacy: Four overview metrics Assignments, Active, Primary instructors, Classes covered. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:383-393`)
- vNext now: Stats conditional on peopleFilters; this page passes no peopleFilters, so all four absent. (`src/app/(authenticated)/admin/faculty-assignment/page.tsx:24-45;src/components/admin/admin-scoped-read-page.tsx:95-108`)
- Fix: Pass faculty-assignment metric model and render exact four tiles.

## G2-4-008-009  [P2] GAP  facet F03  effort M
- Legacy: AdminTableToolbar refresh and export in roster Card extra. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:477-491`)
- vNext now: Header-level Export CSV and Refresh provided by generic directory. (`src/app/(authenticated)/admin/faculty-assignment/page.tsx:29-30;src/components/admin/admin-scoped-read-page.tsx:77-94`)
- Fix: Place both controls within legacy roster card header.

## G2-4-008-053  [P2] GAP  facet F14  effort M
- Legacy: `faculty-assignments.csv` exports current loaded fields IDs, role, active and year via toolbar. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:484-490`)
- vNext now: Same filename, but separate endpoint `/api/admin/faculty-assignment/export` and filtered data columns. (`src/app/(authenticated)/admin/faculty-assignment/page.tsx:29-30`)
- Fix: Compare exact CSV header order (ID Faculty/Course/Class/Batch/Year/Role/Active) and honor current loaded subset.

## G2-4-008-059  [P2] GAP  facet F17  effort M
- Legacy: Old Edit/Delete buttons aria-label with assignment ID; class filter aria-label. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:370-379;docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:477-483`)
- vNext now: Manage disclosure and generic Edit role/End buttons repeat across rows. (`src/app/(authenticated)/admin/faculty-assignment/page.tsx:33-44;src/components/admin/super-admin-faculty-assignment-create.tsx:151-156`)
- Fix: Make every action accessible name record-unique.

## G2-4-008-061  [P2] GAP  facet F18  effort M
- Legacy: Heading `Faculty Assignments`, cards `Create teaching assignment` and `Current teaching assignments`. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:383-386;docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:402;docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:477`)
- vNext now: New heading matches, intro create toggle, no Current teaching assignments card heading. (`src/app/(authenticated)/admin/faculty-assignment/page.tsx:25-31;src/components/admin/super-admin-faculty-assignment-create.tsx:59-64`)
- Fix: Restore card heading and title placements.

## G2-4-011-001  [P2] GAP  facet F01  effort M
- Legacy: Super Admin selects college in header and enters /superadmin/faculty-assignment via People group. (`docs/legacy-source/frontend/src/pages/superadmin/faculty-assignment.js:7-27`)
- vNext now: New /admin/faculty-assignment uses AdminScopedReadPage rather than legacy People-group shell. (`src/app/(authenticated)/admin/faculty-assignment/page.tsx:13-31`)
- Fix: Match the People group tab, active navigation styling and breadcrumb/route transition.

## G2-4-011-005  [P2] GAP  facet F02  effort M
- Legacy: Four overview metrics precede two cards at lg 10/14 width with gutter 24. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:383-402`; `docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:476-514`)
- vNext now: Vertical directory with inline intro, no metrics and no card pairing. (`src/app/(authenticated)/admin/faculty-assignment/page.tsx:23-45`)
- Fix: Restore overview strip then 10/14 two-card responsive layout.

## G2-4-011-009  [P2] MISSING  facet F03  effort M
- Legacy: Metrics labels Assignments, Active, Primary instructors and Classes covered. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:384-393`)
- vNext now: Only heading and description, no metric values. (`src/app/(authenticated)/admin/faculty-assignment/page.tsx:29-31`)
- Fix: Compute and display all four metrics for selected college.

## G2-4-011-022  [P2] GAP  facet F05  effort M
- Legacy: Class filter is 170px Select placeholder Filter by class with allowClear. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:477-483`)
- vNext now: Shared directory class option filter is in generic filter area. (`src/app/(authenticated)/admin/faculty-assignment/page.tsx:19-20`; `src/components/admin/admin-scoped-read-page.tsx:112-199`)
- Fix: Match location, width, placeholder and clear behavior.

## G2-4-011-049  [P2] GAP  facet F09  effort M
- Legacy: Delete Popconfirm exact title Delete teaching assignment? and explanatory description. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:373-379`)
- vNext now: Actions via Manage assignment disclosure and teaching actions component. (`src/app/(authenticated)/admin/faculty-assignment/page.tsx:37-43`)
- Fix: Show per-row legacy danger confirmation copy.

## G2-4-011-054  [P2] GAP  facet F10  effort M
- Legacy: Five initial lookup requests, assignments lookup, semesters by program. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:103-175`)
- vNext now: Server loads course workspace, scoped classes and SQL directory. (`src/app/(authenticated)/admin/faculty-assignment/page.tsx:19-22`; `src/modules/admin-ui/super-admin-faculty-assignments-service.ts:12-29`)
- Fix: Restore equivalent scoped lookup choices and error handling.

## G2-4-011-067  [P2] GAP  facet F16  effort M
- Legacy: Create/roster cards stack xs, split lg 10:14. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:400-402`; `docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:475-477`)
- vNext now: Create form md two columns but roster stays vertically separate. (`src/app/(authenticated)/admin/faculty-assignment/page.tsx:23-45`; `src/components/admin/super-admin-faculty-assignment-create.tsx:69-70`)
- Fix: Reproduce legacy breakpoint and column proportions.

## G2-4-011-069  [P2] GAP  facet F17  effort S
- Legacy: Edit/Delete have per-id aria-labels; class filter has accessible label. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:370-378`; `docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:477-483`)
- vNext now: Actions under Manage assignment; Edit role button is generic. (`src/app/(authenticated)/admin/faculty-assignment/page.tsx:37-43`; `src/components/admin/super-admin-faculty-assignment-create.tsx:152-171`)
- Fix: Give actions ID-bearing accessible names and match focus path.

## G2-4-011-075  [P2] GAP  facet F19  effort M
- Legacy: Legacy prevents duplicate async reads via lookup and table request counters. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:83-85`; `docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:103-133`; `docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:135-158`)
- vNext now: Server data load and guarded mutation, but no per-lookup retry. (`src/app/(authenticated)/admin/faculty-assignment/page.tsx:19-22`; `src/components/admin/super-admin-faculty-assignment-create.tsx:107-110`)
- Fix: Expose per-lookup retry and loading boundaries.
