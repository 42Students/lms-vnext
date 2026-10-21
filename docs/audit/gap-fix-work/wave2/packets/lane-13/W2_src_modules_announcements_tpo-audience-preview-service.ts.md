# Work packet (wave 2): edit src/modules/announcements/tpo-audience-preview-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/l12-u023-tpo-announcement-controller.md

## G2-12-023-062  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:99-108`
- vNext now: `src/modules/announcements/tpo-audience-preview-service.ts:83-94`
- Fix: Legacy preview resolves learner IDs then counts withEmail, vNext SQL count distinct membership only, avoids PII but does not match same metric.
