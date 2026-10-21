# Work packet (wave 2): edit src/app/(authenticated)/admin/semesters/page.tsx

26 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l15-u029-superadmin-semesters.md, docs/audit/gap2/lane-5/l18-u029-semester-management.md, docs/audit/gap2/lane-6/semester-search-controller.md

## G2-15-029-001  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/semesters.js:7-32 — superadmin semesters page under old SuperAdminLayout + grouped academic shell
- vNext now: src/app/(authenticated)/admin/semesters/page.tsx:31-80 — Next App Router /admin/semesters, PageHeader and AcademicSetupSteps
- Fix: Align old sidebar active item, grouped tab hierarchy and exact page-head spacing

## G2-15-029-002  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/semesters.js:8-21 — selectedCollegeId taken from global header scope; no selector shows warning
- vNext now: src/app/(authenticated)/admin/semesters/page.tsx:34-49 — adminScope collegeId required; no selection shows EmptyState
- Fix: Use icon warning alert for absent scope with original copy

## G2-15-029-003  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/semesters.js:12-19 — ln-module admin-list-page, 16px-bottom AntD warning Alert
- vNext now: src/app/(authenticated)/admin/semesters/page.tsx:45-48 — plain div PageHeader/EmptyState
- Fix: Reproduce old canvas class, border/padding and warning geometry

## G2-15-029-004  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/semesters.js:23-29 — academic SuperAdminGroupShell wraps management
- vNext now: src/app/(authenticated)/admin/semesters/page.tsx:76-81 — AcademicSetupSteps step 3 and Semester–Course Mapping page action
- Fix: Match old tab strip and navigation while retaining mapping link

## G2-15-029-005  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:407-413 — Semesters H1, Create New Semester card, Semesters table
- vNext now: src/app/(authenticated)/admin/semesters/page.tsx:77-82,129-132 — PageHeader description, disclosure create form and filters/table
- Fix: Align literal title/card text and element ordering

## G2-15-029-025  [P2] GAP  facet F11  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/semesters.js:7-26 — only selectedCollegeId scope, remount on change using key
- vNext now: src/app/(authenticated)/admin/semesters/page.tsx:34-49,63-75 — SSR scoped request, next request filters
- Fix: Ensure scope switch clears stale filters and client draft

## G2-15-029-029  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:518-531 — shows stale data warning when refresh fails
- vNext now: src/app/(authenticated)/admin/semesters/page.tsx:63-73 — SSR error state replaces table altogether
- Fix: Keep last loaded semester list on transient fetch failure

## G2-15-029-030  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:530-540 — TableSkeleton 8x6 while initial loading; empty text if no data
- vNext now: src/app/(authenticated)/admin/semesters/page.tsx:63-75,144-146 — server loads before render, ErrorState/EmptyState
- Fix: Align loading skeleton and old empty message

## G2-15-029-035  [P2] GAP  facet F16  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:410-414,462-482 — AntD small Card sections, Select & Toolbar inline
- vNext now: src/app/(authenticated)/admin/semesters/page.tsx:76-110 — border section and responsive grid form
- Fix: Compare component widths, heights, gutters at 375/768/1280

## G2-18-029-042  [P2] GAP  facet F13  effort M
- Legacy: Legacy skeleton eight rows and stale last-good results warning. `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:523-532`
- vNext now: vNext error page with Retry, no stale data. `src/app/(authenticated)/admin/semesters/page.tsx:63-73`
- Fix: Add skeleton and stale refresh message.

## G2-18-029-045  [P2] GAP  facet F14  effort M
- Legacy: Legacy exportFileName semesters.csv with all filtered data. `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:481-501`
- vNext now: vNext server CSV export, not just current page. `src/app/(authenticated)/admin/semesters/page.tsx:121-127`
- Fix: Diff headers/scopes and rows beyond page.

## G2-18-029-047  [P2] GAP  facet F16  effort M
- Legacy: Legacy create/list split lg10/14, mobile stack. `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:408-463`
- vNext now: vNext stacked panels at every breakpoint. `src/app/(authenticated)/admin/semesters/page.tsx:76-129`
- Fix: Match 375/768/1280 grid.

