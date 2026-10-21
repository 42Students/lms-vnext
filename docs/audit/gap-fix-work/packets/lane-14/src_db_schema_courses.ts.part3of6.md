# Work packet: edit src/db/schema/courses.ts (part 3 of 6)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/u002-superadmin-lessons.md, docs/audit/gap2/lane-18/u003-superadmin-courses.md, docs/audit/gap2/lane-19/faculty-teaching-assignment-entity.md, docs/audit/gap2/lane-19/lesson-content.md, docs/audit/gap2/lane-2/admin-course-progress-controller.md, docs/audit/gap2/lane-2/admin-learner-progress-controller.md

## G2-18-002-076  [P1] GAP  facet F12  effort L
- Legacy: Legacy visible iff active and enabled; bulk set both at once. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:56-60`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:346-367`
- vNext now: vNext visibleToStudents independent of status, path publish and item publish; bulk affects item flags only. `src/db/schema/courses.ts:332-334`, `src/components/courses/college-lesson-visibility-controls.tsx:19-45`, `src/modules/courses/super-admin-lesson-bulk-visibility.ts:32-64`
- Fix: Unify effective visibility calculation/UI and bulk semantics to avoid divergent selection outcomes.

## G2-18-002-120  [P1] GAP  facet F22  effort M
- Legacy: Legacy uniqueness implemented by service case-insensitive name per course, sequence collision on updates. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LessonServiceImpl.java:120-127`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LessonServiceImpl.java:278-333`
- vNext now: vNext SQL unique active name and active sequence per learningPath. `src/db/schema/courses.ts:348-360`, `drizzle/0004_courses_c2_learning.sql:73-79`
- Fix: Reconcile course-wide vs path-wide uniqueness and sequence shape; avoid data loss if multiple offerings.

## G2-18-003-024  [P1] GAP  facet F04  effort M
- Legacy: Legacy In this Course heading, description and ordered bullet takeaways. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:64-75`
- vNext now: vNext name/code/description/takeaways, without distinct heading field in course table. `src/db/schema/courses.ts:34-61`, `src/components/courses/admin-course-actions.tsx:213-242`
- Fix: Restore persisted introduction heading and rich ordered takeaways for old course overview rendering.

## G2-18-003-071  [P1] GAP  facet F12  effort L
- Legacy: Legacy active&&enabled drives Visible/Hidden; allowedForDisplay ignored. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:90-94`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:595-605`
- vNext now: vNext Course status ACTIVE/ARCHIVED, bulk published content flag independent. `src/db/schema/courses.ts:51-54`, `src/components/courses/super-admin-course-bulk-visibility.tsx:23-48`
- Fix: Unify meaning of `visible to students` for base Course vs descendant content.

## G2-18-003-074  [P1] GAP  facet F12  effort L
- Legacy: Legacy course metadata image+color, takeaways and intro heading required. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:64-89`
- vNext now: vNext retains color/takeaways/description but drops heading/image in base course schema. `src/db/schema/courses.ts:34-61`, `src/modules/courses/validation.ts:24-45`
- Fix: Restore image+intro heading and ordered takeaways representation.

## G2-18-003-109  [P1] GAP  facet F22  effort L
- Legacy: Legacy Course entity numeric id + deptId + metadata JSON, active/enabled/allowedForDisplay. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:20-24`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:37-40`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:90-94`
- vNext now: vNext `courses` UUID with departmentId/name/code/status/shortTitle/officialCode/cardColor/takeaways/description. `src/db/schema/courses.ts:34-61`
- Fix: Produce mapping table for metadata image, intro heading, visibility flags, short/title, code and dates.

## G2-18-003-110  [P1] GAP  facet F22  effort M
- Legacy: Legacy shortTitle max64 and optional courseCode40; vNext shortTitle120, required code64 with DB uniqueness. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:50-61`
- vNext now: vNext validation plus unique code/name in department. `src/modules/courses/validation.ts:16-45`, `src/modules/courses/course-service.ts:51-126`, `src/db/schema/courses.ts:66-78`
- Fix: Document constraint collisions and migration/coercion, test longest persisted values.

## G2-19-019-067  [P1] GAP  facet F22  effort L
- Legacy: Old JPA table faculty_teaching_assignment with int generated key and faculty/course/class/batch int columns. `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/FacultyTeachingAssignment.java:16-40` `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BaseModel.java:22-37`
- vNext now: vNext course_teaching_assignments UUID key plus delivery/membership FKs and timestamps. `src/db/schema/courses.ts:228-260`
- Fix: Design explicit old-to-new join migration including school year/semester and active/deleted states.

## G2-19-019-068  [P1] GAP  facet F22  effort L
- Legacy: Old role string enum PRIMARY CO_TEACHER TA; active and is_deleted booleans and SQL DATE range. `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/FacultyTeachingAssignment.java:42-53` `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BaseModel.java:36-37`
- vNext now: vNext enum role, end timestamp and start TIMESTAMPTZ with active-primary partial index. `src/db/schema/courses.ts:242-276`
- Fix: Backfill role/defaults/dates precisely; resolve second-primary conflicts without data loss.

