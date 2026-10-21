# Work packet (wave 2): edit src/modules/academics/college-program-mutation-service.ts

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/new-program.md, docs/audit/gap2/lane-20/superadmin-sections-programs.md, docs/audit/gap2/lane-3/l14-u026-program-controller.md

## G2-13-018-032  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NewProgramServiceImpl.java:55-72` unique name across department, including isDeleted records in `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/NewProgramRepository.java:49-50`
- vNext now: `src/modules/academics/college-program-mutation-service.ts:108-125` unique ACTIVE name/code only; archived duplicate reusable
- Fix: Document archived-name reuse vs legacy soft deleted uniqueness and potential restore conflict

## G2-13-018-044  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NewProgramServiceImpl.java:69-71` exact conflict message 'Program name already exists in this department'
- vNext now: `src/modules/academics/college-program-mutation-service.ts:119-123` PROGRAM_NAME_CONFLICT; `src/components/admin/admin-program-directory.tsx:131-134` generic create error toast
- Fix: Translate duplicate conflict to clear legacy sentence rather than opaque code

## G2-13-018-052  [P2] GAP  facet F21  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/NewProgram.java:11` new_program table and DeptId numeric FK only logical in entity
- vNext now: `src/db/schema/academics.ts:29-76` programs with department UUID FK and uniqueness/check; `src/modules/academics/college-program-mutation-service.ts:156` activity event
- Fix: Schema migration needs old numeric-to-UUID map and explicit foreign-key integrity plan

## G2-20-029-049  [P2] GAP  facet F12  effort M
- Legacy: Legacy duplicate program exact name in same department rejected; case behavior repository-level (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NewProgramServiceImpl.java:63-71`)
- vNext now: New name collision explicitly lowercased among ACTIVE programs, code unique too (`src/modules/academics/college-program-mutation-service.ts:93-114`)
- Fix: Verify casefold behavior against live legacy and document deliberate code-unique rule

## G2-20-029-069  [P2] GAP  facet F20  effort S
- Legacy: Legacy edits trim name before submission, but can change department within same college (`docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:141-150`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NewProgramController.java:164-172`)
- vNext now: vNext trims via schema and prevents changing department after linked records (`src/modules/academics/college-program-mutation-service.ts:169-177`, `src/modules/academics/college-program-mutation-model.ts:3-13`)
- Fix: Clarify deliberate stronger move restriction, show reason inline

## G2-14-026-016  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramController.java:50-53`
- vNext now: `src/modules/academics/college-program-mutation-service.ts:148-155`
- Fix: Legacy @Valid ProgramDTO uses name and deptId; vNext name trim1-255, code constrained and active department lock.

## G2-14-026-024  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramController.java:43-62`
- vNext now: `src/modules/academics/college-program-mutation-service.ts:148-164`
- Fix: Legacy create path has no separate archive/restore modal; vNext adds mutation routes requiring frontend confirmation.

## G2-14-026-038  [P2] GAP  facet F15  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramController.java:47-61`
- vNext now: `src/modules/academics/college-program-mutation-service.ts:157-164`
- Fix: Legacy create service writes program only; vNext creates activity audit event, verify notice integration and recipient privacy.

## G2-14-026-051  [P2] GAP  facet F21  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramController.java:32-41`
- vNext now: `src/modules/academics/college-program-mutation-service.ts:50-69`
- Fix: Legacy NewProgramService and SecurityContextUtil vs vNext Drizzle transaction & resolveActingCollege, deployment auth changes.
