# Work packet: edit src/db/schema/courses.ts (part 1 of 6)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/courses.md, docs/audit/gap2/lane-12/l19-u019-faculty-teaching-assignment.md, docs/audit/gap2/lane-13/lesson-search-controller.md, docs/audit/gap2/lane-14/course-progress.md, docs/audit/gap2/lane-14/l18-u018-lesson.md

## G2-12-003-055  [P1] GAP  facet F12  effort S
- Legacy: Learner visibility from active AND enabled, combined in per-course switch and bulk `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:90-94,600-602`
- vNext now: Course status ACTIVE/ARCHIVED, no enabled separate field `src/db/schema/courses.ts:34-53`
- Fix: Specify how hidden but nonarchived course persists

## G2-12-003-084  [P1] GAP  facet F22  effort M
- Legacy: Legacy course table id int, contents JSON MetaData, deptId int, active/enabled, slug, version `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Course.java:17-57`
- vNext now: VNext UUID course row with status enum and flatten metadata columns `src/db/schema/courses.ts:34-63`
- Fix: Map removed JSON fields/slug/version and state

## G2-19-019-002  [P1] GAP  facet F01  effort M
- Legacy: FacultyTeachingAssignment.java:12-15 defines who teaches what in a class for semester/year
- vNext now: src/db/schema/courses.ts:228-284 delivery-scoped course teacher grant and src/db/schema/academics.ts:400-448 section-level teacher grant
- Fix: Use delivery-scoped grant for actual content permissions and section grant only for section responsibilities

## G2-19-019-008  [P1] GAP  facet F04  effort L
- Legacy: FacultyTeachingAssignment.java:24-40 faculty/course/class ints, batch optional, semesterNumber required, academicYear string
- vNext now: src/db/schema/courses.ts:228-241 membershipId/deliveryId UUID; courseSectionDeliveries.ts:156-177 delivery plus offering->period/cohort references
- Fix: Document joins resolving all legacy IDs, batch/semester/year and preserving historical term after promotion

## G2-19-019-010  [P1] GAP  facet F04  effort M
- Legacy: FacultyTeachingAssignment.java:46-53 isActive true; startDate/endDate java.sql.Date nullable (date-only)
- vNext now: src/db/schema/courses.ts:243-260 timestamptz startedAt defaultNow and endedAt nullable
- Fix: Preserve date-only start/end contract vs instant timestamps in API labels and semester-bound filtering

## G2-19-019-037  [P1] GAP  facet F12  effort M
- Legacy: FacultyTeachingAssignment.java:49-53 explicit startDate/endDate may encode future-dated grants
- vNext now: src/db/schema/courses.ts:243-260 startedAt defaultNow and endedAt only, faculty-course-service.ts:180-198 active if endedAt null
- Fix: Enforce future start and scheduled end cutoff in authorization or formally document non-equivalence

## G2-19-019-048  [P1] GAP  facet F20  effort L
- Legacy: FacultyTeachingAssignmentRepository.java:124-139 bulk promotion updates deactivation by class/semester or batch/semester
- vNext now: src/db/schema/courses.ts:243-260 endedAt grant and immutable offering periods
- Fix: Serialize promotion against new assignment creation/role edits with version, no surviving old-term active grants

## G2-19-019-051  [P1] GAP  facet F22  effort L
- Legacy: FacultyTeachingAssignment.java:18-53 table faculty_teaching_assignment fields id/faculty_id/course_id/class_id/batch_id/semester_number/academic_year/role/is_active/start_date/end_date + BaseModel softdelete
- vNext now: src/db/schema/courses.ts:228-284 course_teaching_assignments uuid delivery/membership/role/started/ended/created/updated; no literal term/batch/year columns
- Fix: Create explicit legacy->vNext projection map via sections/cohorts/offering program term, handle soft delete and nullable dates

## G2-19-019-052  [P1] GAP  facet F22  effort L
- Legacy: FacultyTeachingAssignmentRepository.java:83-119 subset queries depend on faculty/class/course/semester relationship
- vNext now: src/db/schema/courses.ts:263-282 unique active delivery/membership/role and one PRIMARY per delivery
- Fix: Verify indexed joins support class+term, batch+term, faculty+course existence; apply migration constraints

## G2-13-013-033  [P1] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lessons/LessonSearchCache.java:50-55` filter l.isActive before loading (not isDeleted check)
- vNext now: `src/modules/courses/college-learning-directory-service.ts:109-110` only ACTIVE default; `src/db/schema/courses.ts:332-335` status and visibleToStudents
- Fix: Clarify mapping legacy active/is_deleted/enabled to vNext ACTIVE/ARCHIVED/visible flags and exclude soft-deleted where intended

