# Work packet (wave 2): edit src/app/api/announcements/admin/route.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/announcement-controller.md

## G2-2-025-001  [P2] GAP  facet F01  effort M
- Legacy: AnnouncementController.java:32-34 /api/v1/announcements, POST /create line59
- vNext now: src/app/api/announcements/admin/route.ts:29-47 POST /api/announcements/admin
- Fix: Keep legacy API mapping or update old clients with explicit DTO migration.

## G2-2-025-002  [P2] GAP  facet F01  effort M
- Legacy: AnnouncementController.java:82-103 GET /fetchAll pageNumber0/pageSize20
- vNext now: src/app/api/announcements/admin/route.ts:14-27 cursor/limit GET default50
- Fix: Support old pagination or document new cursor semantics.

## G2-2-025-065  [P2] GAP  facet F21  effort M
- Legacy: AnnouncementController.java:82-103 frontend calls /fetchAll
- vNext now: src/app/api/announcements/admin/route.ts:14-27 uses new cursor API
- Fix: Update legacy clients or add old-contract adapter.
