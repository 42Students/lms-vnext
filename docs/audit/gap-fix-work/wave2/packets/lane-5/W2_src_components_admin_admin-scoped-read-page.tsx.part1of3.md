# Work packet (wave 2): edit src/components/admin/admin-scoped-read-page.tsx (part 1 of 3)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-hiring-dashboard.md, docs/audit/gap2/lane-14/super-admin-students.md, docs/audit/gap2/lane-19/faculty-search-controller.md, docs/audit/gap2/lane-19/superadmin-students.md

## G2-10-008-002  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/components/admin/SuperAdminGroupShell.jsx:12-28` wraps legacy dashboard in Placements PageShell with grouped tabs
- vNext now: `src/components/admin/admin-scoped-read-page.tsx:34-41` and `src/app/(authenticated)/admin/placements/analytics/page.tsx:77-82` separate new page headers rather than same group tab strip
- Fix: Restore single Placements group tab strip and correct active Analytics subtab

## G2-10-008-003  [P2] GAP  facet F01  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/hiring-dashboard.js:14-25` when no selected college shows Select a college to continue warning with Organization + College instructions
- vNext now: `src/app/(authenticated)/admin/placements/analytics/page.tsx:34-39` shows EmptyState Choose a college; `src/components/admin/admin-scoped-read-page.tsx:54-57` displays generic people directory wording
- Fix: Match old yellow warning banner and exact college-required explanation

## G2-14-002-003  [P2] GAP  facet F01  effort S
- Legacy: Legacy no-college banner Select a College to manage Learners; vNext Select a college to continue empty state — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1111-1117`
- vNext now: `src/components/admin/admin-scoped-read-page.tsx:47-57`
- Fix: Restore amber warning and text

## G2-14-002-005  [P2] GAP  facet F02  effort S
- Legacy: Legacy overview 4 metrics before collapsed register and roster; vNext registration first, metrics in later directory — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1091-1128,1426-1431`
- vNext now: `src/app/(authenticated)/admin/students/page.tsx:61-90`; `src/components/admin/admin-scoped-read-page.tsx:91-110`
- Fix: Move metrics above registration and roster

## G2-14-002-007  [P2] GAP  facet F02  effort L
- Legacy: Legacy main roster is small Ant table; vNext vertical bordered articles — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:928-963,1572-1586`
- vNext now: `src/components/admin/admin-scoped-read-page.tsx:247-259`
- Fix: Restore table on desktop with mobile fallback

## G2-14-002-017  [P2] GAP  facet F04  effort L
- Legacy: Legacy column names Name/Roll No./Mobile/Email/Class/Gender/Status/Actions; vNext cards title/subtitle/details omit explicit headers — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:928-963`
- vNext now: `src/components/admin/admin-scoped-read-page.tsx:247-259`
- Fix: Render 8 exact visible data columns and labels

## G2-14-002-023  [P2] GAP  facet F05  effort S
- Legacy: Legacy default25 page options25,50,100,200; vNext10,25,50,100 — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1572-1586`
- vNext now: `src/components/admin/admin-scoped-read-page.tsx:184-198`
- Fix: Restore 200 option, keep default25

## G2-14-002-025  [P2] GAP  facet F05  effort M
- Legacy: Legacy AutoComplete focus popular/recent and debounced remote 15 matches; vNext scoped search box only — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:151-352,1481-1501`
- vNext now: `src/components/admin/admin-scoped-read-page.tsx:113-117`
- Fix: Add recent/popular dropdown, selected learner identity, Arrow/Enter controls

## G2-14-002-027  [P2] GAP  facet F05  effort M
- Legacy: Legacy immediate table filter as user types; vNext server GET Filter form — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:917-926,1483-1501`
- vNext now: `src/components/admin/admin-scoped-read-page.tsx:113-124`
- Fix: Debounce query and keep suggestions responsive

## G2-14-002-029  [P2] GAP  facet F05  effort S
- Legacy: Legacy status dropdown Any status/Active/Suspended; vNext raw ALL/ACTIVE/SUSPENDED/ENDED — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1512-1514`
- vNext now: `src/components/admin/admin-scoped-read-page.tsx:118-122`; `src/app/(authenticated)/admin/students/page.tsx:20-20`
- Fix: Use title case/status alias, extra Ended optional

