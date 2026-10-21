# Work packet (wave 2): edit src/app/(authenticated)/admin/batches/page.tsx (part 2 of 2)

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/superadmin-batches.md

## G2-9-023-019  [P2] GAP  facet F05  effort S
- Legacy: Default pageSize25; 10/25/50/100 and localStorage admin-batches-page-size `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:29,37,137-142,177-184`
- vNext now: New query supports pageSize but no legacy persisted preference `src/app/(authenticated)/admin/batches/page.tsx:63-75` `src/modules/academics/college-cohort-mutation-model.ts:1-41`
- Fix: Default25 and read legacy page-size key

## G2-9-023-020  [P2] GAP  facet F05  effort M
- Legacy: Ant Table pagination range x-y of total `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:572-580`
- vNext now: New previous/next pagination and page summary `src/app/(authenticated)/admin/batches/page.tsx:103-120`
- Fix: Restore compact Ant-style paginator and exact range text

## G2-9-023-043  [P2] GAP  facet F10  effort M
- Legacy: GET batches/programs/classes by college `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:14-17,186-238`
- vNext now: Server listCollegeBatches and academic periods instead of legacy classes fetch `src/app/(authenticated)/admin/batches/page.tsx:25-38`
- Fix: Map program/class choices and refresh data

## G2-9-023-052  [P2] GAP  facet F13  effort M
- Legacy: Scope-safe refresh keeps previous data and shows stale warning `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:168-175,186-209,552-557`
- vNext now: Page data fetched server-side without same-scope stale snapshot `src/app/(authenticated)/admin/batches/page.tsx:25-38`
- Fix: Add inline retry/last loaded indicator for refresh errors

## G2-9-023-053  [P2] GAP  facet F13  effort M
- Legacy: Eight-row TableSkeleton on initial load and search empty guidance `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:570-580`
- vNext now: EmptyState generic, separate page-level loading `src/app/(authenticated)/admin/batches/page.tsx:87-89`
- Fix: Match loading skeleton and context-aware empty text

## G2-9-023-058  [P2] GAP  facet F16  effort M
- Legacy: Two-column lg10/lg14 cards, xs full width, compact Ant tables `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:518-542`
- vNext now: Stacked responsive sections and mobilePriority DataTable `src/app/(authenticated)/admin/batches/page.tsx:39-105`
- Fix: Restore desktop card grid and dense rows; keep 44px mobile targets

## G2-9-023-059  [P2] GAP  facet F17  effort S
- Legacy: Per-row aria-label Edit batch, Manage students in..., Move learner... `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:491-502,643-650`
- vNext now: Explicit actions with generic Edit, More, Manage students `src/app/(authenticated)/admin/batches/page.tsx:90-101` `src/components/academics/college-cohort-management.tsx:244-268`
- Fix: Add record-specific accessible names and focus restore

## G2-9-023-060  [P2] GAP  facet F18  effort S
- Legacy: Old subtitle and Create New Batch/Existing Batches titles `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:514-515`
- vNext now: New Batches/Manage batches/Create Batch labels `src/app/(authenticated)/admin/batches/page.tsx:39-45,84-85` `src/components/academics/college-cohort-management.tsx:93-96`
- Fix: Restore full legacy heading strings

## G2-9-023-061  [P2] GAP  facet F18  effort S
- Legacy: Search placeholder Search batch, year, program or status `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:538-541`
- vNext now: Search batches label with no old placeholder `src/app/(authenticated)/admin/batches/page.tsx:58-62`
- Fix: Restore exact search placeholder
