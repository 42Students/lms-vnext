# Announcement and notification migration crosswalk (chat-14)

Schema-only contracts for source `announcements`, `placement_announcement` and `notification`. These are **three different entities**, not interchangeable notice records. No migration, worker or runtime UI was executed.

| Source | Target | Required guard |
| --- | --- | --- |
| `announcements.id` BIGINT | `db10Announcements.legacyAnnouncementId` plus scoped `legacy_id_map` | UUID id stays canonical; original source ID remains lossless bigint |
| `receiver_type`/numeric `receiver_value` (six kinds) | Existing receiverType + resolved UUID receiverId; legacyReceiverValue retained | Resolve from college-scoped source key; never let raw numeric recipient select another tenant |
| `sender_type`/numeric `sender_id` | senderType/senderUserId and legacySenderId | Historic labels are not author permissions; do not fabricate missing actors |
| nullable legacy `is_deleted` | legacyWasDeleted; native deletedAt/deletedByUserId | NULL != true. Current soft-delete authorization stays native; backfill audit actor only if proven |
| placement_announcement BIGINT, audience, author, optional college | announcementBroadcastGroups + one announcement row per target college | Globally addressed TPOS source may have null college; group has stable organization scope |
| placement audience_kind/json/label/count | Group audienceKind/Json/Label/recipientCount | Immutable source snapshot. Never infer current audience permissions from old JSON |
| placement_announcement_college | announcementBroadcastColleges | Exact tenant-safe target college roster at send time |
| placement_announcement_recipient learner ID | announcementBroadcastLearners | Resolve learnerUserId within college, keep numeric original, do not send unresolved recipients |
| placement_announcement_read faculty/learner key and timestamp | announcementBroadcastReaderHistory | Historical per-reader reads differ from placementCellAnnouncementReads first-read-per-college rollup |
| sent_at/send_at/show_until/email/undo_group/last_reminded_at/job_id | Group sentAt/sendAt/showUntil/sendEmail/undoGroup/lastRemindedAt/legacyJobId | Historical provenance only; email, reminder, Undo and external links require service and ACL |
| notification scheduledAt/SCHEDULED/SENT/FAILED/deliveredAt | Separate `notificationDeliveryOutbox` (0214) | Never conflate announcement visibility with notification delivery. SENT cannot resend, only SCHEDULED can cancel; delayed recipient insert/worker not implemented |
| createdAt/updatedAt legacy local timestamps | UTC-aware vNext timestamps after verified timezone translation | Imported timestamp does not prove actual delivery or successful write-CAS |

The current DB10 announcement schema remains DRAFT and is not exported from the live schema index. 0220–0221 migrations only stage this model pending lane-15 journal and service review. An authenticated delivery controller must return the same 404 `Notification not found` for missing/deleted/out-of-scope requests, never leaked bodies. Announcement grouping and due queue API behavior, same-org target checks, per-reader reach analytics, and runtime sent/cancel state guards are still outstanding.
