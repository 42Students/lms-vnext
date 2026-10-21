# Work packet: edit src/components/academics/college-cohort-management.tsx (part 2 of 3)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/superadmin-batches-component.md, docs/audit/gap2/lane-9/superadmin-batches.md, docs/audit/gap2/lane-2/batch-controller.md, docs/audit/gap2/lane-9/college-admin-batches.md

## G2-9-029-040  [P1] GAP  facet F09  effort M
- Legacy: Delete NAME Popconfirm Delete/Cancel `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:491-503`
- vNext now: Remove planned batch ConfirmDialog, archives `src/components/academics/college-cohort-management.tsx:270-277`
- Fix: Explain archival and destructive action outcome in same row

## G2-9-023-017  [P1] GAP  facet F04  effort M
- Legacy: Edit fields batchName, programId, startDate, endDate, academicYear, status `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:49-56`
- vNext now: Edits name, code, expectedEndPeriodId, academicYear, dates but no status dropdown `src/components/academics/college-cohort-management.tsx:167-180`
- Fix: Expose status lifecycle changes where legacy allows safely

## G2-9-023-021  [P1] GAP  facet F05  effort M
- Legacy: Delete disabled when classes/students known `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:491-503`
- vNext now: Remove allowed only PLANNED and no active dependents `src/components/academics/college-cohort-management.tsx:259-266`
- Fix: Document stronger delete constraints, align tooltip and disabled copy

## G2-9-023-026  [P1] GAP  facet F06  effort M
- Legacy: Auto-fill academic year from Start Date; browser preference startMonth default July `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:36-47,58-67,181-184`
- vNext now: Displays derived period year but does not auto-populate academicYear input `src/components/academics/college-cohort-management.tsx:59-64,131-146`
- Fix: Auto-fill editable legacy year based on persisted start month

## G2-9-023-029  [P1] GAP  facet F06  effort M
- Legacy: Creation sets status ACTIVE; retains program after success `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:378-393`
- vNext now: Create form does not submit status; retains program, resets other fields `src/components/academics/college-cohort-management.tsx:65-90`
- Fix: Verify default new cohort status; legacy started ACTIVE whereas new defaults PLANNED

## G2-9-023-033  [P1] GAP  facet F07  effort M
- Legacy: Server snake_case field errors map to corresponding Ant fields; closeable Batch was not created Alert `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:395-403`
- vNext now: First Zod issue and generic status paragraph `src/components/academics/college-cohort-management.tsx:74-89,154-156`
- Fix: Map backend field paths and add persistent closeable form Alert

## G2-9-023-037  [P1] GAP  facet F08  effort M
- Legacy: Deleted batch NAME success toast `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:449-450`
- vNext now: Batch archived; historical identity preserved `src/components/academics/college-cohort-management.tsx:201-214`
- Fix: Make archive-vs-delete policy explicit and match UI confirmation

## G2-9-023-040  [P1] GAP  facet F09  effort M
- Legacy: Delete NAME Popconfirm Delete/Cancel `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:491-503`
- vNext now: Remove planned batch ConfirmDialog, archives `src/components/academics/college-cohort-management.tsx:270-277`
- Fix: Explain archival and destructive action outcome in same row

## G2-2-029-042  [P2] GAP  facet F08  effort S
- Legacy: Batches.js:390-391 toast `Created batch “...” . Next, create its classes/sections.`
- vNext now: college-cohort-management.tsx:85 duplicates exact intent but uses inline notice not Ant toast.
- Fix: Match toast placement, lifecycle and wording; keep post-create next-step CTA.

## G2-2-029-044  [P2] GAP  facet F08  effort S
- Legacy: Batches.js:449-452 toast `Deleted batch “...”.`
- vNext now: college-cohort-management.tsx:201-216 archives planned batch and notice.
- Fix: Change messaging to `Archived` or maintain legacy Delete copy with clear behavior hint.

## G2-9-003-033  [P2] GAP  facet F07  effort M
- Legacy: Program required error Select a program (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:71-80`)
- vNext now: Native required Choose program (`src/components/academics/college-cohort-management.tsx:100-106`)
- Fix: Show 'Select a program' inline on empty submit.

## G2-9-003-036  [P2] GAP  facet F07  effort M
- Legacy: Field error mapping batch_name/program_id/academic_year dates (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:396-400`)
- vNext now: First Zod error as notice, server academicSetupErrorMessage (`src/components/academics/college-cohort-management.tsx:72-88`)
- Fix: Map server field-level messages back to their inputs.

## G2-9-003-039  [P2] GAP  facet F08  effort M
- Legacy: Deletion success Deleted batch <name> (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:445-463`)
- vNext now: Retire success 'Batch archived; historical identity preserved' (`src/components/academics/college-cohort-management.tsx:201-214`)
- Fix: Explain archive behavior, align wording with policy; not fake deletion.

## G2-9-029-030  [P2] GAP  facet F07  effort S
- Legacy: Select a program / Enter a batch name / Maximum 255 characters inline errors `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:71-79`
- vNext now: Browser required + Zod Batch name is required and generic error notice `src/components/academics/college-cohort-management.tsx:65-77` `src/modules/academics/college-cohort-mutation-model.ts:1-16`
- Fix: Use exact field-level Ant messages

## G2-9-029-032  [P2] GAP  facet F07  effort S
- Legacy: Use consecutive years, e.g., 2026-27 `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:95-103`
- vNext now: Use an academic year like 2026-27. with input accepting 2026–2027 `src/modules/academics/college-cohort-mutation-model.ts:1-8` `src/components/academics/college-cohort-management.tsx:131-134`
- Fix: Restore precise legacy consecutive-year validation

## G2-9-029-034  [P2] GAP  facet F07  effort M
- Legacy: Delete failure Batch was not deleted with Retry delete `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:443-459,549-551`
- vNext now: Inline Batch removal failed notice, no per-row retry error banner `src/components/academics/college-cohort-management.tsx:201-214,270-277`
- Fix: Show contextual Retry delete banner

## G2-9-023-030  [P2] GAP  facet F07  effort S
- Legacy: Select a program / Enter a batch name / Maximum 255 characters inline errors `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:71-79`
- vNext now: Browser required + Zod Batch name is required and generic error notice `src/components/academics/college-cohort-management.tsx:65-77` `src/modules/academics/college-cohort-mutation-model.ts:1-16`
- Fix: Use exact field-level Ant messages

## G2-9-023-032  [P2] GAP  facet F07  effort S
- Legacy: Use consecutive years, e.g., 2026-27 `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:95-103`
- vNext now: Use an academic year like 2026-27. with input accepting 2026–2027 `src/modules/academics/college-cohort-mutation-model.ts:1-8` `src/components/academics/college-cohort-management.tsx:131-134`
- Fix: Restore precise legacy consecutive-year validation

## G2-9-023-034  [P2] GAP  facet F07  effort M
- Legacy: Delete failure Batch was not deleted with Retry delete `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:443-459,549-551`
- vNext now: Inline Batch removal failed notice, no per-row retry error banner `src/components/academics/college-cohort-management.tsx:201-214,270-277`
- Fix: Show contextual Retry delete banner

## G2-2-029-043  [P3] GAP  facet F08  effort S
- Legacy: Batches.js:427-428 toast `Updated batch “...”.`
- vNext now: college-cohort-management.tsx:236 inline `Updated batch “...”.`.
- Fix: Align toast duration/position and when drawer closes.
