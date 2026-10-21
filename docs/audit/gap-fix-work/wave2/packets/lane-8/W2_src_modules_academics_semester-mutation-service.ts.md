# Work packet (wave 2): edit src/modules/academics/semester-mutation-service.ts

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/new-program-structure.md, docs/audit/gap2/lane-5/l12-u016-semester-entity.md, docs/audit/gap2/lane-5/l18-u029-semester-management.md, docs/audit/gap2/lane-5/u025-semester-controller.md

## G2-12-018-016  [P2] GAP  facet F06  effort S
- Legacy: Create defaults empty list courseIds and StatusType.ACTIVE `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ProgramStructureServiceImpl.java:23-33`
- vNext now: New create term row active true but requires separate course map insert `src/db/schema/academic-terms.ts:13,25-39` `src/modules/academics/semester-mutation-service.ts:115-120`
- Fix: Persist atomic empty curriculum group; keep ACTIVE default.

## G2-12-018-029  [P2] GAP  facet F10  effort M
- Legacy: Legacy delete hard deletes row by id, no dependent course mapping rows separate `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ProgramStructureServiceImpl.java:61-64`
- vNext now: New delete restricted when any programTermCourses or active cohorts, FK restrict `src/modules/academics/semester-mutation-service.ts:193-216`
- Fix: Explain changed deletion blockers; avoid silent orphan courseIds.

## G2-12-018-038  [P2] GAP  facet F13  effort S
- Legacy: Legacy invalid foreign status emits 400 with message `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ProgramStructureServiceImpl.java:78-89` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramStructureController.java:133-138`
- vNext now: New generic SEMESTER_NOT_FOUND and CAS error `src/modules/academics/semester-mutation-service.ts:20-30,62-81`
- Fix: Return actionable selected-program guidance.

## G2-12-016-001  [P2] GAP  facet F01  effort M
- Legacy: Legacy Semester entity is owned by Program, routes under `/api/v1/semester`. `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Semester.java:12-20`
- vNext now: vNext ProgramTerm table owned by Program and mutation service under new API. `src/db/schema/academic-terms.ts:7-23`, `src/modules/academics/semester-mutation-service.ts:106-136`
- Fix: Maintain old ID/route-to-new UUID mapping.

## G2-12-016-026  [P2] GAP  facet F11  effort M
- Legacy: Legacy scoped superadmin checked selected org/college. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:178-187`
- vNext now: vNext acting-college path with program college scope. `src/modules/academics/semester-mutation-service.ts:33-80`
- Fix: Test org-scoped admin parity.

## G2-12-016-034  [P2] GAP  facet F15  effort M
- Legacy: Legacy audit event SEMESTER_CREATE etc. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:61-66,125-127`
- vNext now: vNext ACADEMICS_SEMESTER_CREATED/UPDATED events. `src/modules/academics/semester-mutation-service.ts:121-130,173-185`
- Fix: Map audit event code and legacy entity id.

## G2-18-029-033  [P2] GAP  facet F10  effort M
- Legacy: Legacy createSemester snake_case payload, isActive true. `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:160-209`
- vNext now: vNext create POST programId/termNumber/name/totalCredits. `src/modules/academics/semester-mutation-service.ts:106-135`, `src/modules/academics/semester-mutation-model.ts:6-11`
- Fix: Map API request fields and source data.

## G2-18-029-058  [P2] GAP  facet F21  effort M
- Legacy: Legacy AdminService and SemesterService REST. `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:5-8`
- vNext now: vNext scoped Drizzle service plus Zod boundaries. `src/modules/academics/semester-mutation-service.ts:106-227`
- Fix: Map API route and errors.

## G2-5-025-018  [P2] GAP  facet F06  effort M
- Legacy: Legacy update only provided name,isActive,totalCredits; blocks programId and number changes. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/SemesterServiceImpl.java:72-86`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:160-195`
- vNext now: vNext PATCH requires name,totalCredits,isActive,expectedUpdatedAt,confirm true; program/number not editable. `src/modules/academics/semester-mutation-model.ts:13-19`, `src/modules/academics/semester-mutation-service.ts:138-170`
- Fix: Preserve partial editing while ensuring CAS token and explicit confirmation.

## G2-5-025-050  [P2] GAP  facet F15  effort M
- Legacy: Legacy logs SEMESTER_CREATE/UPDATE/DELETE using AdminAuditLogService. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:61-66,125-127,189-190,235-236`
- vNext now: vNext writes scoped ACADEMICS_SEMESTER_* activity event. `src/modules/academics/semester-mutation-service.ts:121-130,173-185`
- Fix: Map event taxonomy, actor scope and payload between audit views.
