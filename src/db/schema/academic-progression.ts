import { sql } from "drizzle-orm";
import { bigint, check, index, integer, pgTable, text, timestamp, unique, uuid, varchar } from "drizzle-orm/pg-core";
import { academicPeriods, cohorts } from "./academics";
import { users } from "./users";

export const cohortProgressionState = pgTable("cohort_progression_state", {
  cohortId: uuid("cohort_id").primaryKey().references(() => cohorts.id, { onDelete: "cascade" }),
  currentTermNumber: integer("current_term_number").notNull().default(1),
  currentAcademicYearStart: integer("current_academic_year_start"),
  currentPeriodId: uuid("current_period_id").references(() => academicPeriods.id, { onDelete: "restrict" }),
  version: bigint("version", { mode: "number" }).notNull().default(0),
  updatedByUserId: uuid("updated_by_user_id").references(() => users.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [
  check("cohort_progression_term_ck", sql`${t.currentTermNumber} >= 1`),
  check("cohort_progression_year_ck", sql`${t.currentAcademicYearStart} is null or ${t.currentAcademicYearStart} between 1900 and 9998`),
  check("cohort_progression_version_ck", sql`${t.version} >= 0`),
]);

export const cohortProgressionEvents = pgTable("cohort_progression_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  cohortId: uuid("cohort_id").notNull().references(() => cohorts.id, { onDelete: "restrict" }),
  fromTermNumber: integer("from_term_number").notNull(),
  toTermNumber: integer("to_term_number").notNull(),
  fromAcademicYearStart: integer("from_academic_year_start"),
  toAcademicYearStart: integer("to_academic_year_start"),
  fromPeriodId: uuid("from_period_id").references(() => academicPeriods.id, { onDelete: "restrict" }),
  toPeriodId: uuid("to_period_id").references(() => academicPeriods.id, { onDelete: "restrict" }),
  actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
  eventKind: varchar("event_kind", { length: 16 }).notNull(),
  reason: text("reason"),
  stateVersion: bigint("state_version", { mode: "number" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [
  unique("cohort_progression_events_cohort_version_uq").on(t.cohortId, t.stateVersion),
  index("cohort_progression_events_cohort_time_idx").on(t.cohortId, t.createdAt),
  check("cohort_progression_events_kind_ck", sql`${t.eventKind} in ('PROMOTION','CORRECTION')`),
  check("cohort_progression_events_transition_ck", sql`(${t.eventKind} = 'PROMOTION' and ${t.toTermNumber} = ${t.fromTermNumber} + 1) or (${t.eventKind} = 'CORRECTION' and ${t.toTermNumber} = ${t.fromTermNumber})`),
  check("cohort_progression_events_version_ck", sql`${t.stateVersion} >= 1`),
]);

/** Legacy academic-year labels are not generic dates. Preserve start-year identity. */
export function academicYearLabel(start:number|null):string|null {
 if(start===null||!Number.isInteger(start)||start<1900||start>9998)return null;
 return String(start)+"-"+String(start+1);
}
export function parseLegacyAcademicYearStart(raw:string):number|null {
 const match=/^(\d{4})(?:\s*[-/]\s*(\d{2}|\d{4}))?$/.exec(raw.trim());
 if(!match)return null;
 const start=Number(match[1]);
 if(start<1900||start>9998)return null;
 if(match[2]){
   const end=Number(match[2]);
   if(end!==start+1&&end!==(start+1)%100)return null;
 }
 return start;
}
