# Work packet: edit src/db/schema/db10-announcements.ts (part 2 of 2)

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/l15-u021-announcement-model.md, docs/audit/gap2/lane-3/l19-u023-learner-announcement-controller.md, docs/audit/gap2/lane-2/admin-notification-delivery-controller.md

## G2-15-021-001  [P1] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Announcement.java:14-21`
- vNext now: `src/db/schema/db10-announcements.ts:18-21`
- Fix: Legacy JPA announcements ID long auto increment, vNext UUID announcements ID.

## G2-15-021-008  [P1] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Announcement.java:19-21`
- vNext now: `src/db/schema/db10-announcements.ts:21-27`
- Fix: Long ID and receiverValue numeric vs UUID IDs, explicit organization/college, migration required.

## G2-15-021-045  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Announcement.java:19-40`
- vNext now: `src/db/schema/db10-announcements.ts:21-32`
- Fix: Legacy numeric announcement/receiver/sender IDs and optional receiver metadata vs UUID with explicit org+college/typed sender, ETL.

## G2-19-023-054  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:282-309`
- vNext now: `src/db/schema/db10-announcements.ts:18-79`
- Fix: Legacy placement_announcement + recipient/read tables numeric IDs, vNext UUID db10_announcements, frozen membership audiences, activity event readAt, needs migration.

## G2-2-019-022  [P2] MISSING  facet F07  effort M
- Legacy: AdminNotificationDeliveryController.java:72-75 and 122-125 exact 404 `Notification not found`
- vNext now: db10-announcements.ts:18-43 no notification record by legacy ID
- Fix: Return 404 for missing, deleted and foreign-scoped delivery IDs without leaking body.

## G2-15-021-016  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Announcement.java:49-50`
- vNext now: `src/db/schema/db10-announcements.ts:73-75`
- Fix: Legacy null isDeleted may behave unset versus true/false queries; vNext deletion state enforces metadata pairing.

## G2-15-021-017  [P2] GAP  facet F08  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Announcement.java:42-47`
- vNext now: `src/db/schema/db10-announcements.ts:42-43`
- Fix: Legacy createdAt/updatedAt Hibernate @CreationTimestamp/@UpdateTimestamp, vNext DB defaultNow and service-updated updatedAt.
