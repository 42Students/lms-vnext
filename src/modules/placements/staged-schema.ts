/** Proposed TPO configuration tables. Not imported into registered db/schema. 
 * Owner must register the SQL before runtime reads or writes are enabled. */
import { boolean, check, date, index, jsonb, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
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


/** REC-home-drives-21: proposed only. No runtime access before migration registration. */
export const recruiterDriveRequests = pgTable("placement_recruiter_drive_requests", {
 id:uuid("id").defaultRandom().primaryKey(),
 collegeId:uuid("college_id").notNull(),
 companyRelationshipId:uuid("company_relationship_id").notNull(),
 recruiterUserId:uuid("recruiter_user_id").notNull(),
 submissionId:uuid("submission_id").notNull(),
 sourceJobId:uuid("source_job_id"),
 approvedJobId:uuid("approved_job_id"),
 status:varchar("status",{length:24}).notNull().default("REQUEST"),
 draft:jsonb("draft").$type<Record<string,unknown>>().notNull(),
 decisionNote:text("decision_note"),
 decidedByUserId:uuid("decided_by_user_id"),
 decidedAt:timestamp("decided_at",{withTimezone:true}),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
 updatedAt:timestamp("updated_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[
 uniqueIndex("placement_recruiter_drive_requests_nonce_uq").on(t.recruiterUserId,t.collegeId,t.submissionId),
 index("placement_recruiter_drive_requests_tpo_inbox_idx").on(t.collegeId,t.status,t.createdAt),
 index("placement_recruiter_drive_requests_own_idx").on(t.recruiterUserId,t.collegeId,t.createdAt),
 check("placement_recruiter_drive_requests_status_ck",sql`${t.status} in ('REQUEST','SENT_BACK','DRAFT','REJECTED','CANCELLED')`),
 check("placement_recruiter_drive_requests_decision_ck",sql`(${t.decidedAt} is null and ${t.decidedByUserId} is null) or (${t.decidedAt} is not null and ${t.decidedByUserId} is not null)`),
]);
