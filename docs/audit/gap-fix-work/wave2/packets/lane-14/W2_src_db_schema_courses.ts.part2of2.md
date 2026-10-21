# Work packet (wave 2): edit src/db/schema/courses.ts (part 2 of 2)

22 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/student-course-controller.md, docs/audit/gap2/lane-4/l14-u027-faculty-course-association-controller.md, docs/audit/gap2/lane-4/learner-content-progress-model.md, docs/audit/gap2/lane-8/course.md, docs/audit/gap2/lane-8/semester-course.md, docs/audit/gap2/lane-18/u002-superadmin-lessons.md

## G2-3-025-068  [P2] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/response/StudentCoursesResponseDTO.java:16-85`
- vNext now: `src/db/schema/courses.ts:34-85`
- Fix: Legacy DTO course slug, class numeric ID, faculty email and metadata image/content differ from normalized course data fields; map through authorized delivery/content service.

## G2-14-027-014  [P2] GAP  facet F06  effort M
- Legacy: Legacy active always 1 on create `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/FacultyCourseAssociationServiceImpl.java:38-48`
- vNext now: New startedAt defaults now, endedAt null, role must be chosen `src/db/schema/courses.ts:242-251`
- Fix: Map default teaching role when importing legacy active records.

## G2-14-027-026  [P2] GAP  facet F10  effort M
- Legacy: PATCH deactivateAssociation mappingId sets active=0 `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyCourseAssociationController.java:90-100`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/FacultyCourseAssociationServiceImpl.java:104-111`
- vNext now: New DELETE end assignment marks endedAt and records lifecyle `src/app/api/courses/teaching-assignments/[assignmentId]/route.ts:17-38`; `src/db/schema/courses.ts:243-251`
- Fix: Carry historical mapping ID and active→ended conversion.

## G2-14-027-032  [P2] GAP  facet F12  effort M
- Legacy: Legacy active int 1/0, deactivation without timestamp `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/FacultyCourseAssociation.java:22-23`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/FacultyCourseAssociationServiceImpl.java:104-111`
- vNext now: New active derived from endedAt timestamp null `src/db/schema/courses.ts:243-251`
- Fix: Map old inactive to endedAt with unknown end-time provenance.

## G2-4-019-043  [P2] GAP  facet F11  effort M
- Legacy: Legacy progress row keyed to numeric learner, not Section. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LearnerContentProgress.java:21-25`)
- vNext now: New UUID membership scoped to college but content may be shared among Sections. (`src/db/schema/courses.ts:479-488`; `src/modules/courses/progress-service.ts:148-155`)
- Fix: Clarify retake isolation across shared offerings and same learner Section transfers.

## G2-4-019-072  [P2] GAP  facet F22  effort M
- Legacy: Legacy entity extends BaseModel with soft delete and int IDs. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LearnerContentProgress.java:14-19`; `docs/legacy-source/backend/src/main/resources/db/migration/V36__learner_content_progress.sql:3-15`)
- vNext now: New UUID primary key, no isDeleted, course scoped membership. (`src/db/schema/courses.ts:475-535`)
- Fix: Map soft-deleted history/attempts and report inclusion explicitly.

## G2-8-020-009  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Course.java:23-24 short_title nullable
- vNext now: src/db/schema/courses.ts:46 shortTitle VARCHAR120 optional
- Fix: Align legacy 255 frontend validation, stored length and blank fallback.

## G2-8-020-073  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/MetaData.java:25 courseColor accepts 3/6 hex chars per service
- vNext now: src/db/schema/courses.ts:82-84 cardColor only #RRGGBB
- Fix: Normalize #RGB shorthand safely or accept it at boundary.

## G2-8-020-075  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BaseModel.java:28-37 created/updated local timestamps, soft-delete flag
- vNext now: src/db/schema/courses.ts:51-63 status enum and tz-aware timestamps
- Fix: Preserve original timestamps and deleted semantics explicitly.

## G2-8-016-003  [P2] GAP  facet F02  effort M
- Legacy: SemesterCourse has no UI title; represents mapper grid (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/SemesterCourse.java:11-23`)
- vNext now: VNext Offering is separate course scheduling/placement card (`src/db/schema/courses.ts:88-127`)
- Fix: Compare legacy semester mapping grid and vNext offering setup visual structure

## G2-8-016-004  [P2] GAP  facet F03  effort M
- Legacy: Legacy isMandatory Boolean defaults true for Core (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/SemesterCourse.java:31-32`)
- vNext now: VNext type CORE/ELECTIVE enum default CORE (`src/db/schema/courses.ts:107-110`)
- Fix: Map null/true/false to core/elective without changing label

