# Work packet: edit src/modules/academics/semester-mutation-model.ts

12 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l13-u026-program-structure-controller.md, docs/audit/gap2/lane-12/new-program-structure.md, docs/audit/gap2/lane-5/l18-u029-semester-management.md, docs/audit/gap2/lane-5/l12-u016-semester-entity.md, docs/audit/gap2/lane-9/college-admin-semesters.md

## G2-13-026-012  [P1] GAP  facet F06  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/NewProgramStructureDTO.java:13-23 — POST/PUT request programId min1, name nonblank max255, optional start/end date strings max255, courseIds, status.
- vNext now: src/modules/academics/semester-mutation-model.ts:6-19 — create requires UUID programId, termNumber 1..12, name max255, totalCredits; update requires CAS+confirm+isActive.
- Fix: Build field-by-field compatibility and DTO migration.

## G2-12-018-005  [P1] MISSING  facet F03  effort M
- Legacy: Status ACTIVE/INACTIVE/COMPLETED using StatusType `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/NewProgramStructure.java:30-32` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ProgramStructureServiceImpl.java:90-103`
- vNext now: New Boolean isActive, no COMPLETED state `src/db/schema/academic-terms.ts:13` `src/modules/academics/semester-mutation-model.ts:13-19`
- Fix: Represent COMPLETED distinctly for historical/terminal curriculum statuses.

## G2-12-018-015  [P1] GAP  facet F06  effort M
- Legacy: Legacy create programId required positive, name required, date strings max255, courseIds any ints/status string `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/NewProgramStructureDTO.java:13-24`
- vNext now: New create requires termNumber 1..12,name,optional credits; no dates/courseIds/status `src/modules/academics/semester-mutation-model.ts:6-11`
- Fix: Add legacy structure create form or canonical adapter accepting all source fields.

## G2-18-029-034  [P1] GAP  facet F10  effort M
- Legacy: Legacy edit sends programId/number/name/totalCredits/isActive. `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:231-275`
- vNext now: vNext PATCH name,isActive,totalCredits=null, CAS and confirm. `src/components/academics/college-semester-management.tsx:134-156`, `src/modules/academics/semester-mutation-model.ts:13-19`
- Fix: Avoid silently clearing totalCredits, preserve unchanged value.

## G2-13-026-016  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/NewProgramStructureDTO.java:13-21 — mandatory programId and nonblank name, max255 validation.
- vNext now: src/modules/academics/semester-mutation-model.ts:3-11 — name same max255, required integer term number, programId UUID.
- Fix: Map error strings, especially absent term number.

## G2-13-026-019  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ProgramStructureServiceImpl.java:79-89 — exact messages A valid program, structure and status are required / Program structure does not belong...
- vNext now: src/modules/academics/semester-mutation-model.ts:13-19 and src/modules/academics/semester-mutation-service.ts:20-24 — strict Zod and SEMESTER_... enum errors.
- Fix: Preserve actionable identity/scope validation messages.

## G2-12-018-019  [P2] GAP  facet F07  effort S
- Legacy: Invalid status StatusType.valueOf throws IllegalArgumentException, update 400 with message `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ProgramStructureServiceImpl.java:51-58` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramStructureController.java:79-87`
- vNext now: New z.boolean active accepts only bool, cannot express completed status `src/modules/academics/semester-mutation-model.ts:13-19`
- Fix: Map enum validation errors with exact legacy status semantics.

## G2-12-018-021  [P2] GAP  facet F07  effort S
- Legacy: Legacy create required 'name' and programId, start/end only max length; no date parse `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/NewProgramStructureDTO.java:13-24`
- vNext now: New doesn't admit legacy dates, validates credits and 12-term cap `src/modules/academics/semester-mutation-model.ts:3-11`
- Fix: Add legacy validation messages for absent or malformed date strings.

## G2-12-016-016  [P2] GAP  facet F07  effort M
- Legacy: Legacy duplicate `Semester N already exists for this program`, empty name `Semester name is required`. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/SemesterServiceImpl.java:49-61`
- vNext now: vNext coded SEMESTER_NUMBER_CONFLICT and same required-name text. `src/modules/academics/semester-mutation-service.ts:83-103`, `src/modules/academics/semester-mutation-model.ts:3-9`
- Fix: Translate conflict code into exact user string.

## G2-9-019-030  [P2] GAP  facet F07  effort S
- Legacy: Create required validation Please select program `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:414-419`
- vNext now: Native required + Zod invalid UUID, not same copy `src/components/academics/college-semester-management.tsx:79-84` `src/modules/academics/semester-mutation-model.ts:5-11`
- Fix: Show exact inline Select program field error.

## G2-9-019-032  [P2] GAP  facet F07  effort S
- Legacy: Blank name Please enter semester name `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:441-449`
- vNext now: Zod Semester name is required `src/modules/academics/semester-mutation-model.ts:3-9`
- Fix: Map exact legacy label validation to inline error.

## G2-9-019-033  [P2] GAP  facet F07  effort S
- Legacy: Name max 255 Name must be 255 characters or less `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:441-449`
- vNext now: Zod max255 generic and HTML maxLength255 `src/modules/academics/semester-mutation-model.ts:3-9` `src/components/academics/college-semester-management.tsx:92-96`
- Fix: Use exact maximum-length wording.
