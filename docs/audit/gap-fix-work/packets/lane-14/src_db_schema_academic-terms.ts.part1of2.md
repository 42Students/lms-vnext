# Work packet: edit src/db/schema/academic-terms.ts (part 1 of 2)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l13-u026-program-structure-controller.md, docs/audit/gap2/lane-12/new-program-structure.md, docs/audit/gap2/lane-12/semester-courses.md, docs/audit/gap2/lane-17/superadmin-semester-course-mapping.md

## G2-13-026-007  [P1] GAP  facet F04  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/NewProgramStructure.java:19-32 — name, programId, startDate/endDate strings, courseIds JSON, StatusType status.
- vNext now: src/db/schema/academic-terms.ts:8-23 — programId, termNumber, name, isActive, totalCredits, timestamps; no date strings or JSON courseIds.
- Fix: Map legacy dates/status/course membership to normalized term model.

## G2-13-026-047  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/NewProgramStructure.java:14-32 — new_program_structure table name, string dates, courseIds JSON and StatusType enum.
- vNext now: src/db/schema/academic-terms.ts:8-39 — program_terms UUID, term number, bool, credits and separate program_term_courses.
- Fix: Map table ID, status, courseIds, dates and membership in migration.

## G2-13-026-048  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/NewProgramStructureDTO.java:13-23 — programId Integer, structure id inherited numeric.
- vNext now: src/db/schema/academic-terms.ts:9-12 — UUID primary and program FK, unique program+termNumber index at src/db/schema/academic-terms.ts:18.
- Fix: Supply legacy ID translation and semester numbering.

## G2-13-026-049  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/NewProgramStructure.java:30-32 — legacy COMPLETED status possible.
- vNext now: src/db/schema/academic-terms.ts:13-14 — isActive only (true/false), no COMPLETED.
- Fix: Represent completed historical term state.

## G2-12-018-001  [P1] GAP  facet F01  effort L
- Legacy: NewProgramStructure is independent program structure/semester entity `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/NewProgramStructure.java:13-18`
- vNext now: vNext programTerms/term courses implement normalized curriculum but not same legacy program structure record `src/db/schema/academic-terms.ts:7-39`
- Fix: Crosswalk legacy structure rows separate from Semester model, do not collapse duplicates without policy.

