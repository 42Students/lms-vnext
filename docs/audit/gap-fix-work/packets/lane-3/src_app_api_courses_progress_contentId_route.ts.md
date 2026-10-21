# Work packet: edit src/app/api/courses/progress/[contentId]/route.ts

13 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-learner-progress-controller.md, docs/audit/gap2/lane-3/lesson-content-controller.md, docs/audit/gap2/lane-4/learner-content-progress-model.md

## G2-2-017-014  [P1] MISSING  facet F06  effort M
- Legacy: learnerId and courseId required positive integer JSON fields `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminLearnerProgressController.java:61-66,73-80`
- vNext now: Only contentId URL UUID and progress body in learner API `src/app/api/courses/progress/[contentId]/route.ts:39-62`
- Fix: Define strict scoped membershipId+offeringId input and reject missing values

## G2-2-017-031  [P1] GAP  facet F11  effort L
- Legacy: Principal plus dual resource authorization `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminLearnerProgressController.java:81-90`
- vNext now: vNext progress API is learner self-service, no staff reset guard `src/app/api/courses/progress/[contentId]/route.ts:16-62`
- Fix: Guard admin reset for College Admin and scoped Super Admin only

## G2-3-027-005  [P1] MISSING  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:439-512`
- vNext now: `src/app/api/courses/progress/[contentId]/route.ts:16-35`
- Fix: Legacy faculty/learner assignment list, paged and coursesForClass dropdown endpoints require equivalent role-scoped global assessment lists; content GET by lesson does not replace them.

## G2-4-019-001  [P1] GAP  facet F01  effort L
- Legacy: Learner progress saved per lesson content, read in lesson and course progress; admin can start retake. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LearnerContentProgress.java:10-12`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminLearnerProgressController.java:68-74`)
- vNext now: New learner GET/PUT /api/courses/progress/contentId and lesson-by-lesson progress screen; no retake route evidenced. (`src/app/api/courses/progress/[contentId]/route.ts:16-40`; `src/app/(authenticated)/learn/courses/[deliveryId]/progress/page.tsx:19-36`)
- Fix: Expose deliberate admin retake flow and show current attempt in learner progress.

## G2-2-017-016  [P2] MISSING  facet F07  effort S
- Legacy: HTTP 400 message learnerId is required `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminLearnerProgressController.java:75-77`
- vNext now: No corresponding admin endpoint validator `src/app/api/courses/progress/[contentId]/route.ts:39-67`
- Fix: Return precise learner field error

## G2-2-017-017  [P2] MISSING  facet F07  effort S
- Legacy: HTTP 400 message courseId is required `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminLearnerProgressController.java:78-80`
- vNext now: No corresponding admin endpoint validator `src/app/api/courses/progress/[contentId]/route.ts:39-67`
- Fix: Return precise course field error

## G2-2-017-019  [P2] GAP  facet F07  effort S
- Legacy: Missing principal gets 401 Authentication required `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminLearnerProgressController.java:81-85`
- vNext now: vNext maps errors via apiErrorResponse, with no admin reset path `src/app/api/courses/progress/[contentId]/route.ts:16-35,39-67`
- Fix: Return proper expired-session 401 on admin action

## G2-3-027-033  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:745-768`
- vNext now: `src/app/api/courses/progress/[contentId]/route.ts:39-67`
- Fix: Legacy explicit 503 Content progress service not available and invalid learner ID errors; vNext service errors differ and require machine-to-copy mapping.

## G2-3-027-037  [P2] GAP  facet F08  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:745-788`
- vNext now: `src/app/api/courses/progress/[contentId]/route.ts:16-67`
- Fix: Legacy GET and PUT content progress returns Response of ContentProgressResponse; vNext returns `{progress}` with different status/percent/duration contract.

## G2-4-019-027  [P2] GAP  facet F07  effort S
- Legacy: Legacy null progress request says Progress request cannot be null. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerContentProgressServiceImpl.java:68-75`)
- vNext now: New API validates JSON through Zod and generic apiErrorResponse. (`src/app/api/courses/progress/[contentId]/route.ts:50-65`)
- Fix: Match friendly field-level/request error.

## G2-4-019-029  [P2] MISSING  facet F07  effort M
- Legacy: Legacy too many bulk IDs shows exact Too many lessonContentIds in one request. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerContentProgressServiceImpl.java:218-224`)
- vNext now: New lacks equivalent per-learner bulk API. (`src/app/api/courses/progress/[contentId]/route.ts:16-67`)
- Fix: Expose bounded batch and actionable split-batches error.

## G2-4-019-031  [P2] MISSING  facet F07  effort M
- Legacy: Legacy admin retake validation learnerId/courseId required, no-content retake denied. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminLearnerProgressController.java:75-95`)
- vNext now: New no equivalent retake route or error messages. (`src/app/api/courses/progress/[contentId]/route.ts:16-67`)
- Fix: Implement precise validation, empty-course state and fail-closed checks.

## G2-4-019-033  [P2] MISSING  facet F08  effort M
- Legacy: Legacy admin retake success includes attempt,previousAttempt,contentItemsReset and history-preserved copy. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminLearnerProgressController.java:109-125`)
- vNext now: New API progress PUT returns a single progress object, no retake response. (`src/app/api/courses/progress/[contentId]/route.ts:39-65`)
- Fix: Return explicit reset counts and avoid misleading success on partial reset.
