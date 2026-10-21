# Work packet: edit src/components/admin/admin-scoped-read-page.tsx

15 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/semester-courses.md, docs/audit/gap2/lane-14/super-admin-students.md, docs/audit/gap2/lane-19/faculty-search-controller.md, docs/audit/gap2/lane-19/superadmin-students.md, docs/audit/gap2/lane-4/superadmin-faculty-assignment.md

## G2-12-002-008  [P1] MISSING  facet F03  effort S
- Legacy: Refresh button in selected-semester right card `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:380-384`
- vNext now: Only directory Refresh, not mapping refresh `src/components/admin/admin-scoped-read-page.tsx:77-94`
- Fix: Add selected-semester refresh with stale data handling

## G2-14-002-026  [P1] GAP  facet F05  effort M
- Legacy: Legacy Program/Batch/Class filters dependent and clear child on parent change; vNext three independent GET fields — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:896-926,1503-1523`
- vNext now: `src/components/admin/admin-scoped-read-page.tsx:165-177`
- Fix: Make parent changes clear child and scope option lists

## G2-19-013-018  [P1] GAP  facet F06  effort M
- Legacy: Legacy `facultyType` typed Java FacultyType enum `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchController.java:91-93` `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchController.java:249-259`
- vNext now: vNext employmentType text filter plus Mentor role special case `src/components/admin/admin-scoped-read-page.tsx:162-164` `src/modules/admin-ui/super-admin-scoped-people-service.ts:72-76`
- Fix: Define mapping between FacultyType and new employmentType/academicTitle.

## G2-19-013-034  [P1] GAP  facet F11  effort L
- Legacy: Legacy global SA may search/cache all tenants; scoped SA restricted `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchController.java:63-77` `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchController.java:95-115`
- vNext now: vNext super admin directory requires selected college `src/components/admin/admin-scoped-read-page.tsx:48-56` `src/modules/admin-ui/super-admin-scoped-people-service.ts:10-12`
- Fix: Owner decide global search capability while preserving tenant isolation.

## G2-19-013-061  [P1] GAP  facet F23  effort L
- Legacy: Legacy global SA `/search`, `/colleges`, `/stats` sees global overview `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchController.java:95-99` `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchController.java:191-216` `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchController.java:328-337`
- vNext now: vNext requires explicit selected college on faculty page `src/components/admin/admin-scoped-read-page.tsx:48-56`
- Fix: Decide approved cross-tenant global directory behavior.

## G2-19-001-010  [P1] GAP  facet F04  effort M
- Legacy: Table columns `Name`, `Roll No.`, `Mobile`, `Email`, `Class`, `Gender`, `Status`, `Actions` `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:928-962`
- vNext now: vNext article rows: title/status/subtitle and text detail paragraphs; no named data-table columns `src/components/admin/admin-scoped-read-page.tsx:247-259`; `src/modules/admin-ui/super-admin-scoped-people-service.ts:93-110`
- Fix: Render legacy seven data columns and Actions with matching field mapping; retain accessible mobile fallback.

## G2-19-001-015  [P1] GAP  facet F04  effort S
- Legacy: Legacy `Visible now` counts all client-filtered students `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1096-1101`
- vNext now: vNext `Visible now` uses current paginated `data.items.length` `src/components/admin/admin-scoped-read-page.tsx:100-107`
- Fix: Show total matching records rather than current page length, or label `On this page`.

## G2-19-001-018  [P1] GAP  facet F05  effort M
- Legacy: Legacy column sorters for name and numeric-aware roll number `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:930-936`
- vNext now: vNext always orders by name then ID server-side; no per-column sort controls `src/modules/admin-ui/super-admin-scoped-people-service.ts:90-91`; `src/components/admin/admin-scoped-read-page.tsx:247-259`
- Fix: Add clickable Name and Roll No. sort with numeric-aware roll comparator and server paging.

## G2-19-001-021  [P1] GAP  facet F05  effort M
- Legacy: Legacy filters program→batch→class cascade and clear dependents `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:896-909`,1504-1511
- vNext now: vNext directory Program, Batch, Class independently selected (no dependent option filtering) `src/components/admin/admin-scoped-read-page.tsx:165-174`; `src/modules/admin-ui/super-admin-people-filter-options.ts:19-33`
- Fix: Filter Batch options by selected Program and Class options by selected Batch; reset stale children.

## G2-19-001-023  [P1] GAP  facet F05  effort M
- Legacy: Legacy search autocomplete Recent/Popular/Search Results grouped suggestions, 200ms debounce, limit 15 `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:179-285`
- vNext now: vNext `AdminScopedLiveSearch` URL-driven search without recent/popular grouped suggestions `src/components/admin/admin-scoped-read-page.tsx:115-117`; `src/components/admin/admin-scoped-live-search.tsx:1-27`
- Fix: Restore selected-college Recent/Popular suggestion groups and selection behavior.

## G2-19-001-045  [P1] GAP  facet F09  effort L
- Legacy: Legacy `Profile — <name>` modal width 860 renders 20 profile sections `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1763-1777`
- vNext now: vNext only `Open details →` membership route `src/components/admin/admin-scoped-read-page.tsx:255-257`; `src/modules/admin-ui/super-admin-scoped-people-service.ts:110`
- Fix: Restore deep learner profile sections or direct to a complete equivalent with identical sections.

## G2-4-008-018  [P1] GAP  facet F05  effort M
- Legacy: Table columns Faculty, Course, Class, Semester, Year, Role, Active, Actions. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:353-381`)
- vNext now: Generic article rows with title/subtitle/details and action disclosure, no column headings. (`src/components/admin/admin-scoped-read-page.tsx:223-263;src/modules/admin-ui/super-admin-faculty-assignments-service.ts:67-73`)
- Fix: Restore 8-column DataTable with exact headings and tags.

## G2-19-013-021  [P2] GAP  facet F07  effort S
- Legacy: Legacy search scoped user missing collegeId/deptId returns explicit 403 `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchController.java:95-109`
- vNext now: vNext directory requires selected admin college or EmptyState `src/components/admin/admin-scoped-read-page.tsx:48-56`
- Fix: Present equivalent scope-required explanation, consistent API status.

## G2-19-013-025  [P2] GAP  facet F08  effort S
- Legacy: Legacy `Superadmin only` and `collegeId or deptId is required` errors `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchController.java:101-109` `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchController.java:194-201`
- vNext now: vNext `Directory access denied` or `Select a college to continue` states `src/components/admin/admin-scoped-read-page.tsx:48-56`
- Fix: Restore literal permission/selection guidance where relevant.

## G2-19-013-024  [P3] GAP  facet F08  effort S
- Legacy: Legacy `Popular faculty retrieved`, `Categories retrieved`, `Selection recorded` `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchController.java:186-188` `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchController.java:282-284` `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchController.java:321-325`
- vNext now: vNext directory status badges and no popularity API response in page `src/components/admin/admin-scoped-read-page.tsx:228-253`
- Fix: Provide mapped status/empty copy for migrated consumers.
