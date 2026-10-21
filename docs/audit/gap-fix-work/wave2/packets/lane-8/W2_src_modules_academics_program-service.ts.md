# Work packet (wave 2): edit src/modules/academics/program-service.ts

25 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-programs.md, docs/audit/gap2/lane-13/new-program.md, docs/audit/gap2/lane-2/l18-u026-new-program-controller.md, docs/audit/gap2/lane-3/l14-u026-program-controller.md

## G2-10-020-053  [P2] GAP  facet F10  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:70-81; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NewProgramController.java:126-130 — GET /api/v1/new-program/fetchByCollege?collegeId.
- vNext now: src/app/(authenticated)/admin/programs/page.tsx:37-45; src/modules/academics/program-service.ts:138-205 — Server DB listPrograms filtered active/department.
- Fix: Map active-v-archived, totals and ordering.

## G2-10-020-094  [P2] GAP  facet F19  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:310-319 — Client Table slices 25 rows after loading full data.
- vNext now: src/modules/academics/program-service.ts:169-205; src/modules/admin-ui/program-directory.ts:38-51 — Server selects all programs, client page slices default10.
- Fix: At large scale use paginated server search; preserve visual size25.

## G2-10-020-103  [P2] GAP  facet F22  effort undefined
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NewProgramController.java:59-83 — Program DTO name, dept_id, duration_years; `NewProgram` integer ID.
- vNext now: src/modules/academics/college-program-mutation-model.ts:8-13; src/modules/academics/program-service.ts:208-240 — UUID departmentId/programId, name, code, durationTerms.
- Fix: Map identifiers and duration years→terms.

## G2-13-018-026  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NewProgramController.java:134-142` /fetch/{id} + `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NewProgramController.java:213-222` /fetchProgramDetails
- vNext now: `src/modules/academics/program-service.ts:138-205` listPrograms by college, no details tree in this service
- Fix: Map full structure-and-courses details endpoint to new program/workspace read service

## G2-13-018-028  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/NewProgramRepository.java:23-31` paged native query with explicit countQuery
- vNext now: `src/modules/academics/program-service.ts:182-205` loads all programs in one DB query, `src/components/admin/admin-program-directory.tsx:99-100` client paginates
- Fix: Add server-side pagination if many programs; preserve caller total counts

## G2-13-018-035  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/NewProgramRepository.java:43-44` scope resolver filters soft deleted; `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/NewProgramRepository.java:15-21` listing does not filter deleted
- vNext now: `src/modules/academics/program-service.ts:170-174` only programs ACTIVE and departments not archived
- Fix: Define archived/soft-deleted inclusion separately for admin lists and scope checks

## G2-13-018-037  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NewProgramServiceImpl.java:196-204` department missing is silently ignored when composing response
- vNext now: `src/modules/academics/program-service.ts:195-199` innerJoin department excludes row, not null deptName
- Fix: Identify orphan historical programs during migration instead of silently dropping them from list

## G2-13-018-047  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NewProgramController.java:227-245` optional paged lookup default20, capped100
- vNext now: `src/modules/academics/program-service.ts:182-205` unpaged but department/name SQL indexed via `src/db/schema/academics.ts:56-70`; `src/components/admin/admin-program-directory.tsx:99` paginates client
- Fix: Use paginated API for institution-scale program listings; don't materialize all org records

## G2-13-018-056  [P2] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NewProgramController.java:213-221` details with nested semester structures and course labels
- vNext now: `src/modules/academics/program-service.ts:183-205` flat row with code/duration/status and department
- Fix: Map old detail DTO to programTerms, course memberships and embedded content for details screen

## G2-18-026-049  [P2] GAP  facet F19  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/NewProgramRepository.java:27-31 paged DB count query
- vNext now: src/modules/academics/program-service.ts:169-205 SELECT all active programs
- Fix: Return true totalElements and totalPages for server directory

## G2-18-026-053  [P2] GAP  facet F21  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NewProgramController.java:52-57 auditLogService optional; PROGRAM_CREATE/UPDATE/DELETE events
- vNext now: src/modules/academics/program-service.ts:242-269 one transactional create Activity Event only
- Fix: Emit update/archive activity events, group/dedupe keys, and compliant audit metadata

## G2-14-026-004  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramController.java:67-74`
- vNext now: `src/modules/academics/program-service.ts:138-201`
- Fix: Legacy separate fetchAllPrograms GET deptId, vNext GET requires collegeId and optional departmentId, projection differs.

## G2-14-026-005  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramController.java:94-102`
- vNext now: `src/modules/academics/program-service.ts:138-201`
- Fix: Legacy separate college-wide endpoint returns all departments' programs, vNext list returns active programs under college with optional department.

## G2-14-026-011  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramController.java:56-60`
- vNext now: `src/modules/academics/program-service.ts:38-62`
- Fix: Legacy directly maps years into NewProgramDTO; vNext terms normalization uses years*2 conversion, absent on create mutator requiring durationTerms.

## G2-14-026-012  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramController.java:97-99`
- vNext now: `src/modules/academics/program-service.ts:169-201`
- Fix: Legacy empty list by college responds 404, vNext returns {programs:[]} with 200.

## G2-14-026-013  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramController.java:67-74`
- vNext now: `src/modules/academics/program-service.ts:169-201`
- Fix: Legacy lists by department with newProgramService.findByDeptId order, vNext sorts active rows and joins departments.

## G2-14-026-026  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramController.java:67-74`
- vNext now: `src/modules/academics/program-service.ts:138-201`
- Fix: Legacy `fetchAllPrograms` input only deptId; vNext list validates collegeId and departmentId with scoped reads.

## G2-14-026-029  [P2] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramController.java:71-71`
- vNext now: `src/modules/academics/program-service.ts:146-166`
- Fix: Legacy requireAccessDepartment principal; vNext academics.read scope by college then validates department college match.

## G2-14-026-030  [P2] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramController.java:83-84`
- vNext now: `src/modules/academics/program-service.ts:155-164`
- Fix: Legacy requireAccessProgram by numeric id, vNext active scoped selected college and UUID.

## G2-14-026-031  [P2] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramController.java:95-96`
- vNext now: `src/modules/academics/program-service.ts:146-153`
- Fix: Legacy requireAccessCollege for college-wide list, vNext academia read permission checks organization+college.

## G2-14-026-034  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramController.java:94-102`
- vNext now: `src/modules/academics/program-service.ts:169-201`
- Fix: Legacy no-data 404, vNext normal empty collection; caller empty state must not treat as request failure.

## G2-14-026-046  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramController.java:67-73`
- vNext now: `src/modules/academics/program-service.ts:169-201`
- Fix: Legacy findByDeptId query avoids extra college permission joins, vNext joins departments with ACTIVE filter and scoped SQL.

## G2-14-026-049  [P2] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramController.java:69-73`
- vNext now: `src/modules/academics/program-service.ts:138-201`
- Fix: Legacy may allow fetching programs for stale department with matching numeric id, vNext fails if college/department mismatched, stronger scope.

## G2-14-026-053  [P2] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramController.java:57-60`
- vNext now: `src/modules/academics/program-service.ts:38-62`
- Fix: Legacy durationYears stored directly, vNext durationTerms=years*2, handle fractional years/rounding.

## G2-13-018-012  [P3] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/NewProgramRepository.java:15-21` list by department/college no explicit ORDER BY
- vNext now: `src/modules/academics/program-service.ts:200-203` sorts departments.name ASC then programs.name ASC
- Fix: Explicitly document vNext alphabetical order and test expected legacy list order in UI
