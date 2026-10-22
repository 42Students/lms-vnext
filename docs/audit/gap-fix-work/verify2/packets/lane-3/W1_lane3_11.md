# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-2-017-009
- Verification: DEFERRED — quick source check cannot establish full legacy mutation and permission parity. [P1] MISSING facet F04
- Files: src/modules/courses/progress-service.ts
- Legacy: New attempt response contains attempt, previousAttempt, contentItemsReset `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminLearnerProgressController.java:119-125`
- Expected fix: Provide staff result DTO preserving three fields

## G2-2-017-011
- Verification: DEFERRED — quick source check cannot establish full legacy mutation and permission parity. [P1] GAP facet F04
- Files: src/modules/courses/progress-service.ts
- Legacy: Earlier rows retained; reset visible immediately after mutation `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminLearnerProgressController.java:34-37`
- Expected fix: Select and seed new current-attempt rows within transaction

## G2-2-017-014
- Verification: OK — source contains matching contract terms; deeper equivalence not asserted. [P1] MISSING facet F06
- Files: src/app/api/courses/progress/[contentId]/route.ts
- Legacy: learnerId and courseId required positive integer JSON fields `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminLearnerProgressController.java:61-66,73-80`
- Expected fix: Define strict scoped membershipId+offeringId input and reject missing values

## G2-2-017-018
- Verification: DEFERRED — quick source check cannot establish full legacy mutation and permission parity. [P1] MISSING facet F07
- Files: src/modules/courses/progress-service.ts
- Legacy: HTTP 400 That course has no content to retake `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminLearnerProgressController.java:92-95`
- Expected fix: Block no-content reset with same message and no write

## G2-2-017-027
- Verification: DEFERRED — quick source check cannot establish full legacy mutation and permission parity. [P1] GAP facet F10
- Files: src/modules/courses/progress-service.ts
- Legacy: Both learner and course access checked `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminLearnerProgressController.java:86-90`
- Expected fix: Authorize both resources with college scope and enrollment verification

## G2-2-017-030
- Verification: OK — source contains matching contract terms; deeper equivalence not asserted. [P1] MISSING facet F10
- Files: src/modules/courses/progress-service.ts
- Legacy: Audit LEARNER_PROGRESS_START_ATTEMPT records old/new attempt and course `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminLearnerProgressController.java:110-117`
- Expected fix: Add retake audit event taxonomy and persisted actor metadata

## G2-2-017-031
- Verification: DEFERRED — quick source check cannot establish full legacy mutation and permission parity. [P1] GAP facet F11
- Files: src/app/api/courses/progress/[contentId]/route.ts
- Legacy: Principal plus dual resource authorization `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminLearnerProgressController.java:81-90`
- Expected fix: Guard admin reset for College Admin and scoped Super Admin only

## G2-2-017-032
- Verification: DEFERRED — quick source check cannot establish full legacy mutation and permission parity. [P1] MISSING facet F11
- Files: src/modules/courses/progress-service.ts
- Legacy: Legacy integration denies foreign learner/course and learner-role use `docs/legacy-source/backend/src/test/java/com/_42students/lms/integration/AdminCourseProgressRetakeMySqlIT.java:217-256`
- Expected fix: Add exact cross-college and role-denial tests to new admin API

## G2-2-017-034
- Verification: DEFERRED — quick source check cannot establish full legacy mutation and permission parity. [P1] GAP facet F12
- Files: src/modules/courses/progress-service.ts
- Legacy: No prior row returns alreadyFresh attempt=1 and performs no insert `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminLearnerProgressController.java:97-106`
- Expected fix: Do not manufacture a row on first admin reset

## G2-2-017-035
- Verification: DEFERRED — quick source check cannot establish full legacy mutation and permission parity. [P1] GAP facet F12
- Files: src/modules/courses/progress-service.ts
- Legacy: Copies current rows to attempt MAX+1, zeroes positions, retains old history `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/LearnerContentProgressRepository.java:66-80`
- Expected fix: Add latest-attempt-aware read and exact-attempt update

## G2-2-017-060
- Verification: DEFERRED — quick source check cannot establish full legacy mutation and permission parity. [P1] GAP facet F22
- Files: src/modules/courses/super-admin-student-course-progress.ts
- Legacy: Past completion does not count after incomplete latest attempt `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/LearnerContentProgressRepository.java:89-99`
- Expected fix: Use latest attempt CTE for aggregate

## G2-2-017-061
- Verification: DEFERRED — quick source check cannot establish full legacy mutation and permission parity. [P1] GAP facet F22
- Files: src/modules/courses/learner-course-service.ts
- Legacy: Learner per-content latest attempt is single row `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/LearnerContentProgressRepository.java:29-43`
- Expected fix: Use latest-progress subquery to prevent duplicate lesson rows

## G2-2-018-009
- Verification: OK — source contains matching contract terms; deeper equivalence not asserted. [P1] GAP facet F04
- Files: src/modules/courses/super-admin-lesson-bulk-visibility.ts
- Legacy: AdminLessonBulkController.java:137-142 returns `requested`,`updatedCount`,`failed[{lessonId,reason}]` and exact `Updated N of M lesson(s)`
- Expected fix: Return per-lesson update summary with original requested/updated/failed semantics.

