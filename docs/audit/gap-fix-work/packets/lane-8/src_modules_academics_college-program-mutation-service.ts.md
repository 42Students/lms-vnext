# Work packet: edit src/modules/academics/college-program-mutation-service.ts

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-20/superadmin-sections-programs.md, docs/audit/gap2/lane-13/new-program.md

## G2-20-029-045  [P1] GAP  facet F10  effort L
- Legacy: Edit PUT new-program/update/{id}; hard delete DELETE new-program/delete/{id} (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NewProgramController.java:145-177`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NewProgramController.java:185-212`)
- vNext now: PATCH update and DELETE archive/soft-hide (`src/app/api/academics/programs/[programId]/route.ts:24-49`, `src/modules/academics/college-program-mutation-service.ts:196-245`)
- Fix: Decide hard-delete versus archive parity and document data retention effect explicitly

## G2-20-029-050  [P1] GAP  facet F12  effort M
- Legacy: Legacy shrink years blocked if batch current semester or configured semester exceeds new max (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NewProgramServiceImpl.java:113-139`)
- vNext now: New reduction checks highest term and cohort progression state (`src/modules/academics/college-program-mutation-service.ts:180-196`)
- Fix: Ensure legacy current-semester and configured-semester blockers map fully

## G2-20-029-051  [P1] GAP  facet F12  effort M
- Legacy: Legacy delete blocks structure, batches, semesters, and enrolled learners (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NewProgramServiceImpl.java:149-178`)
- vNext now: New archive guards linked program terms/cohorts/enrollments (`src/modules/academics/college-program-mutation-service.ts:224-250`)
- Fix: Verify deleted versus archived descendants, learners and race-safe archive guards

## G2-20-029-073  [P1] GAP  facet F22  effort M
- Legacy: Legacy delete removes row physically if dependency checks clear (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NewProgramServiceImpl.java:149-179`)
- vNext now: New DELETE updates program status to ARCHIVED (`src/modules/academics/college-program-mutation-service.ts:224-255`)
- Fix: Record archive instead of deletion and handle duplicate-name reuse intentionally

## G2-13-018-019  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NewProgramServiceImpl.java:69-71` 409 exact 'Program name already exists in this department'
- vNext now: `src/modules/academics/college-program-mutation-service.ts:118-123` PROGRAM_NAME_CONFLICT, `src/app/api/academics/programs/route.ts:38-41` returns machine code 409
- Fix: Translate code into exact legacy duplicate-name explanation in form toast/error

## G2-13-018-020  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NewProgramServiceImpl.java:121-138` conflict with batch beyond length or semester above max, specific explanatory messages
- vNext now: `src/modules/academics/college-program-mutation-service.ts:190-200` PROGRAM_DURATION_HAS_DEPENDENCIES, generic typed code
- Fix: Show blocked dependency (term/batch) and target maximum with actionable row-specific message

## G2-13-018-021  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NewProgramServiceImpl.java:153-176` four delete errors semesters/structure, batches, learners
- vNext now: `src/modules/academics/college-program-mutation-service.ts:30-40` has PROGRAM_HAS_COHORTS/ENROLLMENTS/SEMESTERS codes
- Fix: Map legacy dependency classes to vNext cohort/enrollment/term and human-friendly messages

## G2-20-029-036  [P2] GAP  facet F07  effort S
- Legacy: Server duplicate same-department name conflict 'Program name already exists in this department' (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NewProgramServiceImpl.java:63-71`)
- vNext now: Returns symbolic PROGRAM_NAME_CONFLICT with 409 (`src/modules/academics/college-program-mutation-service.ts:93-110`, `src/app/api/academics/programs/route.ts:38-41`)
- Fix: Translate symbolic code to legacy human-readable field-level error

## G2-13-018-023  [P3] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NewProgramController.java:207` delete returns 'Program deleted successfully'
- vNext now: `src/modules/academics/college-program-mutation-service.ts:169-327` archives/restores programs, `src/components/admin/admin-program-directory.tsx:128` created-toast 'Created program ...'
- Fix: Distinguish archive from hard delete in toast and action names
