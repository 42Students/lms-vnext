# Work packet: edit src/app/(authenticated)/learn/courses/[deliveryId]/progress/page.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/learner-content-progress-model.md

## G2-4-019-001  [P1] GAP  facet F01  effort L
- Legacy: Learner progress saved per lesson content, read in lesson and course progress; admin can start retake. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LearnerContentProgress.java:10-12`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminLearnerProgressController.java:68-74`)
- vNext now: New learner GET/PUT /api/courses/progress/contentId and lesson-by-lesson progress screen; no retake route evidenced. (`src/app/api/courses/progress/[contentId]/route.ts:16-40`; `src/app/(authenticated)/learn/courses/[deliveryId]/progress/page.tsx:19-36`)
- Fix: Expose deliberate admin retake flow and show current attempt in learner progress.
