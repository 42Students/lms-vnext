# Work packet: edit src/modules/courses/progress-service.ts (part 1 of 2)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/syllabus-video.md, docs/audit/gap2/lane-2/admin-learner-progress-controller.md, docs/audit/gap2/lane-3/lesson-content-controller.md, docs/audit/gap2/lane-4/learner-content-progress-model.md

## G2-14-008-065  [P1] GAP  facet F22  effort L
- Legacy: Legacy learner_content_progress PK keyed learnerId/int lessonContentId, with percentWatched; vNext by membershipId/UUID lessonContentId, computed percent from authored duration — `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerContentProgressServiceImpl.java:68-85,121-156`; `docs/legacy-source/frontend/src/components/Course/Syllabus/ContentProgressBadge.jsx:19-26`
- vNext now: `src/modules/courses/progress-service.ts:45-103,172-199`
- Fix: Document data mapping of resume/percent/completedAt and legacy ID migration/test fixtures

## G2-2-017-009  [P1] MISSING  facet F04  effort M
- Legacy: New attempt response contains attempt, previousAttempt, contentItemsReset `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminLearnerProgressController.java:119-125`
- vNext now: Learner save response returns one per-content progress view only `src/modules/courses/progress-service.ts:334-457`
- Fix: Provide staff result DTO preserving three fields

## G2-2-017-011  [P1] GAP  facet F04  effort L
- Legacy: Earlier rows retained; reset visible immediately after mutation `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminLearnerProgressController.java:34-37`
- vNext now: Current read selects arbitrary row and writer updates by membership/content `src/modules/courses/progress-service.ts:172-198,253-268`
- Fix: Select and seed new current-attempt rows within transaction

## G2-2-017-018  [P1] MISSING  facet F07  effort M
- Legacy: HTTP 400 That course has no content to retake `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminLearnerProgressController.java:92-95`
- vNext now: Learner save endpoint has no course-wide no-content validation `src/modules/courses/progress-service.ts:334-457`
- Fix: Block no-content reset with same message and no write

## G2-2-017-023  [P1] MISSING  facet F08  effort M
- Legacy: Audit only for real new attempt, not no-progress branch `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminLearnerProgressController.java:110-124`
- vNext now: Activity emitted only for learner content completion `src/modules/courses/progress-service.ts:320-330`
- Fix: Record admin retake event only when new rows actually inserted

## G2-2-017-027  [P1] GAP  facet F10  effort L
- Legacy: Both learner and course access checked `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminLearnerProgressController.java:86-90`
- vNext now: Current learner endpoint checks own content/delivery access `src/modules/courses/progress-service.ts:106-169`
- Fix: Authorize both resources with college scope and enrollment verification

## G2-2-017-030  [P1] MISSING  facet F10  effort M
- Legacy: Audit LEARNER_PROGRESS_START_ATTEMPT records old/new attempt and course `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminLearnerProgressController.java:110-117`
- vNext now: New activity event solely learner-content-completed `src/modules/courses/progress-service.ts:320-330`
- Fix: Add retake audit event taxonomy and persisted actor metadata

## G2-2-017-032  [P1] MISSING  facet F11  effort M
- Legacy: Legacy integration denies foreign learner/course and learner-role use `docs/legacy-source/backend/src/test/java/com/_42students/lms/integration/AdminCourseProgressRetakeMySqlIT.java:217-256`
- vNext now: Only self-learner scope is implemented for existing API `src/modules/courses/progress-service.ts:106-169`
- Fix: Add exact cross-college and role-denial tests to new admin API

## G2-2-017-034  [P1] GAP  facet F12  effort M
- Legacy: No prior row returns alreadyFresh attempt=1 and performs no insert `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminLearnerProgressController.java:97-106`
- vNext now: Learner save inserts a first row on actual playback `src/modules/courses/progress-service.ts:409-422`
- Fix: Do not manufacture a row on first admin reset

## G2-2-017-035  [P1] GAP  facet F12  effort L
- Legacy: Copies current rows to attempt MAX+1, zeroes positions, retains old history `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/LearnerContentProgressRepository.java:66-80`
- vNext now: Read ignores attempt and UPDATE is membership/content only `src/modules/courses/progress-service.ts:172-198,253-268`
- Fix: Add latest-attempt-aware read and exact-attempt update

