/**
 * One user-bound login challenge (phone SMS and/or email code).
 * Codes are stored only as keyed HMAC (never raw), expire within five
 * minutes, and share one atomic verification budget across channels.
 * Contract: docs/planning/db01-auth-otp-handoff-contract.md.
 *
 * Legacy learnerId=0 preuser challenge intentionally cannot bypass this
 * authenticated user FK: a future pre-registration endpoint needs a distinct,
 * expiring non-account intent keyed by a stable HMAC fingerprint and rate limit,
 * with proof of ownership BEFORE binding to a newly created UUID user.
 * Never insert placeholder users, raw OTPs, roll numbers or plaintext contact
 * into this table. No historical verification OTPs are imported to vNext.
 * Hash/expiry/version constraints supersede legacy plaintext learner_acct_verification.
 */
import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  integer,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { colleges } from "./colleges";
import { collegeMemberships } from "./memberships";

export const identityAuthAttempts = pgTable(
  "identity_auth_attempts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    collegeId: uuid("college_id")
      .references(() => colleges.id, { onDelete: "restrict" }),
    membershipId: uuid("membership_id")
      .references(() => collegeMemberships.id, { onDelete: "restrict" }),
    targetRole: varchar("target_role", { length: 24 }).notNull(),
    contactFingerprint: varchar("contact_fingerprint", { length: 64 })
      .notNull(),
    // Short one-way tag of the requesting address; lets the send cap count
    // per contact AND per requester so one caller cannot lock a person out.
    ipTag: varchar("ip_tag", { length: 24 }),
    smsCodeMac: varchar("sms_code_mac", { length: 64 }),
    smsCodeExpiresAt: timestamp("sms_code_expires_at", { withTimezone: true }),
    emailCodeMac: varchar("email_code_mac", { length: 64 }),
    emailCodeExpiresAt: timestamp("email_code_expires_at", { withTimezone: true }),
    emailCodeSentAt: timestamp("email_code_sent_at", { withTimezone: true }),
    verificationAttempts: integer("verification_attempts").notNull().default(0),
    resendAttempts: integer("resend_attempts").notNull().default(0),
    version: integer("version").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    usedAt: timestamp("used_at", { withTimezone: true }),
  },
  (table) => [
    // Requires W01 composite UNIQUE (id,user_id,college_id) on memberships.
    // MATCH SIMPLE skips nullable membershipId; shape CHECK below closes bypass.
    foreignKey({
      name: "identity_auth_attempts_membership_scope_fk",
      columns: [table.membershipId, table.userId, table.collegeId],
      foreignColumns: [
        collegeMemberships.id,
        collegeMemberships.userId,
        collegeMemberships.collegeId,
      ],
    }).onDelete("restrict"),
    check(
      "identity_auth_attempts_membership_college_shape_ck",
      sql`${table.membershipId} IS NULL OR ${table.collegeId} IS NOT NULL`,
    ),
    index("identity_auth_attempts_user_expiry_idx").on(
      table.userId,
      table.expiresAt,
    ),
    index("identity_auth_attempts_contact_rate_idx").on(
      table.contactFingerprint,
      table.createdAt,
    ),
    index("identity_auth_attempts_expiry_idx").on(table.expiresAt),
    index("identity_auth_attempts_contact_ip_idx").on(
      table.contactFingerprint,
      table.ipTag,
      table.createdAt,
    ),
    index("identity_auth_attempts_ip_rate_idx").on(
      table.ipTag,
      table.createdAt,
    ),
    check(
      "identity_auth_attempts_expiry_ck",
      sql`${table.expiresAt} > ${table.createdAt}`,
    ),
    check(
      "identity_auth_attempts_attempt_bounds_ck",
      sql`${table.verificationAttempts} BETWEEN 0 AND 5 AND ${table.resendAttempts} >= 0`,
    ),
    check(
      "identity_auth_attempts_version_ck",
      sql`${table.version} >= 1`,
    ),
    check(
      "identity_auth_attempts_sms_shape_ck",
      sql`(${table.smsCodeMac} IS NULL) = (${table.smsCodeExpiresAt} IS NULL)`,
    ),
    check(
      "identity_auth_attempts_email_shape_ck",
      sql`(${table.emailCodeMac} IS NULL) = (${table.emailCodeExpiresAt} IS NULL)`,
    ),
    check(
      "identity_auth_attempts_mac_shape_ck",
      sql`(${table.smsCodeMac} IS NULL OR ${table.smsCodeMac} ~ '^[0-9a-f]{64}$') AND
          (${table.emailCodeMac} IS NULL OR ${table.emailCodeMac} ~ '^[0-9a-f]{64}$') AND
          ${table.contactFingerprint} ~ '^[0-9a-f]{64}$'`,
    ),
    check(
      "identity_auth_attempts_timestamp_ck",
      sql`(${table.verifiedAt} IS NULL OR (${table.verifiedAt} >= ${table.createdAt} AND ${table.verifiedAt} < ${table.expiresAt})) AND
          (${table.usedAt} IS NULL OR (${table.usedAt} >= ${table.createdAt} AND ${table.usedAt} < ${table.expiresAt}))`,
    ),
    check(
      "identity_auth_attempts_five_minute_expiry_ck",
      sql`${table.expiresAt} <= ${table.createdAt} + interval '5 minutes'`,
    ),
    check(
      "identity_auth_attempts_target_role_shape_ck",
      sql`char_length(btrim(${table.targetRole})) BETWEEN 1 AND 24`,
    ),
    check(
      "identity_auth_attempts_consumed_shape_ck",
      sql`${table.usedAt} IS NULL OR
          (${table.verifiedAt} IS NOT NULL
           AND ${table.verifiedAt} <= ${table.usedAt}
           AND ${table.smsCodeMac} IS NULL
           AND ${table.smsCodeExpiresAt} IS NULL
           AND ${table.emailCodeMac} IS NULL
           AND ${table.emailCodeExpiresAt} IS NULL)`,
    ),
  ],
);
