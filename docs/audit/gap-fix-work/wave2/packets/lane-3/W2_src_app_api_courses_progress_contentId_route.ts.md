# Work packet (wave 2): edit src/app/api/courses/progress/[contentId]/route.ts

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/youtube.md, docs/audit/gap2/lane-14/syllabus-video.md, docs/audit/gap2/lane-2/admin-learner-progress-controller.md, docs/audit/gap2/lane-3/lesson-content-controller.md, docs/audit/gap2/lane-4/learner-content-progress-model.md

## G2-12-008-027  [P2] GAP  facet F10  effort S
- Legacy: saveContentProgress post includes lastPositionSeconds, durationSeconds, completed `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/youtube.js:80-114`
- vNext now: PUT progress body `{deliveryId,positionSeconds}`, duration/completed derived server `src/app/api/courses/progress/[contentId]/route.ts:39-62`
- Fix: Preserve threshold/duration accuracy via server-owned derivation

## G2-12-008-058  [P2] GAP  facet F22  effort S
- Legacy: Legacy lastPositionSeconds/durationSeconds/completed submitted in save payload `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/youtube.js:100-105`
- vNext now: New PUT takes body deliveryId/positionSeconds; duration computed server `src/app/api/courses/progress/[contentId]/route.ts:53-60`
- Fix: Audit duration reconciliation for variable-length external video

## G2-14-008-035  [P2] GAP  facet F10  effort M
- Legacy: Legacy progress PUT saves lessonContentId,lastPositionSeconds,durationSeconds,completed hint; vNext PUT /api/courses/progress/:id with deliveryId,positionSeconds — `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/video.js:89-103,125-131`
- vNext now: `src/components/courses/learner-video-player.tsx:61-66`; `src/app/api/courses/progress/[contentId]/route.ts:39-62`
- Fix: Keep safe vNext payload but ensure playback duration and completion semantics map accurately

## G2-2-017-047  [P2] MISSING  facet F18  effort S
- Legacy: Exact field messages learnerId is required and courseId is required `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminLearnerProgressController.java:75-80`
- vNext now: No matching admin validation copy `src/app/api/courses/progress/[contentId]/route.ts:39-62`
- Fix: Implement two exact field errors

## G2-3-027-047  [P2] MISSING  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:791-829`
- vNext now: `src/app/api/courses/progress/[contentId]/route.ts:16-35`
- Fix: Legacy bulk progress GET for all lesson contents with max500 trackable IDs; vNext progress route reads one content ID each; avoid 500-roundtrip consumer regression.

## G2-3-027-087  [P2] GAP  facet F23  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:634-663`
- vNext now: `src/app/api/courses/progress/[contentId]/route.ts:16-67`
- Fix: Legacy fetch content by id/playback URL not a vNext content CRUD read; resolve equivalents across workspace and video APIs for direct bookmarks.

## G2-4-019-017  [P2] GAP  facet F05  effort M
- Legacy: Legacy bulk response deduplicates positive content IDs and preserves caller order. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerContentProgressServiceImpl.java:205-231`)
- vNext now: New GET targets one content and college report batches SQL queries, not per-learner bulk endpoint. (`src/app/api/courses/progress/[contentId]/route.ts:16-37`; `src/modules/courses/college-learner-progress-service.ts:125-144`)
- Fix: Offer scoped bulk progress endpoint where old lesson player expects one call.

## G2-4-019-062  [P2] MISSING  facet F18  effort S
- Legacy: Legacy invalid empty course says That course has no content to retake. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminLearnerProgressController.java:92-95`)
- vNext now: New no retake error state. (`src/app/api/courses/progress/[contentId]/route.ts:16-67`)
- Fix: Add exact validation message to retake endpoint/UI.
