# Work packet (wave 2): edit src/app/(authenticated)/admin/departments/page.tsx

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-recycle-bin-controller.md, docs/audit/gap2/lane-6/l18-u030-superadmin-departments.md, docs/audit/gap2/lane-9/superadmin-departments.md

## G2-2-023-018  [P2] GAP  facet F06  effort M
- Legacy: AdminRecycleBinController.java:177-193 optional collegeId integer except platform types
- vNext now: src/app/(authenticated)/admin/departments/page.tsx:13-28 college scope from context
- Fix: Honor selected tenant role scope rather than trusting query id.

## G2-2-023-048  [P2] GAP  facet F16  effort M
- Legacy: AdminRecycleBinController.java:210-214 three-column generic row suitable table
- vNext now: src/app/(authenticated)/admin/departments/page.tsx:51-53 directory UI
- Fix: Build small-screen stacked row and desktop table using legacy grid tokens.

## G2-18-030-062  [P2] GAP  facet F21  effort M
- Legacy: Legacy dependency counts fetched by hook with re-use across reloads. `docs/legacy-source/frontend/src/pages/superadmin/sections/Departments.js:216`
- vNext now: vNext page re-fetches usage per row on full router.refresh. `src/app/(authenticated)/admin/departments/page.tsx:35`
- Fix: Cache or batch usage with invalidation keyed to known relationship mutations.

## G2-9-024-001  [P2] GAP  facet F01  effort M
- Legacy: Old /superadmin/departments is within SuperAdminLayout and academic SuperAdminGroupShell `docs/legacy-source/frontend/src/pages/superadmin/departments.js:1-5,23-32`
- vNext now: New /admin/departments uses PageHeader and AcademicSetupSteps `src/app/(authenticated)/admin/departments/page.tsx:13-15,49-57`
- Fix: Restore academic legacy tab strip/current tab

## G2-9-024-002  [P2] GAP  facet F01  effort S
- Legacy: No selected college displays yellow Alert Select a college to continue `docs/legacy-source/frontend/src/pages/superadmin/departments.js:10-21`
- vNext now: Shows EmptyState with same heading and description `src/app/(authenticated)/admin/departments/page.tsx:17-29`
- Fix: Use old warning banner geometry and margin

## G2-9-024-004  [P2] GAP  facet F02  effort M
- Legacy: H1 then Row gutter24: create left lg10 and list right lg14, both Card size small `docs/legacy-source/frontend/src/pages/superadmin/sections/Departments.js:328-420`
- vNext now: PageHeader, AcademicSetupSteps, form and list all stacked `src/app/(authenticated)/admin/departments/page.tsx:49-58`
- Fix: Recreate legacy two-column cards

## G2-9-024-048  [P2] GAP  facet F13  effort M
- Legacy: On refresh failure retain same-scope stale rows and show Retry alert `docs/legacy-source/frontend/src/pages/superadmin/sections/Departments.js:60-80,398-406`
- vNext now: Server renders fresh list or route error; no in-page stale snapshot `src/app/(authenticated)/admin/departments/page.tsx:32-49`
- Fix: Provide inline scoped refresh retry/stale notice

## G2-9-024-050  [P2] GAP  facet F13  effort M
- Legacy: Separate delete failure retry and fetch failure retry `docs/legacy-source/frontend/src/pages/superadmin/sections/Departments.js:395-404`
- vNext now: Archive modal error only, server load outside component `src/components/admin/department-actions.tsx:111-135` `src/app/(authenticated)/admin/departments/page.tsx:32-47`
- Fix: Add list-level refresh error and Retry

## G2-9-024-059  [P2] GAP  facet F19  effort M
- Legacy: Bounded asynchronous dependency-count hook per department `docs/legacy-source/frontend/src/pages/superadmin/sections/Departments.js:216-223`
- vNext now: Promise.allSettled usage for every department `src/app/(authenticated)/admin/departments/page.tsx:35-47`
- Fix: Bound resolver concurrency for large colleges

## G2-9-024-038  [P3] GAP  facet F10  effort S
- Legacy: GET /api/v1/department/fetch?collegeId and retain scoped list `docs/legacy-source/frontend/src/pages/superadmin/sections/Departments.js:60-80`
- vNext now: Server listDepartments + usage separate queries `src/app/(authenticated)/admin/departments/page.tsx:32-47` `src/modules/departments/service.ts:183-205`
- Fix: Document route and response shape
