import { sql } from "drizzle-orm";
import {
  check,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { colleges } from "./colleges";
import { users } from "./users";

/**
 * DB08: a bulk change has one idempotency key and immutable request payload.
 * Staged until the DB03/DB04 migration journal is reconciled.
 */
export const placementEligibilityActions = pgTable(
  "placement_eligibility_actions",
  {
    id: uuid("id").primaryKey(),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "restrict" }),
    requestedByUserId: uuid("requested_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    requestPayload: jsonb("request_payload").notNull(),
    status: varchar("status", { length: 12 })
      .notNull()
      .default("APPLIED"),
    undoneByUserId: uuid("undone_by_user_id").references(
      () => users.id,
      { onDelete: "restrict" },
    ),
    undoneAt: timestamp("undone_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("placement_eligibility_actions_college_created_idx").on(
      table.collegeId,
      table.createdAt,
    ),
    check(
      "placement_eligibility_actions_state_ck",
      sql`(${table.status} = 'APPLIED' and ${table.undoneAt} is null and ${table.undoneByUserId} is null)
        or (${table.status} = 'UNDONE' and ${table.undoneAt} is not null and ${table.undoneByUserId} is not null)`,
    ),
  ],
);

/** Historical snapshots are never deleted. Undo only sets an undo marker. */
export const placementEligibilityEvents = pgTable(
  "placement_eligibility_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actionId: uuid("action_id")
      .notNull()
      .references(() => placementEligibilityActions.id, { onDelete: "restrict" }),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "restrict" }),
    scopeType: varchar("scope_type", { length: 24 }).notNull(),
    scopeId: uuid("scope_id").notNull(),
    beforeStatus: varchar("before_status", { length: 24 }),
    beforeReason: text("before_reason"),
    beforeNote: text("before_note"),
    beforeLastActionId: uuid("before_last_action_id").references(
      () => placementEligibilityActions.id,
      { onDelete: "restrict" },
    ),
    beforeDecidedByUserId: uuid("before_decided_by_user_id").references(
      () => users.id,
      { onDelete: "restrict" },
    ),
    beforeDecidedAt: timestamp("before_decided_at", { withTimezone: true }),
    afterStatus: varchar("after_status", { length: 24 }).notNull(),
    afterReason: text("after_reason"),
    afterNote: text("after_note"),
    actorUserId: uuid("actor_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    undoneAt: timestamp("undone_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("placement_eligibility_events_action_scope_uq").on(
      table.actionId,
      table.scopeType,
      table.scopeId,
    ),
    index("placement_eligibility_events_college_scope_idx").on(
      table.collegeId,
      table.scopeType,
      table.scopeId,
      table.createdAt,
    ),
    check(
      "placement_eligibility_events_scope_ck",
      sql`${table.scopeType} in ('MEMBERSHIP', 'SECTION', 'COHORT')`,
    ),
    check(
      "placement_eligibility_events_before_status_ck",
      sql`${table.beforeStatus} is null or ${table.beforeStatus} in ('ELIGIBLE', 'INELIGIBLE')`,
    ),
    check(
      "placement_eligibility_events_after_status_ck",
      sql`${table.afterStatus} in ('ELIGIBLE', 'INELIGIBLE')`,
    ),
    check(
      "placement_eligibility_events_before_reason_ck",
      sql`${table.beforeStatus} is distinct from 'INELIGIBLE'
        or length(trim(coalesce(${table.beforeReason}, ''))) > 0`,
    ),
    check(
      "placement_eligibility_events_after_reason_ck",
      sql`${table.afterStatus} <> 'INELIGIBLE'
        or length(trim(coalesce(${table.afterReason}, ''))) > 0`,
    ),
  ],
);
