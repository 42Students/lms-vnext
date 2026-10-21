# Work packet: edit src/db/schema/courses.ts (part 6 of 6)

15 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/course.md, docs/audit/gap2/lane-8/l14-u031-academic-structure-cross-cutting.md, docs/audit/gap2/lane-8/semester-course.md, docs/audit/gap2/lane-9/l15-u027-faculty-controller.md, docs/audit/gap2/lane-18/u002-superadmin-lessons.md, docs/audit/gap2/lane-19/lesson-content.md

## G2-8-020-070  [P1] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Course.java:42-43 globally unique slug VARCHAR64
- vNext now: src/db/schema/courses.ts:44,66-77 code per department unique only active
- Fix: Retain globally stable slug unique alias independent of academic code.

## G2-8-020-071  [P1] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Course.java:51-53 nullable JPA Long version
- vNext now: src/db/schema/courses.ts:34-86 no catalog version
- Fix: Store CAS version for conflicts and concurrent partial metadata updates.

## G2-8-020-072  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Course.java:55-57 contents JSON MetaData fourteen fields
- vNext now: src/db/schema/courses.ts:45-50 limited columns only
- Fix: Create explicit 14-field conversion with user-visible fallbacks.

## G2-8-020-074  [P1] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/MetaData.java:28-29 courseStartDate/endDate stored as text
- vNext now: src/db/schema/courses.ts:34-64 no course date columns
- Fix: Persist schedule dates with timezone/format conversion.

## G2-8-020-076  [P1] GAP  facet F23  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/MetaData.java:20-34 metadata includes amount, imageUrl, rich intro, thumbnail
- vNext now: src/db/schema/courses.ts:45-50 missing most presentation metadata
- Fix: Document field-by-field retirement rationale before claiming parity.

## G2-8-020-078  [P1] GAP  facet F23  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Course.java:36-41 legacy had independent enabled/active/display
- vNext now: src/db/schema/courses.ts:51-53 active/archive lifecycle only
- Fix: Do not conflate these flags; preserve behavior-dependent visibility.

## G2-14-031-055  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:31-55 SemesterCourse JPA association
- vNext now: src/db/schema/academics.ts:79-125 academic period and src/db/schema/courses.ts term offerings
- Fix: Specify ordinal→period→term course ID and unique constraints

## G2-8-016-001  [P1] GAP  facet F01  effort M
- Legacy: Legacy semester_course table maps courseId to semesterId (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/SemesterCourse.java:11-29`)
- vNext now: VNext courseOfferings uses courseId+cohortId+academicPeriodId (no semesterCourse table) (`src/db/schema/courses.ts:88-106`)
- Fix: Create explicit mapping from legacy semester to academicPeriod+cohort, preserve per-program semester meaning

## G2-8-016-005  [P1] GAP  facet F03  effort M
- Legacy: Legacy credits default3 (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/SemesterCourse.java:34-35`)
- vNext now: VNext credits nullable, no default (`src/db/schema/courses.ts:110-111`)
- Fix: Set new default to 3 for legacy semester assignments unless explicit curriculum rule replaces it

## G2-8-016-036  [P1] GAP  facet F22  effort M
- Legacy: Legacy semester_course unique (semester_id,course_id) (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/SemesterCourse.java:17-19`)
- vNext now: New (courseId,cohortId,academicPeriodId) unique active (`src/db/schema/courses.ts:129-135`)
- Fix: Write authoritative mapping and enrollment coverage before claiming semester parity

## G2-8-016-039  [P1] GAP  facet F23  effort M
- Legacy: Legacy credits 3 and courseOrder appended (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/SemesterCourse.java:34-38; docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/SemesterCourseServiceImpl.java:62-68`)
- vNext now: VNext nullable credits, order default0 (`src/db/schema/courses.ts:110-113`)
- Fix: Restore visible default credits/order for curriculum setup

## G2-15-027-069  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/FacultyCourseMapping.java:9-23 faculty_course_mapping active int, class/course refs
- vNext now: src/db/schema/courses.ts:228-281 scoped courseTeachingAssignments and endedAt
- Fix: Map class+course to delivery and create unique active rules with migration proof.

## G2-18-002-044  [P2] GAP  facet F07  effort S
- Legacy: Legacy duplicate lesson name exact `A lesson with this name already exists in the course`. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LessonServiceImpl.java:120-127`
- vNext now: vNext DB uniqueness per learningPath and error maps `course_lessons_active_name_uq`. `src/modules/courses/lesson-service.ts:37-49`, `src/db/schema/courses.ts:351-357`
- Fix: Specify same duplicate text while clarifying new uniqueness scope per offering.

## G2-19-002-041  [P2] GAP  facet F07  effort S
- Legacy: Legacy allowed sequence >=1 and points >=0 `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:628-639`
- vNext now: vNext editor Order between 1 and 10001; storage sequence>=0, points 0-1000 `src/components/courses/super-admin-content-actions.tsx:34-40` `src/db/schema/courses.ts:433-440`
- Fix: Document explicit upper-bound difference and unify labels/validation messages.

## G2-8-016-016  [P2] GAP  facet F07  effort M
- Legacy: Legacy duplicate error Course is already assigned to this semester (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/SemesterCourseServiceImpl.java:51-52,69-73`)
- vNext now: VNext active partial unique on course,cohort,period, offering conflict error (`src/db/schema/courses.ts:129-135`)
- Fix: Match exact duplicate message with contextual semester/cohort
