# Work packet: edit src/app/(authenticated)/college/course-progress/page.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-learner-progress-controller.md

## G2-2-017-006  [P1] MISSING  facet F03  effort M
- Legacy: Two request fields learnerId and courseId; no visible button definition `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminLearnerProgressController.java:61-66`
- vNext now: College page has no retake affordance `src/app/(authenticated)/college/course-progress/page.tsx:65-76`
- Fix: Add explicit Start next attempt control with selected learner+course identity

## G2-2-017-021  [P2] MISSING  facet F08  effort S
- Legacy: Already fresh exact success: This learner has no recorded progress for that course — they are already starting fresh. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminLearnerProgressController.java:101-106`
- vNext now: No retake info message `src/app/(authenticated)/college/course-progress/page.tsx:64-76`
- Fix: Show exact no-op success copy, not failure

## G2-2-017-022  [P2] MISSING  facet F08  effort S
- Legacy: Success exact: Attempt N started. The previous attempt is kept as history. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminLearnerProgressController.java:123-125`
- vNext now: No retake success toast `src/app/(authenticated)/college/course-progress/page.tsx:64-76`
- Fix: Render exact confirmation success with N
