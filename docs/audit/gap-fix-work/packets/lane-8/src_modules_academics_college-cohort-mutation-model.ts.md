# Work packet: edit src/modules/academics/college-cohort-mutation-model.ts

14 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/batch-controller.md, docs/audit/gap2/lane-9/college-admin-batches.md, docs/audit/gap2/lane-9/superadmin-batches-component.md, docs/audit/gap2/lane-9/superadmin-batches.md

## G2-2-029-016  [P1] GAP  facet F04  effort L
- Legacy: BatchRequestDTO.java:13-29 `batchName,programId,startDate,endDate,currentStudents,academicYear,status`.
- vNext now: college-cohort-mutation-model.ts:10-21 requires `name,code,startPeriodId,expectedEndPeriodId`, dates and academicYear; no status/currentStudents.
- Fix: Provide migration schema for batch code/period, ignore old client count; document status default change.

## G2-9-003-035  [P1] GAP  facet F07  effort M
- Legacy: DTO academic year max7 YYYY-YY exact Pattern message (`docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/BatchRequestDTO.java:13-29`)
- vNext now: Allows 7-9 length and en-dash separator (`src/modules/academics/college-cohort-mutation-model.ts:6-8`)
- Fix: Confirm and align legacy constraints, preserve round-trip normalization.

## G2-9-003-053  [P1] GAP  facet F12  effort M
- Legacy: Academic year start month default July (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:39-63`)
- vNext now: date-derived academic year from periods (`src/modules/academics/college-cohort-mutation-model.ts:49-61`)
- Fix: Retain July default or make college period policy explicit.

## G2-9-003-088  [P1] GAP  facet F22  effort M
- Legacy: BatchRequestDTO name/program required, academic year max7 (`docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/BatchRequestDTO.java:12-29`)
- vNext now: Cohort model requires startPeriod and code, supports longer year (`src/modules/academics/college-cohort-mutation-model.ts:3-30`)
- Fix: Reconcile required fields, defaults and year format.

## G2-9-029-066  [P1] GAP  facet F22  effort L
- Legacy: Legacy Batch stores batchName, programId, currentStudents, status ACTIVE, currentSemester1 `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/BatchServiceImpl.java:71-95`
- vNext now: New UUID cohort with programId/code/startPeriodId/status PLANNED; progression separate `src/db/schema/academics.ts:126-175` `src/modules/academics/college-cohort-mutation-model.ts:10-34`
- Fix: Map status/currentSemester/start period and migrate legacy status safely

## G2-9-023-066  [P1] GAP  facet F22  effort L
- Legacy: Legacy Batch stores batchName, programId, currentStudents, status ACTIVE, currentSemester1 `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/BatchServiceImpl.java:71-95`
- vNext now: New UUID cohort with programId/code/startPeriodId/status PLANNED; progression separate `src/db/schema/academics.ts:126-175` `src/modules/academics/college-cohort-mutation-model.ts:10-34`
- Fix: Map status/currentSemester/start period and migrate legacy status safely

## G2-9-003-032  [P2] GAP  facet F07  effort M
- Legacy: Batch Name required whitespace and max255, exact 'Enter a batch name' (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:84-98`)
- vNext now: Zod min1 max255 with 'Batch name is required' (`src/modules/academics/college-cohort-mutation-model.ts:3-7`)
- Fix: Use legacy validation message and whitespace rule.

## G2-9-029-030  [P2] GAP  facet F07  effort S
- Legacy: Select a program / Enter a batch name / Maximum 255 characters inline errors `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:71-79`
- vNext now: Browser required + Zod Batch name is required and generic error notice `src/components/academics/college-cohort-management.tsx:65-77` `src/modules/academics/college-cohort-mutation-model.ts:1-16`
- Fix: Use exact field-level Ant messages

## G2-9-029-032  [P2] GAP  facet F07  effort S
- Legacy: Use consecutive years, e.g., 2026-27 `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:95-103`
- vNext now: Use an academic year like 2026-27. with input accepting 2026–2027 `src/modules/academics/college-cohort-mutation-model.ts:1-8` `src/components/academics/college-cohort-management.tsx:131-134`
- Fix: Restore precise legacy consecutive-year validation

## G2-9-023-030  [P2] GAP  facet F07  effort S
- Legacy: Select a program / Enter a batch name / Maximum 255 characters inline errors `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:71-79`
- vNext now: Browser required + Zod Batch name is required and generic error notice `src/components/academics/college-cohort-management.tsx:65-77` `src/modules/academics/college-cohort-mutation-model.ts:1-16`
- Fix: Use exact field-level Ant messages

## G2-9-023-032  [P2] GAP  facet F07  effort S
- Legacy: Use consecutive years, e.g., 2026-27 `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:95-103`
- vNext now: Use an academic year like 2026-27. with input accepting 2026–2027 `src/modules/academics/college-cohort-mutation-model.ts:1-8` `src/components/academics/college-cohort-management.tsx:131-134`
- Fix: Restore precise legacy consecutive-year validation

## G2-2-029-034  [P3] GAP  facet F07  effort S
- Legacy: BatchServiceImpl.java:76-78 create rejects end<start with `End date cannot be before start date`.
- vNext now: college-cohort-mutation-model.ts:19-20 same policy but includes trailing period.
- Fix: Align exact punctuation in inline field error.

## G2-9-029-031  [P3] GAP  facet F07  effort S
- Legacy: End date cannot be before start date `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:85-92`
- vNext now: End date cannot be before start date. includes final period `src/components/academics/college-cohort-management.tsx:61-69` `src/modules/academics/college-cohort-mutation-model.ts:12-17`
- Fix: Match punctuation/location and disabled date state

## G2-9-023-031  [P3] GAP  facet F07  effort S
- Legacy: End date cannot be before start date `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:85-92`
- vNext now: End date cannot be before start date. includes final period `src/components/academics/college-cohort-management.tsx:61-69` `src/modules/academics/college-cohort-mutation-model.ts:12-17`
- Fix: Match punctuation/location and disabled date state
