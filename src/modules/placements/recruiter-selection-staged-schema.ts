/** REC-home-drives-51 STAGED ONLY. Not imported into src/db/schema
 * and not queried or written before an orchestrator-registered SQL migration.
 * The TPO must independently verify applicants, review outcome and tenant.
 */
import {pgTable,uuid,varchar,jsonb,timestamp,uniqueIndex,index}
 from "drizzle-orm/pg-core";
export const stagedRecruiterSelectionLists=pgTable("placement_recruiter_selection_lists",{
 id:uuid("id").defaultRandom().primaryKey(),
 collegeId:uuid("college_id").notNull(),
 jobId:uuid("job_id").notNull(),
 recruiterUserId:uuid("recruiter_user_id").notNull(),
 submissionId:uuid("submission_id").notNull(),
 kind:varchar("kind",{length:24}).notNull(),
 ctcLpa:varchar("ctc_lpa",{length:16}),
 packageDescription:varchar("package_description",{length:500}),
 status:varchar("status",{length:32}).notNull().default("SENT_FOR_VERIFICATION"),
 decisionNote:varchar("decision_note",{length:500}),
 decidedByUserId:uuid("decided_by_user_id"),
 decidedAt:timestamp("decided_at",{withTimezone:true}),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
 updatedAt:timestamp("updated_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[
 uniqueIndex("placement_recruiter_selection_nonce_uq").on(t.recruiterUserId,t.collegeId,t.submissionId),
 index("placement_recruiter_selection_tpo_queue_idx").on(t.collegeId,t.status,t.createdAt),
]);
export const stagedRecruiterSelectionItems=pgTable("placement_recruiter_selection_items",{
 id:uuid("id").defaultRandom().primaryKey(),
 selectionListId:uuid("selection_list_id").notNull(),
 applicationId:uuid("application_id").notNull(),
 jobId:uuid("job_id").notNull(),
 status:varchar("status",{length:24}).notNull().default("PROPOSED"),
 metadata:jsonb("metadata").$type<Record<string,unknown>>().notNull().default({}),
},t=>[uniqueIndex("placement_recruiter_selection_unique_applicant_uq").on(t.selectionListId,t.applicationId)]);