## G2-18-029-048  [P2] GAP  facet F16  effort M
- Legacy: Legacy table horizontal scrolling. `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:533-539`
- vNext now: vNext priority columns adaptive. `src/app/(authenticated)/admin/semesters/page.tsx:131-143`
- Fix: Preserve numeric badges visibility on small screens.

## G2-18-029-051  [P2] GAP  facet F18  effort M
- Legacy: Legacy main title Semesters, left Create New Semester. `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:407-410`
- vNext now: vNext title same; disclosure label differs. `src/app/(authenticated)/admin/semesters/page.tsx:77-81`, `src/components/academics/college-semester-management.tsx:73-75`
- Fix: Use exact Create New Semester heading.

## G2-18-029-052  [P2] GAP  facet F18  effort M
- Legacy: Legacy toolbar Search semesters / Filter by program. `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:467-484`
- vNext now: vNext labels Semester or program / Program. `src/app/(authenticated)/admin/semesters/page.tsx:83-94`
- Fix: Restore placeholders.

## G2-6-013-003  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/semesters/SemesterSearchController.java:48-52`
- vNext now: `src/app/(authenticated)/admin/semesters/page.tsx:77-83`
- Fix: Legacy backend has no page chrome; new directory filters live in complete Semesters page, compare table UX separately

## G2-6-013-004  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/semesters/SemesterSearchController.java:81-91`
- vNext now: `src/app/(authenticated)/admin/semesters/page.tsx:113-126`
- Fix: Expose superadmin search stats/refresh controls only with equivalent permissions

## G2-6-013-006  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/semesters/SemesterSearchCache.java:56-64`
- vNext now: `src/app/(authenticated)/admin/semesters/page.tsx:130-144`
- Fix: Preserve fallback `Semester N` when name missing

## G2-6-013-021  [P2] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/semesters/SemesterSearchController.java:83-87`
- vNext now: `src/app/(authenticated)/admin/semesters/page.tsx:31-49`
- Fix: Old stats only GLOBAL superadmin, new admin UI selected-college and no global stats

## G2-6-013-024  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/semesters/SemesterSearchCache.java:42-53`
- vNext now: `src/app/(authenticated)/admin/semesters/page.tsx:63-72`
- Fix: Old load failure logs/retains cache; new page returns Semesters unavailable with Retry

## G2-6-013-031  [P2] GAP  facet F18  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/semesters/SemesterSearchController.java:86-99`
- vNext now: `src/app/(authenticated)/admin/semesters/page.tsx:66-72`
- Fix: Map original stats and refresh wording to admin-only system messages

## G2-15-029-011  [P3] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:338-340 — blue Tag 'Sem {num}'
- vNext now: src/app/(authenticated)/admin/semesters/page.tsx:137 — plain text 'Sem '+num
- Fix: Restore blue rounded tag and density

## G2-15-029-012  [P3] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:361-363 — green Active/red Inactive Tag
- vNext now: src/app/(authenticated)/admin/semesters/page.tsx:141 — StatusBadge success/neutral
- Fix: Use old red inactive chip when cloning

## G2-15-029-034  [P3] GAP  facet F16  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/semesters.js:12-19 — warning Alert has showIcon, marginBottom16
- vNext now: src/app/(authenticated)/admin/semesters/page.tsx:45-48 — EmptyState with PageHeader
- Fix: Mirror AntD alert icon/spacing at mobile breakpoints

## G2-15-029-038  [P3] GAP  facet F18  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:400-407 — Select a College to manage Semesters warning
- vNext now: src/app/(authenticated)/admin/semesters/page.tsx:44-48 — Select a college to continue empty state
- Fix: Restore exact warning/casing on scoped management entry

## G2-15-029-039  [P3] GAP  facet F18  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:540 — No semesters found. Create a program first, then add semesters.
- vNext now: src/app/(authenticated)/admin/semesters/page.tsx:144-145 — No semesters match these filters. Create a program first, then add semesters.
- Fix: Separate unfiltered empty copy and no-filter-match copy