## G2-14-002-030  [P2] GAP  facet F05  effort S
- Legacy: Legacy two distinct empty texts for no roster/no matches; vNext always No matching records — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1583-1586`
- vNext now: `src/components/admin/admin-scoped-read-page.tsx:243-245,259-259`
- Fix: Restore both exact no-data messages

## G2-14-002-066  [P2] GAP  facet F13  effort S
- Legacy: Legacy Could not load student roster with Retry and stale data; vNext Directory unavailable ErrorState replaces table — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1472-1475`
- vNext now: `src/components/admin/admin-scoped-read-page.tsx:58-65`
- Fix: Show inline retry and retain existing rows/filters

## G2-14-002-067  [P2] GAP  facet F13  effort S
- Legacy: Legacy no college amber banner, vNext empty Select a college to continue — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1111-1117`
- vNext now: `src/components/admin/admin-scoped-read-page.tsx:47-57`
- Fix: Match exact state text, icon and tone

## G2-14-002-069  [P2] GAP  facet F13  effort M
- Legacy: Legacy Ant Table spinner while reloading, vNext server SSR records — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:357-411,1572-1586`
- vNext now: `src/components/admin/admin-scoped-read-page.tsx:58-65,247-265`
- Fix: Add table loading overlay and preserve current data on refresh

## G2-14-002-071  [P2] GAP  facet F14  effort M
- Legacy: Legacy students.csv exact columns Name, Roll, Mobile, Email, Class, Gender, Status; vNext super-admin-students-ist.csv — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1434-1463`
- vNext now: `src/app/(authenticated)/admin/students/page.tsx:82-84`; `src/components/admin/admin-scoped-read-page.tsx:91-94`
- Fix: Restore filename seven headers/order and status presentation

## G2-14-002-078  [P2] GAP  facet F16  effort L
- Legacy: Legacy table x max-content scroll and fixed Actions md; vNext card list — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:959-964,1572-1586`
- vNext now: `src/components/admin/admin-scoped-read-page.tsx:247-259`
- Fix: Restore fixed-right actions and scrollable table tablet/desktop

## G2-14-002-080  [P2] GAP  facet F17  effort M
- Legacy: Legacy autocomplete Arrow/Enter popular/recent suggestions; vNext live search without suggestions — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:179-352`
- vNext now: `src/components/admin/admin-scoped-read-page.tsx:113-117`
- Fix: Implement aria-combobox options and keyboard selection

## G2-14-002-086  [P2] GAP  facet F18  effort S
- Legacy: Legacy Active and Suspended title case; vNext raw enums — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:950-957`
- vNext now: `src/components/admin/admin-scoped-read-page.tsx:247-255`
- Fix: Format statuses title-case

