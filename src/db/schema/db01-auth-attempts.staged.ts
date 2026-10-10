/**
 * DB-004 / Chat 2: source-backed OTP attempt database contract.
 *
 * STAGED ONLY. Not exported from src/db/schema/index.ts, not migrated,
 * and NOT a live authentication implementation. Chat 1 owns migration
 * registration. Do not activate alongside legacy raw OTP persistence.
 *
 * Legacy proof:
 * lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5
 * PublicMobileAuthController.java and MobileLoginAttemptRepository.java.
 * Replaces raw short OTP values with keyed MACs; unauthenticated attempts
 * have strict expiry and persisted atomic retry budgets.
 */
import { sql } from "drizzle-orm";
import {
  check,
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

export const identityAuthAttemptsStaged = pgTable(
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
    index("identity_auth_attempts_user_expiry_idx").on(
      table.userId,
      table.expiresAt,
    ),
    index("identity_auth_attempts_contact_rate_idx").on(
      table.contactFingerprint,
      table.createdAt,
    ),
    index("identity_auth_attempts_expiry_idx").on(table.expiresAt),
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
      sql`(${table.verifiedAt} IS NULL OR ${table.verifiedAt} >= ${table.createdAt}) AND
          (${table.usedAt} IS NULL OR ${table.usedAt} >= ${table.createdAt})`,
    ),
  ],
);
