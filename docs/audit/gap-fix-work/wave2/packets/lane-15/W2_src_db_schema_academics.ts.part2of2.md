# Work packet (wave 2): edit src/db/schema/academics.ts (part 2 of 2)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u014-class-search-controller.md, docs/audit/gap2/lane-5/u021-batch.md, docs/audit/gap2/lane-6/l18-u020-class-schedule.md, docs/audit/gap2/lane-8/l14-u031-academic-structure-cross-cutting.md, docs/audit/gap2/lane-9/college-admin-batch-promotion.md, docs/audit/gap2/lane-9/college-admin-batches.md

## G2-5-014-022  [P2] GAP  facet F05  effort M
- Legacy: Legacy /exists performs case-insensitive exact class name lookup across scope (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/classes/ClassSearchController.java:220-229`)
- vNext now: vNext section uniqueness scoped to cohort+period for ACTIVE only (`src/db/schema/academics.ts:219-236`)
- Fix: Provide separate tenant-wide exact existence indicator or approve restricted uniqueness semantics

## G2-5-014-024  [P2] GAP  facet F06  effort M
- Legacy: Legacy select action requires integer classId in path (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/classes/ClassSearchController.java:186-195`)
- vNext now: vNext sections use UUID section ID in DB (`src/db/schema/academics.ts:184-198`)
- Fix: Translate old numeric class references or document mapping for usage recording

## G2-5-014-080  [P2] GAP  facet F22  effort M
- Legacy: Legacy cache filters isDeleted soft delete (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/classes/ClassSearchCache.java:57-65`)
- vNext now: vNext section status enum ACTIVE/ARCHIVED and active-name/code indexes (`src/db/schema/academics.ts:203-236`)
- Fix: Document deletion semantics and uniqueness changes

## G2-5-021-003  [P2] GAP  facet F02  effort M
- Legacy: Legacy model has name, program, dates, student count, semester, academic year, status `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Batch.java:19-48`
- vNext now: New cohort plus progression record split and page directory `src/db/schema/academics.ts:126-163` `src/modules/academics/college-batch-promotion-service.ts:90-108`
- Fix: Project exact legacy columns in batch UI in intended order.

## G2-5-021-006  [P2] GAP  facet F04  effort M
- Legacy: Legacy id Long auto-increment `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Batch.java:15-17`
- vNext now: New cohort.id UUID PK `src/db/schema/academics.ts:126-131`
- Fix: Map IDs at migration/import boundaries.

## G2-5-021-009  [P2] GAP  facet F04  effort M
- Legacy: Legacy startDate/endDate java.util.Date nullable `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Batch.java:25-29`
- vNext now: New startDate/endDate SQL date strings nullable with date order check `src/db/schema/academics.ts:150-168`
- Fix: Convert timezone-dependent java.util.Date to date-only without day shift.

## G2-5-021-012  [P2] GAP  facet F04  effort M
- Legacy: Legacy academicYear String with '2024-25' convention `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Batch.java:37-38`
- vNext now: New cohort academicYear varchar16 plus progression academicYearStart number `src/db/schema/academics.ts:150-152` `src/modules/academics/college-batch-promotion-service.ts:93-98`
- Fix: Normalize legacy hyphen-year values to numeric start and display format.

## G2-5-021-013  [P2] GAP  facet F04  effort M
- Legacy: Legacy status `StatusType` enum `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Batch.java:40-42`
- vNext now: New cohort status PLANNED/ACTIVE/COMPLETED etc `src/db/schema/academics.ts:147-149`
- Fix: Build enum transition/retirement mapping; do not silently treat INACTIVE as COMPLETED.

## G2-5-021-043  [P2] GAP  facet F18  effort M
- Legacy: Legacy API field `batchName`/`currentSemester`/`academicYear` `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Batch.java:19-38`
- vNext now: New `name`,`currentTermNumber`,`currentAcademicYearStart` `src/db/schema/academics.ts:135-151` `src/modules/academics/college-batch-promotion-service.ts:90-98`
- Fix: Map visible labels and data formats exactly.

## G2-5-021-047  [P2] GAP  facet F20  effort S
- Legacy: Legacy academic year uses JVM local Calendar timezone `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/BatchServiceImpl.java:122-136`
- vNext now: New SQL date-only and currentAcademicYearStart int `src/db/schema/academics.ts:150-152` `src/modules/academics/college-batch-promotion-execute.ts:139-143`
- Fix: Define Asia/Kolkata calendar boundary explicitly.

## G2-18-020-052  [P2] GAP  facet F23  effort M
- Legacy: Legacy lecture halls cannot be deleted when active sessions refer to them. `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ClassScheduleRepository.java:167`
- vNext now: vNext lectureHallId FK restrict even on cancelled sessions. `src/db/schema/academics.ts:464`
- Fix: Align deletion policy after cancelling sessions; handle old 'active only' count difference.

## G2-14-031-037  [P2] GAP  facet F12  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:169-176 program/semester number immutable
- vNext now: src/db/schema/academics.ts:79-125 periods/terms independent
- Fix: Enforce immutable ordinal after assignment

## G2-14-031-053  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DepartmentController.java:7-8 Department JPA integer PK and college FK
- vNext now: src/db/schema/academics.ts:29-78 UUID programs; src/modules/departments/service.ts:221-386 scoped department UUID
- Fix: Record per-column department ID/chair mapping

## G2-14-031-056  [P2] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClassController.java:31-35 Class JPA batch/program class membership
- vNext now: src/db/schema/academics.ts:184-254 sections,330-399 sectionEnrollments,400-449 facultyAssignments
- Fix: Document class/team/student/teacher membership translation

## G2-9-002-081  [P2] GAP  facet F22  effort M
- Legacy: Old batch table bigint ID, semester, YYYY-YY year, dates and status (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Batch.java:10-55`)
- vNext now: cohorts UUID + separate progression state (`src/db/schema/academics.ts:112-153`)
- Fix: Write explicit legacy schema field mapping.

