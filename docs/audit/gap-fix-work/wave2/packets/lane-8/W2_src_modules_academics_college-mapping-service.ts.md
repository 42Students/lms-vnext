# Work packet (wave 2): edit src/modules/academics/college-mapping-service.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/college-admin-faculty-assignment.md, docs/audit/gap2/lane-4/l14-u027-faculty-course-association-controller.md, docs/audit/gap2/lane-8/l14-u031-academic-structure-cross-cutting.md

## G2-4-005-010  [P2] GAP  facet F04  effort M
- Legacy: Unnamed entity falls back Faculty name unavailable (ID N). (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:26;docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:353-357`)
- vNext now: Fallback Unnamed faculty. (`src/modules/academics/college-mapping-service.ts:214-219`)
- Fix: Restore exact legacy value and interaction unless explicitly approved.

## G2-4-005-059  [P2] GAP  facet F22  effort M
- Legacy: Legacy facultyId/courseId/classId/batchId/semester/year/role/active. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:206-216;docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:279-283`)
- vNext now: vNext membership/delivery and inferred period. (`src/modules/academics/college-mapping-service.ts:175-220`)
- Fix: Restore exact legacy value and interaction unless explicitly approved.

## G2-14-027-005  [P2] GAP  facet F03  effort M
- Legacy: Legacy faculty info DTO mappingId, faculty id, deptId, firstName `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/response/FacultyInfoDTO.java:7-10`
- vNext now: New service returns membershipId and roster faculty display name `src/modules/academics/college-mapping-service.ts:137-152`
- Fix: Expose resolved faculty identity, department and mapping ID under privacy-safe scope.

## G2-14-027-050  [P2] GAP  facet F23  effort M
- Legacy: Legacy fetchActiveFacultiesInfoByCourse outputs firstName and deptId `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/FacultyCourseAssociationServiceImpl.java:121-143`
- vNext now: New college roster provides full displayName, membership and role `src/modules/academics/college-mapping-service.ts:137-152`
- Fix: Map legacy firstName/department where legacy clients still depend on them.

## G2-14-031-005  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:104-210 semester create/update and association flow
- vNext now: src/modules/academics/college-mapping-service.ts:53-127 read mapping, separate program term edit
- Fix: Expose course associations in semester editor flow

## G2-14-031-015  [P2] GAP  facet F05  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:283-470 semester-course mapping sorted by ordinal
- vNext now: src/modules/academics/college-mapping-service.ts:104-106 sort program/period/course ascending
- Fix: Sort in legacy semester sequence within program
