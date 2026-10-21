# Work packet (wave 2): edit src/modules/placements/college-drive-archive-preview-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-jobs-settings.md

## G2-9-013-096  [P2] GAP  facet F21  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:1048-1078` — Delete post-commit notificationService activity; no email send shown.
- vNext now: `src/modules/placements/college-drive-archive-preview-service.ts:29-45` — Archive has no external mail or job dispatch in this path.
- Fix: Retain a durable notification/event process when business-required.
