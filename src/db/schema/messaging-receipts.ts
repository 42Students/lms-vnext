/**
 * Outbound delivery batches and per-recipient receipts.
 * No plaintext recipient, variables, provider authorization or invitation URL:
 * recipient_key is a tenant-keyed HMAC only.
 */
import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { colleges } from "./colleges";
import { organizations } from "./organizations";
import { users } from "./users";

export const messagingDeliveryBatches = pgTable(
  "messaging_delivery_batches",
  {
    id: uuid("id").primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id),
    actorUserId: uuid("actor_user_id")
      .notNull()
      .references(() => users.id),
    purpose: varchar("purpose", { length: 160 }).notNull(),
    total: integer("total").notNull(),
    queued: integer("queued").notNull().default(0),
    sent: integer("sent").notNull().default(0),
    failed: integer("failed").notNull().default(0),
    suppressed: integer("suppressed").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    finalizedAt: timestamp("finalized_at", { withTimezone: true }),
  },
  (t) => [
    index("messaging_batches_scope_idx").on(t.collegeId, t.createdAt),
    check("messaging_delivery_batches_total_check", sql`${t.total}>=0 and ${t.total}<=500`),
    check("messaging_delivery_batches_queued_check", sql`${t.queued}>=0`),
    check("messaging_delivery_batches_sent_check", sql`${t.sent}>=0`),
    check("messaging_delivery_batches_failed_check", sql`${t.failed}>=0`),
    check("messaging_delivery_batches_suppressed_check", sql`${t.suppressed}>=0`),
    check(
      "messaging_batch_count_ck",
      sql`${t.queued}+${t.sent}+${t.failed}+${t.suppressed}<=${t.total}`,
    ),
  ],
);

export const messagingDeliveryReceipts = pgTable(
  "messaging_delivery_receipts",
  {
    id: uuid("id").primaryKey(),
    batchId: uuid("batch_id")
      .notNull()
      .references(() => messagingDeliveryBatches.id, { onDelete: "restrict" }),
    recipientKey: varchar("recipient_key", { length: 64 }).notNull(),
    channel: varchar("channel", { length: 16 }).notNull(),
    templateKey: varchar("template_key", { length: 160 }).notNull(),
    purpose: varchar("purpose", { length: 160 }).notNull(),
    status: varchar("status", { length: 16 }).notNull(),
    reason: varchar("reason", { length: 64 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("messaging_receipts_batch_recipient_uq").on(
      t.batchId,
      t.recipientKey,
      t.channel,
      t.templateKey,
      t.purpose,
    ),
    index("messaging_receipts_batch_idx").on(t.batchId, t.status),
    check("messaging_delivery_receipts_recipient_key_check", sql`${t.recipientKey} ~ '^[a-f0-9]{64}$'`),
    check("messaging_delivery_receipts_channel_check", sql`${t.channel} in ('EMAIL','SMS')`),
    check("messaging_delivery_receipts_status_check", sql`${t.status} in ('QUEUED','SENT','FAILED','SUPPRESSED')`),
    check(
      "messaging_delivery_receipts_reason_check",
      sql`${t.reason} in ('nonprod-not-allowlisted','unsubscribed','rate-limited','daily-cap','invalid-recipient')`,
    ),
  ],
);

/**
 * Provider-attempt audit shared by OTP, attendance and TPO sends.
 * This is NOT proof of handset delivery. No raw phone number is stored.
 */
export const messagingSmsDeliveryAttempts = pgTable(
  "messaging_sms_delivery_attempts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").references(
      () => organizations.id, { onDelete: "restrict" },
    ),
    collegeId: uuid("college_id").references(
      () => colleges.id, { onDelete: "restrict" },
    ),
    userId: uuid("user_id").references(
      () => users.id, { onDelete: "restrict" },
    ),
    recipientKey: varchar("recipient_key", { length: 64 }),
    /** At most four numeric digits for authorized support searches. */
    recipientSuffix: varchar("recipient_suffix", { length: 4 }),
    purpose: varchar("purpose", { length: 160 }).notNull(),
    templateKey: varchar("template_key", { length: 160 }),
    providerMessageId: varchar("provider_message_id", { length: 64 }),
    /** API accepted != delivered to a handset. */
    outcome: varchar("outcome", { length: 24 }).notNull(),
    /** Code only; never persist provider response with phone/token/secret. */
    errorCode: varchar("error_code", { length: 64 }),
    attemptedAt: timestamp("attempted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("messaging_sms_attempts_time_idx").on(t.attemptedAt),
    index("messaging_sms_attempts_suffix_purpose_idx").on(
      t.recipientSuffix, t.purpose, t.attemptedAt,
    ),
    index("messaging_sms_attempts_college_time_idx").on(
      t.collegeId, t.attemptedAt,
    ),
    check(
      "messaging_sms_attempts_outcome_ck",
      sql`${t.outcome} in ('PROVIDER_ACCEPTED','FAILED','SUPPRESSED')`,
    ),
    check(
      "messaging_sms_attempts_suffix_ck",
      sql`${t.recipientSuffix} is null or ${t.recipientSuffix} ~ '^[0-9]{1,4}$'`,
    ),
    check(
      "messaging_sms_attempts_recipient_key_ck",
      sql`${t.recipientKey} is null or ${t.recipientKey} ~ '^[a-f0-9]{64}$'`,
    ),
  ],
);
