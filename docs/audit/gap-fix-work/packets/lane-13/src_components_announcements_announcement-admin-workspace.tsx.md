# Work packet: edit src/components/announcements/announcement-admin-workspace.tsx

15 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-announcements.md, docs/audit/gap2/lane-11/l19-u024-super-admin-announcement-controller.md, docs/audit/gap2/lane-2/admin-notification-delivery-controller.md, docs/audit/gap2/lane-2/announcement-controller.md

## G2-10-002-019  [P1] GAP  facet F05  effort L
- Legacy: One card per broadcast regardless selected colleges `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:338-349`
- vNext now: One database item per college so selected broadcast appears in several history entries `src/modules/announcements/super-admin-college-broadcast-service.ts:69-80` `src/components/announcements/announcement-admin-workspace.tsx:283-293`
- Fix: Add logical broadcast group ID and collapse all per-college records into one card with shared actions

## G2-10-002-029  [P1] GAP  facet F06  effort M
- Legacy: Legacy edit modal pre-fills old title body pin button link and expiry; audience immutable `docs/legacy-source/frontend/src/pages/superadmin/announcements.js:37-41` `docs/legacy-source/frontend/src/pages/superadmin/announcements.js:96-108`
- vNext now: Generic edit dialog can retarget and alter scheduling but omits edit fields for button label/URL `src/components/announcements/announcement-admin-workspace.tsx:350-413`
- Fix: Use broadcast-specific editor: lock audience and allow changing existing button label and URL

## G2-10-002-030  [P1] GAP  facet F06  effort S
- Legacy: Legacy edit title 200 and body 8000 limits inherited from same form `docs/legacy-source/frontend/src/pages/superadmin/announcements.js:81-85`
- vNext now: Generic edit allows title 255 and body 10000 `src/components/announcements/announcement-admin-workspace.tsx:392-399`
- Fix: Use broadcast-specific 200 and 8000 max values in generic editor when senderType SUPER_ADMIN broadcast

## G2-10-002-040  [P1] GAP  facet F09  effort S
- Legacy: Legacy delete uses Popconfirm Delete this announcement? and Placement cells stop seeing it. `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementList.jsx:93-103`
- vNext now: Generic Delete is unconfirmed menu mutation `src/components/announcements/announcement-admin-workspace.tsx:315-321` `src/components/announcements/announcement-admin-workspace.tsx:138-173`
- Fix: Show confirmation with legacy title description and danger Delete before mutation

## G2-10-002-045  [P1] GAP  facet F10  effort L
- Legacy: Legacy edit PUT /api/v1/superadmin/announcements/id updates one logical broadcast `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminAnnouncementController.java:46-50` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:391-399`
- vNext now: New PATCH /api/announcements/id changes one college announcement using expectedVersion `src/app/api/announcements/[announcementId]/route.ts:14-31` `src/components/announcements/announcement-admin-workspace.tsx:175-203`
- Fix: Expose broadcast-wide edit transaction instead of mutating a single recipient clone

## G2-10-002-046  [P1] GAP  facet F10  effort L
- Legacy: Legacy delete DELETE /api/v1/superadmin/announcements/id removes single logical broadcast `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminAnnouncementController.java:52-55` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:401-404`
- vNext now: New DELETE /api/announcements/id removes one row only `src/app/api/announcements/[announcementId]/route.ts:35-50` `src/components/announcements/announcement-admin-workspace.tsx:138-157`
- Fix: Create group-scoped deletion that withdraws all college copies and notifications consistently

## G2-19-024-023  [P1] GAP  facet F09  effort L
- Legacy: Legacy deletion via card Popconfirm `Delete this announcement?` with consequence text; AnnouncementList.jsx:93-104
- vNext now: Generic admin workspace action menu deletes a single college row; announcement-admin-workspace.tsx:138-173,315-325
- Fix: Make confirmation delete entire broadcast and withdraw all target notices atomically.

## G2-10-002-037  [P2] GAP  facet F08  effort S
- Legacy: Legacy edit toast Saved `docs/legacy-source/frontend/src/pages/superadmin/announcements.js:49-51`
- vNext now: New generic edit toast Announcement updated `src/components/announcements/announcement-admin-workspace.tsx:214-219`
- Fix: Use Saved for legacy broadcast edit operation

## G2-10-002-038  [P2] MISSING  facet F08  effort S
- Legacy: Legacy delete toast Deleted `docs/legacy-source/frontend/src/pages/superadmin/announcements.js:71-75`
- vNext now: New mutation success only router.refresh with no explicit deletion toast `src/components/announcements/announcement-admin-workspace.tsx:138-173`
- Fix: Show Deleted after confirmed soft-delete

## G2-2-019-023  [P2] MISSING  facet F07  effort M
- Legacy: AdminNotificationDeliveryController.java:85-86 exact already-sent error
- vNext now: announcement-admin-workspace.tsx:138-140 no resend action or error
- Fix: Block SENT immediate retry with exact error and suggest compose new notice.

## G2-2-019-024  [P2] MISSING  facet F07  effort M
- Legacy: AdminNotificationDeliveryController.java:131-133 exact cancel-invalid-status error
- vNext now: announcement-admin-workspace.tsx:138-140 no schedule cancel control
- Fix: Return 400 on cancel of non-SCHEDULED rows.

## G2-2-019-026  [P2] MISSING  facet F08  effort S
- Legacy: AdminNotificationDeliveryController.java:102-103 exact success `Queued for immediate delivery`
- vNext now: announcement-admin-workspace.tsx:122-134 general `Announcement created`; no requeue feedback
- Fix: Display exact queued status after requeue, not claim delivered.

## G2-2-019-027  [P2] MISSING  facet F08  effort S
- Legacy: AdminNotificationDeliveryController.java:149 exact `Schedule cancelled`
- vNext now: announcement-admin-workspace.tsx:138-140 no cancel feedback
- Fix: Display exact cancellation success.

## G2-2-019-028  [P2] MISSING  facet F08  effort M
- Legacy: AdminNotificationDeliveryController.java:85-86 already-delivered instruction to compose a NEW notification
- vNext now: announcement-admin-workspace.tsx:138-140 no analogous instruction
- Fix: Surface actionable compose link on already-sent reject.

## G2-2-025-027  [P2] GAP  facet F08  effort M
- Legacy: Legacy superadmin/announcements.js:51-61 Saved / Sent to N placement cells / Couldn't send
- vNext now: src/components/announcements/announcement-admin-workspace.tsx:122-134 Announcement created/creation failed
- Fix: Match placement broadcast success counts and wording.
