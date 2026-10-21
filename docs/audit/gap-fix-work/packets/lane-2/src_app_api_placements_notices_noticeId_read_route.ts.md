# Work packet: edit src/app/api/placements/notices/[noticeId]/read/route.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/l19-u023-learner-announcement-controller.md

## G2-19-023-057  [P1] GAP  facet F23  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerAnnouncementController.java:23-31`
- vNext now: `src/app/api/placements/notices/[noticeId]/read/route.ts:7-12`
- Fix: Automatic mark-read-on-list dropped intentionally for explicit user acknowledgment, but this breaks old unread badge behavior.

## G2-19-023-019  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerAnnouncementController.java:23-31`
- vNext now: `src/app/api/placements/notices/[noticeId]/read/route.ts:7-12`
- Fix: Legacy GET list succeeds/read receipt silently, vNext POST may return read:false (no delivered event) and UI shows explicit error.
