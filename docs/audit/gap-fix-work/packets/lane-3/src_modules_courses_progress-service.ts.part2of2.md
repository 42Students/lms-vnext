# Work packet: edit src/modules/courses/progress-service.ts (part 2 of 2)

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/learner-content-progress-model.md, docs/audit/gap2/lane-14/syllabus-video.md

## G2-4-019-054  [P1] MISSING  facet F15  effort M
- Legacy: Legacy start-attempt emits AdminAuditLog LEARNER_PROGRESS_START_ATTEMPT. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminLearnerProgressController.java:109-117`)
- vNext now: New no start-attempt event; manual first-completion emits activity event. (`src/modules/courses/progress-service.ts:320-329`)
- Fix: Write immutable admin retake audit with actor, learner, course and attempt numbers.

## G2-4-019-065  [P1] GAP  facet F20  effort M
- Legacy: Legacy concurrent first insert recovers transaction with exact attempted key. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerContentProgressServiceImpl.java:144-158`)
- vNext now: New conflict recovery based on membership-content only; cannot isolate retake winner. (`src/modules/courses/progress-service.ts:429-444`)
- Fix: Use exact attempt key in insert race recovery and test admin retake vs device write.

## G2-4-019-071  [P1] GAP  facet F22  effort L
- Legacy: Legacy progress row stores duration_seconds, firstCompletedAt, completedAt plus attempt. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LearnerContentProgress.java:27-51`)
- vNext now: New omits durationSeconds in row; has firstCompletedAt column but lacks write. (`src/db/schema/courses.ts:489-501`; `src/modules/courses/progress-service.ts:230-270`)
- Fix: Complete missing progress metadata and immutable first-completion lifecycle.

## G2-14-008-027  [P2] GAP  facet F07  effort M
- Legacy: Legacy progress save rejects null/invalid lessonContentId as named error; vNext Zod UUID content schema returns typed error — `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerContentProgressServiceImpl.java:68-85`
- vNext now: `src/modules/courses/progress-service.ts:201-210,347-359`
- Fix: Preserve equivalent validation semantics and humanize API error; do not copy numeric IDs

## G2-4-019-028  [P2] GAP  facet F07  effort S
- Legacy: Legacy invalid lessonContentId says lessonContentId must be a positive integer. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerContentProgressServiceImpl.java:73-76`)
- vNext now: New UUID content ID parser yields different invalid ID error and 404. (`src/modules/courses/progress-service.ts:339-345`)
- Fix: Translate legacy caller invalid-ID copy in compatibility path.

## G2-4-019-030  [P2] GAP  facet F07  effort S
- Legacy: Legacy timed completed true ignored, and ratio calculated from server duration when available. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerContentProgressServiceImpl.java:87-119`)
- vNext now: New rejects timed completed field with TIMED_CONTENT_MANUAL_COMPLETION_NOT_ALLOWED. (`src/modules/courses/progress-service.ts:362-367`)
- Fix: Show explanatory error for invalid timed completion claim.

## G2-4-019-032  [P2] GAP  facet F08  effort S
- Legacy: Legacy admin retake without prior records says already starting fresh with attempt1. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminLearnerProgressController.java:97-107`)
- vNext now: New no record returns NOT_STARTED but no admin retake feedback. (`src/modules/courses/progress-service.ts:201-228`)
- Fix: Keep idempotent fresh-result and exact informative response.
