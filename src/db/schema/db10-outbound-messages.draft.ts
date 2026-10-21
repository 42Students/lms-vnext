/**
 * DB10 transactional outbox + suppression tables: migration 0164 is registered,
 * but activation remains FAIL-CLOSED until owner-approved PostgreSQL replay,
 * database role hardening, suppression race checks and dispatch verification.
 * There is NO production sender or externally callable outbox API in this batch.
 * Invitation URLs/merge variables/recipient addresses MUST stay encrypted.
 */
import { sql } from "drizzle-orm";
import {
  check, foreignKey, index, integer, pgTable, text, timestamp, uniqueIndex,
  uuid, varchar,
} from "drizzle-orm/pg-core";
import { colleges } from "./colleges";
import { organizations } from "./organizations";

export const db10OutboundMessages = pgTable(
  "outbound_messages",
  {
    id: uuid("id").primaryKey(),
    organizationId: uuid("organization_id").notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    collegeId: uuid("college_id").notNull()
      .references(() => colleges.id, { onDelete: "restrict" }),
    sourceEventId: uuid("source_event_id").notNull(),
    channel: varchar("channel", { length: 16 }).notNull(),
    templateKey: varchar("template_key", { length: 64 }).notNull(),
    /** Secret-derived, never raw contact information. */
    recipientHash: varchar("recipient_hash", { length: 64 }).notNull(),
    /** Row-scoped SHA-256 commitment; NOT the globally correlatable EMAIL HMAC. */
    globalEmailHashCommitment: varchar("global_email_hash_commitment", { length: 64 }),
    idempotencyKey: varchar("idempotency_key", { length: 64 }).notNull(),
    requestDigest: varchar("request_digest", { length: 64 }).notNull(),
    keyId: varchar("key_id", { length: 24 }).notNull(),
    nonceBase64: varchar("nonce_base64", { length: 24 }).notNull(),
    tagBase64: varchar("tag_base64", { length: 32 }).notNull(),
    ciphertextBase64: text("ciphertext_base64").notNull(),
    status: varchar("status", { length: 24 }).notNull().default("PENDING"),
    notBefore: timestamp("not_before", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true }),
    attempts: integer("attempts").notNull().default(0),
    claimedBy: varchar("claimed_by", { length: 120 }),
    claimExpiresAt: timestamp("claim_expires_at", { withTimezone: true }),
    claimFence: integer("claim_fence").notNull().default(0),
    /** Only the matching claim fence may be completed after pre-send authorization. */
    preSendAuthorizedFence: integer("pre_send_authorized_fence"),
    providerMessageId: varchar("provider_message_id", { length: 200 }),
    providerAcceptedAt: timestamp("provider_accepted_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    lastSafeFailureCode: varchar("last_safe_failure_code", { length: 40 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // Prevent forged or subsequently reassigned organization/college pairs.
    // Chat 1 must first register UNIQUE colleges(id, organization_id) and
    // stage-check any existing rows before promoting this composite FK.
    foreignKey({
      name: "db10_outbound_college_organization_fk",
      columns: [t.collegeId, t.organizationId],
      foreignColumns: [colleges.id, colleges.organizationId],
    }).onUpdate("restrict").onDelete("restrict"),
    uniqueIndex("db10_outbound_idempotency_uq").on(t.idempotencyKey),
    index("db10_outbound_due_idx").on(t.status, t.nextAttemptAt, t.notBefore),
    index("db10_outbound_scope_idx").on(t.organizationId, t.collegeId, t.createdAt),
    index("db10_outbound_claim_expiry_idx").on(t.claimExpiresAt, t.status),
    check("db10_outbound_channel_ck",
      sql`${t.channel} in ('EMAIL','SMS','WHATSAPP')`),
    check("db10_outbound_template_ck",
      sql`${t.templateKey} in ('RECRUITER_INVITATION','RECRUITER_INVITATION_REMINDER')`),
    check("db10_outbound_status_ck",
      sql`${t.status} in ('PENDING','CLAIMED','RETRY','PROVIDER_ACCEPTED','DELIVERED','SUPPRESSED','BOUNCED','FAILED','EXPIRED')`),
    check("db10_outbound_request_digest_ck",
      sql`${t.requestDigest} ~ '^[0-9a-f]{64}$'`),
    check("db10_outbound_idempotency_hash_ck",
      sql`${t.idempotencyKey} ~ '^[0-9a-f]{64}$'`),
    check("db10_outbound_recipient_hash_ck",
      sql`${t.recipientHash} ~ '^[0-9a-f]{64}$'`),
    check("db10_outbound_email_commitment_ck",
      sql`(${t.channel} = 'EMAIL' and ${t.globalEmailHashCommitment} is not null and ${t.globalEmailHashCommitment} ~ '^[0-9a-f]{64}$')
        or (${t.channel} <> 'EMAIL' and ${t.globalEmailHashCommitment} is null)`),
    check("db10_outbound_pre_send_fence_ck",
      sql`${t.preSendAuthorizedFence} is null or
        (${t.status} = 'CLAIMED' and ${t.preSendAuthorizedFence} = ${t.claimFence})`),
    check("db10_outbound_attempts_ck",
      sql`${t.attempts} >= 0 and ${t.attempts} <= 5`),
    check("db10_outbound_fence_ck", sql`${t.claimFence} >= 0`),
    check("db10_outbound_expiry_ck",
      sql`${t.expiresAt} is null or ${t.notBefore} is null or ${t.expiresAt} > ${t.notBefore}`),
    check("db10_outbound_claim_shape_ck",
      sql`(${t.status} = 'CLAIMED' and ${t.claimedBy} is not null and ${t.claimExpiresAt} is not null)
        or (${t.status} <> 'CLAIMED' and ${t.claimedBy} is null and ${t.claimExpiresAt} is null)`),
  ],
);

