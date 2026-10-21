# Work packet: edit src/db/schema/courses.ts (part 4 of 6)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/college-admin-courses.md, docs/audit/gap2/lane-3/course-search-controller.md, docs/audit/gap2/lane-3/lesson-content-controller.md, docs/audit/gap2/lane-3/student-course-controller.md, docs/audit/gap2/lane-4/l14-u027-faculty-course-association-controller.md, docs/audit/gap2/lane-4/learner-content-progress-model.md

## G2-3-008-077  [P1] GAP  facet F22  effort L
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:90-94`
- vNext now: `src/db/schema/courses.ts:34-85`
- Fix: Old active/enabled independent flags and allowedForDisplay boolean/integer vs single status enum; course visibility semantics not structurally equivalent.

## G2-3-008-078  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:468-486`
- vNext now: `src/db/schema/courses.ts:34-85`
- Fix: Legacy dept numeric ID, course slug and soft-delete vs UUID FK and unique active department name+code constraints; verify name duplication and restorability.

## G2-3-014-052  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/courses/CourseSearchCache.java:94-129`
- vNext now: `src/db/schema/courses.ts:34-81`, `88-154`
- Fix: Legacy active course cache includes all active courses regardless of delivery/section then header restricts assigned; vNext learner uses delivery assignments and college catalogue uses status ACTIVE. Ensure one canonical visible-course predicate for each role.

## G2-3-027-082  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LessonContents.java:23-46`
- vNext now: `src/db/schema/courses.ts:371-471`
- Fix: Legacy lesson_contents numeric lesson/course/class/faculty IDs, active/enabled/deleted flags and optimistic version vs vNext UUID lessonContent/delivery/status/createdBy, playback schema; write explicit conversion matrix.

## G2-3-025-067  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/StudentCourseServiceImpl.java:183-239`
- vNext now: `src/db/schema/courses.ts:88-150`
- Fix: Legacy semester_course mappings include mandatory/order/credits and course allowedForDisplay; vNext course_offerings carry type/credits/displayOrder/status with different constraints.

## G2-14-027-002  [P1] GAP  facet F01  effort M
- Legacy: Legacy faculty/course link has no class/semester, globally identified by two integers `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/FacultyCourseAssociation.java:12-23`
- vNext now: New one faculty membership to one courseSectionDelivery in class/term `src/db/schema/courses.ts:228-242`
- Fix: Add compatibility read aggregation by course across deliveries and define default scope.

## G2-14-027-006  [P1] GAP  facet F04  effort M
- Legacy: FacultyCourseAssociation id Long, facultyId/courseId int, active int `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/FacultyCourseAssociation.java:12-23`
- vNext now: New id UUID, deliveryId UUID, membershipId UUID, role enum, timestamps `src/db/schema/courses.ts:228-255`
- Fix: Define legacy ID map, active state migration and course-to-class delivery expansion.

## G2-14-027-031  [P1] GAP  facet F12  effort M
- Legacy: Legacy model permits multiple rows for same faculty and course without uniqueness stated `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/FacultyCourseAssociation.java:9-23`
- vNext now: New active unique by deliveryId/memberId/role, one primary per delivery `src/db/schema/courses.ts:263-276`
- Fix: Define intentional dedup, no accidental duplicate source conversion.

## G2-14-027-047  [P1] GAP  facet F22  effort M
- Legacy: Legacy faculty_course_associations 4 columns id/faculty_id/course_id/active `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/FacultyCourseAssociation.java:9-23`
- vNext now: New teaching assignments id/delivery/member/role/start/end/audit times and unique indexes `src/db/schema/courses.ts:228-283`
- Fix: Build schema-level migration preserving old faculty-course membership and inactive history.

## G2-4-019-011  [P1] GAP  facet F04  effort L
- Legacy: Legacy learnerId integer, lessonContentId integer. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LearnerContentProgress.java:21-25`)
- vNext now: New membershipId and lessonContentId UUID foreign keys. (`src/db/schema/courses.ts:475-488`)
- Fix: Map legacy integer learner and content IDs to scoped UUIDs.

## G2-4-019-012  [P1] GAP  facet F04  effort M
- Legacy: Legacy lastPositionSeconds nonnull int0 and durationSeconds nonnull int0. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LearnerContentProgress.java:27-31`)
- vNext now: New lastPositionSeconds nonnull int0 but no durationSeconds in progress row; read from content metadata. (`src/db/schema/courses.ts:489-501`; `src/modules/courses/progress-service.ts:70-76`)
- Fix: Preserve duration from legacy when authored content duration missing.

