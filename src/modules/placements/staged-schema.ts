/** Proposed TPO configuration tables. Not imported into registered db/schema. 
 * Owner must register the SQL before runtime reads or writes are enabled. */
import { boolean, date, integer, index, jsonb, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
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

/** T-S1-03: unregistered OTP challenge store; never use before migration. */
export const recruiterInviteCodesStaged=pgTable("recruiter_invite_code",{
 id:uuid("id").defaultRandom().primaryKey(),
 leadId:uuid("lead_id").notNull(),
 collegeId:uuid("college_id").notNull(),
 tokenHash:varchar("token_hash",{length:64}).notNull(),
 codeHash:varchar("code_hash",{length:64}).notNull(),
 sentAt:timestamp("sent_at",{withTimezone:true}).notNull(),
 expiresAt:timestamp("expires_at",{withTimezone:true}).notNull(),
 failedAttempts:integer("failed_attempts").notNull().default(0),
 consumedAt:timestamp("consumed_at",{withTimezone:true}),
 deliveryState:varchar("delivery_state",{length:16}).notNull().default("PENDING"),
},t=>[
 index("recruiter_invite_code_lead_sent_idx").on(t.leadId,t.sentAt),
 index("recruiter_invite_code_college_sent_idx").on(t.collegeId,t.sentAt),
 index("recruiter_invite_code_token_active_idx").on(t.tokenHash,t.sentAt),
]);

/** T-S1-01: proposed per-college recruiter grant duration, NOT registered. */
export const recruiterAccessPoliciesStaged=pgTable("placement_recruiter_access_policies",{
 collegeId:uuid("college_id").primaryKey(),
 recruiterAccessMonths:integer("recruiter_access_months").notNull(),
 updatedAt:timestamp("updated_at",{withTimezone:true}).notNull().defaultNow(),
});
