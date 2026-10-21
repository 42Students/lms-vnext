# Work packet: edit src/db/schema/academics.ts (part 2 of 3)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/new-program.md, docs/audit/gap2/lane-18/learner-calendar.md, docs/audit/gap2/lane-2/batch-controller.md, docs/audit/gap2/lane-2/class-controller.md, docs/audit/gap2/lane-2/l18-u026-new-program-controller.md, docs/audit/gap2/lane-20/superadmin-sections-programs.md

## G2-13-018-007  [P1] GAP  facet F04  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/NewProgram.java:15-22` name/deptId/durationYears only, `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BaseModel.java:22-37` audit fields
- vNext now: `src/db/schema/academics.ts:32-54` id/departmentId/name/code/durationTerms/status/timestamps
- Fix: Map orphan departments, names, years and status; derive deterministic code with conflict-safe resolution

## G2-13-018-011  [P1] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BaseModel.java:23-37` int id, createdAt/updatedAt, isDeleted
- vNext now: `src/db/schema/academics.ts:32` UUID id, `src/db/schema/academics.ts:41-53` ACTIVE/ARCHIVED and timestamps
- Fix: Map legacy soft-delete to archived status and preserve timestamps when migration is necessary

## G2-13-018-054  [P1] GAP  facet F22  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/NewProgram.java:15-22` name/dept/durationYears + `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BaseModel.java:22-37` integer ID/audit/delete
- vNext now: `src/db/schema/academics.ts:32-53` code,terms,status, UUID department/id, created/updated
- Fix: Provide full column mapping including code generation, years→terms, soft delete→ARCHIVED, timestamps

## G2-18-006-065  [P1] GAP  facet F22  effort L
- Legacy: Old class_schedule stores int class/course/faculty/hall refs, text times, title, attendance_marked_at (`ClassSchedule.java:10-35`).
- vNext now: New UUID section_schedule_events, timestamptz, facultyMembershipId, status, location and separate course link (`academics.ts:450-505`; `courses.ts:202-225`).
- Fix: Write migration crosswalk including hall, attendance marking and timezone.

## G2-18-006-067  [P1] GAP  facet F22  effort L
- Legacy: Old start/end stored strings, query backend range (`ClassSchedule.java:24-27`; `ClassScheduleController.java:522-530`).
- vNext now: New typed timestamptz overlap where endsAt >= from, startsAt < to (`academics.ts:467-472`; `learner-schedule-service.ts:189-205`).
- Fix: Compare inclusive boundaries and define source-zone migration.

## G2-2-029-018  [P1] GAP  facet F04  effort M
- Legacy: BatchServiceImpl.java:90-95 newly created batch ACTIVE semester1 and optional year derived from start date.
- vNext now: src/db/schema/academics.ts:147-149 new cohort default PLANNED, progression tracked separately.
- Fix: Require explicit activation semantics and initial term setup; do not silently alter default.

## G2-2-029-060  [P1] GAP  facet F12  effort M
- Legacy: BatchServiceImpl.java:90-91 create ACTIVE in current semester1.
- vNext now: academics.ts:147-149 create PLANNED, progression separate; `college-batch-promotion-model.ts:45-65` requires active.
- Fix: Reconcile initial cohort activation/progression prerequisites and default status.

## G2-2-029-099  [P1] GAP  facet F22  effort L
- Legacy: BatchRequestDTO.java:13-29 and BatchServiceImpl.java:80-105 store Batch integer ID, program, dates, status and currentSemester.
- vNext now: academics.ts:126-163 UUID cohorts with name, code, start/end academic periods; term progression separate in execute.ts:139-151.
- Fix: Provide legacy batch-to-cohort ID map and current-semester progression migration.

## G2-2-031-084  [P1] GAP  facet F22  effort L
- Legacy: ClassDTO.java:13-24 and _Class.java store integer id, programId,batchId,upper/lower,start/end.
- vNext now: academics.ts:184-216 stores UUID id/cohortId/academicPeriodId/code/capacity/minSize/status/description.
- Fix: Build legacy class ID↔section UUID mapping; define date/limit/status migration.

