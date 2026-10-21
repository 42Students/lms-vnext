# Work packet (wave 2): edit src/db/schema/courses.ts (part 1 of 2)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/courses.md, docs/audit/gap2/lane-12/l19-u019-faculty-teaching-assignment.md, docs/audit/gap2/lane-14/l18-u018-lesson.md, docs/audit/gap2/lane-15/u003-superadmin-lessons.md, docs/audit/gap2/lane-18/u001-faculty-course-tab.md, docs/audit/gap2/lane-18/u002-superadmin-lessons.md

## G2-12-003-058  [P2] GAP  facet F12  effort S
- Legacy: Course dates,parent,type,category,price and allowedForDisplay preserved on update `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:233-250`
- vNext now: No corresponding date, parent, type, category or amount columns `src/db/schema/courses.ts:34-64`
- Fix: Document removed legacy fields and feature boundaries

## G2-12-003-089  [P2] GAP  facet F23  effort S
- Legacy: Legacy parent course, dates, amount, type/category retained but hidden in form `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:37-40,229-253`
- vNext now: VNext drops these columns from normalized course model `src/db/schema/courses.ts:34-64`
- Fix: Document intentional removal and no migration requirement

## G2-19-019-009  [P2] GAP  facet F04  effort S
- Legacy: FacultyTeachingAssignment.java:42-44 enum TeachingRole defaults PRIMARY
- vNext now: src/db/schema/courses.ts:242 courseTeachingRoleEnum NOT NULL; caller must provide role
- Fix: Default PRIMARY at form/validator or explicitly require choice; map unknown role rejection

## G2-19-019-011  [P2] GAP  facet F04  effort M
- Legacy: FacultyTeachingAssignment.java:33-34 batchId denormalized for queries
- vNext now: src/db/schema/courses.ts:156-177 delivery->offering->cohort; no direct batchId
- Fix: Verify batch relation historical identity remains immutable when faculty/section is transferred

## G2-19-019-035  [P2] GAP  facet F12  effort S
- Legacy: FacultyTeachingAssignment.java:42-47 isActive true and role PRIMARY default
- vNext now: src/db/schema/courses.ts:242-260 role and endedAt null means active
- Fix: Preserve lifecycle projection active false from endedAt, no absent default role

## G2-19-019-049  [P2] GAP  facet F20  effort M
- Legacy: FacultyTeachingAssignment.java:49-53 java.sql.Date start/end
- vNext now: src/db/schema/courses.ts:243-250 timestamptz startedAt/endedAt and faculty-course-service.ts:180-198 active gating
- Fix: Validate Asia/Kolkata date-only mapping, midnight and date range inclusivity, avoid treating date as instant incorrectly

## G2-19-019-053  [P2] GAP  facet F22  effort M
- Legacy: FacultyTeachingAssignment.java:30-34 nullable batchId denormalization to expedite reads
- vNext now: src/db/schema/academics.ts:400-448 section grant plus courses.ts:156-199 active section/delivery link
- Fix: Reconstruct historical cohort even if section/cohort moves, do not treat section-level grant as course grant

## G2-18-018-001  [P2] GAP  facet F01  effort M
- Legacy: Lesson is an academic structure under `course_id`; UI authored in admin Lessons console; `LessonController.java:56-73,139-174`.
- vNext now: `src/app/(authenticated)/college/lessons/page.tsx:17-80` entry; content under learning path (`src/db/schema/courses.ts:320-328`).
- Fix: Verify old breadcrumb/selected course → new offering/path selection preserving legacy course context while retaining vNext path architecture.

## G2-18-018-004  [P2] GAP  facet F03  effort S
- Legacy: Response property `courseSlug` is computed-only, not persisted (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Lesson.java:26-28`; LessonServiceImpl.java:174-184).
- vNext now: `src/db/schema/courses.ts:320-328` has learningPathId but no `courseSlug`; UI filters `src/app/(authenticated)/college/lessons/page.tsx:27-40` include courseCode.
- Fix: Show original course slug/code beside lesson or retain route resolver so admin can reach same lesson from a course.

## G2-18-018-009  [P2] GAP  facet F04  effort M
- Legacy: `@Transient courseSlug` populated per lesson on GET (`LessonServiceImpl.java:174-184`).
- vNext now: `src/db/schema/courses.ts:320-341` none; vNext has course relationships.
- Fix: Expose derived `courseCode`/`slug` in read models where old labels and exports refer to it.

## G2-18-018-048  [P2] GAP  facet F21  effort S
- Legacy: JPA auditing listener and Spring timestamps update entity (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Lesson.java:13-15`; docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BaseModel.java:28-34).
- vNext now: Postgres `createdAt/updatedAt` default now; vNext service explicitly sets updatedAt and activity event (`src/db/schema/courses.ts:335-344`; lesson-service.ts:201-228).
- Fix: Ensure automatic updatedAt for EVERY mutation including direct SQL and archive/restore, then compare activity-log labels.

