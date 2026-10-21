# Work packet (wave 2): edit src/app/(authenticated)/learn/courses/[deliveryId]/progress/page.tsx

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/learner-content-progress-model.md

## G2-4-019-005  [P2] GAP  facet F02  effort M
- Legacy: Legacy admin retake is separate deliberate action, not automatic on semester/batch promotion. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminLearnerProgressController.java:21-37`)
- vNext now: New visible progress page contains no reset/attempt control for learner. (`src/app/(authenticated)/learn/courses/[deliveryId]/progress/page.tsx:30-113`)
- Fix: Create clearly labeled admin-only Start new attempt action with confirmation.

## G2-4-019-010  [P2] MISSING  facet F03  effort M
- Legacy: Legacy progress course retake success copy includes Attempt N started and history note. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminLearnerProgressController.java:119-125`)
- vNext now: No new retake outcome dialog or attempt count in learner progress. (`src/app/(authenticated)/learn/courses/[deliveryId]/progress/page.tsx:30-113`)
- Fix: Add exact success message and attempt count to admin reset UX.

## G2-4-019-021  [P2] GAP  facet F05  effort M
- Legacy: Legacy list sorting content according to source content IDs and current attempt. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerContentProgressServiceImpl.java:225-231`)
- vNext now: New learner course progress groups by lesson and item, not flat bulk response. (`src/app/(authenticated)/learn/courses/[deliveryId]/progress/page.tsx:59-98`)
- Fix: Ensure stable lesson/content order matches roadmap and list API.

## G2-4-019-049  [P2] MISSING  facet F13  effort S
- Legacy: Legacy retake response indicates alreadyFresh rather than silent new attempt. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminLearnerProgressController.java:97-107`)
- vNext now: New no retake route/status, only new progress display. (`src/app/(authenticated)/learn/courses/[deliveryId]/progress/page.tsx:30-113`)
- Fix: Show learner-specific no-op when already on first attempt.

## G2-4-019-057  [P2] GAP  facet F16  effort M
- Legacy: Legacy admin retake endpoint headless and may be initiated from admin UI. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminLearnerProgressController.java:68-74`)
- vNext now: New learner page has touch-size back and item links, no retake action. (`src/app/(authenticated)/learn/courses/[deliveryId]/progress/page.tsx:30-36`; `src/app/(authenticated)/learn/courses/[deliveryId]/progress/page.tsx:99-105`)
- Fix: Provide accessible admin action on learner progress table/detail.

## G2-4-019-060  [P2] GAP  facet F18  effort S
- Legacy: Legacy exact status words WATCHED/IN_PROGRESS/NOT_STARTED. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerContentProgressServiceImpl.java:234-249`)
- vNext now: New API status COMPLETED/IN_PROGRESS/NOT_STARTED, humanized badges. (`src/modules/courses/progress-service.ts:50-56`; `src/app/(authenticated)/learn/courses/[deliveryId]/progress/page.tsx:92-95`)
- Fix: Use legacy watched label on video resources if strict copy clone.

## G2-4-019-061  [P2] MISSING  facet F18  effort M
- Legacy: Legacy admin confirmation says Attempt N started. The previous attempt is kept as history. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminLearnerProgressController.java:119-125`)
- vNext now: No comparable vNext message. (`src/app/(authenticated)/learn/courses/[deliveryId]/progress/page.tsx:30-113`)
- Fix: Restore confirmation copy and actual history guarantee.
