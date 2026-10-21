# Work packet (wave 2): edit src/app/(authenticated)/admin/batches/page.tsx (part 1 of 2)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/batch-search-controller.md, docs/audit/gap2/lane-9/superadmin-batches-component.md, docs/audit/gap2/lane-9/superadmin-batches.md

## G2-6-014-003  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/batches/BatchSearchController.java:65-74`
- vNext now: `src/app/(authenticated)/admin/batches/page.tsx:39-49`
- Fix: Match old query-only structure for quick picker

## G2-6-014-004  [P2] MISSING  facet F03  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/batches/BatchSearchController.java:116-130`
- vNext now: `src/app/(authenticated)/admin/batches/page.tsx:48-80`
- Fix: Restore 10-result popular batch selector and icon

## G2-6-014-017  [P2] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/batches/BatchSearchController.java:216-234`
- vNext now: `src/app/(authenticated)/admin/batches/page.tsx:25-44`
- Fix: Map global versus scoped stats access

## G2-6-014-024  [P2] GAP  facet F18  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/batches/BatchSearchController.java:208-210`
- vNext now: `src/app/(authenticated)/admin/batches/page.tsx:84-88`
- Fix: Restore Selection recorded wording only when action exists

## G2-6-014-025  [P2] GAP  facet F18  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/batches/BatchSearchController.java:129-131`
- vNext now: `src/app/(authenticated)/admin/batches/page.tsx:84-88`
- Fix: Restore Popular batches retrieved message on compatibility API

## G2-6-014-028  [P2] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/batches/BatchSearchController.java:253-263`
- vNext now: `src/app/(authenticated)/admin/batches/page.tsx:78-80`
- Fix: Refresh now refetches route rather than warming in-memory index

## G2-6-014-030  [P2] GAP  facet F21  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/batches/BatchSearchController.java:213-234`
- vNext now: `src/app/(authenticated)/admin/batches/page.tsx:25-44`
- Fix: Restore superadmin totalBatches/program counts endpoint

## G2-9-029-001  [P2] GAP  facet F01  effort M
- Legacy: SuperAdminLayout and academic SuperAdminGroupShell route /superadmin/batches `docs/legacy-source/frontend/src/pages/superadmin/batches.js:1-5,23-32`
- vNext now: /admin/batches standalone header and AcademicSetupSteps `src/app/(authenticated)/admin/batches/page.tsx:22-42`
- Fix: Restore legacy group tabs/active navigation and URL alias

## G2-9-029-002  [P2] GAP  facet F01  effort S
- Legacy: Missing selected college shows yellow Select a college to continue Alert `docs/legacy-source/frontend/src/pages/superadmin/batches.js:10-21`
- vNext now: One-line role=status text below Batches header `src/app/(authenticated)/admin/batches/page.tsx:27-43`
- Fix: Use warning icon and matching text block position

## G2-9-029-003  [P2] GAP  facet F01  effort M
- Legacy: Changing selected college remounts Batches component via key `docs/legacy-source/frontend/src/pages/superadmin/batches.js:23-27`
- vNext now: Scope obtained from server context; search query may persist `src/app/(authenticated)/admin/batches/page.tsx:25-34`
- Fix: Reset old college filters when scope switches

## G2-9-029-004  [P2] GAP  facet F02  effort M
- Legacy: Header subtitle plus xs24/lg10 Create New Batch and lg14 Existing Batches cards `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:510-538`
- vNext now: Header then collapsed Create Batch, tabs, filters, Manage batches table `src/app/(authenticated)/admin/batches/page.tsx:39-45,84-87`
- Fix: Restore 10/14 cards, titles and subtitle

## G2-9-029-005  [P2] MISSING  facet F02  effort S
- Legacy: Legacy subtitle Manage cohorts, their academic year and current semester before creating sections or promoting students `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:512-516`
- vNext now: Only PageHeader Batches, no subtitle `src/app/(authenticated)/admin/batches/page.tsx:39-41`
- Fix: Add exact subtitle

## G2-9-029-007  [P2] GAP  facet F02  effort M
- Legacy: Existing Batches card includes toolbar, filters, table, retry/refresh states `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:538-580`
- vNext now: Separate tabs/form and unboxed Manage batches section `src/app/(authenticated)/admin/batches/page.tsx:45-87`
- Fix: Restore Card title and integrated toolbar placement

## G2-9-029-009  [P2] GAP  facet F03  effort M
- Legacy: Edit, Students, Delete small icon buttons per batch `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:491-502`
- vNext now: Manage students link + Edit + More actions dropdown `src/app/(authenticated)/admin/batches/page.tsx:90-101` `src/components/academics/college-cohort-management.tsx:244-268`
- Fix: Restore three visible row actions/icons

