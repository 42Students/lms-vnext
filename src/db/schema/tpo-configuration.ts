/**
 * TPO configuration: job types, blocked dates, prep-readiness config and
 * learner after-college outcomes. All rows are tenant (college) scoped.
 */
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  foreignKey,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { colleges } from "./colleges";
import { collegeMemberships } from "./memberships";

export const placementTpoJobTypes = pgTable(
  "placement_tpo_job_types",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "restrict" }),
    label: varchar("label", { length: 100 }).notNull(),
    active: boolean("active").notNull().default(true),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("placement_tpo_job_types_college_label_uq").on(table.collegeId, table.label),
    check("placement_tpo_job_types_label_ck", sql`length(btrim(${table.label})) > 0`),
  ],
);

export const placementTpoBlockedDates = pgTable(
  "placement_tpo_blocked_dates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "restrict" }),
    day: date("day").notNull(),
    reason: text("reason").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("placement_tpo_blocked_dates_college_day_uq").on(table.collegeId, table.day),
    check("placement_tpo_blocked_dates_reason_ck", sql`length(btrim(${table.reason})) > 0`),
  ],
);

export const placementTpoPrepReadiness = pgTable(
  "placement_tpo_prep_readiness",
  {
    collegeId: uuid("college_id")
      .primaryKey()
      .references(() => colleges.id, { onDelete: "restrict" }),
    config: jsonb("config").notNull().default(sql`'{}'::jsonb`),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("placement_tpo_prep_readiness_object_ck", sql`jsonb_typeof(${table.config}) = 'object'`),
  ],
);

export const placementTpoAfterCollege = pgTable(
  "placement_tpo_after_college",
  {
    learnerMembershipId: uuid("learner_membership_id").primaryKey(),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "restrict" }),
    outcome: varchar("outcome", { length: 40 }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    foreignKey({
      name: "placement_tpo_after_college_membership_college_fk",
      columns: [table.learnerMembershipId, table.collegeId],
      foreignColumns: [collegeMemberships.id, collegeMemberships.collegeId],
    }).onDelete("restrict"),
    check(
      "placement_tpo_after_college_outcome_ck",
      sql`${table.outcome} in ('PLACED_ON_CAMPUS','PLACED_OFF_CAMPUS','HIGHER_STUDIES','ENTREPRENEURSHIP','COMPETITIVE_EXAMS','NOT_INTERESTED','LOOKING_FOR_JOB','DEBARRED','NOT_DECIDED')`,
    ),
  ],
);
