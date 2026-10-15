/** Proposed TPO configuration tables. Not imported into registered db/schema. 
 * Owner must register the SQL before runtime reads or writes are enabled. */
import { boolean, date, jsonb, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
export const tpoJobTypes=pgTable("placement_tpo_job_types",{
 id:uuid("id").defaultRandom().primaryKey(),collegeId:uuid("college_id").notNull(),
 label:varchar("label",{length:100}).notNull(),active:boolean("active").notNull().default(true),
 updatedAt:timestamp("updated_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[uniqueIndex("placement_tpo_job_types_college_label_uq").on(t.collegeId,t.label)]);
export const tpoBlockedDates=pgTable("placement_tpo_blocked_dates",{
 id:uuid("id").defaultRandom().primaryKey(),collegeId:uuid("college_id").notNull(),
 day:date("day",{mode:"string"}).notNull(),reason:text("reason").notNull(),
 updatedAt:timestamp("updated_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[uniqueIndex("placement_tpo_blocked_dates_college_day_uq").on(t.collegeId,t.day)]);
export const tpoPrepReadiness=pgTable("placement_tpo_prep_readiness",{
 collegeId:uuid("college_id").primaryKey(),config:jsonb("config").$type<Record<string,unknown>>().notNull(),
 updatedAt:timestamp("updated_at",{withTimezone:true}).notNull().defaultNow(),
});
export const tpoAfterCollege=pgTable("placement_tpo_after_college",{
 learnerMembershipId:uuid("learner_membership_id").primaryKey(),
 collegeId:uuid("college_id").notNull(),outcome:varchar("outcome",{length:40}).notNull(),
 updatedAt:timestamp("updated_at",{withTimezone:true}).notNull().defaultNow(),
});
