# Work packet: edit src/components/academics/college-cohort-management.tsx (part 1 of 3)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/l14-u031-academic-structure-cross-cutting.md, docs/audit/gap2/lane-9/college-admin-batches.md, docs/audit/gap2/lane-9/superadmin-batches-component.md

## G2-14-031-017  [P1] GAP  facet F06  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/BatchRequestDTO.java:14-29 name/program required, dates/year/status optional
- vNext now: src/components/academics/college-cohort-management.tsx:102-142 requires program/start period/name/code, optional expectedEndPeriod
- Fix: Document and correctly validate new mandatory code/period compared with legacy

## G2-9-003-010  [P1] GAP  facet F03  effort M
- Legacy: Row actions Edit, Students, Delete visible with icons (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:464-506`)
- vNext now: Edit button and More menu (graduation, remove) (`src/components/academics/college-cohort-management.tsx:244-268`)
- Fix: Expose Students action and legacy row action affordances.

## G2-9-003-026  [P1] GAP  facet F06  effort M
- Legacy: Academic year starts in preference keyed by college; July default (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:42-62`)
- vNext now: Start academic period date derives helper year (`src/components/academics/college-cohort-management.tsx:59-63`)
- Fix: Restore selectable academic year start month and generated year behavior where required.

## G2-9-003-030  [P1] GAP  facet F06  effort M
- Legacy: Academic Year maxLength 7, YYYY-YY, fill from start date (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:108-128`)
- vNext now: maxLength 16, placeholder 2026–2027 (`src/components/academics/college-cohort-management.tsx:131-134`)
- Fix: Align accepted/displayed academic year format or document supported extended form.

## G2-9-003-031  [P1] MISSING  facet F06  effort M
- Legacy: Status editable in legacy edit modal (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:111-130`)
- vNext now: Edit form lacks status selector; lifecycle actions limited (`src/components/academics/college-cohort-management.tsx:283-315`)
- Fix: Expose legacy ACTIVE/INACTIVE/COMPLETED transitions under safe backend rules.

## G2-9-003-044  [P1] MISSING  facet F09  effort M
- Legacy: Move student modal class choice, capacity/full warning, no cross-batch transfer (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:658-694`)
- vNext now: No corresponding modal (`src/components/academics/college-cohort-management.tsx:244-268`)
- Fix: Add safe same-batch SECTION move modal respecting capacity.

## G2-9-003-045  [P1] GAP  facet F09  effort M
- Legacy: Delete Popconfirm if no linked classes/students (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:493-505`)
- vNext now: Remove planned batch via confirmation, soft archive (`src/components/academics/college-cohort-management.tsx:251-276`)
- Fix: Preserve appropriate delete eligibility and dependency messaging; do not hard delete if data retention mandated.

## G2-9-003-052  [P1] MISSING  facet F11  effort M
- Legacy: Move targets only SECTION in same batch+program (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:318-353`)
- vNext now: No move target from this page (`src/components/academics/college-cohort-management.tsx:244-269`)
- Fix: Enforce SECTION type/same batch/program in transfer API.

## G2-9-003-054  [P1] GAP  facet F12  effort M
- Legacy: Edit: program immutable, dates/status editable (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:127-154`)
- vNext now: Program and start period immutable, dates locked when populated, status not editable (`src/components/academics/college-cohort-management.tsx:281-315`)
- Fix: Reconcile editability against legacy policy and dependency guard.

## G2-9-003-055  [P1] GAP  facet F12  effort M
- Legacy: Delete only disabled when known child records and server validates (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:465-506`)
- vNext now: Remove only PLANNED and no active children (`src/components/academics/college-cohort-management.tsx:258-276`)
- Fix: Document intentionally narrower deletion eligibility; ensure inactive historical batch handling.

## G2-9-003-056  [P1] MISSING  facet F12  effort M
- Legacy: Roster move blocks full class using live capacity counts (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:336-355`)
- vNext now: No roster move on page (`src/components/academics/college-cohort-management.tsx:244-268`)
- Fix: Implement read/check destination capacity, prevent overfill.

## G2-9-003-062  [P1] MISSING  facet F13  effort M
- Legacy: No classes in batch, roster loading, class load Retry (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:605-641`)
- vNext now: No roster UI or class-specific error states (`src/components/academics/college-cohort-management.tsx:244-335`)
- Fix: Implement roster loading/empty/offline/error independently.

## G2-9-003-084  [P1] MISSING  facet F20  effort M
- Legacy: Move class confirmation disables if capacity full (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:332-355`)
- vNext now: No student move on page (`src/components/academics/college-cohort-management.tsx:243-268`)
- Fix: Implement idempotent transfer with live capacity CAS.

## G2-9-003-092  [P1] MISSING  facet F23  effort M
- Legacy: Legacy Students roster + transfer modals (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:601-695`)
- vNext now: Students workflow missing in vNext batch workspace (`src/components/academics/college-cohort-management.tsx:244-334`)
- Fix: Restore per-batch class roster and safe same-batch transfer.

## G2-9-029-017  [P1] GAP  facet F04  effort M
- Legacy: Edit fields batchName, programId, startDate, endDate, academicYear, status `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:49-56`
- vNext now: Edits name, code, expectedEndPeriodId, academicYear, dates but no status dropdown `src/components/academics/college-cohort-management.tsx:167-180`
- Fix: Expose status lifecycle changes where legacy allows safely

## G2-9-029-021  [P1] GAP  facet F05  effort M
- Legacy: Delete disabled when classes/students known `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:491-503`
- vNext now: Remove allowed only PLANNED and no active dependents `src/components/academics/college-cohort-management.tsx:259-266`
- Fix: Document stronger delete constraints, align tooltip and disabled copy

## G2-9-029-026  [P1] GAP  facet F06  effort M
- Legacy: Auto-fill academic year from Start Date; browser preference startMonth default July `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:36-47,58-67,181-184`
- vNext now: Displays derived period year but does not auto-populate academicYear input `src/components/academics/college-cohort-management.tsx:59-64,131-146`
- Fix: Auto-fill editable legacy year based on persisted start month

## G2-9-029-029  [P1] GAP  facet F06  effort M
- Legacy: Creation sets status ACTIVE; retains program after success `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:378-393`
- vNext now: Create form does not submit status; retains program, resets other fields `src/components/academics/college-cohort-management.tsx:65-90`
- Fix: Verify default new cohort status; legacy started ACTIVE whereas new defaults PLANNED

## G2-9-029-033  [P1] GAP  facet F07  effort M
- Legacy: Server snake_case field errors map to corresponding Ant fields; closeable Batch was not created Alert `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:395-403`
- vNext now: First Zod issue and generic status paragraph `src/components/academics/college-cohort-management.tsx:74-89,154-156`
- Fix: Map backend field paths and add persistent closeable form Alert

## G2-9-029-037  [P1] GAP  facet F08  effort M
- Legacy: Deleted batch NAME success toast `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:449-450`
- vNext now: Batch archived; historical identity preserved `src/components/academics/college-cohort-management.tsx:201-214`
- Fix: Make archive-vs-delete policy explicit and match UI confirmation
