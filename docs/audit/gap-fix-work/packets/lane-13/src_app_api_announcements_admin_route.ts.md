# Work packet: edit src/app/api/announcements/admin/route.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-notification-delivery-controller.md, docs/audit/gap2/lane-2/announcement-controller.md

## G2-2-019-002  [P1] MISSING  facet F01  effort M
- Legacy: AdminNotificationDeliveryController.java:58-65 POST `/{id}/resend?collegeId=`
- vNext now: src/app/api/announcements/admin/route.ts (different entity); no `/api/admin/notification-delivery/[id]/resend` mapped
- Fix: Create authenticated resend POST with college and notification identifiers.

## G2-2-025-028  [P3] GAP  facet F08  effort S
- Legacy: AnnouncementController.java:78-79 response HTTP200 and statusOK
- vNext now: src/app/api/announcements/admin/route.ts:41-43 status201 and `{announcement}`
- Fix: Adapt success envelope for old callers if preserved.
