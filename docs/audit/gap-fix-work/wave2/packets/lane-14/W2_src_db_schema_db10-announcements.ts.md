# Work packet (wave 2): edit src/db/schema/db10-announcements.ts

16 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-announcements.md, docs/audit/gap2/lane-14/u014-announcement-search-controller.md, docs/audit/gap2/lane-2/admin-notification-delivery-controller.md, docs/audit/gap2/lane-2/announcement-controller.md, docs/audit/gap2/lane-3/l15-u021-announcement-model.md

## G2-10-002-084  [P2] GAP  facet F22  effort S
- Legacy: Legacy link label varchar60 and link URL varchar500 `docs/legacy-source/backend/src/main/resources/db/migration/V217__announcements_audience_reach_schedule.sql:12-13`
- vNext now: New buttonLabel varchar60 and buttonUrl varchar500 with HTTPS pair CHECK `src/db/schema/db10-announcements.ts:35-37` `src/db/schema/db10-announcements.ts:65-70`
- Fix: Preserve link capacity while deciding whether no-label URL may auto-label Open

## G2-14-014-007  [P2] GAP  facet F03  effort M
- Legacy: Legacy DTO fields id, title, message, receiverType, receiverValue `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/announcements/AnnouncementSearchDTO.java:13-19`
- vNext now: New projection has title,message,receiverType,UUID receiverId plus sender/schedule/pin/time `src/app/(authenticated)/admin/announcements/page.tsx:94-112` `src/db/schema/db10-announcements.ts:21-43`
- Fix: Map receiverValue integer to receiverId UUID and original response keys

## G2-14-014-011  [P2] GAP  facet F04  effort M
- Legacy: Legacy announcement createdAt LocalDateTime `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Announcement.java:42-47`
- vNext now: New timestamptz and en-IN IST read time `src/db/schema/db10-announcements.ts:42-43` `src/app/(authenticated)/college/announcements/page.tsx:93-112`
- Fix: Specify UTC/IST historical timestamp import

## G2-14-014-062  [P2] GAP  facet F22  effort M
- Legacy: Legacy announcement title/message no explicit entity max `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Announcement.java:30-34`
- vNext now: New title varchar255 and input message max10000 `src/db/schema/db10-announcements.ts:28-29` `src/modules/announcements/validation.ts:15-28`
- Fix: Audit oversized legacy messages and titles before import

## G2-2-019-048  [P2] GAP  facet F14  effort M
- Legacy: Notification.java:88-105 delivery error retained as text on failed row
- vNext now: src/db/schema/db10-announcements.ts:20-44 no error-export field
- Fix: Expose safe truncated failure reason in support history (optional CSV).

## G2-2-019-060  [P2] GAP  facet F20  effort M
- Legacy: AdminNotificationDeliveryController.java:90/138 LocalDateTime.now local zone, minus1s/+100y
- vNext now: db10-announcements.ts:33 timestamptz; broadcast service.ts:76 Date ISO conversion
- Fix: Normalize times to UTC and document Asia/Kolkata input handling.

## G2-2-025-066  [P2] GAP  facet F22  effort M
- Legacy: Announcement.java:16-68 integer receiverValue/senderId/isDeleted + LocalDateTime
- vNext now: src/db/schema/db10-announcements.ts:18-43 UUID scoped receiver/sender and deletedAt/timestamptz
- Fix: Map identity and time semantics; do not silently treat integer IDs as UUID.

## G2-15-021-002  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Announcement.java:23-29`
- vNext now: `src/db/schema/db10-announcements.ts:26-27`
- Fix: Legacy receiverType enum + receiverValue long, vNext varchar receiverType + UUID receiverId, more explicit scope.

## G2-15-021-003  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Announcement.java:36-40`
- vNext now: `src/db/schema/db10-announcements.ts:30-32`
- Fix: Legacy senderType string and senderId long (faculty or admin), vNext typed senderType and senderUserId UUID.

## G2-15-021-004  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Announcement.java:14-50`
- vNext now: `src/db/schema/db10-announcements.ts:18-44`
- Fix: Old flat JPA entity with nullable isDeleted boolean and local timestamps, vNext structured PG table with deletedAt/by and timestamptz.

## G2-15-021-009  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Announcement.java:36-40`
- vNext now: `src/db/schema/db10-announcements.ts:30-32`
- Fix: Old senderId numeric may represent faculty admin row, new senderUserId always users, no single-step FK cast.

## G2-15-021-010  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Announcement.java:49-50`
- vNext now: `src/db/schema/db10-announcements.ts:38-41`
- Fix: Legacy isDeleted nullable flag replaced by deletedAt/deletedByUserId pair.

## G2-15-021-042  [P2] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Announcement.java:49-50`
- vNext now: `src/db/schema/db10-announcements.ts:73-75`
- Fix: Legacy nullable soft-delete boolean may be updated without author, vNext requires deletedByUserId and timestamps, migration shape conversion.

## G2-15-021-043  [P2] GAP  facet F21  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Announcement.java:14-16`
- vNext now: `src/db/schema/db10-announcements.ts:18-21`
- Fix: MySQL Hibernate annotations + Java enum vs PostgreSQL Drizzle schema, different migration/runtime integration.

## G2-15-021-046  [P2] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Announcement.java:42-50`
- vNext now: `src/db/schema/db10-announcements.ts:38-43`
- Fix: Legacy timestamp without timezone and isDeleted boolean vs PG timestamptz plus deletedAt/deletedBy/version.

## G2-14-014-048  [P3] GAP  facet F17  effort S
- Legacy: Legacy DTO title nullable fallback for assistive display `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/announcements/AnnouncementSearchDTO.java:20-25`
- vNext now: New title required nonempty `src/db/schema/db10-announcements.ts:28-29`
- Fix: Retain accessible fallback for historical title-less rows
