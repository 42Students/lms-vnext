/**
 * First-party per-device login sessions. The browser holds an opaque random
 * token; only its keyed HMAC digest is stored here. Sessions are user-scoped
 * (a person switches colleges/roles inside one session).
 * Contract: docs/planning/db01-device-session-contract.md.
 */
import { sql } from "drizzle-orm";
import {
  check,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const identityDeviceSessions = pgTable(
  "identity_device_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    credentialDigest: varchar("credential_digest", { length: 64 }).notNull(),
    deviceName: varchar("device_name", { length: 255 }),
    userAgent: varchar("user_agent", { length: 512 }),
    ipAddress: varchar("ip_address", { length: 64 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    revokedByUserId: uuid("revoked_by_user_id")
      .references(() => users.id, { onDelete: "restrict" }),
    revocationReason: text("revocation_reason"),
  },
  (table) => [
    uniqueIndex("identity_device_sessions_digest_uq").on(table.credentialDigest),
    index("identity_device_sessions_user_time_idx").on(
      table.userId,
      table.lastSeenAt,
    ),
    index("identity_device_sessions_expiry_idx").on(table.expiresAt),
    check(
      "identity_device_sessions_digest_format_ck",
      sql`${table.credentialDigest} ~ '^[0-9a-f]{64}$'`,
    ),
    check(
      "identity_device_sessions_expiry_ck",
      sql`${table.expiresAt} > ${table.createdAt}`,
    ),
    check(
      "identity_device_sessions_last_seen_ck",
      sql`${table.lastSeenAt} >= ${table.createdAt}`,
    ),
    check(
      "identity_device_sessions_revoked_time_ck",
      sql`${table.revokedAt} is null or ${table.revokedAt} >= ${table.createdAt}`,
    ),
    check(
      "identity_device_sessions_revoker_shape_ck",
      sql`(${table.revokedAt} is null) = (${table.revokedByUserId} is null)`,
    ),
  ],
);

/**
 * Retirement crosswalk (legacy JTI blacklist/session rows are never imported):
 *  - legacy.id -> retired INTEGER primary key, NOT our UUID session id.
 *  - legacy.user_id -> users UUID only via authenticated identity mapping.
 *  - legacy.token_jti -> discard entirely; NEVER a credential_digest.
 *  - legacy.role -> no longer session authority; active college x role choice is resolved live.
 *  - legacy.device_info -> optional deviceName / userAgent, display-only.
 *  - legacy.created_at -> historical event evidence only; a new session is minted at login.
 *  - legacy.expires_at -> historical lifetime, not a new login grant.
 *  - legacy.revoked_at -> historical revocation evidence, never reactivate.
 *  - legacy.last_used_at -> read-only lastSeenAt display if safely converted,
 *      NOT evidence of a still-active session.
 *  - legacy.updated_at -> independent audit edit time, NOT lastSeenAt.
 *  - legacy.active/revoked flag -> no live session without a freshly minted HMAC token.
 * Migration disposition: retire old rows, require owner approval for secure purge.
 * Native, third-party and session-bound consumers must be inventoried before
 * deletion; this runtime adapter deliberately cannot translate legacy JWTs.
 */
export function canImportLegacyDeviceSessionAsActive(): false { return false; }
