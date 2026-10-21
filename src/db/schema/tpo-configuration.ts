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
  integer,
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
    /** Stable display name; virtual built-ins have no row, so drives snapshot their selected label. */
    label: varchar("label", { length: 40 }).notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    active: boolean("active").notNull().default(true),
    countsAsPlaced: boolean("counts_as_placed").notNull().default(true),
    isBuiltin: boolean("is_builtin").notNull().default(false),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("placement_tpo_job_types_college_label_uq").on(table.collegeId, sql`lower(${table.label})`),
    check("placement_tpo_job_types_label_ck", sql`length(btrim(${table.label})) between 2 and 40 and ${table.label} ~ '^[[:alnum:] +&/().,''-]{2,40}$'`),
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

/** Old job type settings returned name, builtin, hidden, countsAsPlaced,
 * and the number of drives using the value. Never return nullable placed
 * flags to the UI: current persisted rows explicitly choose true or false. */
export function toLegacyTpoJobType(
 row:{id:string;label:string;isBuiltin:boolean;active:boolean;countsAsPlaced:boolean},
 usedCount:number,
){
 if(!Number.isSafeInteger(usedCount)||usedCount<0)
  throw new Error("Invalid job-type usage count");
 return {id:row.id,name:row.label,builtin:row.isBuiltin,
  hidden:!row.active,countsAsPlaced:row.countsAsPlaced,
  drives:usedCount};
}
/** Shared with any import/Settings mutation; the caller must additionally
 * enforce that each college has at least one active job type before commit. */
export function validatedTpoJobTypeName(name:string):string{
 const normalized=name.trim();
 if(normalized.length<2||normalized.length>40||
  !/^[\p{L}\p{N} +&/().,'-]+$/u.test(normalized))
  throw new Error("Job type name must be 2–40 letters, numbers or allowed punctuation");
 return normalized;
}
export function assertAtLeastOneActiveTpoJobType(
 rows:readonly {active:boolean}[],
){
 if(!rows.some(row=>row.active))
  throw new Error("At least one job type must remain active");
}
