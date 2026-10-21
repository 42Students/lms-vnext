# Work packet (wave 2): edit src/app/api/placements/tpo/announcements/[noticeId]/lifecycle/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/l12-u023-tpo-announcement-controller.md

## G2-12-023-035  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoAnnouncementController.java:56-71`
- vNext now: `src/app/api/placements/tpo/announcements/[noticeId]/lifecycle/route.ts:9-25`
- Fix: Legacy `PUT`, `DELETE`, `/undo` separate request verbs vs vNext POST lifecycle action with CAS version and soft-delete/restore.
