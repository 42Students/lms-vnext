# Work packet (wave 2): edit src/app/(authenticated)/college/companies/page.tsx

17 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/l13-u020-company-model.md, docs/audit/gap2/lane-9/college-admin-companies.md

## G2-13-020-002  [P2] GAP  facet F01  effort M
- Legacy: Admin company module /api/v1/admin/companies `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/CompanyController.java:24-32`
- vNext now: /college/companies page and company-service `src/app/(authenticated)/college/companies/page.tsx:22-48`
- Fix: Map company management entry, API paths and breadcrumbs.

## G2-13-020-003  [P2] GAP  facet F02  effort M
- Legacy: Legacy company read includes shared identity and per-college private fields merged `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/CompanyServiceImpl.java:457-481`
- vNext now: New directory maps relationship list and create form separately `src/app/(authenticated)/college/companies/page.tsx:45-97`
- Fix: Restore shared/private section order, including contact fields.

## G2-13-020-005  [P2] GAP  facet F03  effort M
- Legacy: Legacy driveCount and lastActiveAt calculated `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Company.java:103-116`
- vNext now: New directory data includes lastActive and company state `src/app/(authenticated)/college/companies/page.tsx:78-96`
- Fix: Add drive count and exact date placeholder/format.

## G2-13-020-016  [P2] GAP  facet F05  effort M
- Legacy: Legacy alphabetical case-insensitive company sort `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/CompanyServiceImpl.java:91-105`
- vNext now: New default LAST_ACTIVE with COMPANY alternative `src/app/(authenticated)/college/companies/page.tsx:61-64`
- Fix: Match alphabetic default or explicitly approve changed behavior.

## G2-13-020-042  [P2] GAP  facet F18  effort M
- Legacy: Legacy validation names 'Company name', 'Industry', 'Description' `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Company.java:33-52`
- vNext now: New list labels 'Companies','Filter','Company' and generic Zod errors `src/app/(authenticated)/college/companies/page.tsx:45-54`; `src/modules/placements/validation.ts:32-41`
- Fix: Use exact old validation/copy on shared fields.

## G2-9-004-002  [P2] GAP  facet F01  effort M
- Legacy: AdminGroupShell placements tab wraps Companies (`docs/legacy-source/frontend/src/pages/college-admin/companies/index.js:31-41`)
- vNext now: PageHeader/FilterBar without group shell (`src/app/(authenticated)/college/companies/page.tsx:46-100`)
- Fix: Restore Placements group tab strip, Companies selected.

## G2-9-004-004  [P2] GAP  facet F02  effort M
- Legacy: PlacementsPageOverview heading, description, four KPI tiles, Add company (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:320-345`)
- vNext now: PageHeader then Add company section, no KPI metrics (`src/app/(authenticated)/college/companies/page.tsx:45-57`)
- Fix: Restore four KPI overview cards.

## G2-9-004-005  [P2] GAP  facet F02  effort M
- Legacy: Search/checkbox/export toolbar directly above status text/table (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:343-390`)
- vNext now: Separate server FilterBar with expanded status/sort/size controls (`src/app/(authenticated)/college/companies/page.tsx:54-90`)
- Fix: Match compact toolbar and its vertical position.

## G2-9-004-012  [P2] GAP  facet F03  effort M
- Legacy: Search width260, right-aligned Show deleted checkbox and Export (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:344-372`)
- vNext now: Input grid FilterBar, checkbox one field (`src/app/(authenticated)/college/companies/page.tsx:57-91`)
- Fix: Match toolbar alignment and whitespace.

## G2-9-004-020  [P2] GAP  facet F05  effort M
- Legacy: Can click Company and Drives sort headers; Last active default desc (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:297-322`)
- vNext now: Sort select Company/Drives/Last active (`src/app/(authenticated)/college/companies/page.tsx:69-80`)
- Fix: Implement clickable sortable table columns while preserving URL sort.

## G2-9-004-023  [P2] GAP  facet F06  effort M
- Legacy: Search placeholder Search by name or industry, allowClear (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:343-371`)
- vNext now: Unlabelled placeholder, Company label, q max100 (`src/app/(authenticated)/college/companies/page.tsx:58-63`)
- Fix: Restore placeholder and clear icon.

## G2-9-004-056  [P2] GAP  facet F13  effort M
- Legacy: TableSkeleton eight rows, six cols on load (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:352-362`)
- vNext now: SSR route no inline table skeleton (`src/app/(authenticated)/college/companies/page.tsx:30-50`)
- Fix: Add loading skeleton matching legacy cards/table.

## G2-9-004-057  [P2] GAP  facet F13  effort M
- Legacy: Refreshing companies… with previous rows retained (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:346-353`)
- vNext now: Server fetch and route errors; no refresh indicator (`src/app/(authenticated)/college/companies/page.tsx:28-46`)
- Fix: Add Refresh affordance and non-destructive retry.

## G2-9-004-058  [P2] GAP  facet F13  effort M
- Legacy: Couldn't refresh companies vs Failed to load, Retry button (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:357-363`)
- vNext now: Only invalid company search has Clear filters (`src/app/(authenticated)/college/companies/page.tsx:29-36`)
- Fix: Separate upstream failure and malformed query states.

## G2-9-004-061  [P2] GAP  facet F14  effort M
- Legacy: CSV button disabled if no companies, file companies.csv (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:352-371`)
- vNext now: Export CSV anchor always enabled (`src/app/(authenticated)/college/companies/page.tsx:47-56`)
- Fix: Disable export when filtered result count zero.

## G2-9-004-072  [P2] GAP  facet F18  effort M
- Legacy: Subtitle includes recovery/no clutter sentence (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:320-339`)
- vNext now: Shortened description 'Maintain... reuse across drives.' (`src/app/(authenticated)/college/companies/page.tsx:47-50`)
- Fix: Restore full legacy description.

## G2-9-004-073  [P2] GAP  facet F18  effort M
- Legacy: Search by name or industry exact placeholder (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:349-352`)
- vNext now: Company input label without placeholder (`src/app/(authenticated)/college/companies/page.tsx:58-62`)
- Fix: Add exact placeholder.
