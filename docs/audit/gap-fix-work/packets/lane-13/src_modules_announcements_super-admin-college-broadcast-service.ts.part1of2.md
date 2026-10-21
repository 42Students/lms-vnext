# Work packet: edit src/modules/announcements/super-admin-college-broadcast-service.ts (part 1 of 2)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-announcements.md, docs/audit/gap2/lane-11/l19-u024-super-admin-announcement-controller.md, docs/audit/gap2/lane-2/admin-notification-delivery-controller.md

## G2-10-002-019  [P1] GAP  facet F05  effort L
- Legacy: One card per broadcast regardless selected colleges `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:338-349`
- vNext now: One database item per college so selected broadcast appears in several history entries `src/modules/announcements/super-admin-college-broadcast-service.ts:69-80` `src/components/announcements/announcement-admin-workspace.tsx:283-293`
- Fix: Add logical broadcast group ID and collapse all per-college records into one card with shared actions

## G2-10-002-044  [P1] GAP  facet F10  effort L
- Legacy: Legacy post inserts one placement_announcement plus join rows per college then bell audit `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:379-388`
- vNext now: New transaction inserts one announcement plus activity event per college and immediate notification to TPO members `src/modules/announcements/super-admin-college-broadcast-service.ts:69-115`
- Fix: Introduce stable campaign/broadcast group identity and audit correlation across all per-college rows

## G2-10-002-048  [P1] GAP  facet F11  effort M
- Legacy: Legacy placement-cell audience is any college with type-14 faculty or TPO team member `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:314-318`
- vNext now: New audience only ACTIVE college and organization plus ACTIVE TPO membership and ACTIVE account `src/modules/announcements/super-admin-college-broadcast-service.ts:18-38`
- Fix: Determine owner-approved targeting exclusions and show omitted legacy placement cells clearly

## G2-10-002-052  [P1] GAP  facet F12  effort L
- Legacy: Legacy superadmin broadcast has no scheduling and is inserted sent_at UTC_TIMESTAMP `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:375-388`
- vNext now: New form supports scheduledAt; backend omits immediate notification for future schedule `src/components/announcements/super-admin-college-broadcast-form.tsx:91-98` `src/modules/announcements/super-admin-college-broadcast-service.ts:90-112`
- Fix: Do not claim scheduled bell delivery until worker processes scheduled broadcasts

## G2-10-002-059  [P1] GAP  facet F15  effort M
- Legacy: Legacy sends bell audit once per placement cell with From 42 title and /tpo/announcements?tab=from42 `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:379-388`
- vNext now: New immediate notification each active TPO user with actionHref /tpo/announcements `src/modules/announcements/super-admin-college-broadcast-service.ts:90-110`
- Fix: Deep-link to From 42 view and verify exact once-per-cell bell vs per-member notification policy

## G2-10-002-078  [P1] GAP  facet F21  effort L
- Legacy: Legacy broadcasts write bell audit immediately; superadmin broadcast path does not run scheduling worker `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:352-389`
- vNext now: New scheduled notices omit immediate TPO bell; service says worker not configured `src/modules/announcements/super-admin-college-broadcast-service.ts:90-112`
- Fix: Implement and test scheduled dispatch worker or remove scheduled UI until delivery supported