## G2-14-002-091  [P2] GAP  facet F20  effort M
- Legacy: Legacy dependent filters clear child params; vNext GET can retain stale IDs — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:896-909,1503-1511`
- vNext now: `src/components/admin/admin-scoped-read-page.tsx:156-177`
- Fix: Reset/validate cohort and section hierarchy on GET

## G2-19-013-004  [P2] GAP  facet F02  effort M
- Legacy: Legacy controller has no page shell, returns Response DTO lists and maps `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchController.java:83-93` `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchController.java:168-170`
- vNext now: vNext admin faculty page uses PageHeader/filters/status and cards `src/app/(authenticated)/admin/faculty/page.tsx:20-44` `src/components/admin/admin-scoped-read-page.tsx:91-126`
- Fix: Clone visual faculty search grouping and dropdown in consuming screens.

## G2-19-013-005  [P2] GAP  facet F02  effort M
- Legacy: Legacy search suggestions bounded `limit=15` `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchController.java:80-93`
- vNext now: vNext full admin directory has paging/search and faculty picker max500 `src/components/admin/admin-scoped-read-page.tsx:184-200` `src/modules/courses/college-faculty-picker-service.ts:9-32`
- Fix: Add autocomplete top15 mode without breaking paged management view.

## G2-19-013-012  [P2] GAP  facet F04  effort M
- Legacy: Legacy `GET /stats` returns totalFaculty, departments, colleges, facultyTypes `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchController.java:328-352`
- vNext now: vNext AdminScopedReadPage summaries include scoped counts and role/status `src/components/admin/admin-scoped-read-page.tsx:69-106`
- Fix: Map missing statistics fields and avoid global unscoped totals.

## G2-19-013-013  [P2] GAP  facet F05  effort M
- Legacy: Legacy search `query`, limit, collegeId, deptId, facultyType filters `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchController.java:80-93`
- vNext now: vNext directory q/status/departmentId/employmentType, paged `src/modules/admin-ui/super-admin-scoped-people-service.ts:10-12` `src/modules/admin-ui/super-admin-scoped-people-service.ts:71-82` `src/components/admin/admin-scoped-read-page.tsx:114-174`
- Fix: Map query parameter names, faculty type enum and department/college selection.

## G2-19-013-017  [P2] GAP  facet F06  effort M
- Legacy: Legacy `limit` default15 for search and 10 popular, 50 college/department/type `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchController.java:85-93` `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchController.java:173-179` `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchController.java:219-238`
- vNext now: vNext admin pages use configurable pageSize and faculty picker hard cap500 `src/components/admin/admin-scoped-read-page.tsx:184-200` `src/modules/courses/college-faculty-picker-service.ts:9-32`
- Fix: Validate and normalize endpoint-specific page/limit defaults.

## G2-19-013-030  [P2] GAP  facet F10  effort M
- Legacy: Legacy `GET /faculty-type`, `/categories`, `/category/{department}` `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchController.java:249-306`
- vNext now: vNext department filter options with faculty employmentType text `src/components/admin/admin-scoped-read-page.tsx:154-164`
- Fix: Add typed facet endpoint if UI depends on it.

## G2-19-013-032  [P2] GAP  facet F10  effort M
- Legacy: Legacy GET `/stats` and `/exists/{facultyName}` `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchController.java:328-369`
- vNext now: vNext admin directory counts, no mapped exact-check route `src/components/admin/admin-scoped-read-page.tsx:69-106` `src/modules/admin-ui/super-admin-scoped-people-service.ts:77-81`
- Fix: Expose scoped counts and duplicate-check as needed.

## G2-19-013-037  [P2] GAP  facet F12  effort M
- Legacy: Legacy in-memory cache loads non-deleted faculty, not necessarily active membership `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchCache.java:103-130`
- vNext now: vNext list reads membership status including ACTIVE/SUSPENDED/ENDED with filters `src/modules/admin-ui/super-admin-scoped-people-service.ts:69-76` `src/components/admin/admin-scoped-read-page.tsx:118-121`
- Fix: Define visibility of suspended faculty in quick search vs management directory.

## G2-19-013-039  [P2] GAP  facet F12  effort M
- Legacy: Legacy superadmin `/colleges` returns city,state for global only `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchController.java:191-216`
- vNext now: vNext faculty page requires scope selected, no cross-college inventory on page `src/components/admin/admin-scoped-read-page.tsx:48-56`
- Fix: Keep colleges listing separate, only allow global privilege.

## G2-19-013-042  [P2] GAP  facet F13  effort S
- Legacy: Legacy non-global no tenant scope throws AccessDeniedException `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchController.java:70-77`
- vNext now: vNext missing admin selected college renders Select a college `src/components/admin/admin-scoped-read-page.tsx:48-56`
- Fix: Map 403 vs scope selection state without exposing cross-tenant records.

## G2-19-013-047  [P2] GAP  facet F16  effort M
- Legacy: Legacy limit15 search suitable autocomplete `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchController.java:83-93`
- vNext now: vNext admin directory card layout/page sizes and picker capped500 `src/modules/courses/college-faculty-picker-service.ts:9-32` `src/components/admin/admin-scoped-read-page.tsx:184-200`
- Fix: Add compact typeahead list with scroll and keyboard when needed.

## G2-19-001-002  [P2] GAP  facet F01  effort S
- Legacy: No college: warning `Select a college to continue` above student screen `docs/legacy-source/frontend/src/pages/superadmin/students.js:10-23`
- vNext now: Selected-college absent becomes `EmptyState` in directory after `PageHeader`; register sections omitted `src/components/admin/admin-scoped-read-page.tsx:54-57`; `src/app/(authenticated)/admin/students/page.tsx:34`,70-82
- Fix: Match exact college-required warning text, alert styling and placement.

## G2-19-001-005  [P2] GAP  facet F02  effort S
- Legacy: Legacy `PeoplePageOverview` shows Students/Active/Suspended/Visible now above accordion `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1091-1105`
- vNext now: vNext overview rendered inside roster after register/bulk sections `src/app/(authenticated)/admin/students/page.tsx:70-82`; `src/components/admin/admin-scoped-read-page.tsx:98-108`
- Fix: Move overview above registration and preserve headline/metric order.

## G2-19-001-007  [P2] GAP  facet F03  effort S
- Legacy: Legacy roster has small `Refresh`, `Export CSV`, conditional `Clear Search` `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1429-1468`
- vNext now: vNext separate `Refresh`, export link and always-available `Clear search` after result list `src/components/admin/admin-scoped-read-page.tsx:77-93`,111-112,260-262
- Fix: Reproduce legacy roster toolbar position, conditional clear action and capitalization.

## G2-19-001-014  [P2] GAP  facet F04  effort S
- Legacy: Legacy status `Active`/`Suspended` colour-tag based on `suspendedAt` `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:949-956`
- vNext now: vNext raw membership enum `ACTIVE`/`SUSPENDED` `StatusBadge`, also allows `ENDED` `src/components/admin/admin-scoped-read-page.tsx:249-252`; `src/app/(authenticated)/admin/students/page.tsx:20`
- Fix: Use sentence-case legacy labels and verify distinct ENDED membership state UI.

## G2-19-001-017  [P2] GAP  facet F05  effort M
- Legacy: Legacy AntD table with 8 named headers and compact size `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:928-962`,1572-1577
- vNext now: vNext article-list dividers with no table column headers `src/components/admin/admin-scoped-read-page.tsx:247-259`
- Fix: Implement desktop table with legacy columns/row density; responsive fallback for mobile.

## G2-19-001-019  [P2] GAP  facet F05  effort M
- Legacy: Legacy default table paging 25; changer offers 25,50,100,200 `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1583`
- vNext now: vNext default 25; size chooser 10,25,50,100 `src/modules/admin-ui/super-admin-read-directory-model.ts:2`,14; `src/components/admin/admin-scoped-read-page.tsx:184-189`
- Fix: Match legacy size options including 200, update bounded query and DB pagination.

## G2-19-001-022  [P2] GAP  facet F05  effort S
- Legacy: Legacy status dropdown `Any status`, `Active`, `Suspended` `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1512-1514`
- vNext now: vNext `Status` raw `ALL`, `ACTIVE`, `SUSPENDED`, `ENDED` `src/app/(authenticated)/admin/students/page.tsx:20`; `src/components/admin/admin-scoped-read-page.tsx:118-123`
- Fix: Match visible status option labels while preserving supported ENDED semantics.

## G2-19-001-025  [P2] GAP  facet F05  effort S
- Legacy: Legacy filtered counter `N of M students`, clear-filters only if filters chosen `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1515-1523`
- vNext now: vNext status string `N matching records · page x of y` and unconditionally clear link `src/components/admin/admin-scoped-read-page.tsx:221`,260-262
- Fix: Replicate student-count copy, separate clear-filters and clear-search controls.

## G2-19-001-060  [P2] GAP  facet F13  effort S
- Legacy: Legacy roster load error alert `Could not load student roster` with inline Retry `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1472-1475`
- vNext now: vNext `Directory unavailable` replaces roster with ErrorState and `Retry loading directory` `src/components/admin/admin-scoped-read-page.tsx:58-67`
- Fix: Match error banner placement and retry action without hiding unaffected sections.

## G2-19-001-061  [P2] GAP  facet F13  effort S
- Legacy: Legacy empty text `No students found. Register students to get started.` vs filtered `No students match these filters.` `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1583-1586`
- vNext now: vNext generic `No matching records` / `No persisted data matches...` `src/components/admin/admin-scoped-read-page.tsx:259`
- Fix: Differentiate no-roster vs no-filter-results with exact legacy language.