## G2-18-018-052  [P2] GAP  facet F23  effort S
- Legacy: Legacy `courseSlug` is transient, old records need `courseId`; no record migration requested (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Lesson.java:18-28`).
- vNext now: vNext read models use UUID path, no numeric legacy ids (`src/db/schema/courses.ts:320-341`).
- Fix: Explicitly mark no-migration decision and create a crosswalk only if importing data later.

## G2-15-003-015  [P2] GAP  facet F04  effort S
- Legacy: Lesson title fallback `Untitled lesson` when missing (`sections/Lessons.js:21-24`).
- vNext now: `lesson.name` used directly, DB name nonnull (`admin/lessons/page.tsx:93-96`; `courses.ts:329-334`).
- Fix: Show `Untitled lesson` diagnostic for corrupt/incomplete migrated values; keep consistent disabled actions.

## G2-18-001-101  [P2] GAP  facet F22  effort L
- Legacy: Legacy faculty_teaching_assignment keys numeric faculty_id/course_id/class_id; is_active flag, semester/year, role, dates. `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/FacultyTeachingAssignment.java:18-52`
- vNext now: vNext course_teaching_assignments keys UUID membership_id+delivery_id, uses started_at/ended_at and joins cohort/academic period. `src/db/schema/courses.ts:228-283`, `src/modules/courses/faculty-course-service.ts:103-201`
- Fix: Document migration equivalence and old link mapping; retain active scope/tenant rules and role semantics.

## G2-18-001-102  [P2] GAP  facet F22  effort M
- Legacy: Legacy lesson table uses lesson_name, course_id, active/enabled, sequence, version. `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Lesson.java:15-40`
- vNext now: vNext course_lessons UUID learning_path_id, name, status/sequence with uniqueness and active indexes. `src/db/schema/courses.ts:320-360`, `drizzle/0004_courses_c2_learning.sql:15-24`
- Fix: Specify mapping of active/enabled/version semantics to status and optimistic concurrency; verify migrated content order.

## G2-18-001-103  [P2] GAP  facet F22  effort L
- Legacy: Legacy course route context identifies numeric course, class IDs independently of course offering. `docs/legacy-source/frontend/src/pages/teacher/courses/[courseId]/[...courseTab].js:60-127`
- vNext now: vNext normalized course offerings, section deliveries and teaching assignments enforce membership join. `src/db/schema/courses.ts:88-201`, `src/db/schema/courses.ts:228-283`
- Fix: Inventory legacy `(course,class,term)` to vNext offering/delivery composite; no blind numeric ID reassignment.

## G2-18-002-074  [P2] GAP  facet F12  effort M
- Legacy: Legacy max length 255 at UI+DTO, case-insensitive lesson uniqueness per course. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:46-50`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/LessonDTO.java:11-18`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LessonServiceImpl.java:120-127`
- vNext now: vNext name max255 and unique lower(name) per learningPath, so same name allowed in another offering. `src/components/courses/super-admin-lesson-create.tsx:51-54`, `src/db/schema/courses.ts:351-357`
- Fix: Document that uniqueness scope changed from course to offering; decide expected cross-section duplicate treatment.

## G2-18-002-119  [P2] GAP  facet F22  effort L
- Legacy: Legacy `lesson` int ID and numeric course_id, lesson_name, active, enabled, sequence, version. `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Lesson.java:15-40`
- vNext now: vNext course_lessons UUID id, learning_path_id, name, description, status ACTIVE/ARCHIVED, visible_to_students, sequence, timestamptz. `src/db/schema/courses.ts:320-345`
- Fix: Map entity fields and numeric→UUID IDs; decide how active+enabled influences status and visibility.

## G2-18-002-121  [P2] GAP  facet F22  effort M
- Legacy: Legacy new lesson sequence appends to max integer, sequence starts at 1. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LessonServiceImpl.java:130-136`
- vNext now: vNext uses zero-based sequence and max at 10000, SQL sequence >=0 check. `src/components/courses/super-admin-lesson-create.tsx:27-29`, `src/db/schema/courses.ts:360-365`
- Fix: Normalize display +1 on reads, map legacy 1-based values to 0-based DB; enforce cap at server.

## G2-18-002-122  [P2] GAP  facet F22  effort M
- Legacy: Legacy soft delete `is_deleted` and child deleted_with_lesson marker. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LessonServiceImpl.java:344-392`
- vNext now: vNext archive status enum with parent path and child retained, restore service. `src/modules/courses/lesson-service.ts:238-336`, `src/db/schema/courses.ts:332-334`
- Fix: Specify archive/restore semantics for individual vs parent-hidden contents and preserve no-resurrection policy.

## G2-18-003-096  [P2] GAP  facet F18  effort S
- Legacy: Legacy `Hidden from students` warning and help nothing deleted. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:90-94`
- vNext now: vNext status/ARCHIVED display only. `src/db/schema/courses.ts:51-54`, `src/components/courses/admin-course-overview.tsx:146-160`
- Fix: Add same warning on off state, do not equate archived with hidden.

## G2-18-003-111  [P2] GAP  facet F22  effort M
- Legacy: Legacy lesson dependencies direct courseId, deletion prevented by child existence. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:487-513`
- vNext now: vNext courses -> offerings -> learningPaths -> lessons, with independent lifecycle. `src/db/schema/courses.ts:88-201`, `src/db/schema/courses.ts:286-348`
- Fix: Document graph/archival cascade and count source for blocked archive.

## G2-19-019-063  [P2] GAP  facet F20  effort M
- Legacy: Old repository first eligible course/class sorts lowest ID then page limit1 to avoid multiple co-teacher query failure. `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/FacultyTeachingAssignmentRepository.java:86-100`
- vNext now: vNext sort role/displayName and restrict single active primary per delivery. `src/modules/courses/teaching-assignment-service.ts:133-136` `src/db/schema/courses.ts:270-276`
- Fix: Document first-teacher resolution for legacy class/course-only consumers.

## G2-19-002-033  [P2] GAP  facet F06  effort M
- Legacy: Legacy sequence default 1 (UI) and points hidden 0 `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1545-1555`
- vNext now: vNext authoring selected lesson next sequence from max+1, course DB points default 1 `src/modules/courses/super-admin-content-authoring-service.ts:18` `src/db/schema/courses.ts:390-400`
- Fix: Map legacy sequence/point defaults; keep valid zero-based storage and intended scoring.

## G2-19-002-097  [P2] GAP  facet F22  effort S
- Legacy: Legacy content points defaults 0 in page and may be long `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:629-639` `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1551-1553`
- vNext now: vNext integer points default 1 bounded 0-1000 `src/db/schema/courses.ts:392-393` `src/db/schema/courses.ts:437`
- Fix: Align display/migration for zero-point content and enforce bounds explicitly.

## G2-2-015-093  [P2] GAP  facet F22  effort L
- Legacy: Legacy progress record contains learner id, lesson_content id, completed time, soft-delete and attempt `docs/legacy-source/backend/src/main/resources/db/migration/V132__learner_content_progress_attempt.sql:19-32`
- vNext now: vNext table has UUID membership/content, completedAt, firstCompletedAt and attempt but no row soft-delete/duration `src/db/schema/courses.ts:475-534`
- Fix: Reconcile legacy soft-delete and stored duration semantics while preserving vNext firstCompletedAt and attempt fields

## G2-2-017-010  [P2] GAP  facet F04  effort M
- Legacy: New rows copy duration, set position zero and leave completion null `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/LearnerContentProgressRepository.java:66-80`
- vNext now: New schema stores position/completedAt/attempt but duration belongs to content `src/db/schema/courses.ts:475-501`
- Fix: Derive authored duration on reset; never copy prior completion flags

## G2-2-017-036  [P2] GAP  facet F12  effort M
- Legacy: Copies duration only, deliberately excludes completedAt and firstCompletedAt `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/LearnerContentProgressRepository.java:67-76`
- vNext now: vNext firstCompletedAt and attempt exist; no progress duration field `src/db/schema/courses.ts:489-501`
- Fix: Use content duration, reset both completion timestamps

## G2-2-017-051  [P2] GAP  facet F19  effort M
- Legacy: Latest-attempt MAX lookups backed by attempt-desc index `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/LearnerContentProgressRepository.java:29-43,101-106`
- vNext now: Current schema has membership/content unique and single-column indexes, no attempt-desc `src/db/schema/courses.ts:514-525`
- Fix: Add composite current-attempt lookup index

## G2-2-017-055  [P2] GAP  facet F20  effort M
- Legacy: Repeat no-progress remains no-op; successive actual resets increment attempt `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminLearnerProgressController.java:97-110`
- vNext now: Schema records attempt but has no admin increment path `src/db/schema/courses.ts:497-501`
- Fix: Add confirmation/idempotency token for accidental double click

## G2-2-017-058  [P2] GAP  facet F22  effort M
- Legacy: Legacy row has learnerId,contentId,duration,completedAt,firstCompletedAt,attempt `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LearnerContentProgress.java:21-51`
- vNext now: New UUID membership/content, firstCompletedAt and attempt; duration only on content `src/db/schema/courses.ts:475-534`
- Fix: Document identity+duration mapping and first-completion retention

## G2-2-018-069  [P2] GAP  facet F22  effort M
- Legacy: LessonServiceImpl.java:271-334 name uniqueness, sequence collision constraints and version; bulk preserves these
- vNext now: src/db/schema/courses.ts:347-359 path-scoped active name/sequence unique indexes
- Fix: Specify college/course vs learning-path uniqueness migration and preserve current name/order.

## G2-20-026-004  [P2] GAP  facet F04  effort M
- Legacy: Old numeric courseSlug/courseId fallback docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonController.java:173-181
- vNext now: New UUID learningPath/courseLesson IDs src/db/schema/courses.ts:320-331
- Fix: Adapt slugs and deep links

## G2-20-026-024  [P2] GAP  facet F22  effort L
- Legacy: Legacy Lesson/Contents JPA and deleted flags docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonController.java:3-12
- vNext now: New UUID courseLessons/lessonContents, status/sequence indexes src/db/schema/courses.ts:320-435
- Fix: Write field migration crosswalk

## G2-3-008-054  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:25-31`
- vNext now: `src/db/schema/courses.ts:34-64`
- Fix: Legacy optional course start/end dates and price/category/type preserved, vNext typed course schema excludes these metadata fields. Clarify intentional parity waiver.

## G2-3-014-010  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/courses/CourseSearchCache.java:134-146`
- vNext now: `src/modules/courses/college-course-catalogue-service.ts:53-64`, `src/db/schema/courses.ts:34-64`
- Fix: Legacy cache includes only active courses but preserves enabled flag and slug; vNext catalogue active filter and course UUID records do not expose legacy slug/enabled in search. Define display/disabled behavior for status and active offering.

## G2-3-014-014  [P2] MISSING  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/courses/CourseSearchController.java:238-267`
- vNext now: `src/modules/courses/college-course-catalogue-service.ts:24-29`, `src/db/schema/courses.ts:34-41`
- Fix: Legacy list categories sorted case-insensitive and category named department lookup; vNext catalogue has departmentName in rows but no matching global category API. Implement allowed category name list and lookup.

## G2-3-014-051  [P2] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/courses/CourseSearchDTO.java:19-26`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/courses/CourseSearchCache.java:134-146`
- vNext now: `src/db/schema/courses.ts:34-81`
- Fix: Legacy CourseSearchDTO expects course slug, active and enabled flags, shortTitle, deptId/name; vNext courses normalized UUID/department FK/status and offer deliveries, no same DTO. Add query projection with slug compatibility.

## G2-3-014-053  [P2] MISSING  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/core/GenericSearchCache.java:34-49`, `256-261`
- vNext now: `src/db/schema/courses.ts:34-81`
- Fix: Legacy in-memory usageCounts popularity not persisted, vNext schema has no course popularity count table. Add ephemeral or durable scoped counter for ranking with privacy controls.

## G2-3-025-015  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/StudentCourseServiceImpl.java:230-239`
- vNext now: `src/db/schema/courses.ts:43-50`
- Fix: Resolve legacy courseCode preference (metadata.courseCode then short title) against vNext code/officialCode/shortTitle; avoid silently changing code display.
