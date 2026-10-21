# Work packet (wave 3): edit src/app/(authenticated)/college/course-progress/page.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-learner-progress-controller.md

## G2-2-017-001  [P1] MISSING  facet F01  effort L
- Legacy: Staff-only POST endpoint /api/v1/admin/learner-progress/start-attempt, not a page route `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminLearnerProgressController.java:39-44,68-74`
- vNext now: College Course Progress is read-only with offering and export links `src/app/(authenticated)/college/course-progress/page.tsx:64-76`
- Fix: Add scoped learner+course retake action and reachable staff entry point