## G2-4-019-013  [P1] GAP  facet F04  effort M
- Legacy: Legacy completedAt first mark, firstCompletedAt immutable within attempt. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LearnerContentProgress.java:33-40`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerContentProgressServiceImpl.java:176-187`)
- vNext now: New DB has both but write service only persists completedAt; firstCompletedAt not populated. (`src/db/schema/courses.ts:494-501`; `src/modules/courses/progress-service.ts:308-317`)
- Fix: Write immutable firstCompletedAt in same transaction for first completion.

## G2-4-019-014  [P1] GAP  facet F04  effort L
- Legacy: Legacy attempt default1, earlier attempts immutable history. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LearnerContentProgress.java:42-51`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/LearnerContentProgressRepository.java:15-22`)
- vNext now: New attempt column default1 but unique index prevents multiple attempts per membership/content. (`src/db/schema/courses.ts:501-519`)
- Fix: Change unique index to membership-content-attempt and select max attempt in all reads.

## G2-4-019-044  [P1] GAP  facet F12  effort M
- Legacy: Legacy firstCompletedAt is immutable when completed false clears completedAt. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LearnerContentProgress.java:36-40`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerContentProgressServiceImpl.java:176-187`)
- vNext now: New schema has firstCompletedAt but does not populate on completion path. (`src/db/schema/courses.ts:497-501`; `src/modules/courses/progress-service.ts:241-249`)
- Fix: Set audit field once, keep it across unmark and retake attempt scope.

## G2-4-019-047  [P1] GAP  facet F12  effort L
- Legacy: Legacy retake resets completedAt AND firstCompletedAt for new attempt, but prior row stays. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/LearnerContentProgressRepository.java:45-56`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/LearnerContentProgressRepository.java:66-80`)
- vNext now: New one-row unique record cannot retain historic completed attempt. (`src/db/schema/courses.ts:513-519`)
- Fix: Persist separate attempts and restore fresh first-completion tracking.

## G2-4-019-064  [P1] GAP  facet F19  effort M
- Legacy: Legacy current attempt lookup index (learner,content,attempt DESC). (`docs/legacy-source/backend/src/main/resources/db/migration/V132__learner_content_progress_attempt.sql:26-32`)
- vNext now: New unique membership+content excludes attempt, no descending attempt read index. (`src/db/schema/courses.ts:513-525`)
- Fix: Register attempt composite unique and lookup indexes with migration.

## G2-4-019-067  [P1] GAP  facet F20  effort M
- Legacy: Legacy admin retake reset is explicit, not inferred from batch semester changes. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminLearnerProgressController.java:28-37`)
- vNext now: New progress row tied to membership/content, no automatic retake selector. (`src/db/schema/courses.ts:475-535`)
- Fix: Avoid silently retaining completion on course repeat; require deliberate admin reset.

## G2-4-019-070  [P1] GAP  facet F22  effort L
- Legacy: Legacy V132 adds attempt unique learner-content-attempt, retaining historical runs. (`docs/legacy-source/backend/src/main/resources/db/migration/V132__learner_content_progress_attempt.sql:19-32`)
- vNext now: New schema attempt column but unique membership-content only, mismatched constraint. (`src/db/schema/courses.ts:501-519`)
- Fix: Migrate index, enforce integer attempt>=1 and modify reads.

## G2-4-019-071  [P1] GAP  facet F22  effort L
- Legacy: Legacy progress row stores duration_seconds, firstCompletedAt, completedAt plus attempt. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LearnerContentProgress.java:27-51`)
- vNext now: New omits durationSeconds in row; has firstCompletedAt column but lacks write. (`src/db/schema/courses.ts:489-501`; `src/modules/courses/progress-service.ts:230-270`)
- Fix: Complete missing progress metadata and immutable first-completion lifecycle.

## G2-4-011-057  [P1] GAP  facet F12  effort M
- Legacy: Role PRIMARY and is_active true defaults, optional academic year string. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:211-216`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/FacultyTeachingAssignment.java:39-47`)
- vNext now: Role PRIMARY and active derived from endedAt. (`src/components/admin/super-admin-faculty-assignment-create.tsx:26-26`; `src/db/schema/courses.ts:242-250`)
- Fix: Specify boolean-to-timestamp lifecycle mapping.
