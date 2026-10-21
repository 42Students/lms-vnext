# Work packet: edit src/db/schema/db10-announcements.ts (part 1 of 2)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-announcements.md, docs/audit/gap2/lane-11/l19-u024-super-admin-announcement-controller.md, docs/audit/gap2/lane-14/u014-announcement-search-controller.md, docs/audit/gap2/lane-2/admin-notification-delivery-controller.md, docs/audit/gap2/lane-3/l12-u023-tpo-announcement-controller.md

## G2-10-002-080  [P1] GAP  facet F22  effort L
- Legacy: Legacy MySQL placement_announcement BIGINT key nullable college scope one TPOS broadcast row `docs/legacy-source/backend/src/main/resources/db/migration/V210__placement_announcements.sql:6-19` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:379-386`
- vNext now: New Postgres announcements UUID key non-null college id one row per college `src/db/schema/db10-announcements.ts:18-43` `src/modules/announcements/super-admin-college-broadcast-service.ts:69-80`
- Fix: Model stable broadcast group entity with target join or explicit parentId and test query parity

## G2-10-002-081  [P1] GAP  facet F22  effort L
- Legacy: Legacy recipient targeting join table placement_announcement_college keyed announcement and college `docs/legacy-source/backend/src/main/resources/db/migration/V217__announcements_audience_reach_schedule.sql:28-33`
- vNext now: New recipient list materialized as separate notices and receipt table `src/db/schema/db10-announcements.ts:18-43` `src/db/schema/db10-announcements.ts:79-94`
- Fix: Provide broadcast-recipient relation or verified grouping equivalence across sender and targets

## G2-10-002-082  [P1] GAP  facet F22  effort M
- Legacy: Legacy reader table key announcement_id reader_type reader_id and read_at timestamp `docs/legacy-source/backend/src/main/resources/db/migration/V210__placement_announcements.sql:21-27`
- vNext now: New college receipt keyed announcementId collegeId with firstReadByUserId timestamp `src/db/schema/db10-announcements.ts:79-94`
- Fix: Define conversion of per-reader receipts into per-college first-read semantics for analytics

## G2-10-002-083  [P1] GAP  facet F22  effort M
- Legacy: Legacy fields audience_kind json label recipient_count sent_at email and is_deleted `docs/legacy-source/backend/src/main/resources/db/migration/V217__announcements_audience_reach_schedule.sql:6-19`
- vNext now: New fields receiverType receiverId scheduledAt expiresAt deletedAt version but no audienceLabel/recipientCount `src/db/schema/db10-announcements.ts:18-43`
- Fix: Add required author-side reach metadata or compute exact broadcast counts via relations

## G2-19-024-046  [P1] GAP  facet F22  effort L
- Legacy: Legacy placement_announcement single record + placement_announcement_college join + per-faculty placement_announcement_read; PlacementAnnouncementService.java:338-389,408-417
- vNext now: db10Announcements one row per college and placementCellAnnouncementReads PK per notice+college; db10-announcements.ts:18-113
- Fix: Add broadcast grouping and composite unique recipient constraints; preserve distinct-cell read metrics.

## G2-19-024-047  [P1] GAP  facet F22  effort L
- Legacy: Legacy soft-delete boolean plus UTC sentAt, audience_kind/label/json/recipient_count; PlacementAnnouncementService.java:338-404
- vNext now: vNext deletedAt/deletedBy/version and scheduledAt/expiresAt receiverType UUID but no legacy audience snapshot; db10-announcements.ts:18-76
- Fix: Map old columns explicitly and migrations; store provenance and immutable targets for group updates.

## G2-14-014-010  [P1] GAP  facet F04  effort L
- Legacy: Legacy receiverType enum receiverValue Long `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Announcement.java:23-28`
- vNext now: New receiverType string receiverId UUID and explicit college and organization `src/db/schema/db10-announcements.ts:21-28`
- Fix: Build historical receiver ID crosswalk for all six types

## G2-14-014-060  [P1] GAP  facet F22  effort L
- Legacy: Legacy announcements table identity Long and receiverValue Long `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Announcement.java:14-28`
- vNext now: New UUID primary, receiverId UUID, explicit org and college FKs `src/db/schema/db10-announcements.ts:18-28`
- Fix: Create per-receiver-type integer to UUID migration map

## G2-14-014-061  [P1] GAP  facet F22  effort M
- Legacy: Legacy sender string + numeric id, isDeleted, schedules/expiry/pin `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Announcement.java:36-68`
- vNext now: New senderUserId UUID, deletedAt/by, scheduledAt/expiresAt/pin, version `src/db/schema/db10-announcements.ts:30-43`
- Fix: Map legacy deletion and sender provenance without loss

## G2-2-019-011  [P1] GAP  facet F04  effort M
- Legacy: Notification.java:18-39 title,message,classId,courseId,learnerId,recipientType
- vNext now: db10-announcements.ts:20-37 stores announcement audience/type, not original notifications
- Fix: Model notification-specific target/audience and author fields in campaign rather than substitute announcements.

## G2-2-019-012  [P1] MISSING  facet F04  effort M
- Legacy: Notification.java:88-105 scheduledAt/status/error/deliveredAt per notification
- vNext now: db10-announcements.ts:33-43 stores scheduledAt and timestamps but no deliveryStatus/error/deliveredAt
- Fix: Add campaign lifecycle, last error, due and published time.

## G2-2-019-040  [P1] MISSING  facet F12  effort M
- Legacy: AdminNotificationDeliveryController.java:85-86 SENT+scheduledAt null cannot resend
- vNext now: db10-announcements.ts:18-43 no status or sent guard
- Fix: Implement explicit allowed-state transition table.

## G2-2-019-042  [P1] MISSING  facet F12  effort M
- Legacy: AdminNotificationDeliveryController.java:131-139 only SCHEDULED may be cancelled; schedule not set null
- vNext now: db10-announcements.ts:33 scheduledAt nullable and no delivery status
- Fix: Require SCHEDULED and retain suppression marker on cancel.

## G2-2-019-058  [P1] GAP  facet F19  effort M
- Legacy: NotificationRepository.java:167-170 due index from V130__notification_schedule_and_delivery_status.sql:18-20
- vNext now: db10-announcements.ts:46-52 has recipient visibility index but no status+due worker index
- Fix: Add partial status/due index to campaign table.

## G2-2-019-062  [P1] MISSING  facet F20  effort M
- Legacy: NotificationWorkflowMySqlIT.java:213-225 stale SENT immediate resend rejects no mutation
- vNext now: src/db/schema/db10-announcements.ts:18-43 no SENT state
- Fix: Transactionally reject stale sent retries.

## G2-2-019-065  [P1] GAP  facet F22  effort M
- Legacy: Notification.java:17-105 legacy notification table includes scheduledAt,status,error,deliveredAt, deleted flag
- vNext now: db10-announcements.ts:18-77 stores announcements without status/error/deliveredAt
- Fix: Register separate campaign schema or add lifecycle columns; never conflate content visibility and provider delivery.

## G2-2-019-066  [P1] MISSING  facet F22  effort M
- Legacy: V130__notification_schedule_and_delivery_status.sql:12-20 adds due index/status columns
- vNext now: db10-announcements.ts:45-51 visibility index, not delivery queue index
- Fix: Add equivalent durable scheduled delivery index and failure metadata migration.

## G2-2-019-067  [P1] GAP  facet F22  effort M
- Legacy: Notification.java:24-39 class/course/personal target, creator faculty identity
- vNext now: db10-announcements.ts:26-32 audience receiverType/receiverId and user-based sender
- Fix: Map multi-resource lesson/class/course audience and creator identities explicitly.

## G2-12-023-069  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:55-76`
- vNext now: `src/db/schema/db10-announcements.ts:18-64`
- Fix: Legacy numeric placement_announcement id, faculty authorId, audience JSON, soft-delete and UTC timestamp vs UUID db10_announcements senderUserId, version, deletedAt, scheduledAt; explicit ETL required.

## G2-12-023-071  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:321-335`
- vNext now: `src/db/schema/db10-announcements.ts:79-94`
- Fix: Legacy From42 markRead per FACULTY ID vs vNext placement_cell_announcement_reads composite (announcementId,collegeId); historical unread semantics cannot map 1:1.
