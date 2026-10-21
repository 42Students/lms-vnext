# Work packet: edit src/db/schema/academics.ts (part 3 of 3)

18 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u021-batch.md, docs/audit/gap2/lane-8/l14-u031-academic-structure-cross-cutting.md, docs/audit/gap2/lane-9/college-admin-programs.md, docs/audit/gap2/lane-9/superadmin-batch-promotion-component.md, docs/audit/gap2/lane-9/superadmin-batch-promotion.md, docs/audit/gap2/lane-9/superadmin-batches-component.md

## G2-5-021-002  [P1] GAP  facet F01  effort L
- Legacy: Legacy uses Batch numeric identity in class/semester APIs `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/BatchRepository.java:55-62`
- vNext now: VNext cohort UUID + progression state and academic period `src/db/schema/academics.ts:126-163`
- Fix: Define legacy batch/class ID mapping and API compatibility.

## G2-5-021-016  [P1] GAP  facet F05  effort M
- Legacy: Legacy duplicate name check case-insensitive within program `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/BatchRepository.java:17-22` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/BatchServiceImpl.java:113-119`
- vNext now: VNext UNIQUE programId/lower(code), no name index `src/db/schema/academics.ts:170-176`
- Fix: Enforce name uniqueness if legacy-dependent, or document code-based identity change.

## G2-5-021-019  [P1] GAP  facet F06  effort S
- Legacy: Legacy create status defaults ACTIVE `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/BatchServiceImpl.java:85-91`
- vNext now: VNext cohort default PLANNED `src/db/schema/academics.ts:147-149`
- Fix: Align selected default or explicitly explain planned activation.

## G2-5-021-049  [P1] GAP  facet F22  effort L
- Legacy: Legacy batch table numeric ID, name/program/date/count/status/semester/year `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Batch.java:10-48`
- vNext now: VNext cohorts UUID, code/program/start-period/status/date/year; progression separate `src/db/schema/academics.ts:126-163` `src/modules/academics/college-batch-promotion-execute.ts:139-151`
- Fix: Write migration field map + progression event backfill, including status enum.

## G2-5-021-050  [P1] GAP  facet F22  effort M
- Legacy: Legacy no DB uniqueness on program batchName, app-only name guard `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/BatchRepository.java:17-22`
- vNext now: New DB uniqueness on lower program code; name unrestricted `src/db/schema/academics.ts:170-176`
- Fix: Decide name vs code uniqueness and avoid duplicate names.

## G2-14-031-012  [P1] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:104-133 semesterNumber,name,isActive,totalCredits
- vNext now: src/db/schema/academics.ts:79-125 academicPeriods and programTerms separated
- Fix: Show number/name/active/totalCredits after mapping to term

## G2-14-031-019  [P1] GAP  facet F06  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/SemesterDTO.java:13-21 programId/semesterNumber/name required, isActive/credits optional
- vNext now: src/db/schema/academics.ts:79-125 period and term tables
- Fix: Expose legacy semester fields in term setup forms

## G2-14-031-054  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/BatchController.java:31-35 batch JPA program currentSemester academicYear
- vNext now: src/db/schema/academics.ts:126-183 cohorts + progression table src/db/schema/cohort-progression.ts
- Fix: Map semester ordinal/current year to progression model

## G2-14-031-055  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:31-55 SemesterCourse JPA association
- vNext now: src/db/schema/academics.ts:79-125 academic period and src/db/schema/courses.ts term offerings
- Fix: Specify ordinal→period→term course ID and unique constraints

## G2-9-018-070  [P1] GAP  facet F22  effort L
- Legacy: Legacy new_program int ID, text name, int deptId, int years `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/NewProgram.java:14-22`
- vNext now: UUID PK, dept UUID FK, text name, code varchar64, durationTerms int, status timestamps `src/db/schema/academics.ts:29-53`
- Fix: Document migration/map fields, years*2 conversion, status semantics and FK behavior.

## G2-9-018-071  [P1] GAP  facet F22  effort M
- Legacy: Legacy user-facing deletes physically, protected by structure/batch/semester/learner checks `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NewProgramServiceImpl.java:149-179`
- vNext now: Active/archived status + partial unique name/code indexes `src/db/schema/academics.ts:41-75`
- Fix: Validate restore/reuse collision and linked record archival rules explicitly.

## G2-9-028-064  [P1] GAP  facet F22  effort L
- Legacy: Legacy Batch stores semester, academicYear and COMPLETED status `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:124-138,177-183`
- vNext now: Cohort stores status; progression state stores term/year/version `src/db/schema/academics.ts:130-164` `src/modules/academics/college-batch-promotion-execute.ts:137-154`
- Fix: Map migrations and dual academicYear display/read behavior

## G2-9-022-064  [P1] GAP  facet F22  effort L
- Legacy: Legacy Batch stores semester, academicYear and COMPLETED status `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:124-138,177-183`
- vNext now: Cohort stores status; progression state stores term/year/version `src/db/schema/academics.ts:130-164` `src/modules/academics/college-batch-promotion-execute.ts:137-154`
- Fix: Map migrations and dual academicYear display/read behavior

## G2-9-029-066  [P1] GAP  facet F22  effort L
- Legacy: Legacy Batch stores batchName, programId, currentStudents, status ACTIVE, currentSemester1 `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/BatchServiceImpl.java:71-95`
- vNext now: New UUID cohort with programId/code/startPeriodId/status PLANNED; progression separate `src/db/schema/academics.ts:126-175` `src/modules/academics/college-cohort-mutation-model.ts:10-34`
- Fix: Map status/currentSemester/start period and migrate legacy status safely

## G2-9-023-066  [P1] GAP  facet F22  effort L
- Legacy: Legacy Batch stores batchName, programId, currentStudents, status ACTIVE, currentSemester1 `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/BatchServiceImpl.java:71-95`
- vNext now: New UUID cohort with programId/code/startPeriodId/status PLANNED; progression separate `src/db/schema/academics.ts:126-175` `src/modules/academics/college-cohort-mutation-model.ts:10-34`
- Fix: Map status/currentSemester/start period and migrate legacy status safely

## G2-2-031-033  [P2] GAP  facet F07  effort M
- Legacy: ClassServiceImpl.java:68-77 duplicate name case-insensitive scoped to batch else program.
- vNext now: college-section-mutation-service.ts:97-119 checks name/code within cohort+period; academics.ts:218-236 DB unique.
- Fix: Document changed uniqueness scope (per period) and new code collision error.

## G2-5-021-022  [P2] GAP  facet F07  effort S
- Legacy: Legacy 'End date cannot be before start date' `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/BatchServiceImpl.java:75-79`
- vNext now: New SQL date-order check, structured academic errors `src/db/schema/academics.ts:165-169`
- Fix: Expose exact inline validation text in create/edit.

## G2-18-015-013  [P3] GAP  facet F08  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/_Class.java:14-19 — JSON ignores proxy metadata; integer id
- vNext now: src/db/schema/academics.ts:184-187 — UUID id and typed API projection
- Fix: Map historic int id to UUID response and link