## G2-8-016-006  [P2] GAP  facet F04  effort M
- Legacy: Legacy integer id from BaseModel, semesterId int, courseId int (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/SemesterCourse.java:23-29`)
- vNext now: VNext offering UUID and FK to course/cohort/period (`src/db/schema/courses.ts:91-106`)
- Fix: Provide old semester/course ID adapter for historic references

## G2-8-016-008  [P2] GAP  facet F04  effort M
- Legacy: Legacy credits Integer nullable default3 in Java constructor (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/SemesterCourse.java:34-35,43-55`)
- vNext now: VNext integer nullable and check1..30 (`src/db/schema/courses.ts:110,145-149`)
- Fix: Normalize old null/default, show range error and preserve intended zero exclusion

## G2-8-016-009  [P2] GAP  facet F04  effort M
- Legacy: Legacy courseOrder Integer nullable (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/SemesterCourse.java:37-38`)
- vNext now: VNext displayOrder nonnull default0 (`src/db/schema/courses.ts:111-113`)
- Fix: Convert 1-based orders to 0-based or update UI to display natural 1-based

## G2-8-016-010  [P2] GAP  facet F04  effort M
- Legacy: Legacy composite unique constraint semester_id+course_id (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/SemesterCourse.java:17-19`)
- vNext now: VNext partial unique active courseId+cohortId+academicPeriodId (`src/db/schema/courses.ts:129-135`)
- Fix: Clarify whether a course can recur across multiple sections/cohorts in one period

## G2-8-016-012  [P2] GAP  facet F05  effort M
- Legacy: Legacy bulk add appends courses at max courseOrder (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/SemesterCourseServiceImpl.java:79-111`)
- vNext now: VNext create assigns displayOrder default0 (`src/db/schema/courses.ts:111-113; src/modules/courses/offering-service.ts:216-300`)
- Fix: Append after max display order, avoid all rows showing 0

## G2-8-016-014  [P2] GAP  facet F06  effort M
- Legacy: Legacy explicit order must >=1 (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/SemesterCourseServiceImpl.java:40-45`)
- vNext now: VNext DB order >=0 (`src/db/schema/courses.ts:149-151`)
- Fix: Align user-facing order base and validations

## G2-8-016-023  [P2] GAP  facet F12  effort M
- Legacy: Legacy duplicate already-present bulk add is a no-op (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/SemesterCourseServiceImpl.java:95-101`)
- vNext now: New unique active offering prevents same tuple; mutation may reject (`src/db/schema/courses.ts:129-135`)
- Fix: Normalize repeat import to skip with count rather than fail

## G2-8-016-026  [P2] GAP  facet F13  effort M
- Legacy: Legacy duplicate concurrency caught and converted same duplicate message (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/SemesterCourseServiceImpl.java:66-74,99-107`)
- vNext now: VNext unique index constrains only active rows (`src/db/schema/courses.ts:129-135`)
- Fix: Map DB conflict to user-friendly duplicate message

## G2-8-016-034  [P2] GAP  facet F20  effort M
- Legacy: Legacy append max course order susceptible to concurrent duplicate order (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/SemesterCourseServiceImpl.java:62-68,87-111`)
- vNext now: VNext nonunique displayOrder default0 and transactional unique active tuple (`src/db/schema/courses.ts:111-113,129-135`)
- Fix: Handle simultaneous inserts with deterministic sort/reorder and sequence lock

## G2-18-002-020  [P3] GAP  facet F04  effort S
- Legacy: Legacy lesson name fallback `Untitled lesson`. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:22-24`
- vNext now: vNext DB has required lesson name and renders raw `lesson.name`. `src/app/(authenticated)/admin/lessons/page.tsx:95-96`, `src/db/schema/courses.ts:328-330`
- Fix: Supply `Untitled lesson` only when corrupted/legacy-mapped record is blank.

## G2-8-016-031  [P3] GAP  facet F18  effort M
- Legacy: Legacy label Core course or Elective from isMandatory comment (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/SemesterCourse.java:31-32`)
- vNext now: New type CORE/ELECTIVE enum (`src/db/schema/courses.ts:107-110`)
- Fix: Use exact legacy display labels rather than raw uppercase enum
