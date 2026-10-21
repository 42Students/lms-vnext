# Work packet: edit src/db/schema/academic-terms.ts (part 2 of 2)

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/l12-u016-semester-entity.md, docs/audit/gap2/lane-5/u025-semester-controller.md, docs/audit/gap2/lane-9/college-admin-semesters.md

## G2-12-016-008  [P1] GAP  facet F04  effort M
- Legacy: Legacy int ID+programId+semesterNumber+name+isActive+totalCredits. `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Semester.java:18-39`
- vNext now: vNext UUID id/programId, termNumber/name/isActive/totalCredits plus timestamps. `src/db/schema/academic-terms.ts:8-16`
- Fix: Write data migration field map incl id and old nulls.

## G2-12-016-009  [P1] GAP  facet F04  effort M
- Legacy: Legacy name nullable at DB model; isActive/totalCredits nullable. `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Semester.java:32-39`
- vNext now: vNext name not null/check nonblank, isActive not null, totalCredits nullable. `src/db/schema/academic-terms.ts:12-22`
- Fix: Backfill missing names and nullable active statuses before loading.

## G2-12-016-045  [P1] GAP  facet F22  effort M
- Legacy: Legacy MySQL semester has auto integer ID via BaseModel, programId int, nullable name/is_active/total_credits. `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Semester.java:18-39`
- vNext now: vNext PG UUID pk, programId UUID, nonnull name,isActive,nullable totalCredits, timestamps. `src/db/schema/academic-terms.ts:8-23`
- Fix: Map IDs, null cleanup and CAS timestamps.

## G2-5-025-012  [P1] GAP  facet F04  effort M
- Legacy: Legacy mapping fields semester_id, course_id, is_mandatory, credits, course_order, course_ids. `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/SemesterCourseDTO.java:12-26`
- vNext now: vNext UUID term mapping, type CORE/ELECTIVE, credits, displayOrder, position. `src/modules/academics/college-term-mapping-model.ts:3-11`, `src/db/schema/academic-terms.ts:25-39`
- Fix: Bridge isMandatory↔type and courseOrder↔displayOrder, retain defaults.

## G2-5-025-043  [P1] GAP  facet F12  effort M
- Legacy: Legacy 0 credits permitted, course order >=1. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/SemesterCourseServiceImpl.java:40-44`
- vNext now: vNext schema UI min credits 1 though database permits 0..30. `src/modules/academics/college-term-mapping-model.ts:3-11`, `src/db/schema/academic-terms.ts:25-39`
- Fix: Align UI/service constraint to data contract or migrate invalid existing rows.

## G2-5-025-063  [P1] GAP  facet F22  effort M
- Legacy: Legacy semester and semester_course have numeric IDs, snake_case serialization, isMandatory boolean and order. `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Semester.java:16-40`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/SemesterCourse.java:15-39`
- vNext now: vNext UUID term and mapping tables with enum CORE/ELECTIVE and nonnull displayOrder. `src/db/schema/academic-terms.ts:8-39`
- Fix: Provide migration mapping for identity/enum/credits/order, including missing mappings.

## G2-9-019-072  [P1] GAP  facet F22  effort L
- Legacy: Legacy semester int PK, program_id,semester_number,name,is_active,total_credits `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Semester.java:15-35`
- vNext now: program_terms UUID PK and programId UUID FK, termNumber,name,isActive,totalCredits, timestamps `src/db/schema/academic-terms.ts:8-19`
- Fix: Document ID migration, field mapping and parent foreign key restrictions.

## G2-9-019-074  [P1] GAP  facet F22  effort L
- Legacy: Legacy course-credit source SemesterCourse mapping `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/SemesterServiceImpl.java:117-136`
- vNext now: program_term_courses with credits, display order, type, unique term+course `src/db/schema/academic-terms.ts:28-42`
- Fix: Verify curriculum mapping identities and credit values for parity.
