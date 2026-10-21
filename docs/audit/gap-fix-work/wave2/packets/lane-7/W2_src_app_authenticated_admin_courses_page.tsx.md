# Work packet (wave 2): edit src/app/(authenticated)/admin/courses/page.tsx

22 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/l19-u027-course-controller.md, docs/audit/gap2/lane-12/courses.md, docs/audit/gap2/lane-18/u003-superadmin-courses.md, docs/audit/gap2/lane-6/course-home-edit-drawer.md, docs/audit/gap2/lane-8/course.md

## G2-19-027-002  [P2] GAP  facet F01  effort M
- Legacy: Frontend uses Super Admin Courses section with table/new/edit/delete and route `/college-admin/courses/{slug or id}`; Courses.js:11,474-479
- vNext now: vNext `/admin/courses` tabs and table plus `CourseActions` by UUID; admin/courses/page.tsx:14-48; admin-course-overview.tsx:86-161
- Fix: Maintain old course list/detail deep-links by verified slug-to-UUID resolution and active-college-safe redirect.

## G2-19-027-004  [P2] GAP  facet F02  effort L
- Legacy: Courses.js AntD Card/Row/Table page with toolbar, inline batch visibility, per-course image/preview and top create action; Courses.js:4-15,34-96,410-435,474-512
- vNext now: vNext PageHeader/Tabs and Create Course and offering Disclosure ahead of table; admin/courses/page.tsx:24-51; admin-course-overview.tsx:452-483
- Fix: Recreate old primary header, top toolbar, table/cell rhythm; place new offering wizard behind secondary tab without changing course list structure.

## G2-19-027-015  [P2] GAP  facet F05  effort M
- Legacy: Legacy scoped-organization `/fetchAllPaged` returns unpaged plain list rather than DTO (known irregularity); CourseController.java:146-156
- vNext now: vNext requires selected college rather than org-wide catalogue; admin/courses/page.tsx:13-29
- Fix: Explicitly document legacy array-vs-page anomaly; add permission-safe org pagination or retire that irregular contract.

## G2-19-027-041  [P2] GAP  facet F13  effort M
- Legacy: Legacy table loader TableSkeleton and RefreshStatus, network errors remain inline, delete failure Retry; Courses.js:14-16,132-135,570-575
- vNext now: vNext page-level error/filtered-zero components and no per-delete retry; admin/courses/page.tsx:41-82; admin-course-overview.tsx:535-557
- Fix: Recreate old loading table rows, stale refresh status and persistent row error; distinguish no results and transport failure.

## G2-19-027-042  [P2] GAP  facet F13  effort S
- Legacy: Legacy empty-state table on no college scope/loading vs no courses within selected college; Courses.js:125-161,565-575
- vNext now: vNext `Select a college to continue` and `No records to show. Create Course and offering above`; admin/courses/page.tsx:25-48; admin-course-overview.tsx:548-553
- Fix: Clone original no-data copy/CTA in table while keeping safe no-college guard.

## G2-12-003-003  [P2] GAP  facet F01  effort S
- Legacy: Unscoped alert `Select a college to manage Courses` `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:527-529`
- vNext now: Unscoped EmptyState `Select a college to continue` `src/app/(authenticated)/admin/courses/page.tsx:18-41`
- Fix: Match warning label/icon/description

## G2-18-003-001  [P2] GAP  facet F01  effort M
- Legacy: Entry is `/superadmin/courses` with SuperAdminLayout and SuperAdminGroupShell content group. `docs/legacy-source/frontend/src/pages/superadmin/courses.js:3-5`, `docs/legacy-source/frontend/src/pages/superadmin/courses.js:31-40`
- vNext now: vNext entry `/admin/courses`; tab strip links Courses, Lessons, Videos, Resources, Live Classes, Progress, Assessments. `src/app/(authenticated)/admin/courses/page.tsx:70-95`
- Fix: Preserve legacy group shell tab names/order and link resolution.

## G2-18-003-004  [P2] GAP  facet F01  effort S
- Legacy: SuperAdminGroupShell groupKey content surrounds Courses. `docs/legacy-source/frontend/src/pages/superadmin/courses.js:31-36`
- vNext now: vNext Tabs on page selected courses, adjacent directories links. `src/app/(authenticated)/admin/courses/page.tsx:72-95`
- Fix: Match tab chrome + active selection from old shell; separate nested tabs only if legacy hierarchy supports.

## G2-18-003-006  [P2] GAP  facet F02  effort L
- Legacy: Legacy page starts with h1 Courses; scoped shows split Create New Course left 10/24 and Existing Courses right 14/24. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:527-561`
- vNext now: vNext PageHeader + tabstrip + AdminCourseOverview, setup workflow, stat tiles, tables in vertically stacked regions. `src/app/(authenticated)/admin/courses/page.tsx:70-95`, `src/components/courses/admin-course-overview.tsx:40-160`
- Fix: Restore two-column Create/List first view and original card borders/padding with new offering modules below.

## G2-18-003-007  [P2] GAP  facet F02  effort S
- Legacy: Legacy unscoped page only warning + Progress policy card and no tabs section content. `docs/legacy-source/frontend/src/pages/superadmin/courses.js:11-29`
- vNext now: vNext unscoped page shows PageHeader, tabs, EmptyState only. `src/app/(authenticated)/admin/courses/page.tsx:18-40`
- Fix: Insert policy card directly after warning; retain accessible tabs if globally present in legacy shell.

## G2-18-003-009  [P2] GAP  facet F02  effort M
- Legacy: Legacy Existing Courses card toolbar, errors, bulk strip, refresh status, skeleton, 7-column table. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:561-633`
- vNext now: vNext Overview includes stats/filters/catalogue/delivery and course tables. `src/components/courses/admin-course-overview.tsx:100-160`, `src/app/(authenticated)/admin/courses/page.tsx:88-95`
- Fix: Match card+toolbar+table order; keep vNext extra metrics in later sections.

