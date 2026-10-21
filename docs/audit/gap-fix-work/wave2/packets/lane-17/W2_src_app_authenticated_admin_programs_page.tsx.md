# Work packet (wave 2): edit src/app/(authenticated)/admin/programs/page.tsx

12 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-programs.md, docs/audit/gap2/lane-20/superadmin-sections-programs.md

## G2-10-020-001  [P2] GAP  facet F01  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/programs.js:7-26 — Selected Super Admin college required before rendering Programs component.
- vNext now: src/app/(authenticated)/admin/programs/page.tsx:14-33 — Also scoped but separate header/EmptyState and no legacy wrapper.
- Fix: Render selected-college warning and academic group shell parity.

## G2-10-020-002  [P2] GAP  facet F01  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/programs.js:25-27 — SuperAdminGroupShell groupKey academic provides academic sibling tabs.
- vNext now: src/app/(authenticated)/admin/programs/page.tsx:55-62 — AcademicSetupSteps plus PageBackLink rather than legacy grouped tab strip.
- Fix: Match academic group names, tab spacing and active state.

## G2-10-020-004  [P2] GAP  facet F01  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:267-269 — Programs title then split creation/list cards.
- vNext now: src/app/(authenticated)/admin/programs/page.tsx:54-62 — PageBackLink then PageHeader and steps before directory.
- Fix: Match title location, header margin and screen flow.

## G2-10-020-053  [P2] GAP  facet F10  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:70-81; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NewProgramController.java:126-130 — GET /api/v1/new-program/fetchByCollege?collegeId.
- vNext now: src/app/(authenticated)/admin/programs/page.tsx:37-45; src/modules/academics/program-service.ts:138-205 — Server DB listPrograms filtered active/department.
- Fix: Map active-v-archived, totals and ordering.

## G2-10-020-070  [P2] MISSING  facet F13  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:302-309 — Table skeleton 8x5 before first data.
- vNext now: src/app/(authenticated)/admin/programs/page.tsx:37-51 — Async server page shows eventual result or ErrorState; no per-panel table skeleton.
- Fix: Add 8-row skeleton to loading.tsx/panel for direct clone.

## G2-10-020-096  [P2] GAP  facet F20  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:57-81 — tableSeq request guards out-of-order refresh/college switch.
- vNext now: src/app/(authenticated)/admin/programs/page.tsx:37-51 — Server scope binding removes client stale list, but create transition may refresh later.
- Fix: Verify all mutation callbacks are scope-bound; protect cross-tenant stale notifications.

## G2-10-020-101  [P2] GAP  facet F21  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:163-168 — Contents dependencies from SemesterService, getBatchesByProgram, getClassCountByProgram.
- vNext now: src/app/(authenticated)/admin/programs/page.tsx:42-43; src/components/admin/admin-program-directory.tsx:55-64 — Server aggregated contents, displayed collapsed.
- Fix: Compare archived/active counting and chip states across service.

## G2-20-029-001  [P2] GAP  facet F01  effort M
- Legacy: Superadmin /superadmin/programs wraps shared Programs inside academic group shell; selected college required (`docs/legacy-source/frontend/src/pages/superadmin/programs.js:6-30`)
- vNext now: Legacy bookmark redirects to canonical /admin/programs; canonical adds PageBackLink and setup steps (`src/app/(authenticated)/superadmin/programs/page.tsx:5-8`, `src/app/(authenticated)/admin/programs/page.tsx:65-75`)
- Fix: Preserve legacy grouped shell and navigation hierarchy in canonical destination

## G2-20-029-047  [P2] GAP  facet F11  effort S
- Legacy: Super Admin requires selected college; displays selected-scope warning, no controls without scope (`docs/legacy-source/frontend/src/pages/superadmin/programs.js:8-23`)
- vNext now: vNext /admin/programs renders empty-state; route checks isSuperAdmin (`src/app/(authenticated)/admin/programs/page.tsx:15-34`)
- Fix: Mirror warning and blocked action without selected scope

## G2-20-029-052  [P2] GAP  facet F13  effort M
- Legacy: Initial load 8-row/5-column TableSkeleton, refreshing status for stale data (`docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:302-311`)
- vNext now: Server loading boundary uses GracefulPageLoading (directory) (`src/app/(authenticated)/admin/programs/page.tsx:35-56`)
- Fix: Render row skeleton and distinct nonblocking refresh label

## G2-20-029-054  [P2] GAP  facet F13  effort M
- Legacy: Department fetch failure shows 'Departments could not be loaded' with Retry departments (`docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:249-253`)
- vNext now: Server combined read failure becomes generic unavailable page (`src/app/(authenticated)/admin/programs/page.tsx:37-56`)
- Fix: Expose department-specific retry and error separately

## G2-20-029-043  [P3] GAP  facet F10  effort M
- Legacy: Legacy reads GET new-program/fetchByCollege and department-by-college plus 3 dependency GETs per row (`docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:66-109`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:161-168`, `docs/legacy-source/frontend/src/api/Services/AdminService.js:117-135`)
- vNext now: vNext uses server-rendered listPrograms/listDepartments/listProgramContents in 2 query rounds (`src/app/(authenticated)/admin/programs/page.tsx:37-46`, `src/modules/admin-ui/program-contents-service.ts:20-63`)
- Fix: Record old-to-new endpoint mapping; preserve scope and retry semantics
