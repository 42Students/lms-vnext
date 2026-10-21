# Work packet (wave 2): edit src/app/(authenticated)/college/programs/page.tsx

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-20/superadmin-sections-programs.md, docs/audit/gap2/lane-9/college-admin-programs.md, docs/audit/gap2/lane-13/new-program.md

## G2-20-029-002  [P2] GAP  facet F01  effort M
- Legacy: College Admin shares same component, switching base link by /college-admin path (`docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:25-27`)
- vNext now: College admin has separate /college/programs page with archived section (`src/app/(authenticated)/college/programs/page.tsx:9-45`)
- Fix: Ensure both role routes retain equivalent entry/back navigation

## G2-9-018-001  [P2] GAP  facet F01  effort M
- Legacy: College admin wrapper sets active menu `programs` and academic group. `docs/legacy-source/frontend/src/pages/college-admin/programs.js:13-18,34-42`
- vNext now: Server-rendered /college/programs view; group tabs not rendered in page. `src/app/(authenticated)/college/programs/page.tsx:11-30`
- Fix: Provide legacy Academic Setup tab strip and active Programs menu.

## G2-9-018-004  [P2] GAP  facet F02  effort M
- Legacy: H1, two-column Ant Row gutter24, left lg10 create card and right lg14 list card `docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:267-273,289-323`
- vNext now: PageHeader with description, vertically stacked details/list/archived section `src/app/(authenticated)/college/programs/page.tsx:24-48`
- Fix: Reproduce title and large-screen 10/14 two-panel structure with two small Cards.

## G2-9-018-051  [P2] GAP  facet F13  effort M
- Legacy: On first fetch failure shows retry alert, refresh failure retains existing list `docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:66-85,302-309`
- vNext now: Server load page has error fallback, no retained client snapshot `src/app/(authenticated)/college/programs/page.tsx:16-22`
- Fix: Provide inline refresh retry and stale-data retention at same scope.

## G2-9-018-052  [P2] GAP  facet F13  effort M
- Legacy: First load TableSkeleton 8 rows, refresh status label `docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:302-310`
- vNext now: Route-level graceful loading separate from directory `src/app/(authenticated)/college/programs/page.tsx:11-24`
- Fix: Match in-card skeleton/refresh treatment.

## G2-9-018-064  [P2] GAP  facet F19  effort M
- Legacy: Table paginates client rows 25 default `docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:42-50,310-319`
- vNext now: All server rows loaded then client pages 10 `src/app/(authenticated)/college/programs/page.tsx:17-22` `src/modules/admin-ui/program-directory.ts:41-56`
- Fix: Match 25 and add server paging for high row counts if needed.

## G2-13-018-045  [P3] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NewProgramController.java:207` exact delete success 'Program deleted successfully'
- vNext now: `src/app/(authenticated)/college/programs/page.tsx:47` Archived Programs separate list; `src/components/admin/admin-program-directory.tsx:128` created toast
- Fix: Use 'Archived program' where actual mutation archives, not false deleted claim

## G2-9-018-041  [P3] GAP  facet F10  effort M
- Legacy: GET /api/v1/new-program/fetchByCollege?collegeId; GET college departments `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NewProgramController.java:126-132` `docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:66-107`
- vNext now: Server listPrograms/listDepartments/listArchived through context `src/app/(authenticated)/college/programs/page.tsx:16-22` and GET /api/academics/programs `src/app/api/academics/programs/route.ts:13-26`
- Fix: Record route contract changes; preserve same scoped data.

## G2-9-018-063  [P3] GAP  facet F19  effort M
- Legacy: Calls dependency lookup per row, bounded useDependencyCounts and request sequence tokens `docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:55-110,169-171`
- vNext now: Preloads listProgramContents in one server fetch `src/app/(authenticated)/college/programs/page.tsx:17-22`
- Fix: Verify large-college load and allow progressive count loading if queries slow.

## G2-9-018-068  [P3] GAP  facet F21  effort M
- Legacy: Legacy dependencies from semester/batch/class APIs `docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:8-9,169-171`
- vNext now: Server listProgramContents materializes dependencies `src/app/(authenticated)/college/programs/page.tsx:7,22`
- Fix: Compare count freshness/race and missing-record semantics.