## G2-18-003-029  [P2] GAP  facet F05  effort M
- Legacy: Legacy 10/25/50/100 page options persistent via localStorage admin-courses-page-size. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:18-19`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:143-151`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:623-628`
- vNext now: vNext course catalogue server pages fixed value; superadmin query has pageSize. `src/modules/courses/college-course-catalogue-service.ts:41-64`, `src/app/(authenticated)/admin/courses/page.tsx:12-17`
- Fix: Unify page size 10/25/50/100 in both admin modes and persist safely.

## G2-18-003-077  [P2] GAP  facet F13  effort M
- Legacy: Legacy initial table skeleton 8x7 and refreshing uses RefreshStatus without blanking prior rows. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:606-614`
- vNext now: vNext server page has loading/error route controls, UI derives workspace. `src/app/(authenticated)/admin/courses/page.tsx:64-95`, `src/components/courses/admin-course-overview.tsx:1-40`
- Fix: Provide table-specific loading and refreshing copy with stable previous rows.

## G2-18-003-080  [P2] GAP  facet F13  effort M
- Legacy: Legacy stale list warning says Showing the last courses loaded for this college and Retry. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:607-614`
- vNext now: vNext server route load failure bubbles error boundary. `src/app/(authenticated)/admin/courses/page.tsx:64-69`
- Fix: Retain authorized last-list only within unchanged college scope and Retry.

## G2-18-003-092  [P2] MISSING  facet F17  effort M
- Legacy: Legacy global policy help tooltip/number spinner min0 max99 Reset/default with accessible Reload. `docs/legacy-source/frontend/src/pages/superadmin/courses.js:21-27`, `docs/legacy-source/frontend/src/components/admin/PolicySettingField.js:156-196`
- vNext now: vNext global policy control missing on page. `src/app/(authenticated)/admin/courses/page.tsx:18-40`
- Fix: Reintroduce numeric editor, help tooltip, Save/Reset/Reload keyboard order.

## G2-18-003-093  [P2] GAP  facet F18  effort S
- Legacy: Legacy `Progress policy` and `Platform-wide: applies to every college.` `docs/legacy-source/frontend/src/pages/superadmin/courses.js:22-26`
- vNext now: vNext unscoped title `Courses` and EmptyState only. `src/app/(authenticated)/admin/courses/page.tsx:18-40`
- Fix: Restore global policy labels/helpers exactly.

## G2-18-003-108  [P2] GAP  facet F21  effort M
- Legacy: Legacy lesson dependency probe blocks deletion. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:8-8`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:487-513`
- vNext now: vNext queries active offering count and linked lesson count for archive. `src/app/(authenticated)/admin/courses/page.tsx:64-69`, `src/components/courses/admin-course-overview.tsx:130-145`
- Fix: Expose both dependency sources, failure and stale-count handling.

## G2-6-009-001  [P2] GAP  facet F01  effort S
- Legacy: Legacy file under Pages Router path is actually dynamically imported as `HomeEditor` `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseHome.jsx:7-9`
- vNext now: New course actions are inline on Courses admin catalogue `src/components/courses/admin-course-overview.tsx:142-167` `src/app/(authenticated)/admin/courses/page.tsx:88-95`
- Fix: Document accidental old route as component-only; keep editing entry under course details

## G2-8-020-001  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/CourseController.java:27,96-101 legacy GET department course directory
- vNext now: src/app/(authenticated)/admin/courses/page.tsx:12-98 superadmin /admin/courses college-scope route
- Fix: Map old /superadmin and /college-admin Courses entry paths to new route.

## G2-8-020-005  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/CourseController.java:160-179 college-specific list endpoint
- vNext now: src/app/(authenticated)/admin/courses/page.tsx:18-43 superadmin route requires selected college
- Fix: Allow equivalent scoped listing for a college admin and correct missing-scope state.

## G2-8-020-040  [P2] GAP  facet F11  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/CourseController.java:105-125 global Super Admin fetch across colleges optionally narrowed by scope
- vNext now: src/app/(authenticated)/admin/courses/page.tsx:12-43 requires college selected for UI
- Fix: Clarify global list parity vs safety-scope requirement.

## G2-8-020-047  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/CourseController.java:195-227 404 for missing or inaccessible course
- vNext now: src/app/(authenticated)/admin/courses/page.tsx:46-63 invalid filters ErrorState with Clear filters
- Fix: Preserve distinct missing-course state in detail.
