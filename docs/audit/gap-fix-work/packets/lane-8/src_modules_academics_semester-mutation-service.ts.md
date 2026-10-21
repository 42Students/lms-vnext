# Work packet: edit src/modules/academics/semester-mutation-service.ts

18 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l13-u026-program-structure-controller.md, docs/audit/gap2/lane-12/new-program-structure.md, docs/audit/gap2/lane-5/l12-u016-semester-entity.md, docs/audit/gap2/lane-5/u025-semester-controller.md, docs/audit/gap2/lane-9/college-admin-semesters.md

## G2-13-026-023  [P1] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramStructureController.java:66-74 — create POST writes new_program_structure.
- vNext now: src/modules/academics/semester-mutation-service.ts:106-135 — inserts into program_terms and activity event.
- Fix: Migrate create semantics and preserve legacy fields.

## G2-13-026-024  [P1] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramStructureController.java:76-88 and docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ProgramStructureServiceImpl.java:45-59 — update PUT partial fields, does not update programId.
- vNext now: src/modules/academics/semester-mutation-service.ts:138-190 — PATCH full name/credits/active with CAS, no dates/courseIds.
- Fix: Preserve partial-update semantics and course/date fields if still required.

## G2-13-026-026  [P1] GAP  facet F10  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramStructureController.java:123-139 and docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ProgramStructureServiceImpl.java:77-104 — status ACTIVE deactivates non-completed sibling terms.
- vNext now: src/modules/academics/semester-mutation-service.ts:152-170 — per-term isActive toggle, no sibling deactivation.
- Fix: Implement active semester sibling exclusivity if still required.

## G2-13-026-030  [P1] GAP  facet F12  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ProgramStructureServiceImpl.java:77-104 — ACTIVE sets non-COMPLETED siblings INACTIVE atomically.
- vNext now: src/modules/academics/semester-mutation-service.ts:152-170 — bool isActive no sibling cascade.
- Fix: Reproduce switch semantics and protect completed terms.

## G2-12-018-006  [P1] GAP  facet F03  effort L
- Legacy: Activate one status automatically inactivates non-completed siblings `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ProgramStructureServiceImpl.java:76-104`
- vNext now: New toggle changes only selected programTerm.isActive `src/modules/academics/semester-mutation-service.ts:152-170`
- Fix: Implement atomic sibling exclusivity when activating legacy program structure.

## G2-12-018-027  [P1] GAP  facet F10  effort L
- Legacy: POST/create PUT/update DELETE/delete and GET/fetchAllSemesters+fetchActiveSemesters; PUT/updateStatus `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramStructureController.java:66-146`
- vNext now: New term mutation service create/update/delete and separate mapping functions `src/modules/academics/semester-mutation-service.ts:106-232` `src/modules/academics/college-term-mapping-service.ts:60-95`
- Fix: Expose full structure management actions and route compatibility.

## G2-12-018-032  [P1] GAP  facet F11  effort M
- Legacy: Legacy updateStatus checks target belongs program before touching siblings `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ProgramStructureServiceImpl.java:76-103`
- vNext now: New validates single term scope but no sibling status mutation `src/modules/academics/semester-mutation-service.ts:62-81,152-170`
- Fix: Perform target check and sibling transition atomically.

## G2-12-018-035  [P1] GAP  facet F12  effort L
- Legacy: Legacy statuses mutate only ACTIVE target and other noncompleted siblings `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ProgramStructureServiceImpl.java:90-103`
- vNext now: New deactivation fails if mapped courses or current cohorts `src/modules/academics/semester-mutation-service.ts:152-164`
- Fix: Reconcile sibling inactivation with new dependency blockers.

## G2-12-018-047  [P1] GAP  facet F20  effort L
- Legacy: Legacy updateStatus transaction ensures sibling status updates atomic `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ProgramStructureServiceImpl.java:76-104`
- vNext now: New update only one term with CAS, no sibling exclusivity `src/modules/academics/semester-mutation-service.ts:138-191`
- Fix: Add atomically serialized sibling update preserving completed terms.

