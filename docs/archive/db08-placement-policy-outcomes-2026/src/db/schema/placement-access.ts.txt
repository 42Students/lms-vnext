import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { colleges } from "./colleges";
import { users } from "./users";
import { placementEligibilityActions } from "./placement-eligibility-actions";

export const placementEligibilityDecisions = pgTable(
  "placement_eligibility_decisions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "restrict" }),
    scopeType: varchar("scope_type", { length: 24 }).notNull(),
    scopeId: uuid("scope_id").notNull(),
    status: varchar("status", { length: 24 }).notNull(),
    reason: text("reason"),
    note: text("note"),
    decidedByUserId: uuid("decided_by_user_id").references(
      () => users.id,
      { onDelete: "restrict" },
    ),
    lastActionId: uuid("last_action_id").references(
      () => placementEligibilityActions.id,
      { onDelete: "restrict" },
    ),
    decidedAt: timestamp("decided_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      name: "placement_eligibility_decisions_action_college_fk",
      columns: [table.lastActionId, table.collegeId],
      foreignColumns: [
        placementEligibilityActions.id,
        placementEligibilityActions.collegeId,
      ],
    }).onDelete("restrict"),
    uniqueIndex("placement_eligibility_decisions_scope_uq").on(
      table.scopeType,
      table.scopeId,
    ),
    index("placement_eligibility_decisions_college_idx").on(
      table.collegeId,
      table.scopeType,
    ),
    check(
      "placement_eligibility_decisions_scope_ck",
      sql`${table.scopeType} in ('MEMBERSHIP', 'SECTION', 'COHORT')`,
    ),
    check(
      "placement_eligibility_decisions_status_ck",
      sql`${table.status} in ('ELIGIBLE', 'INELIGIBLE')`,
    ),
    check(
      "placement_eligibility_decisions_reason_ck",
      sql`${table.status} = 'ELIGIBLE' or length(trim(coalesce(${table.reason}, ''))) > 0`,
    ),
    check(
      "placement_eligibility_decisions_reason_length_ck",
      sql`${table.reason} is null or length(${table.reason}) <= 200`,
    ),
    check(
      "placement_eligibility_decisions_note_length_ck",
      sql`${table.note} is null or length(${table.note}) <= 300`,
    ),
  ],
);
