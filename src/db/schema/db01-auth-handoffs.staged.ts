/**
 * DB-004 / Chat 2 — immutable, one-time cross-host auth handoff candidate.
 * STAGED ONLY: not exported from src/db/schema/index.ts or migrated.
 *
 * Legacy AuthController.completeSwitch -> handoff/consume stores raw tokens:
 * do NOT preserve that security flaw. The new table stores a keyed HMAC
 * of a 256-bit one-time code and explicit target domain/membership pointers.
 * The API phase must re-check user, membership, domain verification and
 * target host on atomic consumption; an FK alone is insufficient.
 */
import { sql } from "drizzle-orm";
import {
  check,
  index,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { collegeMemberships } from "./memberships";
import { tenantDomains } from "./tenant-domains";

export const identityAuthHandoffsStaged = pgTable(
  "identity_auth_handoffs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    targetMembershipId: uuid("target_membership_id")
      .notNull()
      .references(() => collegeMemberships.id, { onDelete: "restrict" }),
    targetDomainId: uuid("target_domain_id")
      .notNull()
      .references(() => tenantDomains.id, { onDelete: "restrict" }),
    targetHost: varchar("target_host", { length: 253 }).notNull(),
    codeMac: varchar("code_mac", { length: 64 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("identity_auth_handoffs_code_mac_uq").on(table.codeMac),
    index("identity_auth_handoffs_user_expiry_idx").on(table.userId, table.expiresAt),
    index("identity_auth_handoffs_domain_expiry_idx").on(
      table.targetDomainId,
      table.expiresAt,
    ),
    check(
      "identity_auth_handoffs_lifetime_ck",
      sql`${table.expiresAt} > ${table.createdAt}
          AND ${table.expiresAt} <= ${table.createdAt} + interval '2 minutes'`,
    ),
    check(
      "identity_auth_handoffs_consumed_ck",
      sql`${table.consumedAt} IS NULL OR
          (${table.consumedAt} >= ${table.createdAt} AND ${table.consumedAt} < ${table.expiresAt})`,
    ),
    check(
      "identity_auth_handoffs_mac_format_ck",
      sql`${table.codeMac} ~ '^[0-9a-f]{64}$'`,
    ),
  ],
);
