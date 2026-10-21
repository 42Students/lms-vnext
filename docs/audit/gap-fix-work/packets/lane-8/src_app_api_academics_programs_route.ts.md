# Work packet: edit src/app/api/academics/programs/route.ts

12 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/program-search-controller.md, docs/audit/gap2/lane-13/new-program.md, docs/audit/gap2/lane-20/superadmin-sections-programs.md, docs/audit/gap2/lane-3/l14-u026-program-controller.md

## G2-8-013-014  [P1] GAP  facet F06  effort M
- Legacy: POST /{programId}/select records click without body (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/programs/ProgramSearchController.java:191-205`)
- vNext now: New POST creates a program, not usage selection (`src/app/api/academics/programs/route.ts:28-46`)
- Fix: Make selection POST a distinct read-side usage event, never create a Program.

## G2-8-013-038  [P1] GAP  facet F20  effort M
- Legacy: Legacy scoped results filter by college or organization when relevant (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/programs/ProgramSearchController.java:51-59`)
- vNext now: New API requires exact college UUID (`src/app/api/academics/programs/route.ts:143-153`)
- Fix: Separate legacy selection count action from program creation.

## G2-13-018-019  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NewProgramServiceImpl.java:69-71` 409 exact 'Program name already exists in this department'
- vNext now: `src/modules/academics/college-program-mutation-service.ts:118-123` PROGRAM_NAME_CONFLICT, `src/app/api/academics/programs/route.ts:38-41` returns machine code 409
- Fix: Translate code into exact legacy duplicate-name explanation in form toast/error

## G2-20-029-036  [P2] GAP  facet F07  effort S
- Legacy: Server duplicate same-department name conflict 'Program name already exists in this department' (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NewProgramServiceImpl.java:63-71`)
- vNext now: Returns symbolic PROGRAM_NAME_CONFLICT with 409 (`src/modules/academics/college-program-mutation-service.ts:93-110`, `src/app/api/academics/programs/route.ts:38-41`)
- Fix: Translate symbolic code to legacy human-readable field-level error

## G2-14-026-018  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramController.java:83-87`
- vNext now: `src/app/api/academics/programs/route.ts:23-26`
- Fix: Legacy Program not found 404 with Response envelope; vNext error response standard `{error:PROGRAM_NOT_FOUND}` from service.

## G2-14-026-019  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramController.java:95-101`
- vNext now: `src/app/api/academics/programs/route.ts:13-25`
- Fix: Legacy no college programs 404; vNext list empty success not error.

## G2-14-026-020  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramController.java:47-62`
- vNext now: `src/app/api/academics/programs/route.ts:38-43`
- Fix: Legacy service validation errors via Spring response format; vNext 404 DEPARTMENT_NOT_FOUND or 409 conflicts and JSON code.

## G2-8-013-015  [P2] GAP  facet F07  effort M
- Legacy: Missing deptId for ordinary user returns 403 message deptId is required... (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/programs/ProgramSearchController.java:95-101`)
- vNext now: New GET without collegeId fails collegeIdSchema.parse (`src/app/api/academics/programs/route.ts:143-153`)
- Fix: Explain required scope/department to non-global staff.

## G2-8-013-017  [P2] GAP  facet F07  effort M
- Legacy: Malformed noninteger limit parsed by Spring int -> 400 (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/programs/ProgramSearchController.java:61-70`)
- vNext now: No pagination limit accepted, no corresponding validation (`src/app/api/academics/programs/route.ts:13-25`)
- Fix: Return explicit invalid-limit errors on old endpoint aliases.

## G2-8-013-018  [P2] GAP  facet F08  effort M
- Legacy: JSON Response status success and message `Programs retrieved in Nms` (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/programs/ProgramSearchController.java:103-109`)
- vNext now: JSON object `{programs}` without status/message fields (`src/app/api/academics/programs/route.ts:13-25`)
- Fix: Preserve old response envelope only for external API consumers.

## G2-13-018-022  [P3] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NewProgramController.java:83` returns HTTP200 reason phrase OK and entity
- vNext now: `src/app/api/academics/programs/route.ts:35-36` returns 201 {program}
- Fix: Update API consumers for changed status/envelope; avoid new UI showing raw response

## G2-14-026-021  [P3] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramController.java:61-61`
- vNext now: `src/app/api/academics/programs/route.ts:35-36`
- Fix: Legacy 200 OK ReasonPhrase on create, vNext 201 Created and program payload.