## G2-9-029-010  [P2] GAP  facet F03  effort S
- Legacy: Semester blue Tag and status Ant green/orange/gray tags `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:473-480`
- vNext now: Plain current semester and StatusBadge `src/app/(authenticated)/admin/batches/page.tsx:98-100`
- Fix: Restore semester/status chip styling

## G2-9-029-011  [P2] GAP  facet F03  effort M
- Legacy: Filter program/status selectors 155px each, Clear filters conditional `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:558-567`
- vNext now: Wide program select, status via tabs and More filters `src/app/(authenticated)/admin/batches/page.tsx:49-81`
- Fix: Match compact selectors and conditional Clear filters

## G2-9-029-013  [P2] GAP  facet F04  effort M
- Legacy: Columns Batch Name, Program, Years, Semester, Academic Year, Classes, Students, Status, Actions `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:464-480`
- vNext now: Columns Batch, Program, Start Date, End Date, Academic Year, Semester, Students, Status, Actions `src/app/(authenticated)/admin/batches/page.tsx:89-101`
- Fix: Restore Years and Classes, exact legacy header order

## G2-9-029-014  [P2] GAP  facet F04  effort S
- Legacy: Years derived from start/end year, Semester N blue chip `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:465-477`
- vNext now: Separate raw start/end date and plain term `src/app/(authenticated)/admin/batches/page.tsx:90-100`
- Fix: Render year-span and blue Semester N chip

## G2-9-029-018  [P2] GAP  facet F05  effort M
- Legacy: Search batch name, year, program, status, current semester `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:365-373`
- vNext now: Search q built from cohort name/code/program in server directory `src/app/(authenticated)/admin/batches/page.tsx:49-62`
- Fix: Support year/status/term matches

## G2-9-029-019  [P2] GAP  facet F05  effort S
- Legacy: Default pageSize25; 10/25/50/100 and localStorage admin-batches-page-size `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:29,37,137-142,177-184`
- vNext now: New query supports pageSize but no legacy persisted preference `src/app/(authenticated)/admin/batches/page.tsx:63-75` `src/modules/academics/college-cohort-mutation-model.ts:1-41`
- Fix: Default25 and read legacy page-size key

## G2-9-029-020  [P2] GAP  facet F05  effort M
- Legacy: Ant Table pagination range x-y of total `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:572-580`
- vNext now: New previous/next pagination and page summary `src/app/(authenticated)/admin/batches/page.tsx:103-120`
- Fix: Restore compact Ant-style paginator and exact range text

## G2-9-029-043  [P2] GAP  facet F10  effort M
- Legacy: GET batches/programs/classes by college `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:14-17,186-238`
- vNext now: Server listCollegeBatches and academic periods instead of legacy classes fetch `src/app/(authenticated)/admin/batches/page.tsx:25-38`
- Fix: Map program/class choices and refresh data

## G2-9-029-052  [P2] GAP  facet F13  effort M
- Legacy: Scope-safe refresh keeps previous data and shows stale warning `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:168-175,186-209,552-557`
- vNext now: Page data fetched server-side without same-scope stale snapshot `src/app/(authenticated)/admin/batches/page.tsx:25-38`
- Fix: Add inline retry/last loaded indicator for refresh errors

## G2-9-029-053  [P2] GAP  facet F13  effort M
- Legacy: Eight-row TableSkeleton on initial load and search empty guidance `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:570-580`
- vNext now: EmptyState generic, separate page-level loading `src/app/(authenticated)/admin/batches/page.tsx:87-89`
- Fix: Match loading skeleton and context-aware empty text

## G2-9-029-058  [P2] GAP  facet F16  effort M
- Legacy: Two-column lg10/lg14 cards, xs full width, compact Ant tables `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:518-542`
- vNext now: Stacked responsive sections and mobilePriority DataTable `src/app/(authenticated)/admin/batches/page.tsx:39-105`
- Fix: Restore desktop card grid and dense rows; keep 44px mobile targets

## G2-9-029-059  [P2] GAP  facet F17  effort S
- Legacy: Per-row aria-label Edit batch, Manage students in..., Move learner... `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:491-502,643-650`
- vNext now: Explicit actions with generic Edit, More, Manage students `src/app/(authenticated)/admin/batches/page.tsx:90-101` `src/components/academics/college-cohort-management.tsx:244-268`
- Fix: Add record-specific accessible names and focus restore

## G2-9-029-060  [P2] GAP  facet F18  effort S
- Legacy: Old subtitle and Create New Batch/Existing Batches titles `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:514-515`
- vNext now: New Batches/Manage batches/Create Batch labels `src/app/(authenticated)/admin/batches/page.tsx:39-45,84-85` `src/components/academics/college-cohort-management.tsx:93-96`
- Fix: Restore full legacy heading strings

