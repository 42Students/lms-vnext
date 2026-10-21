# Work packet (wave 2): edit src/components/tpo/tpo-notice-acknowledge.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/l19-u023-learner-announcement-controller.md

## G2-19-023-009  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:289-301`
- vNext now: `src/components/tpo/tpo-notice-acknowledge.tsx:8-24`
- Fix: Legacy notice GET auto-read; vNext each Placement cell notice has Mark notice read button, success/error inline.

## G2-19-023-016  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerAnnouncementController.java:23-31`
- vNext now: `src/components/tpo/tpo-notice-acknowledge.tsx:11-22`
- Fix: Legacy no manual read input; vNext POST acknowledgment requires button click and valid delivered notification.

## G2-19-023-023  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerAnnouncementController.java:23-31`
- vNext now: `src/components/tpo/tpo-notice-acknowledge.tsx:8-24`
- Fix: Legacy no confirm, auto-mark on listing; vNext explicit button per notice, no modal.

## G2-19-023-043  [P2] GAP  facet F17  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerAnnouncementController.java:23-31`
- vNext now: `src/components/tpo/tpo-notice-acknowledge.tsx:8-24`
- Fix: Auto-read GET has no focus step, new explicit Mark notice read button with 44px target and inline status.

## G2-19-023-049  [P2] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerAnnouncementController.java:23-31`
- vNext now: `src/components/tpo/tpo-notice-acknowledge.tsx:5-24`
- Fix: Old list-read has race where simply opening consumes unread and affects tab badge; new per-card POST and disabled read state, no background unread loss.