## G2-13-013-054  [P1] GAP  facet F22  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Lesson.java:13-38` MySQL lesson int id, lesson_name,course_id,active,enabled,sequence,version,BaseModel is_deleted
- vNext now: `src/db/schema/courses.ts:320-367` Postgres course_lessons UUID,learning_path_id,name,description,sequence,status,visible_to_students; `drizzle/0004_courses_c2_learning.sql:15-25`
- Fix: Produce field-level legacy→vNext mapping including course ancestry and archived/deleted/visibility/version semantics

## G2-14-003-078  [P1] GAP  facet F22  effort L
- Legacy: Legacy lesson_contents classId/video/youtube/assignment and quizzes table, student_assignment & learner_content_progress; vNext course_offerings/course_section_deliveries/course_assignments/quiz_attempts — `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:68-72,115-149,167-183`
- vNext now: `src/modules/courses/super-admin-student-course-progress.ts:40-77,78-114`; `src/db/schema/courses.ts:88-140`
- Fix: Document table/column mapping for legacy lesson-content assignment vs new course assignment and class scope

## G2-18-018-005  [P1] GAP  facet F03  effort M
- Legacy: `active`, `enabled` distinct booleans (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Lesson.java:20-23`).
- vNext now: `src/db/schema/courses.ts:332-335` status+visibleToStudents, not an independent pair.
- Fix: Decide and document mapping for all four old flag combinations; add independent flags if still needed for legacy semantics.

## G2-18-018-007  [P1] GAP  facet F04  effort L
- Legacy: `courseId` primitive int and optional transient courseSlug (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Lesson.java:18-19,26-28`).
- vNext now: `learningPathId` UUID FK restrict (`src/db/schema/courses.ts:323-327`).
- Fix: Document course→offering→learning-path mapping for section/semester contexts; never join numeric legacy id directly to UUID.

## G2-18-018-008  [P1] GAP  facet F04  effort S
- Legacy: `sequence` Java long (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Lesson.java:24-25`), legacy may autoallocate from max+1 (`LessonServiceImpl.java:133-142`).
- vNext now: `src/db/schema/courses.ts:331` signed int; create schema `src/modules/courses/validation.ts:258-263` 0..10000.
- Fix: Specify range shrink and migration/large imported sequence policy; auto-select first free ordinal rather than exposing required number in UI if old create auto-appended.

## G2-18-018-013  [P1] GAP  facet F05  effort M
- Legacy: Lesson `getMaxSequenceByCourseId` ignores soft-deleted (`LessonRepository.java:30-33`).
- vNext now: `src/modules/courses/lesson-service.ts:132-150` inserts explicit input.sequence; unique index `src/db/schema/courses.ts:357-359`.
- Fix: Compute next sequence from active lessons automatically where old form omitted sequence; avoid accidental 0 duplicate.

## G2-18-018-015  [P1] GAP  facet F06  effort M
- Legacy: Legacy defaults `active=true`, `enabled=true`; sequence <=0 becomes `max+1` (`LessonServiceImpl.java:133-145`).
- vNext now: `src/db/schema/courses.ts:332-335` status ACTIVE and visibleToStudents true, create explicit sequence (`lesson-service.ts:139-148`).
- Fix: Retain distinct defaults and append ordering; cover omitted and zero sequence in UI API boundary.

## G2-18-018-034  [P1] GAP  facet F12  effort M
- Legacy: Legacy active/enabled independent flags, deleted separate (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Lesson.java:20-37`; BaseModel.java:36-37).
- vNext now: vNext status ACTIVE/ARCHIVED plus visibleToStudents boolean (`src/db/schema/courses.ts:332-335`).
- Fix: Create explicit truth table for legacy active/enabled/deleted vs vNext status/visibility, including learner-facing filtering.

## G2-18-018-045  [P1] GAP  facet F20  effort M
- Legacy: Legacy JPA @Version Long optimistic lock version nullable on new entity; documented merge/persist hazard (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Lesson.java:30-41`).
- vNext now: `src/db/schema/courses.ts:320-365` has NO version column; `lesson-service.ts:201-215` does not condition UPDATE on updatedAt.
- Fix: Add expectedUpdatedAt/version to edit DTO and conditional update in same transaction, like visibility writer `college-lesson-visibility-service.ts:57-69`; report stale conflict.

## G2-18-018-049  [P1] GAP  facet F22  effort L
- Legacy: Physical `lesson` table: integer PK, `lesson_name`, int `course_id`, boolean `active`,`enabled`,`is_deleted`, bigint `sequence`, bigint `version`, DATETIME timestamps (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Lesson.java:16-41`; docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BaseModel.java:22-37).
- vNext now: `course_lessons`: uuid PK, path FK, text name/description, int sequence, enum status, boolean visible, tz timestamps; no version (`src/db/schema/courses.ts:320-365`).
- Fix: Document per-column mapping or explicit intentional incompatible redesign; resolve independent booleans and version before parity acceptance.