## G2-10-002-080  [P1] GAP  facet F22  effort L
- Legacy: Legacy MySQL placement_announcement BIGINT key nullable college scope one TPOS broadcast row `docs/legacy-source/backend/src/main/resources/db/migration/V210__placement_announcements.sql:6-19` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:379-386`
- vNext now: New Postgres announcements UUID key non-null college id one row per college `src/db/schema/db10-announcements.ts:18-43` `src/modules/announcements/super-admin-college-broadcast-service.ts:69-80`
- Fix: Model stable broadcast group entity with target join or explicit parentId and test query parity

## G2-19-024-006  [P1] GAP  facet F04  effort L
- Legacy: Single broadcast result contains id, title, body, pinned, authorName=42, createdAt, updatedAt, audienceKind/Label, recipientCount, readCount, link and expiry; PlacementAnnouncementService.java:338-350
- vNext now: One announcement row per college and receipt counts individual college; super-admin-college-broadcast-service.ts:69-117; admin/announcements/page.tsx:92-113,181-192
- Fix: Introduce broadcastGroupId and aggregate metadata/receipts to one logical author-facing item, preserving original audience label.

## G2-19-024-010  [P1] GAP  facet F05  effort M
- Legacy: Legacy picker lists colleges with faculty type14 or tpo_team_member alphabetically; PlacementAnnouncementService.java:314-318
- vNext now: Only active colleges/orgs with active TPO memberships capped500, ordered name; super-admin-college-broadcast-service.ts:15-43
- Fix: Explain and reconcile colleges with team members but no active TPO membership; do not silently omit.

## G2-19-024-025  [P1] GAP  facet F10  effort L
- Legacy: POST creates ONE placement_announcement + placement_announcement_college target rows, bell for each college; PlacementAnnouncementService.java:379-388
- vNext now: Transaction inserts one announcements and activity event per college, TPO notification per active user; super-admin-college-broadcast-service.ts:69-115
- Fix: Add atomic group identity and stable audience snapshot, avoid duplicate broadcast objects in admin history.

## G2-2-019-004  [P1] GAP  facet F01  effort M
- Legacy: NotificationController.java:59-71 compose route creates scheduled row; admin operator route handles retry/cancel
- vNext now: src/modules/announcements/super-admin-college-broadcast-service.ts:40-80 separate broadcast composer
- Fix: Map legacy notification authoring and queue operator to same persisted campaign model.

## G2-2-019-015  [P1] MISSING  facet F05  effort M
- Legacy: NotificationRepository.java:163-170 due scheduled work oldest schedule first
- vNext now: src/modules/announcements/super-admin-college-broadcast-service.ts:90-112 sends only immediate notices; no due sweep
- Fix: Implement oldest-due-first limited worker queue.

## G2-2-019-018  [P1] MISSING  facet F06  effort M
- Legacy: AdminNotificationDeliveryController.java:63-65 `id` path Integer, `collegeId` query Integer
- vNext now: src/modules/announcements/super-admin-college-broadcast-service.ts:44-45 UUID selectedCollegeIds for create; no operator payload
- Fix: Validate positive legacy ID mapping or UUID campaign ID plus authorized college scope.

## G2-2-019-025  [P1] GAP  facet F07  effort M
- Legacy: AccessControlService.java:482-499 per-course forbiddance; AdminNotificationDeliveryController.java:79-83 class/course checks
- vNext now: src/modules/announcements/super-admin-college-broadcast-service.ts:66-68 authorize selected college, not original class/course
- Fix: Reauthorize original notification audience and tenant at mutation.

## G2-2-019-031  [P1] MISSING  facet F10  effort M
- Legacy: AdminNotificationDeliveryController.java:89-92 on resend sets SCHEDULED, due now-1s, clears deliveryError, saves
- vNext now: src/modules/announcements/super-admin-college-broadcast-service.ts:90-112 scheduled notices passive; no worker pickup
- Fix: Implement requeue transaction, due-now state and error clearing.

## G2-2-019-032  [P1] MISSING  facet F10  effort M
- Legacy: AdminNotificationDeliveryController.java:135-139 cancel sets CANCELLED and due now+100 years (not null)
- vNext now: src/modules/announcements/super-admin-college-broadcast-service.ts:76-77 scheduledAt stored; no cancellation transition
- Fix: Record cancellation state and make scheduled content permanently ineligible for release.

## G2-2-019-033  [P1] MISSING  facet F10  effort M
- Legacy: AdminNotificationDeliveryController.java:94-97 audit event `NOTIFICATION_RESEND` with classId metadata
- vNext now: src/modules/announcements/super-admin-college-broadcast-service.ts:82-89 event only on create
- Fix: Add audit event for operator resend with college/actor/status.

## G2-2-019-034  [P1] MISSING  facet F10  effort M
- Legacy: AdminNotificationDeliveryController.java:141-144 audit event `NOTIFICATION_SCHEDULE_CANCEL`
- vNext now: src/modules/announcements/super-admin-college-broadcast-service.ts:82-89 no cancellation audit
- Fix: Log cancel outcome once, with actor and affected campaign ID.

## G2-2-019-035  [P1] MISSING  facet F10  effort M
- Legacy: NotificationSchedulerService.java:102-150 release job status SENT/FAILED, deliveredAt/error; SSE best effort
- vNext now: src/modules/announcements/super-admin-college-broadcast-service.ts:90-112 scheduled delivery worker explicitly not configured
- Fix: Build durable due-time scheduler with failure state and bounded batch.

## G2-2-019-036  [P1] MISSING  facet F10  effort M
- Legacy: NotificationWorkflowMySqlIT.java:159-186 cancel then resend queued without early learner visibility
- vNext now: src/modules/announcements/super-admin-college-broadcast-service.ts:90-112 scheduled has no notification delivery
- Fix: Test cancel/reschedule/requeue and recipient visibility only after worker commit.
