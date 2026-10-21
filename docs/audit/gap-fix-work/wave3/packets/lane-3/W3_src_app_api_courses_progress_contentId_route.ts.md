# Work packet (wave 3): edit src/app/api/courses/progress/[contentId]/route.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-learner-progress-controller.md, docs/audit/gap2/lane-4/learner-content-progress-model.md

## G2-2-017-026  [P1] MISSING  facet F10  effort L
- Legacy: POST /api/v1/admin/learner-progress/start-attempt body learnerId/courseId `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminLearnerProgressController.java:68-74`
- vNext now: Only /api/courses/progress/[contentId] PUT; no equivalent staff mutation `src/app/api/courses/progress/[contentId]/route.ts:39-62`
- Fix: Create new staff POST route with same-origin check

## G2-4-019-002  [P1] MISSING  facet F01  effort L
- Legacy: Admin POST /api/v1/admin/learner-progress/start-attempt takes learnerId and courseId. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminLearnerProgressController.java:39-74`)
- vNext now: New progress API exposes GET and PUT only, with content UUID and deliveryId. (`src/app/api/courses/progress/[contentId]/route.ts:12-67`)
- Fix: Implement authorized course-wide start-attempt transaction or approved equivalent.