## G2-18-026-055  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/NewProgram.java:14-23 legacy new_program: id int, dept_id, name, duration_years, BaseModel deleted/timestamps
- vNext now: src/db/schema/academics.ts:29-76 programs UUID, department_id, name, code, duration_terms, ACTIVE/ARCHIVED, timestamps
- Fix: Define migration map integer IDs and years to UUID and terms; preserve referential relationships

## G2-18-026-057  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/response/NewProgramDetailsDTO.java:25-68 legacy program structure attached to each program
- vNext now: src/db/schema/academics.ts:79-115 academicPeriods college-level, cohorts program-level; src/components/admin/admin-program-directory.tsx:55-64 reports count
- Fix: Reconcile legacy program-structure semesters and their course maps to new period/cohort schema

## G2-20-029-071  [P1] GAP  facet F22  effort M
- Legacy: Legacy new_program has numeric inherited PK, name, dept_id, duration_years (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/NewProgram.java:10-22`)
- vNext now: vNext programs UUID, name, code, department_id, duration_terms, timestamps/status (`src/db/schema/academics.ts:29-44`)
- Fix: Maintain schema-mapping migration/reference of years to two terms; no data migration mandated if greenfield

## G2-14-026-010  [P1] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/ProgramDTO.java:13-25`
- vNext now: `src/db/schema/academics.ts:29-53`
- Fix: Legacy numeric NewProgram ID/deptId and durationYears int default0; vNext UUID id/departmentId, required code, durationTerms>=1.

## G2-14-026-052  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/ProgramDTO.java:13-25`
- vNext now: `src/db/schema/academics.ts:29-75`
- Fix: Legacy new_program numeric id/deptId/durationYears vs vNext programs UUID/departmentId/code/durationTerms and ACTIVE/ARCHIVED status, ETL.

## G2-3-025-066  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/StudentCourseServiceImpl.java:120-183`
- vNext now: `src/db/schema/academics.ts:87-105`
- Fix: Legacy Learner→Class→Batch→Program→Semester numeric chain maps to membership/enrollment/section/cohort/program/academic-period UUID chain; enumerate compatibility only if migration later required.

## G2-5-003-049  [P1] GAP  facet F12 Business rules  effort M
- Legacy: Legacy class upper/lower limit, lower hidden on edit to preserve value. (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:33-48)
- vNext now: vNext capacity + nullable minSize and independent period/code/status. (src/modules/academics/college-section-mutation-model.ts:4-9; src/db/schema/academics.ts:184-251)
- Fix: Keep historical lower-limit minSize through edit and migration, guard capacity floor.

## G2-5-003-077  [P1] GAP  facet F22 Data model/migrations  effort L
- Legacy: Legacy hard delete class after enrolled/scheduled guard. (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:403-425; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClassController.java:225-255)
- vNext now: vNext archives/restores and retains row/status with no hard delete. (src/components/academics/college-section-lifecycle-action.tsx:19-54; src/db/schema/academics.ts:204-250)
- Fix: Specify retention vs deletion migration, references and event audit.

## G2-5-010-076  [P1] GAP  facet F22 Data/migrations  effort L
- Legacy: Class entity holds numeric program/batch ID, lowerLimit, upperLimit, desc (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:33-48)
- vNext now: Sections UUID/cohort/period/code/capacity/minSize/status (src/modules/academics/college-section-mutation-model.ts:4-9; src/db/schema/academics.ts:184-251)
- Fix: Explicit numeric ID→UUID migration and minSize mapping.

## G2-5-014-009  [P1] GAP  facet F04  effort M
- Legacy: Legacy class DTO dates are java.sql.Date startDate/endDate (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/classes/ClassSearchDTO.java:17-25`)
- vNext now: vNext sections have academicPeriodId and not own start/end dates (`src/db/schema/academics.ts:184-205`)
- Fix: Derive class date boundaries from academic period or store explicit legacy dates

## G2-5-014-078  [P1] GAP  facet F22  effort L
- Legacy: Legacy _Class table numeric ID, program_id,batch_id,name,description,start/end,upper/lower size and classType (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/_Class.java:15-46`)
- vNext now: vNext sections UUID, cohortId,academicPeriodId,code,capacity,minSize,description,status (`src/db/schema/academics.ts:184-216`)
- Fix: Define complete legacy class-to-section mapping including type/group roster and date fields
