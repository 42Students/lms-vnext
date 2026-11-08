/**
 * Durable, append-only security audit trail (docs/security/central-security-architecture.md, layer L9; SEC-19).
 * One row per security-relevant request or action: denied and rate-limited requests, every mutation and export through
 * route(), guarded server actions, Super Admin scope changes. Rows are never updated or deleted: a trigger in the
 * migration refuses UPDATE, DELETE and TRUNCATE for every role, and the runtime role only holds INSERT and SELECT.
 *
 * Tenant table (college_id, nullable for platform events) so a college can later be shown its own trail through the
 * usual tenant policy; the writer runs in a named system scope.
 */
import { bigint, index, integer, jsonb, pgTable, smallint, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const securityAuditEvents = pgTable(
  "security_audit_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
    requestId: text("request_id"),
    event: text("event").notNull(),
    outcome: text("outcome").notNull(),
    actorUserId: uuid("actor_user_id"),
    membershipId: uuid("membership_id"),
    collegeId: uuid("college_id"),
    role: text("role"),
    method: text("method"),
    path: text("path"),
    status: integer("status"),
    target: text("target"),
    ipTag: text("ip_tag"),
    detail: jsonb("detail").notNull().default({}),
    // Hash chain (SEC-26-007): set by the insert trigger, never by the application. Null only on rows written before
    // migration 0342. row_hash = sha256(prev_hash | chain_seq | row content), so a missing, changed or reordered row
    // breaks every later hash; scripts/security/audit-chain-verify.mjs checks it.
    chainSeq: bigint("chain_seq", { mode: "number" }),
    prevHash: text("prev_hash"),
    rowHash: text("row_hash"),
  },
  (table) => [
    index("security_audit_events_time_idx").on(table.occurredAt),
    index("security_audit_events_actor_idx").on(table.actorUserId, table.occurredAt),
    index("security_audit_events_college_idx").on(table.collegeId, table.occurredAt),
    index("security_audit_events_event_idx").on(table.event, table.occurredAt),
  ],
);

/**
 * Single-row head of the audit hash chain. Updated only by the audit insert trigger: a trigger on this table refuses
 * any change that does not come from inside another trigger (pg_trigger_depth), so the runtime role cannot rewind it.
 * Not tenant data (no college_id), classified as infrastructure in docs/security/table-classification.json.
 */
export const securityAuditChainHead = pgTable("security_audit_chain_head", {
  id: smallint("id").primaryKey().default(1),
  lastSeq: bigint("last_seq", { mode: "number" }).notNull().default(0),
  lastHash: text("last_hash").notNull().default("genesis"),
});
