/**
 * DB10 log-alert triage persistence DRAFT ONLY.
 *
 * Raw logs should live in the platform logging system. These tables persist the
 * product's durable triage memory: known error signatures, blast radius and
 * poll/admin cursors. Chat 1 owns migration registration and schema-barrel
 * export. No runtime producer is claimed by this draft.
 *
 * Legacy evidence: V157, V158, V164 and LogAlertSignature/LogAlertState.
 *
 * V158's account=<numeric ID>/<ROLE> log marker is an opaque, role-typed
 * legacy identity, NOT a foreign key to the vNext users table. Keep only an
 * application-keyed hash of a *verified* typed identity for blast radius.
 * Unauthenticated/untrusted markers do not supply a trusted account identity.
 */
import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  index,
  pgTable,
  primaryKey,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const db10LogAlertSignatures = pgTable(
  "log_alert_signatures",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    environment: varchar("environment", { length: 32 }).notNull(),
    signatureHash: varchar("signature_hash", { length: 64 }).notNull(),
    sampleMessage: varchar("sample_message", { length: 500 }),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true }).notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull(),
    // PostgreSQL bigint can exceed Number.MAX_SAFE_INTEGER. Never coerce into JS number.
    occurrenceCount: bigint("occurrence_count", { mode: "bigint" }).notNull().default(1n),
    muted: boolean("muted").notNull().default(false),
    fixStatus: varchar("fix_status", { length: 16 }).notNull().default("OPEN"),
    fixedInCommit: varchar("fixed_in_commit", { length: 64 }),
    fixedAt: timestamp("fixed_at", { withTimezone: true }),
    statusNote: varchar("status_note", { length: 500 }),
    mutedReason: varchar("muted_reason", { length: 255 }),
    issuePublicId: varchar("issue_public_id", { length: 32 }),
    lastSeenCommit: varchar("last_seen_commit", { length: 64 }),
    regressedAt: timestamp("regressed_at", { withTimezone: true }),
    samplePath: varchar("sample_path", { length: 255 }),
  },
  (t) => [
    uniqueIndex("db10_log_alert_signature_env_hash_uq")
      .on(t.environment, t.signatureHash),
    index("db10_log_alert_signature_status_seen_idx")
      .on(t.fixStatus, t.lastSeenAt),
    index("db10_log_alert_signature_muted_seen_idx")
      .on(t.muted, t.lastSeenAt),
    check("db10_log_alert_signature_hash_ck",
      sql`${t.signatureHash} ~ '^[0-9a-f]{64}$'`),
    check("db10_log_alert_signature_count_ck",
      sql`${t.occurrenceCount} >= 1`),
    check("db10_log_alert_signature_status_ck",
      sql`${t.fixStatus} in ('OPEN','FIXED','EXPECTED')`),
    check("db10_log_alert_signature_seen_order_ck",
      sql`${t.lastSeenAt} >= ${t.firstSeenAt}`),
    check("db10_log_alert_signature_fixed_shape_ck",
      sql`(${t.fixStatus} = 'FIXED' and ${t.fixedAt} is not null)
        or ${t.fixStatus} <> 'FIXED'`),
  ],
);

export const db10LogAlertSignatureAccounts = pgTable(
  "log_alert_signature_accounts",
  {
    signatureId: uuid("signature_id")
      .notNull()
      .references(() => db10LogAlertSignatures.id, { onDelete: "cascade" }),
    /** HMAC-SHA256 of the server-verified typed account identity; never a raw
     * account ID, display name, phone or cross-tenant user FK. Unauthenticated
     * logs have no account marker and do not create a blast-radius row. */
    accountKeyHash: varchar("account_key_hash", { length: 64 }).notNull(),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true }).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.signatureId, t.accountKeyHash] }),
    index("db10_log_alert_signature_accounts_hash_idx").on(t.accountKeyHash, t.firstSeenAt),
    check("db10_log_alert_signature_accounts_hash_ck",
      sql`${t.accountKeyHash} ~ '^[0-9a-f]{64}$'`),
  ],
);

export const db10LogAlertStates = pgTable(
  "log_alert_states",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    stateKey: varchar("state_key", { length: 64 }).notNull(),
    pollCursorAt: timestamp("poll_cursor_at", { withTimezone: true }),
    adminLastViewedAt: timestamp("admin_last_viewed_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("db10_log_alert_states_key_uq").on(t.stateKey),
    check("db10_log_alert_states_key_ck", sql`length(trim(${t.stateKey})) > 0`),
  ],
);
