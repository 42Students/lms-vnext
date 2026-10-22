# Verification packet (P1 round 2): 15 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-9-022-034 [DEFERRED — requires service-level or lifecycle parity check] GAP facet F09
- Files: src/components/academics/college-promotion-confirmation.tsx
- Legacy: Modal shows student count, class count, deactivated assignments, term/year impact and max `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:472-500`
- Expected fix: Restore full impact list and class/faculty counts

## G2-9-022-058 [DEFERRED — requires service-level or lifecycle parity check] GAP facet F19
- Files: src/modules/academics/college-batch-promotion-service.ts, src/app/(authenticated)/admin/batch-promotion/page.tsx
- Legacy: Client loads all batches, paginates ten visible rows `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:47-72,442-449`
- Expected fix: Use server pagination for large colleges

## G2-9-029-015 [DEFERRED — requires service-level or lifecycle parity check] GAP facet F04
- Files: src/app/(authenticated)/admin/batches/page.tsx
- Legacy: Class count classCount; currentStudents `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:475-477`
- Expected fix: Show classes and verify legacy student membership semantics

## G2-9-029-017 [DEFERRED — requires service-level or lifecycle parity check] GAP facet F04
- Files: src/components/academics/college-cohort-management.tsx
- Legacy: Edit fields batchName, programId, startDate, endDate, academicYear, status `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:49-56`
- Expected fix: Expose status lifecycle changes where legacy allows safely

## G2-9-029-021 [OK — matching behavior or guard present] GAP facet F05
- Files: src/components/academics/college-cohort-management.tsx
- Legacy: Delete disabled when classes/students known `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:491-503`
- Expected fix: Document stronger delete constraints, align tooltip and disabled copy

## G2-9-029-026 [OK — matching behavior or guard present] GAP facet F06
- Files: src/components/academics/college-cohort-management.tsx
- Legacy: Auto-fill academic year from Start Date; browser preference startMonth default July `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:36-47,58-67,181-184`
- Expected fix: Auto-fill editable legacy year based on persisted start month

## G2-9-029-029 [DEFERRED — requires service-level or lifecycle parity check] GAP facet F06
- Files: src/components/academics/college-cohort-management.tsx
- Legacy: Creation sets status ACTIVE; retains program after success `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:378-393`
- Expected fix: Verify default new cohort status; legacy started ACTIVE whereas new defaults PLANNED

## G2-9-029-037 [OK — matching behavior or guard present] GAP facet F08
- Files: src/components/academics/college-cohort-management.tsx
- Legacy: Deleted batch NAME success toast `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:449-450`
- Expected fix: Make archive-vs-delete policy explicit and match UI confirmation

## G2-9-029-040 [OK — matching behavior or guard present] GAP facet F09
- Files: src/components/academics/college-cohort-management.tsx
- Legacy: Delete NAME Popconfirm Delete/Cancel `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:491-503`
- Expected fix: Explain archival and destructive action outcome in same row

## G2-9-023-017 [DEFERRED — requires service-level or lifecycle parity check] GAP facet F04
- Files: src/components/academics/college-cohort-management.tsx
- Legacy: Edit fields batchName, programId, startDate, endDate, academicYear, status `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:49-56`
- Expected fix: Expose status lifecycle changes where legacy allows safely

## G2-9-023-021 [OK — matching behavior or guard present] GAP facet F05
- Files: src/components/academics/college-cohort-management.tsx
- Legacy: Delete disabled when classes/students known `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:491-503`
- Expected fix: Document stronger delete constraints, align tooltip and disabled copy

## G2-9-023-026 [OK — matching behavior or guard present] GAP facet F06
- Files: src/components/academics/college-cohort-management.tsx
- Legacy: Auto-fill academic year from Start Date; browser preference startMonth default July `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:36-47,58-67,181-184`
- Expected fix: Auto-fill editable legacy year based on persisted start month

## G2-9-023-029 [DEFERRED — requires service-level or lifecycle parity check] GAP facet F06
- Files: src/components/academics/college-cohort-management.tsx
- Legacy: Creation sets status ACTIVE; retains program after success `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:378-393`
- Expected fix: Verify default new cohort status; legacy started ACTIVE whereas new defaults PLANNED

## G2-9-023-037 [OK — matching behavior or guard present] GAP facet F08
- Files: src/components/academics/college-cohort-management.tsx
- Legacy: Deleted batch NAME success toast `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:449-450`
- Expected fix: Make archive-vs-delete policy explicit and match UI confirmation

## G2-9-023-040 [OK — matching behavior or guard present] GAP facet F09
- Files: src/components/academics/college-cohort-management.tsx
- Legacy: Delete NAME Popconfirm Delete/Cancel `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:491-503`
- Expected fix: Explain archival and destructive action outcome in same row