## G2-13-026-019  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ProgramStructureServiceImpl.java:79-89 — exact messages A valid program, structure and status are required / Program structure does not belong...
- vNext now: src/modules/academics/semester-mutation-model.ts:13-19 and src/modules/academics/semester-mutation-service.ts:20-24 — strict Zod and SEMESTER_... enum errors.
- Fix: Preserve actionable identity/scope validation messages.

## G2-12-018-020  [P2] GAP  facet F07  effort S
- Legacy: Legacy updateStatus missing/foreign id errors exact 'Program structure does not belong to the specified program' `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ProgramStructureServiceImpl.java:78-89`
- vNext now: New scoped lockedTerm returns SEMESTER_NOT_FOUND generic code `src/modules/academics/semester-mutation-service.ts:62-81`
- Fix: Preserve distinction between nonexistent and cross-program update without leaking other tenant data.

## G2-12-018-022  [P2] GAP  facet F08  effort S
- Legacy: Legacy create/update success Response status OK reason phrase OK, structure object `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramStructureController.java:66-84`
- vNext now: New semester route returns {semester} and named errors; different wire envelope `src/modules/academics/semester-mutation-service.ts:106-136,138-191`
- Fix: Document API response crosswalk for existing clients.

## G2-12-018-023  [P2] GAP  facet F08  effort S
- Legacy: Legacy delete response 'Deleted successfully' `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramStructureController.java:90-98`
- vNext now: New semester delete returns result id, no success text from service `src/modules/academics/semester-mutation-service.ts:193-228`
- Fix: Maintain exact confirmation text for program structure delete.

## G2-12-016-016  [P2] GAP  facet F07  effort M
- Legacy: Legacy duplicate `Semester N already exists for this program`, empty name `Semester name is required`. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/SemesterServiceImpl.java:49-61`
- vNext now: vNext coded SEMESTER_NUMBER_CONFLICT and same required-name text. `src/modules/academics/semester-mutation-service.ts:83-103`, `src/modules/academics/semester-mutation-model.ts:3-9`
- Fix: Translate conflict code into exact user string.

## G2-12-016-017  [P2] GAP  facet F07  effort M
- Legacy: Legacy delete mapped-semester 409 `Cannot delete semester: it has semester-course mappings...`. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/SemesterServiceImpl.java:93-99`
- vNext now: vNext SEMESTER_HAS_COURSES plus active cohort conflict. `src/modules/academics/semester-mutation-service.ts:201-212`
- Fix: Expose accurate distinct refusal text.

## G2-5-025-023  [P2] GAP  facet F07  effort M
- Legacy: Legacy duplicate program/number returns 409 conflict or 400 safe constraint copy `A semester with this number already exists for this program`. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/SemesterServiceImpl.java:49-53`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:133-155`
- vNext now: vNext SEMESTER_NUMBER_CONFLICT 409, different error mapping. `src/modules/academics/semester-mutation-service.ts:83-103`, `src/app/api/academics/semesters/route.ts:18-24`
- Fix: Render exact descriptive conflict message, not code.

## G2-9-019-035  [P2] GAP  facet F07  effort S
- Legacy: Duplicate semester server returns A semester with this number already exists for this program `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:96-125`
- vNext now: SEMESTER_NUMBER_CONFLICT as API code `src/modules/academics/semester-mutation-service.ts:22-28,83-91` `src/app/api/academics/semesters/route.ts:16-23`
- Fix: Translate code to old conflict copy.

## G2-12-016-018  [P3] GAP  facet F08  effort S
- Legacy: Legacy creation returns status OK/message Semester created successfully. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:128-132`
- vNext now: vNext event summary Semester created and API separate resource response. `src/modules/academics/semester-mutation-service.ts:121-131`
- Fix: Map response success message.
