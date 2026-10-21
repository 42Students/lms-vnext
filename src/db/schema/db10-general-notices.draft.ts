/**
 * DB-024 — general TPO notification intents; DRAFT ONLY.
 *
 * V161 notification_outbox + NotificationOutboxService needs APP notices,
 * undoable 30-second holds and recipient-local digest scheduling. This is not
 * the encrypted recruiter invitation/suppression transport defined separately
 * in db10-outbound-messages.draft.ts.
 *
 * Sole migration/schema-barrel owner is Chat 1. DO NOT export this file from
 * src/db/schema/index.ts or turn on a dispatcher before database replay,
 * identity/scope checks and inter-channel handoff tests have executed.
 */
import { sql } from "drizzle-orm";
import {
  boolean, check, date, index, integer, jsonb, pgTable, text,
  timestamp, uniqueIndex, uuid, varchar,
} from "drizzle-orm/pg-core";
import { colleges } from "./colleges";
import { organizations } from "./organizations";
import { collegeMemberships } from "./memberships";
import { users } from "./users";
import { activityEvents } from "./activity";

export const db10GeneralNotices = pgTable(
  "general_notification_outbox",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    collegeId: uuid("college_id").notNull()
      .references(() => colleges.id, { onDelete: "restrict" }),
    /** Producer-issued stable logical event; not a foreign ID from the legacy DB. */
    sourceEventId: uuid("source_event_id").notNull()
      .references(() => activityEvents.id, { onDelete: "restrict" }),
    event: varchar("event", { length: 50 }).notNull(),
    /** Legacy LEARNER / FACULTY / RECRUITER is a role, not a user PK type. */
    recipientType: varchar("recipient_type", { length: 16 }).notNull(),
    recipientUserId: uuid("recipient_user_id").notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    /** Mandatory for college-learner/faculty, null for verified recruiter grant. */
    recipientMembershipId: uuid("recipient_membership_id")
      .references(() => collegeMemberships.id, { onDelete: "restrict" }),
    channel: varchar("channel", { length: 10 }).notNull(),
    /** Nonsecret allowlisted context ONLY; never bearer tokens or contact PII. */
    safePayloadJson: jsonb("safe_payload_json")
      .$type<Record<string, unknown>>().notNull().default({}),
    sendAfter: timestamp("send_after", { withTimezone: true }).notNull(),
    status: varchar("status", { length: 20 }).notNull().default("PENDING"),
    undoGroupId: uuid("undo_group_id"),
    holdForUndo: boolean("hold_for_undo").notNull().default(false),
    /** For EMAIL digest rows, grouping is by recipient + local delivery date. */
    digestLocalDate: date("digest_local_date", { mode: "string" }),
    /** Time zone is explicit: legacy digest scheduled 08:00 Asia/Kolkata. */
    digestTimezone: varchar("digest_timezone", { length: 40 }),
    claimedBy: varchar("claimed_by", { length: 120 }),
    claimedAt: timestamp("claimed_at", { withTimezone: true }),
    claimExpiresAt: timestamp("claim_expires_at", { withTimezone: true }),
    claimFence: integer("claim_fence").notNull().default(0),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    failureCode: varchar("failure_code", { length: 60 }),
    /** Support-safe explanation; never raw provider body, tokens or contact PII. */
    safeFailureReason: varchar("safe_failure_reason", { length: 500 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    /** HMAC over tenant + sourceEventId + event + role + recipient + channel; not raw PII. */
    idempotencyKey: varchar("idempotency_key", { length: 64 }).notNull(),
  },
  (t) => [
    uniqueIndex("db10_general_notices_idempotency_uq").on(t.idempotencyKey),
    // A single user can receive distinct LEARNER and FACULTY notices for one event.
    uniqueIndex("db10_general_notices_source_recipient_channel_uq")
      .on(t.sourceEventId, t.recipientUserId, t.recipientType, t.channel),
    index("db10_general_notices_due_idx").on(t.status, t.sendAfter),
    index("db10_general_notices_undo_idx").on(t.collegeId, t.undoGroupId, t.status),
    index("db10_general_notices_recipient_idx")
      .on(t.recipientUserId, t.channel, t.status, t.sendAfter),
    index("db10_general_notices_digest_idx")
      .on(t.collegeId, t.digestLocalDate, t.recipientUserId),
    check("db10_general_notices_event_ck",
      sql`length(trim(${t.event})) > 0`),
    check("db10_general_notices_channel_ck",
      sql`${t.channel} in ('APP','EMAIL','SMS')`),
    check("db10_general_notices_recipient_ck",
      sql`${t.recipientType} in ('LEARNER','FACULTY','RECRUITER')`),
    check("db10_general_notices_membership_shape_ck",
      sql`(${t.recipientType} in ('LEARNER','FACULTY') and ${t.recipientMembershipId} is not null)
        or (${t.recipientType} = 'RECRUITER' and ${t.recipientMembershipId} is null)`),
    check("db10_general_notices_status_ck",
      sql`${t.status} in ('PENDING','CLAIMED','HANDED_OFF','SENT','CANCELLED','FAILED')`),
    check("db10_general_notices_handoff_ck",
      sql`${t.status} <> 'HANDED_OFF' or ${t.channel} in ('EMAIL','SMS')`),
    check("db10_general_notices_undo_ck",
      sql`not ${t.holdForUndo}
        or (${t.undoGroupId} is not null and
            ${t.sendAfter} >= ${t.createdAt} + interval '30 seconds')`),
    check("db10_general_notices_digest_ck",
      sql`(${t.digestLocalDate} is null and ${t.digestTimezone} is null)
        or (${t.channel} = 'EMAIL'
          and ${t.digestLocalDate} is not null
          and ${t.digestTimezone} = 'Asia/Kolkata')`),
    check("db10_general_notices_claim_ck",
      sql`(${t.status} = 'CLAIMED' and ${t.claimedBy} is not null
           and ${t.claimedAt} is not null and ${t.claimExpiresAt} is not null)
        or (${t.status} <> 'CLAIMED'
           and ${t.claimedBy} is null and ${t.claimExpiresAt} is null)`),
    check("db10_general_notices_claim_time_ck",
      sql`${t.claimExpiresAt} is null or ${t.claimExpiresAt} > ${t.claimedAt}`),
    check("db10_general_notices_fence_ck", sql`${t.claimFence} >= 0`),
    check("db10_general_notices_sent_ck",
      sql`(${t.status} = 'SENT' and ${t.sentAt} is not null)
        or (${t.status} <> 'SENT' and ${t.sentAt} is null)`),
    check("db10_general_notices_idempotency_ck",
      sql`${t.idempotencyKey} ~ '^[0-9a-f]{64}$'`),
  ],
);

/** Source-compatible SMS attempt audit. Never store message body or full phone. */
export const db10SmsDeliveryLogs = pgTable("general_sms_delivery_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  noticeId: uuid("notice_id").references(() => db10GeneralNotices.id, { onDelete: "restrict" }),
  collegeId: uuid("college_id").references(() => colleges.id, { onDelete: "restrict" }),
  legacySmsLogId: integer("legacy_sms_log_id"),
  purpose: varchar("purpose", { length: 64 }).notNull(),
  recipientSuffix: varchar("recipient_suffix", { length: 4 }),
  status: varchar("status", { length: 16 }).notNull(),
  providerMessageId: varchar("provider_message_id", { length: 64 }),
  errorSummary: varchar("error_summary", { length: 500 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("db10_sms_delivery_logs_college_status_time_idx").on(t.collegeId, t.status, t.createdAt),
  index("db10_sms_delivery_logs_notice_idx").on(t.noticeId),
  check("db10_sms_delivery_logs_status_ck", sql`${t.status} in ('SENT','FAILED')`),
  check("db10_sms_delivery_logs_suffix_ck", sql`${t.recipientSuffix} is null or ${t.recipientSuffix} ~ '^[0-9]{4}$'`),
  check("db10_sms_delivery_logs_purpose_ck", sql`length(trim(${t.purpose})) between 1 and 64`),
]);