## G2-2-017-053  [P1] GAP  facet F20  effort L
- Legacy: Legacy save resolves highest attempt and recovers exact failed insert attempt `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerContentProgressServiceImpl.java:123-155`
- vNext now: New loads arbitrary row and updates membership/content without attempt CAS `src/modules/courses/progress-service.ts:172-198,253-268`
- Fix: Guard current attempt, do not touch historical run from stale tab

## G2-3-027-046  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:747-789`
- vNext now: `src/modules/courses/progress-service.ts:201-385`
- Fix: Legacy progress completed can be supplied by learner; vNext timed media computes watched threshold, handles unknown duration, and binds membership/delivery. Specify exact parity policy.

## G2-4-019-003  [P1] GAP  facet F01  effort M
- Legacy: Admin start-attempt checks learner AND course scope. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminLearnerProgressController.java:81-90`)
- vNext now: New per-content progress gate checks learner Section and offering/delivery visibility. (`src/modules/courses/progress-service.ts:106-169`)
- Fix: Revalidate learner and course in any new administrator retake route.

## G2-4-019-012  [P1] GAP  facet F04  effort M
- Legacy: Legacy lastPositionSeconds nonnull int0 and durationSeconds nonnull int0. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LearnerContentProgress.java:27-31`)
- vNext now: New lastPositionSeconds nonnull int0 but no durationSeconds in progress row; read from content metadata. (`src/db/schema/courses.ts:489-501`; `src/modules/courses/progress-service.ts:70-76`)
- Fix: Preserve duration from legacy when authored content duration missing.

## G2-4-019-013  [P1] GAP  facet F04  effort M
- Legacy: Legacy completedAt first mark, firstCompletedAt immutable within attempt. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LearnerContentProgress.java:33-40`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerContentProgressServiceImpl.java:176-187`)
- vNext now: New DB has both but write service only persists completedAt; firstCompletedAt not populated. (`src/db/schema/courses.ts:494-501`; `src/modules/courses/progress-service.ts:308-317`)
- Fix: Write immutable firstCompletedAt in same transaction for first completion.

## G2-4-019-018  [P1] GAP  facet F05  effort M
- Legacy: Legacy current-attempt batch read uses maximum attempt correlated subquery. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/LearnerContentProgressRepository.java:29-43`)
- vNext now: New progress read uses one membership-content lookup without attempt sorting. (`src/modules/courses/progress-service.ts:172-199`)
- Fix: Read latest attempt explicitly after unique-key migration.

## G2-4-019-025  [P1] MISSING  facet F06  effort M
- Legacy: Legacy allows completed false to clear completion without clearing first completion. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerContentProgressServiceImpl.java:86-87`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerContentProgressServiceImpl.java:176-187`)
- vNext now: New VIDEO rejects any completed property, non-timed requires true; no clear path. (`src/modules/courses/progress-service.ts:362-401`)
- Fix: Add explicit rewatch/unmark request with preserved audit invariant.

## G2-4-019-037  [P1] GAP  facet F10  effort M
- Legacy: Legacy saves current attempt via JpaRepository in transaction, recovers unique races. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerContentProgressServiceImpl.java:123-160`)
- vNext now: New insert on membership-content unique conflict falls back to atomic update. (`src/modules/courses/progress-service.ts:404-455`)
- Fix: Adapt race logic to attempt-scoped unique key and preserve latest current row.

## G2-4-019-042  [P1] GAP  facet F11  effort M
- Legacy: Legacy admin retake requires principal access to both learner and course. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminLearnerProgressController.java:81-90`)
- vNext now: New progress save never accepts arbitrary learner target. (`src/modules/courses/progress-service.ts:201-227`)
- Fix: Provide separate admin-only route with both resource checks.

## G2-4-019-044  [P1] GAP  facet F12  effort M
- Legacy: Legacy firstCompletedAt is immutable when completed false clears completedAt. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LearnerContentProgress.java:36-40`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerContentProgressServiceImpl.java:176-187`)
- vNext now: New schema has firstCompletedAt but does not populate on completion path. (`src/db/schema/courses.ts:497-501`; `src/modules/courses/progress-service.ts:241-249`)
- Fix: Set audit field once, keep it across unmark and retake attempt scope.
