# Work packet (wave 2): edit src/app/api/admin/announcements/broadcast/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/l19-u024-super-admin-announcement-controller.md

## G2-19-024-001  [P2] GAP  facet F01  effort M
- Legacy: GET, placement-cells picker, POST, PUT/{id}, DELETE/{id} under /api/v1/superadmin/announcements; SuperAdminAnnouncementController.java:21-55
- vNext now: /admin/announcements server page and POST /api/admin/announcements/broadcast; admin/announcements/page.tsx:126-142; admin/announcements/broadcast/route.ts:7-17
- Fix: Crosswalk each of five legacy routes, including scoped read/update/delete of a broadcast as a single entity.
