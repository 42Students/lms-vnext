# Work packet (wave 2): edit src/app/(authenticated)/college/departments/page.tsx

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/l14-u031-academic-structure-cross-cutting.md, docs/audit/gap2/lane-9/college-admin-departments.md

## G2-14-031-001  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DepartmentController.java:27-31,60-92 /api/v1/department and legacy department UI
- vNext now: src/app/(authenticated)/college/departments/page.tsx:39-43 dedicated /college/departments with new setup link
- Fix: Match old academic navigation label and deep-link redirects

## G2-14-031-004  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DepartmentController.java:60-92,128-213 department CRUD in one management flow
- vNext now: src/app/(authenticated)/college/departments/page.tsx:39-43 header/administration directory
- Fix: Use old section order, heading and actions from departments page

## G2-9-006-002  [P2] GAP  facet F01  effort M
- Legacy: AdminGroupShell groupKey academic (`docs/legacy-source/frontend/src/pages/college-admin/departments.js:35-42`)
- vNext now: No Academic Setup tab strip, only one back link (`src/app/(authenticated)/college/departments/page.tsx:39-48`)
- Fix: Restore academic tab strip and selected state.

## G2-9-006-004  [P2] GAP  facet F02  effort M
- Legacy: Heading Departments above two cards in one Row gutter24 (`docs/legacy-source/frontend/src/pages/superadmin/sections/Departments.js:347-355`)
- vNext now: PageHeader description, stacked create form/list (`src/app/(authenticated)/college/departments/page.tsx:39-48`)
- Fix: Restore title spacing and lg 10/14 card columns.

## G2-9-006-047  [P2] GAP  facet F13  effort M
- Legacy: Eight-row six-column TableSkeleton initially (`docs/legacy-source/frontend/src/pages/superadmin/sections/Departments.js:382-405`)
- vNext now: Server awaited, no skeleton in route (`src/app/(authenticated)/college/departments/page.tsx:24-50`)
- Fix: Add loading boundary matching old skeleton.

## G2-9-006-048  [P2] GAP  facet F13  effort M
- Legacy: Refreshing departments… status with last rows retained (`docs/legacy-source/frontend/src/pages/superadmin/sections/Departments.js:370-386`)
- vNext now: No refresh control in route; SSR fresh navigation (`src/app/(authenticated)/college/departments/page.tsx:24-48`)
- Fix: Add refresh and non-destructive data retention.

## G2-9-006-049  [P2] GAP  facet F13  effort M
- Legacy: Couldn't refresh departments / Could not load departments and Retry (`docs/legacy-source/frontend/src/pages/superadmin/sections/Departments.js:377-392`)
- vNext now: Server exception bubbles; no inline load failure (`src/app/(authenticated)/college/departments/page.tsx:24-50`)
- Fix: Add targeted retry and error distinction.

## G2-9-006-058  [P2] GAP  facet F16  effort M
- Legacy: Ant Row gutter24, Col xs24 lg10/14 (`docs/legacy-source/frontend/src/pages/superadmin/sections/Departments.js:349-365`)
- vNext now: Stacked sections with no cards (`src/app/(authenticated)/college/departments/page.tsx:39-48`)
- Fix: Recreate desktop split and mobile stacking at old breakpoint.
