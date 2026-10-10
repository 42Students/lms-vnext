/**
 * DB-004 / Chat 2 — staged one-time cross-host authentication handoff.
 *
 * STAGED ONLY. Not exported from src/db/schema/index.ts and has no numbered
 * migration. Chat 1 remains the sole migration integrator.
 *
 * Legacy currently stores raw access+refresh tokens in auth_handoff_token for
 * cross-host membership switching. vNext must preserve the one-time / expiry /
 * target-host job without persisting provider credentials.
 *
 * The browser receives the random handoff code; PostgreSQL stores only its
 * one-way hash. API-phase consume must atomically mark it consumed, revalidate
 * the canonical user + membership + target host, then bootstrap Identity
 * Platform on the target origin without returning stored refresh credentials.
 */
import { sql } from "drizzle-orm";
import {
  check,
  index,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { collegeMemberships } from "./memberships";
import { users } from "./users";

export const identityAuthHandoffsStaged = pgTable(
  "identity_auth_handoffs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    membershipId: uuid("membership_id").references(
      () => collegeMemberships.id,
      { onDelete: "restrict" },
    ),
    codeHash: varchar("code_hash", { length: 128 }).notNull(),
    targetHost: varchar("target_host", { length: 253 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
  },
  (table) => [
    index("identity_auth_handoffs_user_expiry_idx").on(
      table.userId,
      table.expiresAt,
    ),
    index("identity_auth_handoffs_target_expiry_idx").on(
      table.targetHost,
      table.expiresAt,
    ),
    check(
      "identity_auth_handoffs_expiry_ck",
      sql`${table.expiresAt} > ${table.createdAt}`,
    ),
    check(
      "identity_auth_handoffs_consumed_ck",
      sql`${table.consumedAt} is null or ${table.consumedAt} >= ${table.createdAt}`,
    ),
  ],
);