## G2-9-029-061  [P2] GAP  facet F18  effort S
- Legacy: Search placeholder Search batch, year, program or status `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:538-541`
- vNext now: Search batches label with no old placeholder `src/app/(authenticated)/admin/batches/page.tsx:58-62`
- Fix: Restore exact search placeholder

## G2-9-023-001  [P2] GAP  facet F01  effort M
- Legacy: SuperAdminLayout and academic SuperAdminGroupShell route /superadmin/batches `docs/legacy-source/frontend/src/pages/superadmin/batches.js:1-5,23-32`
- vNext now: /admin/batches standalone header and AcademicSetupSteps `src/app/(authenticated)/admin/batches/page.tsx:22-42`
- Fix: Restore legacy group tabs/active navigation and URL alias

## G2-9-023-002  [P2] GAP  facet F01  effort S
- Legacy: Missing selected college shows yellow Select a college to continue Alert `docs/legacy-source/frontend/src/pages/superadmin/batches.js:10-21`
- vNext now: One-line role=status text below Batches header `src/app/(authenticated)/admin/batches/page.tsx:27-43`
- Fix: Use warning icon and matching text block position

## G2-9-023-003  [P2] GAP  facet F01  effort M
- Legacy: Changing selected college remounts Batches component via key `docs/legacy-source/frontend/src/pages/superadmin/batches.js:23-27`
- vNext now: Scope obtained from server context; search query may persist `src/app/(authenticated)/admin/batches/page.tsx:25-34`
- Fix: Reset old college filters when scope switches

## G2-9-023-004  [P2] GAP  facet F02  effort M
- Legacy: Header subtitle plus xs24/lg10 Create New Batch and lg14 Existing Batches cards `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:510-538`
- vNext now: Header then collapsed Create Batch, tabs, filters, Manage batches table `src/app/(authenticated)/admin/batches/page.tsx:39-45,84-87`
- Fix: Restore 10/14 cards, titles and subtitle

## G2-9-023-005  [P2] MISSING  facet F02  effort S
- Legacy: Legacy subtitle Manage cohorts, their academic year and current semester before creating sections or promoting students `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:512-516`
- vNext now: Only PageHeader Batches, no subtitle `src/app/(authenticated)/admin/batches/page.tsx:39-41`
- Fix: Add exact subtitle

## G2-9-023-007  [P2] GAP  facet F02  effort M
- Legacy: Existing Batches card includes toolbar, filters, table, retry/refresh states `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:538-580`
- vNext now: Separate tabs/form and unboxed Manage batches section `src/app/(authenticated)/admin/batches/page.tsx:45-87`
- Fix: Restore Card title and integrated toolbar placement

## G2-9-023-009  [P2] GAP  facet F03  effort M
- Legacy: Edit, Students, Delete small icon buttons per batch `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:491-502`
- vNext now: Manage students link + Edit + More actions dropdown `src/app/(authenticated)/admin/batches/page.tsx:90-101` `src/components/academics/college-cohort-management.tsx:244-268`
- Fix: Restore three visible row actions/icons

## G2-9-023-010  [P2] GAP  facet F03  effort S
- Legacy: Semester blue Tag and status Ant green/orange/gray tags `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:473-480`
- vNext now: Plain current semester and StatusBadge `src/app/(authenticated)/admin/batches/page.tsx:98-100`
- Fix: Restore semester/status chip styling

## G2-9-023-011  [P2] GAP  facet F03  effort M
- Legacy: Filter program/status selectors 155px each, Clear filters conditional `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:558-567`
- vNext now: Wide program select, status via tabs and More filters `src/app/(authenticated)/admin/batches/page.tsx:49-81`
- Fix: Match compact selectors and conditional Clear filters

## G2-9-023-013  [P2] GAP  facet F04  effort M
- Legacy: Columns Batch Name, Program, Years, Semester, Academic Year, Classes, Students, Status, Actions `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:464-480`
- vNext now: Columns Batch, Program, Start Date, End Date, Academic Year, Semester, Students, Status, Actions `src/app/(authenticated)/admin/batches/page.tsx:89-101`
- Fix: Restore Years and Classes, exact legacy header order

## G2-9-023-014  [P2] GAP  facet F04  effort S
- Legacy: Years derived from start/end year, Semester N blue chip `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:465-477`
- vNext now: Separate raw start/end date and plain term `src/app/(authenticated)/admin/batches/page.tsx:90-100`
- Fix: Render year-span and blue Semester N chip

## G2-9-023-018  [P2] GAP  facet F05  effort M
- Legacy: Search batch name, year, program, status, current semester `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:365-373`
- vNext now: Search q built from cohort name/code/program in server directory `src/app/(authenticated)/admin/batches/page.tsx:49-62`
- Fix: Support year/status/term matches