export const db10OutboundSuppressions = pgTable(
  "outbound_suppressions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    channel: varchar("channel", { length: 16 }).notNull(),
    recipientHash: varchar("recipient_hash", { length: 64 }).notNull(),
    reason: varchar("reason", { length: 24 }).notNull(),
    legacySuppressionId: integer("legacy_suppression_id"),
    /** Never store source plaintext email or freeform notes here. */
    legacyReasonCategory: varchar("legacy_reason_category",{length:24}),
    legacyCreatedAt: timestamp("legacy_created_at",{withTimezone:true}),
    clearActorUserId: uuid("clear_actor_user_id"),
    clearReason: varchar("clear_reason",{length:500}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    clearedAt: timestamp("cleared_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("db10_outbound_suppressions_legacy_uq")
      .on(t.organizationId,t.legacySuppressionId)
      .where(sql`${t.legacySuppressionId} is not null`),
    index("db10_outbound_suppression_history_idx")
      .on(t.recipientHash,t.createdAt),
    uniqueIndex("db10_outbound_suppressions_active_uq")
      .on(t.organizationId, t.channel, t.recipientHash)
      .where(sql`${t.clearedAt} is null`),
    index("db10_outbound_suppressions_scope_idx")
      .on(t.organizationId, t.createdAt),
    check("db10_outbound_suppressions_channel_ck",
      sql`${t.channel} in ('EMAIL','SMS','WHATSAPP')`),
    check("db10_outbound_suppressions_reason_ck",
      sql`${t.reason} in ('UNSUBSCRIBED','BOUNCE','COMPLAINT','LEGACY_UNSPECIFIED','ADMIN_BLOCK','LEGACY_UNSPECIFIED')`),
    check("db10_outbound_suppressions_hash_ck",
      sql`${t.recipientHash} ~ '^[0-9a-f]{64}$'`),
    check("db10_outbound_suppressions_clear_order_ck",
      sql`${t.clearedAt} is null or ${t.clearedAt} >= ${t.createdAt}`),
  ],
);

/**
 * Legacy email_suppression.email_norm was globally keyed across colleges.
 * A tenant-scoped recipientHash cannot represent that: it contains the
 * organization UUID. Global HMAC is derived separately with a distinct domain
 * label and must not store or expose the plaintext email.
 *
 * This table is intentionally EMAIL-only. Tenant-specific ADMIN_BLOCK and
 * future SMS/WhatsApp suppression remain in outbound_suppressions. No generic
 * worker access is granted until migration, role privileges and pre-send
 * rechecks pass independent database verification. A future import from legacy
 * email_suppression.email_norm requires an OFFLINE canonical lowercase/trim
 * normalization + domain-separated stable-key HMAC crosswalk: verify collisions,
 * dedupe into this global table, securely discard raw identifiers, and never
 * activate delivery while the HMAC key is missing or being rotated.
 */
export const db10GlobalEmailSuppressions = pgTable(
  "outbound_global_email_suppressions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    recipientHash: varchar("recipient_hash", { length: 64 }).notNull(),
    reason: varchar("reason", { length: 24 }).notNull(),
    /** Null for an externally originated opt-out not tied to an event. */
    sourceEventId: uuid("source_event_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull().defaultNow(),
    clearedAt: timestamp("cleared_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("db10_global_email_suppressions_legacy_uq")
      .on(t.legacySuppressionId)
      .where(sql`${t.legacySuppressionId} is not null`),
    index("db10_global_email_suppression_history_idx")
      .on(t.recipientHash,t.createdAt),
    uniqueIndex("db10_global_email_suppressions_active_uq")
      .on(t.recipientHash).where(sql`${t.clearedAt} is null`),
    index("db10_global_email_suppressions_created_idx").on(t.createdAt),
    check("db10_global_email_suppressions_hash_ck",
      sql`${t.recipientHash} ~ '^[0-9a-f]{64}$'`),
    check("db10_global_email_suppressions_reason_ck",
      sql`${t.reason} in ('UNSUBSCRIBED','BOUNCE','COMPLAINT','LEGACY_UNSPECIFIED')`),
    check("db10_global_email_suppressions_clear_order_ck",
      sql`${t.clearedAt} is null or ${t.clearedAt} >= ${t.createdAt}`),
  ],
);
