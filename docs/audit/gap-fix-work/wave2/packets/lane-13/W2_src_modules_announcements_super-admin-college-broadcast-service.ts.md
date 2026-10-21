# Work packet (wave 2): edit src/modules/announcements/super-admin-college-broadcast-service.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-announcements.md, docs/audit/gap2/lane-2/admin-notification-delivery-controller.md

## G2-10-002-050  [P2] GAP  facet F12  effort M
- Legacy: Legacy one broadcast audience ALL_COLLEGES dynamically resolved to current cells when sent `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:352-388`
- vNext now: New ALL_COLLEGES resolved to current active authorized colleges with exact reviewed set `src/modules/announcements/super-admin-college-broadcast-service.ts:47-68` `src/modules/announcements/super-admin-college-broadcast-model.ts:26-34`
- Fix: State exact timing of recipient resolution and avoid presenting selected or all as identical after targets change

## G2-10-002-072  [P2] GAP  facet F19  effort M
- Legacy: Legacy full-list database query with no pagination or hard limit on history `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:338-349`
- vNext now: New history limit 50 and Older cursor; recipients list max 500 `src/app/(authenticated)/admin/announcements/page.tsx:65-80` `src/app/(authenticated)/admin/announcements/page.tsx:207-213` `src/modules/announcements/super-admin-college-broadcast-service.ts:32-38`
- Fix: Document page-50 navigation and cap; add broadcast-aware paging or preserve full feed if practical

## G2-2-019-013  [P2] GAP  facet F04  effort M
- Legacy: AdminNotificationDeliveryController.java:99-103,146-149 sends id and status, no transient provider acceptance claim
- vNext now: src/modules/announcements/super-admin-college-broadcast-service.ts:115 returns count/noticeIds
- Fix: Return status for one notice after operator mutation.

## G2-2-019-041  [P2] MISSING  facet F12  effort M
- Legacy: AdminNotificationDeliveryController.java:85-92 SENT with non-null scheduledAt can requeue (conditional guard)
- vNext now: src/modules/announcements/super-admin-college-broadcast-service.ts:90-112 no state transitions
- Fix: Match literal legacy guard or deliberately restrict to FAILED/SCHEDULED and document decision.

## G2-2-019-064  [P2] GAP  facet F21  effort M
- Legacy: AdminNotificationDeliveryController.java:94-96,141-143 optional audit integration
- vNext now: src/modules/announcements/super-admin-college-broadcast-service.ts:82-89 only publication event
- Fix: Record action-specific audit entries with actor context.