## G2-12-018-005  [P1] MISSING  facet F03  effort M
- Legacy: Status ACTIVE/INACTIVE/COMPLETED using StatusType `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/NewProgramStructure.java:30-32` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ProgramStructureServiceImpl.java:90-103`
- vNext now: New Boolean isActive, no COMPLETED state `src/db/schema/academic-terms.ts:13` `src/modules/academics/semester-mutation-model.ts:13-19`
- Fix: Represent COMPLETED distinctly for historical/terminal curriculum statuses.

## G2-12-018-009  [P1] MISSING  facet F04  effort M
- Legacy: Legacy startDate/endDate each String up to255 `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/NewProgramStructure.java:23-26` `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/NewProgramStructureDTO.java:17-20`
- vNext now: New term schema has no dates at all; academicPeriods date is a separate college concept `src/db/schema/academic-terms.ts:8-23`
- Fix: Preserve exact structure date text or define explicit program-term schedule mapping.

## G2-12-018-011  [P1] GAP  facet F04  effort S
- Legacy: Old status StatusType enum serialized string `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/NewProgramStructure.java:30-32`
- vNext now: New bool isActive loses COMPLETED / state meaning `src/db/schema/academic-terms.ts:13`
- Fix: Add status enum field or independent completedAt semantics.

## G2-12-018-033  [P1] MISSING  facet F12  effort S
- Legacy: Old STATUS COMPLETED is sticky on activate sibling (do not inactivate completed) `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ProgramStructureServiceImpl.java:90-99`
- vNext now: New bool active cannot encode completed sibling and cannot preserve it `src/db/schema/academic-terms.ts:13`
- Fix: Store COMPLETED explicitly and exempt it from peer deactivation.

## G2-12-018-051  [P1] GAP  facet F22  effort L
- Legacy: Legacy table new_program_structure int PK + program_id int, name,date strings, courseIds JSON,status, soft delete inherited `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/NewProgramStructure.java:13-33` `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BaseModel.java:22-37`
- vNext now: No direct structure table; program_terms UUID,termNumber,name,active/credits with joined child rows `src/db/schema/academic-terms.ts:7-39`
- Fix: Plan DB schema migration/disposition for every legacy field incl dates,status and explicit structure ID.

## G2-12-018-052  [P1] GAP  facet F22  effort M
- Legacy: Legacy no uniqueness by program/term, multiple structures for program `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/NewProgramStructure.java:13-33`
- vNext now: New unique(programId,termNumber) and required termNumber `src/db/schema/academic-terms.ts:8-21`
- Fix: Do not invent ordinal for multiple legacy structures without audited mapping.

## G2-12-018-053  [P1] GAP  facet F22  effort M
- Legacy: Old uses StatusType Enum + nullable status column `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/NewProgramStructure.java:30-32`
- vNext now: New bool isActive defaults true; no enum column for COMPLETED `src/db/schema/academic-terms.ts:13`
- Fix: Store complete historical statuses separately.

## G2-12-018-054  [P1] GAP  facet F22  effort L
- Legacy: Old startDate/endDate VARCHAR? model String and courseIds JSON `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/NewProgramStructure.java:23-29`
- vNext now: New terms no dates and relational per-term courses `src/db/schema/academic-terms.ts:8-39`
- Fix: Migrate date text and ordered course ID array losslessly.

## G2-12-018-056  [P1] GAP  facet F23  effort M
- Legacy: Old COMPLETED state retained across active peer switches `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ProgramStructureServiceImpl.java:90-99`
- vNext now: New isActive flag collapses completed into inactive `src/db/schema/academic-terms.ts:13`
- Fix: Preserve terminal status and peer transition invariants.

## G2-12-002-051  [P1] GAP  facet F12  effort S
- Legacy: isMandatory true default, editable hidden switch `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/SemesterCourse.java:31-36`
- vNext now: CORE/ELECTIVE enum default CORE `src/db/schema/academic-terms.ts:25-31`
- Fix: Define boolean-to-enum translation and persistence

## G2-12-002-073  [P1] GAP  facet F22  effort M
- Legacy: Legacy integer semester_course, isMandatory boolean, credits=3 default, nullable course_order `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/SemesterCourse.java:17-38`
- vNext now: UUID program_term_courses, CORE/ELECTIVE, nullable credits, order not null `src/db/schema/academic-terms.ts:25-39`
- Fix: Map conceptual fields and defaults

## G2-12-002-076  [P1] GAP  facet F22  effort S
- Legacy: Legacy read can soft-hide deleted rows, repository hard DELETE `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/SemesterCourseRepository.java:16-20,37-39`
- vNext now: VNext mapping schema no isDeleted flag `src/db/schema/academic-terms.ts:25-39`
- Fix: Check retention and restoration behavior

## G2-17-002-056  [P1] GAP  facet F12  effort 
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/SemesterCourseServiceImpl.java:40-42,134-138 backend accepts credit 0..30, while docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:418-420 UI edits 1..10.
- vNext now: src/modules/academics/college-term-mapping-model.ts:3-11 service writes 1..10, src/db/schema/academic-terms.ts:37 allows null or 0..30.
- Fix: Reconcile API/UI/DB limits and historical 0/>10 credits.

## G2-17-002-084  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/SemesterCourse.java:17-38 integer semester_course with nullable Boolean is_mandatory=true, credits=3, nullable course_order and unique semester+course.
- vNext now: src/db/schema/academic-terms.ts:25-39 UUID program_term_courses, type CORE/ELECTIVE, nullable credits, nonnull displayOrder>=1, unique term+course.
- Fix: Document domain-model transformation and legacy-link/nullable-value policy; decide parity of mandatory flag.

## G2-17-002-086  [P1] GAP  facet F22  effort 
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/SemesterCourseServiceImpl.java:40-42 permits credits 0-30, entity credits defaults3.
- vNext now: src/db/schema/academic-terms.ts:37 and drizzle/0050_db02_program_terms_curriculum.sql:31-34 permit null or 0-30, src/modules/academics/college-term-mapping-model.ts:3-11 writes 1-10.
- Fix: Align DB/API limits or explain historical read-only out-of-range values.
