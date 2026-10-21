# Work packet (wave 3): edit src/modules/courses/progress-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-learner-progress-controller.md

## G2-2-017-020  [P1] MISSING  facet F07  effort L
- Legacy: requireAccessLearner and requireAccessCourse deny unauthorized target IDs `docs/legacy-source/backend/src/main/java/com/_42students/lms/access/AccessControlService.java:397-403,482-499`
- vNext now: Current writer authorizes only owning learner for one content/delivery `src/modules/courses/progress-service.ts:106-169`
- Fix: Require both learner+course scope and same-college enrollment relation

## G2-2-017-054  [P1] MISSING  facet F20  effort L
- Legacy: Integration verifies old completion preserved and reset position/completion zero `docs/legacy-source/backend/src/test/java/com/_42students/lms/integration/AdminCourseProgressRetakeMySqlIT.java:185-215`
- vNext now: No retake action can maintain invariant `src/modules/courses/progress-service.ts:404-457`
- Fix: Add integration tests for history/zero state and stale writes