## G2-9-002-083  [P2] GAP  facet F22  effort M
- Legacy: Legacy program-scoped case-insensitive name query; app guard (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/BatchRepository.java:1-26`)
- vNext now: Unique cohort code per program and status index (`src/db/schema/academics.ts:105-155`)
- Fix: Review name uniqueness vs code-uniqueness semantics across migrations.

## G2-9-002-084  [P2] GAP  facet F22  effort M
- Legacy: Status ACTIVE/INACTIVE/COMPLETED (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Batch.java:22-52`)
- vNext now: Cohort status enum with PLANNED and other lifecycle values (`src/db/schema/academics.ts:108-145`)
- Fix: Verify mapping for COMPLETED and reactivation.

## G2-9-003-087  [P2] GAP  facet F22  effort M
- Legacy: Batch bigint primary key, programId, year, semester, dates, status (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Batch.java:10-50`)
- vNext now: cohorts UUID with code, period FKs, status and separate progression state (`src/db/schema/academics.ts:108-156`)
- Fix: Create field mapping and account for original status values.

## G2-9-029-067  [P2] GAP  facet F22  effort M
- Legacy: Legacy 7-char academicYear, 1..12 start month preference `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:24-47,95-104`
- vNext now: New academicYear varchar16, flexible regex and no start-month preference `src/db/schema/academics.ts:146-158` `src/modules/academics/college-cohort-mutation-model.ts:4-8`
- Fix: Restore legacy input/display year while keeping stored valid value

## G2-9-023-067  [P2] GAP  facet F22  effort M
- Legacy: Legacy 7-char academicYear, 1..12 start month preference `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:24-47,95-104`
- vNext now: New academicYear varchar16, flexible regex and no start-month preference `src/db/schema/academics.ts:146-158` `src/modules/academics/college-cohort-mutation-model.ts:4-8`
- Fix: Restore legacy input/display year while keeping stored valid value