## G2-19-002-034  [P1] GAP  facet F06  effort M
- Legacy: Legacy `Visible to students` checkbox defaults true `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1554-1556`
- vNext now: vNext content DB visible true but lifecycle status DRAFT until explicit Publish `src/db/schema/courses.ts:400-404` `src/components/courses/super-admin-content-actions.tsx:124-126`
- Fix: Explain create visibility transition and preserve explicit draft/publish controls without accidental learner exposure.

## G2-19-002-051  [P1] GAP  facet F10  effort L
- Legacy: Legacy POST `/api/v1/lesson/contents/create` accepts LessonContentsDTO with faculty_id/course_id/class_id `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:214-279` `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/LessonContentsDTO.java:12-32`
- vNext now: vNext createLessonContent takes lessonId/deliveryId and createdByUserId, validated transaction `src/modules/courses/lesson-content-service.ts:395-460` `src/db/schema/courses.ts:374-408`
- Fix: Map faculty association and class scoping before treating write paths as equivalent.

## G2-19-002-092  [P1] GAP  facet F22  effort L
- Legacy: Legacy `lesson_contents` single row includes `courseId`, `classId`, `facultyId`, data JSON, active/enabled, sequence, points, deadline `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LessonContents.java:23-58`
- vNext now: vNext row references lessonId/deliveryId, typed externalUrl/storageKey/duration, status, visible, starts/ends; no deadline field `src/db/schema/courses.ts:371-420`
- Fix: Create field migration mapping including faculty attribution, deadline, content JSON and legacy class scope.

## G2-19-002-094  [P1] GAP  facet F22  effort L
- Legacy: Legacy contentType string includes historical assignment/quiz/ppt/pdf etc in persisted generic rows `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LessonContents.java:35-41` `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:92-109`
- vNext now: vNext typed enum and shape constraint only RESOURCE,VIDEO,YOUTUBE,LIVE_CLASS `src/db/schema/courses.ts:443-469`
- Fix: Define import mapping for legacy content kinds; route assignments/quizzes to dedicated entities without loss.

## G2-19-002-095  [P1] GAP  facet F22  effort L
- Legacy: Legacy deadline persisted LocalDateTime/India serializer `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LessonContents.java:55-58` `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/LessonContentsDTO.java:34-47`
- vNext now: vNext core lesson_contents schema has no deadline column `src/db/schema/courses.ts:371-420`
- Fix: Audit dedicated assignment deadline storage and legacy content deadline records, preserve cutoff semantics.

## G2-2-015-092  [P1] GAP  facet F22  effort L
- Legacy: Migration V132 keys retakes using attempt column and unique (learner,content,attempt) `docs/legacy-source/backend/src/main/resources/db/migration/V132__learner_content_progress_attempt.sql:19-32`
- vNext now: vNext migration 0098 ADDS attempt, but the existing two-column unique membership/content index remains `drizzle/0098_academics_legacy_fidelity_columns.sql:3-10`; `src/db/schema/courses.ts:497-519`
- Fix: Replace two-column unique with membership/content/attempt and add indexed latest-attempt reads; do not add a duplicate attempt column

## G2-2-017-052  [P1] GAP  facet F20  effort L
- Legacy: Two admin resets can contend for same next attempt, unique triple enforces one row per attempt `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/LearnerContentProgressRepository.java:66-80`
- vNext now: Current two-column unique stops any attempt 2 insert despite 0098 `src/db/schema/courses.ts:514-519`
- Fix: Use transaction-level lock and replace two-column uniqueness

## G2-2-018-042  [P1] GAP  facet F12  effort M
- Legacy: Lesson.java:19-28 separate active and enabled booleans, plus order
- vNext now: src/db/schema/courses.ts:320-335 uses status ACTIVE/ARCHIVED and visibleToStudents bool
- Fix: Define explicit mapping for independent enabled/active states and ensure status transitions reversible.

## G2-2-018-068  [P1] GAP  facet F22  effort M
- Legacy: Lesson.java:14-39 legacy table `lesson` integer ID, course_id, active, enabled, sequence, version
- vNext now: src/db/schema/courses.ts:320-359 UUID `course_lessons` with path ID, status, visible flag, sequence, timestamps; no two independent flags
- Fix: Map all legacy columns and model independent lifecycle/access flags.

## G2-3-008-052  [P1] GAP  facet F12  effort L
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:90-94`
- vNext now: `src/db/schema/courses.ts:34-85`
- Fix: Legacy visible course is active+enabled toggles (hide reversible), vNext status ARCHIVED governs and archive may block active offerings; offer reversible visibility action.

## G2-3-008-076  [P1] GAP  facet F22  effort L
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:229-253`
- vNext now: `src/db/schema/courses.ts:34-85`
- Fix: Legacy course_name,short_title,meta_data introducing HTML, image, takeaways, enabled/active differ from new name/code/shortTitle/cardColor/takeaways/status columns; map every field before parity fix.
