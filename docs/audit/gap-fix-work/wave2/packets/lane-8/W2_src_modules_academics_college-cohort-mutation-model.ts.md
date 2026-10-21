# Work packet (wave 2): edit src/modules/academics/college-cohort-mutation-model.ts

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/batch-controller.md, docs/audit/gap2/lane-9/superadmin-batches-component.md, docs/audit/gap2/lane-9/superadmin-batches.md

## G2-2-029-017  [P2] GAP  facet F04  effort S
- Legacy: BatchRequestDTO.java:25-27 academicYear strictly 7-char `YYYY-YY`.
- vNext now: college-cohort-mutation-model.ts:7 accepts hyphen/en dash, 7–9 chars and 2/4-digit end year.
- Fix: Decide canonical allowed format and ensure same copy/normalization across UI/API.

## G2-2-029-027  [P2] GAP  facet F06  effort M
- Legacy: BatchRequestDTO.java:14-17 requires nonblank batchName, nonnull programId.
- vNext now: college-cohort-mutation-model.ts:3-15 requires trimmed name, UUID program, code, start period.
- Fix: Keep original required indicators while explaining new mandatory code and period.

## G2-2-029-033  [P2] GAP  facet F06  effort M
- Legacy: Batches.js:58-111 form permits status edit/create.
- vNext now: college-cohort-mutation-model.ts:10-33 has no status field; separate lifecycle service.
- Fix: Show separate activate/graduation controls without exposing unsupported status free-edit.

## G2-9-029-019  [P2] GAP  facet F05  effort S
- Legacy: Default pageSize25; 10/25/50/100 and localStorage admin-batches-page-size `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:29,37,137-142,177-184`
- vNext now: New query supports pageSize but no legacy persisted preference `src/app/(authenticated)/admin/batches/page.tsx:63-75` `src/modules/academics/college-cohort-mutation-model.ts:1-41`
- Fix: Default25 and read legacy page-size key

## G2-9-029-049  [P2] GAP  facet F12  effort M
- Legacy: Academic Year normalized strictly consecutive YYYY-YY `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:24-27,95-103`
- vNext now: Zod accepts dash/en dash and 2-4 year suffix `src/modules/academics/college-cohort-mutation-model.ts:4-8,15-23`
- Fix: Enforce or explain stricter accepted syntax

## G2-9-029-067  [P2] GAP  facet F22  effort M
- Legacy: Legacy 7-char academicYear, 1..12 start month preference `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:24-47,95-104`
- vNext now: New academicYear varchar16, flexible regex and no start-month preference `src/db/schema/academics.ts:146-158` `src/modules/academics/college-cohort-mutation-model.ts:4-8`
- Fix: Restore legacy input/display year while keeping stored valid value

## G2-9-023-019  [P2] GAP  facet F05  effort S
- Legacy: Default pageSize25; 10/25/50/100 and localStorage admin-batches-page-size `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:29,37,137-142,177-184`
- vNext now: New query supports pageSize but no legacy persisted preference `src/app/(authenticated)/admin/batches/page.tsx:63-75` `src/modules/academics/college-cohort-mutation-model.ts:1-41`
- Fix: Default25 and read legacy page-size key

## G2-9-023-049  [P2] GAP  facet F12  effort M
- Legacy: Academic Year normalized strictly consecutive YYYY-YY `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:24-27,95-103`
- vNext now: Zod accepts dash/en dash and 2-4 year suffix `src/modules/academics/college-cohort-mutation-model.ts:4-8,15-23`
- Fix: Enforce or explain stricter accepted syntax

## G2-9-023-067  [P2] GAP  facet F22  effort M
- Legacy: Legacy 7-char academicYear, 1..12 start month preference `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:24-47,95-104`
- vNext now: New academicYear varchar16, flexible regex and no start-month preference `src/db/schema/academics.ts:146-158` `src/modules/academics/college-cohort-mutation-model.ts:4-8`
- Fix: Restore legacy input/display year while keeping stored valid value

## G2-2-029-028  [P3] GAP  facet F06  effort S
- Legacy: Batches.js:77-79 name max255 and literal message `Enter a batch name`.
- vNext now: college-cohort-mutation-model.ts:3 max255 and `Batch name is required`.
- Fix: Restore precise validation message for empty name (or approve new copy).
