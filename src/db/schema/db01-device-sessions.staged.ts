/**
 * DB-004 / Chat 2 — staged per-device session registry.
 *
 * STAGED ONLY. This file is intentionally not exported from src/db/schema/index.ts
 * and has no numbered Drizzle migration. Chat 1 remains the sole migration
 * integrator.
 *
 * Legacy parity reason:
 * lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5 persists user_session rows and
 * supports list-active + revoke-specific-session behavior. vNext currently uses
 * Firebase session-cookie verification plus account-wide revokeRefreshTokens().
 *
 * Security rule: never persist a raw Firebase session cookie, refresh token, ID
 * token, or legacy refresh-token JTI. The application session handle must be
 * random and only its one-way hash is persisted.
 */
import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const identityDeviceSessionsStaged = pgTable(
  "identity_device_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    sessionKeyHash: varchar("session_key_hash", { length: 128 }).notNull(),
    deviceName: varchar("device_name", { length: 255 }),
    userAgent: varchar("user_agent", { length: 512 }),
    ipAddress: varchar("ip_address", { length: 64 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    revocationReason: text("revocation_reason"),
    version: integer("version").notNull().default(1),
  },
  (table) => [
    uniqueIndex("identity_device_sessions_key_hash_uq").on(
      table.sessionKeyHash,
    ),
    index("identity_device_sessions_user_active_idx").on(
      table.userId,
      table.revokedAt,
      table.expiresAt,
    ),
    check(
      "identity_device_sessions_expiry_ck",
      sql`${table.expiresAt} > ${table.createdAt}`,
    ),
    check(
      "identity_device_sessions_last_used_ck",
      sql`${table.lastUsedAt} >= ${table.createdAt}`,
    ),
    check(
      "identity_device_sessions_revoked_ck",
      sql`${table.revokedAt} is null or ${table.revokedAt} >= ${table.createdAt}`,
    ),
    check(
      "identity_device_sessions_version_ck",
      sql`${table.version} >= 1`,
    ),
  ],
);
