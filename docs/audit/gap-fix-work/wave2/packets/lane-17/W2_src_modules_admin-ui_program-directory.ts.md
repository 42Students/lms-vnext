# Work packet (wave 2): edit src/modules/admin-ui/program-directory.ts

12 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-programs.md, docs/audit/gap2/lane-20/superadmin-sections-programs.md, docs/audit/gap2/lane-9/college-admin-programs.md

## G2-10-020-022  [P2] GAP  facet F05  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:170-173 — Client search preserves API row order; no sort performed.
- vNext now: src/modules/admin-ui/program-directory.ts:26-35 — Sorts departmentName, name, id ascending.
- Fix: Clone original ordering or explicitly show sort choice.

## G2-10-020-023  [P2] GAP  facet F05  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:292-298 — Toolbar Export CSV returns filtered rows incl id, name, durationYears, deptId, 3 dependency counts.
- vNext now: src/modules/admin-ui/program-directory.ts:62-70 — Exports ID, Program, Code, Department, Duration Terms and counts.
- Fix: Restore legacy columns/order, years, deptId for export parity.

## G2-10-020-074  [P2] GAP  facet F14  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:292-298 — programs.csv emitted for filtered rows, with id/deptId and years.
- vNext now: src/modules/admin-ui/program-directory.ts:62-70 — CSV with code/department and terms, BOM added by src/components/admin/admin-program-directory.tsx:101-102.
- Fix: Match CSV header/data order and duration units.

## G2-10-020-094  [P2] GAP  facet F19  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:310-319 — Client Table slices 25 rows after loading full data.
- vNext now: src/modules/academics/program-service.ts:169-205; src/modules/admin-ui/program-directory.ts:38-51 — Server selects all programs, client page slices default10.
- Fix: At large scale use paginated server search; preserve visual size25.

## G2-20-029-011  [P2] GAP  facet F04  effort S
- Legacy: Duration '4 years' or em dash for absent value (`docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:215-217`)
- vNext now: Duration '4 years (8 terms)' (`src/modules/admin-ui/program-directory.ts:11-14`)
- Fix: Remove terms suffix in table; show em dash on absent value

## G2-20-029-016  [P2] GAP  facet F05  effort S
- Legacy: Legacy preserves service-return order (no frontend sort) (`docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:170-173`)
- vNext now: Always sorts Department then Program then id (`src/modules/admin-ui/program-directory.ts:31-35`)
- Fix: Confirm backend ordering; match it or document sanctioned changed sort

## G2-20-029-056  [P2] GAP  facet F14  effort S
- Legacy: CSV exports id,name,durationYears,departmentId,semesters,batches,classes in that order (`docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:293-299`)
- vNext now: CSV includes Program,Code,Department,Duration Terms,dependencies (`src/modules/admin-ui/program-directory.ts:62-70`)
- Fix: Rebuild legacy column set/order and unit labels while optionally keeping code as extra

## G2-20-029-066  [P2] GAP  facet F19  effort S
- Legacy: Legacy table page size 25, client-side filtered dataset (`docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:47-48`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:170-173`)
- vNext now: New page size 10 default, client-side paginate (`src/modules/admin-ui/program-directory.ts:38-51`)
- Fix: Align page-size default; assess scaling for thousands of programs

## G2-9-018-012  [P2] GAP  facet F04  effort S
- Legacy: Duration displays N years, singular 1 year `docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:215-216`
- vNext now: Duration label includes years and terms count `src/modules/admin-ui/program-directory.ts:12-16`
- Fix: Render years-only string in directory.

## G2-9-018-018  [P2] GAP  facet F05  effort S
- Legacy: Server response displayed in fetched order; filter only `docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:66-78,172-175`
- vNext now: Client forces department/name/id locale sort `src/modules/admin-ui/program-directory.ts:28-39`
- Fix: Retain legacy default ordering unless explicitly redesigned.

## G2-9-018-064  [P2] GAP  facet F19  effort M
- Legacy: Table paginates client rows 25 default `docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:42-50,310-319`
- vNext now: All server rows loaded then client pages 10 `src/app/(authenticated)/college/programs/page.tsx:17-22` `src/modules/admin-ui/program-directory.ts:41-56`
- Fix: Match 25 and add server paging for high row counts if needed.

## G2-10-020-018  [P3] GAP  facet F04  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:215-218 — Duration string only '4 years'.
- vNext now: src/modules/admin-ui/program-directory.ts:11-14 — Renders '4 years (8 terms)'.
- Fix: Use years-only list display; terms can remain secondary detail.
