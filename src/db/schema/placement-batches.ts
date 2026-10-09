import { sql } from "drizzle-orm";
import {
  bigint,
  bigserial,
  check,
  index,
  jsonb,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { cohorts } from "./academics";
import { colleges } from "./colleges";
import { users } from "./users";

/**
 * DB08: a college's independent participation lifecycle for one existing
 * academic cohort. Do not use placement_seasons as a substitute.
 * The DB08 SQL guard validates that the cohort's program/department belong
 * to the same college.
 */
export const placementBatchLifecycles = pgTable(
  "placement_batch_lifecycles",
  {
    cohortId: uuid("cohort_id")
      .primaryKey()
      .references(() => cohorts.id, { onDelete: "restrict" }),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "restrict" }),
    registrationDeadline: timestamp("registration_deadline", {
      withTimezone: true,
    }),
    invitedAt: timestamp("invited_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    rulesOverride: jsonb("rules_override").$type<Record<string, unknown>>(),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    updatedByUserId: uuid("updated_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("placement_batch_lifecycles_college_idx").on(
      t.collegeId, t.finishedAt,
    ),
    check(
      "placement_batch_lifecycles_timeline_ck",
      sql`${t.finishedAt} is null or (${t.invitedAt} is not null and ${t.finishedAt} >= ${t.invitedAt})`,
    ),
    check(
      "placement_batch_lifecycles_rules_object_ck",
      sql`${t.rulesOverride} is null or jsonb_typeof(${t.rulesOverride}) = 'object'`,
    ),
  ],
);

/**
 * Legacy V188 bulk decisions grouped by action_id.
 * History is insert-only at the SQL layer; undo APPENDS inverse records rather
 * than editing prior history. The scope IDs are checked by a SQL trigger.
 */
export const placementEligibilityEvents = pgTable(
  "placement_eligibility_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sequence: bigserial("sequence", { mode: "bigint" }).notNull(),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "restrict" }),
    actionId: uuid("action_id").notNull(),
    reversesActionId: uuid("reverses_action_id"),
    eventKind: varchar("event_kind", { length: 12 }).notNull(),
    scopeType: varchar("scope_type", { length: 24 }).notNull(),
    scopeId: uuid("scope_id").notNull(),
    beforeStatus: varchar("before_status", { length: 24 }),
    beforeReason: varchar("before_reason", { length: 200 }),
    beforeNote: varchar("before_note", { length: 300 }),
    afterStatus: varchar("after_status", { length: 24 }),
    afterReason: varchar("after_reason", { length: 200 }),
    afterNote: varchar("after_note", { length: 300 }),
    actorUserId: uuid("actor_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    occurredAt: timestamp("occurred_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("placement_eligibility_events_sequence_uq").on(t.sequence),
    uniqueIndex("placement_eligibility_events_action_scope_uq").on(
      t.actionId, t.scopeType, t.scopeId,
    ),
    index("placement_eligibility_events_action_idx").on(
      t.collegeId, t.actionId,
    ),
    index("placement_eligibility_events_scope_idx").on(
      t.collegeId, t.scopeType, t.scopeId, t.sequence,
    ),
    index("placement_eligibility_events_reversal_idx").on(t.reversesActionId),
    check(
      "placement_eligibility_events_scope_ck",
      sql`${t.scopeType} in ('MEMBERSHIP', 'SECTION', 'COHORT')`,
    ),
    check(
      "placement_eligibility_events_kind_ck",
      sql`(${t.eventKind} = 'DECIDE' and ${t.reversesActionId} is null)
        or (${t.eventKind} = 'UNDO' and ${t.reversesActionId} is not null)`,
    ),
    check(
      "placement_eligibility_events_status_ck",
      sql`(${t.beforeStatus} is null or ${t.beforeStatus} in ('ELIGIBLE', 'INELIGIBLE'))
        and (${t.afterStatus} is null or ${t.afterStatus} in ('ELIGIBLE', 'INELIGIBLE'))`,
    ),
    check(
      "placement_eligibility_events_reason_ck",
      sql`(${t.beforeStatus} is distinct from 'INELIGIBLE' or length(trim(coalesce(${t.beforeReason}, ''))) > 0)
        and (${t.afterStatus} is distinct from 'INELIGIBLE' or length(trim(coalesce(${t.afterReason}, ''))) > 0)`,
    ),
    check(
      "placement_eligibility_events_changed_ck",
      sql`(${t.beforeStatus}, ${t.beforeReason}, ${t.beforeNote}) is distinct from
        (${t.afterStatus}, ${t.afterReason}, ${t.afterNote})`,
    ),
  ],
);
