# Work packet (wave 2): edit src/db/schema/academic-terms.ts

13 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l13-u026-program-structure-controller.md, docs/audit/gap2/lane-12/new-program-structure.md, docs/audit/gap2/lane-12/semester-courses.md, docs/audit/gap2/lane-17/superadmin-semester-course-mapping.md, docs/audit/gap2/lane-5/l12-u016-semester-entity.md, docs/audit/gap2/lane-5/u025-semester-controller.md

## G2-13-026-045  [P2] GAP  facet F20  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/NewProgramStructureDTO.java:17-20 — dates stored as free-form strings max255.
- vNext now: src/db/schema/academic-terms.ts:8-23 — no start/end date column, timestamps track creation/edit.
- Fix: Do not silently lose course-calendar date meaning.

## G2-12-018-003  [P2] GAP  facet F02  effort M
- Legacy: Structure includes name/date range/courses/status as one unit `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/NewProgramStructure.java:19-32`
- vNext now: New term name/active/totalCredits and child courses; no date range `src/db/schema/academic-terms.ts:8-39`
- Fix: Restore start/end dates or explicitly migrate into academic period relation.

## G2-12-018-007  [P2] GAP  facet F04  effort M
- Legacy: Legacy structure integer id from BaseModel, programId primitive int `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BaseModel.java:22-26` `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/NewProgramStructure.java:21-22`
- vNext now: New term UUID+program FK UUID `src/db/schema/academic-terms.ts:8-12`
- Fix: Map historical structure IDs to UUID with program scope.

## G2-12-018-010  [P2] GAP  facet F04  effort M
- Legacy: Legacy courseIds List<Integer> serialized JSON, nullable on entity `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/NewProgramStructure.java:27-29`
- vNext now: New separate programTermCourses with ordered child rows and per-row UUID courseId `src/db/schema/academic-terms.ts:25-39`
- Fix: Create array↔child mapping preserving order and unknown/deleted IDs.

## G2-12-018-016  [P2] GAP  facet F06  effort S
- Legacy: Create defaults empty list courseIds and StatusType.ACTIVE `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ProgramStructureServiceImpl.java:23-33`
- vNext now: New create term row active true but requires separate course map insert `src/db/schema/academic-terms.ts:13,25-39` `src/modules/academics/semester-mutation-service.ts:115-120`
- Fix: Persist atomic empty curriculum group; keep ACTIVE default.

## G2-12-018-034  [P2] GAP  facet F12  effort S
- Legacy: Legacy endDate/startDate free text up to255, may not be ISO `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/NewProgramStructureDTO.java:17-20`
- vNext now: New no source date strings; academic period DATE column elsewhere `src/db/schema/academic-terms.ts:8-23`
- Fix: Preserve non-ISO imported text or require approved interpretation.

## G2-12-002-075  [P2] GAP  facet F22  effort S
- Legacy: Legacy semester.name nullable `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/SemesterCourse.java:25-38`
- vNext now: VNext term.name required + nonempty check `src/db/schema/academic-terms.ts:8-23`
- Fix: Document deliberate stricter name constraints

## G2-17-002-085  [P2] GAP  facet F22  effort 
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Semester.java:19-38 integer ID, semesterNumber, nullable name, default active true.
- vNext now: src/db/schema/academic-terms.ts:8-22 UUID programTerms, required nonempty name, termNumber>=1, default isActive true.
- Fix: Record name requirement and ID incompatibility, avoid silently invalidating legacy references.

## G2-17-002-087  [P2] GAP  facet F22  effort 
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/SemesterCourseRepository.java:13-18 filters soft-deleted mapping, :28-39 deleteBySemesterIdAndCourseId hard removes.
- vNext now: src/db/schema/academic-terms.ts:25-39 no isDeleted column; src/modules/academics/college-term-mapping-service.ts:273 deletes and records activity event.
- Fix: Document retention/soft-delete consistency and whether historical mappings are restorable.

## G2-12-016-001  [P2] GAP  facet F01  effort M
- Legacy: Legacy Semester entity is owned by Program, routes under `/api/v1/semester`. `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Semester.java:12-20`
- vNext now: vNext ProgramTerm table owned by Program and mutation service under new API. `src/db/schema/academic-terms.ts:7-23`, `src/modules/academics/semester-mutation-service.ts:106-136`
- Fix: Maintain old ID/route-to-new UUID mapping.

## G2-12-016-029  [P2] GAP  facet F12  effort M
- Legacy: Legacy nullable is_active true default via JPA, permits null in database. `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Semester.java:35-36`
- vNext now: vNext nonnull true default. `src/db/schema/academic-terms.ts:13-13`
- Fix: Normalize legacy null to true or preserve if unknown.

## G2-12-016-044  [P2] GAP  facet F21  effort M
- Legacy: Legacy semester belongs to program and course mapping FK through semester_course. `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Semester.java:26-39`
- vNext now: vNext ProgramTerm FK plus ProgramTermCourse and cohort progression. `src/db/schema/academic-terms.ts:8-39`
- Fix: Map all consumer foreign keys before migration.

## G2-5-025-059  [P2] GAP  facet F20  effort M
- Legacy: Legacy unique (semester_id,course_id), nullable courseOrder, default credits 3. `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/SemesterCourse.java:17-39`
- vNext now: vNext unique (termId,courseId), displayOrder nonnull, credits nullable. `src/db/schema/academic-terms.ts:25-39`
- Fix: Map nullable order deterministically and preserve credits default.
