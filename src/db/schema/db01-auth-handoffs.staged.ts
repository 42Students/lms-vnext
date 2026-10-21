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
  foreignKey,
  index,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { colleges } from "./colleges";
import { collegeMemberships } from "./memberships";
import { tenantDomains } from "./tenant-domains";

export const identityAuthHandoffsStaged = pgTable(
  "identity_auth_handoffs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "restrict" }),
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
    // W01 must first register composite parent uniqueness on memberships,
    // and tenant_domains(id,college_id), before promoting this staging file.
    foreignKey({
      name: "identity_auth_handoffs_membership_scope_fk",
      columns: [table.targetMembershipId, table.userId, table.collegeId],
      foreignColumns: [
        collegeMemberships.id,
        collegeMemberships.userId,
        collegeMemberships.collegeId,
      ],
    }).onDelete("restrict"),
    foreignKey({
      name: "identity_auth_handoffs_domain_scope_fk",
      columns: [table.targetDomainId, table.collegeId],
      foreignColumns: [tenantDomains.id, tenantDomains.collegeId],
    }).onDelete("restrict"),
    uniqueIndex("identity_auth_handoffs_code_mac_uq").on(table.codeMac),
    index("identity_auth_handoffs_user_expiry_idx").on(table.userId, table.expiresAt),
    index("identity_auth_handoffs_domain_expiry_idx").on(
      table.targetDomainId,
      table.expiresAt,
    ),
    index("identity_auth_handoffs_maintenance_idx")
      .on(table.expiresAt,table.consumedAt,table.id),
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

/**
 * RETIRED SOURCE: Do not import legacy raw-token AuthController handoff rows.
 * This staged MAC-only candidate is NOT a live login table. If DB01 promotion
 * is approved, consume with one UPDATE...WHERE consumed_at IS NULL AND
 * expires_at > now() RETURNING id under verified membership/domain scope.
 * Cleanup must hard-delete expired/consumed MAC rows only after the approved
 * audit retention period, and must not log or retain raw tokens.
 */
export const HANDOFF_MAC_CLEANUP_RETENTION_DAYS = 7;
export function authHandoffCleanupCutoff(now: Date, retentionDays = HANDOFF_MAC_CLEANUP_RETENTION_DAYS): Date {
  const days = Number.isSafeInteger(retentionDays) && retentionDays >= 1 ? retentionDays : HANDOFF_MAC_CLEANUP_RETENTION_DAYS;
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}
