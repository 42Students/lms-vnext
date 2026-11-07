/**
 * Durable, append-only security audit trail (docs/security/central-security-architecture.md, layer L9; SEC-19).
 * One row per security-relevant request or action: denied and rate-limited requests, every mutation and export through
 * route(), guarded server actions, Super Admin scope changes. Rows are never updated or deleted: a trigger in the
 * migration refuses UPDATE, DELETE and TRUNCATE for every role, and the runtime role only holds INSERT and SELECT.
 *
 * Tenant table (college_id, nullable for platform events) so a college can later be shown its own trail through the
 * usual tenant policy; the writer runs in a named system scope.
 */
import { index, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

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
  },
  (table) => [
    index("security_audit_events_time_idx").on(table.occurredAt),
    index("security_audit_events_actor_idx").on(table.actorUserId, table.occurredAt),
    index("security_audit_events_college_idx").on(table.collegeId, table.occurredAt),
    index("security_audit_events_event_idx").on(table.event, table.occurredAt),
  ],
);
