# Work packet (wave 2): edit src/modules/academics/semester-mutation-model.ts

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l13-u026-program-structure-controller.md, docs/audit/gap2/lane-12/new-program-structure.md, docs/audit/gap2/lane-5/l12-u016-semester-entity.md, docs/audit/gap2/lane-5/l18-u029-semester-management.md, docs/audit/gap2/lane-5/u025-semester-controller.md

## G2-13-026-014  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramStructureController.java:90-97 — DELETE /delete/:id no JSON body.
- vNext now: src/app/api/academics/semesters/[semesterId]/route.ts:38-50 and src/modules/academics/semester-mutation-model.ts:21-23 — DELETE requires body confirm:true.
- Fix: Document changed confirm contract and all clients.

## G2-12-018-017  [P2] GAP  facet F06  effort S
- Legacy: Old update nullable fields patch; programId intentionally immutable `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ProgramStructureServiceImpl.java:44-58`
- vNext now: New update requires name,totalCredits,isActive,CAS token and confirm `src/modules/academics/semester-mutation-model.ts:13-19`
- Fix: Support original partial update fields and protected program identity.

## G2-12-016-010  [P2] GAP  facet F04  effort M
- Legacy: Legacy JSON serialized snake_case via JsonNaming. `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Semester.java:23-39`
- vNext now: vNext Zod camelCase strict schemas. `src/modules/academics/semester-mutation-model.ts:6-19`
- Fix: Map JSON casing to new boundary.

## G2-12-016-013  [P2] GAP  facet F06  effort M
- Legacy: Legacy create programId>=1 semesterNumber>=1, name required <=255, totalCredits>=0, optional active. `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/SemesterDTO.java:13-21`
- vNext now: vNext create UUID programId, termNumber 1..12, name max255, nullable credits; no isActive on create. `src/modules/academics/semester-mutation-model.ts:3-11`
- Fix: Preserve optional initial active and map numeric constraints.

## G2-12-016-014  [P2] GAP  facet F06  effort M
- Legacy: Legacy update partial name/isActive/credits; unspecified fields retained. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/SemesterServiceImpl.java:76-85`
- vNext now: vNext update requires all three plus expectedUpdatedAt/confirm. `src/modules/academics/semester-mutation-model.ts:13-19`
- Fix: Support partial editor or hydration of unchanged fields with CAS.

## G2-18-029-033  [P2] GAP  facet F10  effort M
- Legacy: Legacy createSemester snake_case payload, isActive true. `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:160-209`
- vNext now: vNext create POST programId/termNumber/name/totalCredits. `src/modules/academics/semester-mutation-service.ts:106-135`, `src/modules/academics/semester-mutation-model.ts:6-11`
- Fix: Map API request fields and source data.

## G2-5-025-011  [P2] GAP  facet F04  effort M
- Legacy: Legacy semester snake_case DTO program_id, semester_number, name,is_active,total_credits. `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/SemesterDTO.java:10-22`
- vNext now: vNext camelCase programId, termNumber, name, totalCredits and guarded updates. `src/modules/academics/semester-mutation-model.ts:6-19`
- Fix: Define request/response field mapping and check every default.

## G2-5-025-017  [P2] GAP  facet F06  effort M
- Legacy: Legacy create requires program,number,name and allows optional active/totalCredits; active defaults true. `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/SemesterDTO.java:13-21`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/SemesterServiceImpl.java:48-67`
- vNext now: vNext create requires same core fields but no isActive and sends totalCredits null. `src/modules/academics/semester-mutation-model.ts:6-11`, `src/components/academics/college-semester-management.tsx:40-55`
- Fix: Allow active and optional total credits where parity needed.

## G2-5-025-018  [P2] GAP  facet F06  effort M
- Legacy: Legacy update only provided name,isActive,totalCredits; blocks programId and number changes. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/SemesterServiceImpl.java:72-86`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:160-195`
- vNext now: vNext PATCH requires name,totalCredits,isActive,expectedUpdatedAt,confirm true; program/number not editable. `src/modules/academics/semester-mutation-model.ts:13-19`, `src/modules/academics/semester-mutation-service.ts:138-170`
- Fix: Preserve partial editing while ensuring CAS token and explicit confirmation.

## G2-5-025-064  [P2] GAP  facet F22  effort M
- Legacy: Legacy separate SemesterDTO and SemesterCourseDTO accept optional totalCredits and mapping attrs. `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/SemesterDTO.java:10-22`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/SemesterCourseDTO.java:12-26`
- vNext now: vNext Zod strict schemas, required confirm+timestamp on update. `src/modules/academics/semester-mutation-model.ts:6-23`, `src/modules/academics/college-term-mapping-model.ts:3-25`
- Fix: Translate serialized DTOs and carry CAS tokens through forms.