## G2-2-018-017
- Verification: OK — source contains matching contract terms; deeper equivalence not asserted. [P1] GAP facet F06
- Files: src/modules/courses/super-admin-lesson-bulk-visibility.ts
- Legacy: AdminLessonBulkController.java:62-68 request accepts `lessonIds:Integer[]` and nullable independent `active`,`enabled`
- Expected fix: Implement two independent lesson status flags with null means preserve; version/ID translation.

## G2-2-018-024
- Verification: DEFERRED — quick source check cannot establish full legacy mutation and permission parity. [P1] GAP facet F07
- Files: src/modules/courses/super-admin-lesson-bulk-visibility.ts
- Legacy: AdminLessonBulkController.java:101-106 `Invalid lesson id`,`Lesson not found` in failed list
- Expected fix: For each submitted ID, emit explicit validation/not-found failure without blocking valid siblings.

## G2-2-018-032
- Verification: OK — source contains matching contract terms; deeper equivalence not asserted. [P1] GAP facet F10
- Files: src/modules/courses/super-admin-lesson-bulk-visibility.ts
- Legacy: AdminLessonBulkController.java:99-120 resolves each lesson and calls `lessonService.updateLesson` independently
- Expected fix: Write `course_lessons.visible_to_students`/matching lesson status independently per lesson; preserve partial commits.

## G2-2-018-034
- Verification: OK — source contains matching contract terms; deeper equivalence not asserted. [P1] GAP facet F10
- Files: src/modules/courses/super-admin-lesson-bulk-visibility.ts
- Legacy: AdminLessonBulkController.java:121-128 stores failed entry per lessonId and continues batch
- Expected fix: Aggregate failures by original lesson ID including zero content.

## G2-2-018-035
- Verification: DEFERRED — quick source check cannot establish full legacy mutation and permission parity. [P1] GAP facet F10
- Files: src/modules/courses/super-admin-lesson-bulk-visibility.ts
- Legacy: AdminLessonBulkController.java:130-135 optionally writes one `LESSON_BULK_STATUS_UPDATE` audit with requested/updated/failed
- Expected fix: Emit single batch audit event with counts and actor/college scope.

## G2-2-018-037
- Verification: DEFERRED — quick source check cannot establish full legacy mutation and permission parity. [P1] GAP facet F11
- Files: src/modules/courses/super-admin-lesson-bulk-visibility.ts
- Legacy: AdminLessonBulkController.java:104-111 independently checks `requireAccessCourse` per requested lesson
- Expected fix: Per-ID scope check must report forbidden IDs as individual failures, not omit.

## G2-2-018-038
- Verification: OK — source contains matching contract terms; deeper equivalence not asserted. [P1] GAP facet F11
- Files: src/modules/courses/super-admin-lesson-bulk-visibility.ts
- Legacy: AccessControlService.java:482-499 rejects foreign/not-found/deleted course with audited reason
- Expected fix: Preserve authorized sibling writes and non-leaking per-ID failure reason.

## G2-2-018-041
- Verification: OK — source contains matching contract terms; deeper equivalence not asserted. [P1] GAP facet F12
- Files: src/modules/courses/super-admin-lesson-bulk-visibility.ts
- Legacy: AdminLessonBulkController.java:65-68,113-119 null active or enabled preserves existing independent flag
- Expected fix: Allow partial flag changes, preserve untouched flag and distinguish active/enabled.

## G2-2-018-061
- Verification: OK — source contains matching contract terms; deeper equivalence not asserted. [P1] GAP facet F19
- Files: src/modules/courses/super-admin-lesson-bulk-visibility.ts
- Legacy: AdminLessonBulkController.java:97-128 independent service DB calls in one loop
- Expected fix: Reduce N×content writes; update the parent lesson once per requested lesson.

## G2-2-018-062
- Verification: DEFERRED — quick source check cannot establish full legacy mutation and permission parity. [P1] GAP facet F20
- Files: src/modules/courses/super-admin-lesson-bulk-visibility.ts
- Legacy: AdminLessonBulkController.java:35-36,99-128 partial commits by design; one exception does not roll back siblings
- Expected fix: Ensure atomic write per lesson and per-lesson retry safety.

## G2-2-018-070
- Verification: DEFERRED — quick source check cannot establish full legacy mutation and permission parity. [P1] GAP facet F22
- Files: src/modules/courses/super-admin-lesson-bulk-visibility.ts
- Legacy: AdminLessonBulkController.java:99-120 changes `lesson.active` and `lesson.enabled` rows
- Expected fix: Target `course_lessons` row, not `lesson_contents` as replacement.

## G2-2-018-072
- Verification: DEFERRED — quick source check cannot establish full legacy mutation and permission parity. [P1] MISSING facet F23
- Files: src/modules/courses/super-admin-lesson-bulk-visibility.ts
- Legacy: AdminLessonBulkController.java:97-128 reports absent or forbidden LESSON row as failure
- Expected fix: Count and list every requested ID, including zero-content lessons.
