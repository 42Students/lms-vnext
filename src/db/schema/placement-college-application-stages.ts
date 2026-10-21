import {sql} from "drizzle-orm";
import {check,index,pgTable,text,timestamp,uuid,varchar,integer,uniqueIndex} from "drizzle-orm/pg-core";
import {placementApplications,placementJobs} from "./placements";
import {users} from "./users";
/** College Admin placement pipeline stage is separate from application status and actual offers. */
export const placementCollegeApplicationStages=pgTable("placement_college_application_stages",{
 id:uuid("id").defaultRandom().primaryKey(),
 jobId:uuid("job_id").notNull().references(()=>placementJobs.id),
 applicationId:uuid("application_id").notNull().references(()=>placementApplications.id),
 stage:varchar("stage",{length:24}).notNull().default("APPLIED"),
 previousStage:varchar("previous_stage",{length:24}),
 version:integer("version").notNull().default(1),
 movedByUserId:uuid("moved_by_user_id").notNull().references(()=>users.id),
 reason:text("reason").notNull(),
 movedAt:timestamp("moved_at",{withTimezone:true}).notNull().defaultNow(),
 updatedAt:timestamp("updated_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[
 uniqueIndex("placement_college_stages_application_uq").on(t.applicationId),
 index("placement_college_stages_job_stage_idx").on(t.jobId,t.stage),
 check("placement_college_stages_stage_ck",sql`${t.stage} in ('APPLIED','SHORTLISTED','ASSESSMENT','INTERVIEW','WAITLISTED','OFFERED','HIRED','REJECTED')`),
 check("placement_college_stages_previous_ck",sql`${t.previousStage} is null or ${t.previousStage} in ('APPLIED','SHORTLISTED','ASSESSMENT','INTERVIEW','WAITLISTED','OFFERED','HIRED','REJECTED')`),
 check("placement_college_stages_version_ck",sql`${t.version} >= 1`),
 check("placement_college_stages_reason_ck",sql`length(trim(${t.reason})) >= 3`),
]);
export const placementCollegeApplicationStageHistory=pgTable("placement_college_application_stage_history",{
 id:uuid("id").defaultRandom().primaryKey(),
 stageId:uuid("stage_id").notNull().references(()=>placementCollegeApplicationStages.id),
 fromStage:varchar("from_stage",{length:24}),
 toStage:varchar("to_stage",{length:24}).notNull(),
 reason:text("reason").notNull(),
 actorUserId:uuid("actor_user_id").notNull().references(()=>users.id),
 movedAt:timestamp("moved_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[
 index("placement_college_stage_history_stage_time_idx").on(t.stageId,t.movedAt),
 check("placement_college_stage_history_reason_ck",sql`length(trim(${t.reason})) >= 3`),
]);

/** Historical job_application fields do not belong to the same vNext table.
 * Resolve source learner/job IDs under one college and enforce the canonical
 * application membership+job uniqueness before writing a stage projection.
 * Staff-only notes stay outside the learner response. */
export const LEGACY_COLLEGE_APPLICATION_FIELD_MAP={
 id:"placement_applications.id",
 learner_id:"placement_applications.membership_id",
 job_id:"placement_applications.job_id",
 application_status:"placement_applications.status",
 applied_at:"placement_applications.submitted_at",
 status_updated_at:"placement_college_application_stages.moved_at",
 status_updated_by:"placement_college_application_stages.moved_by_user_id",
 internal_notes:"staff-only application activity",
 internal_reason:"staff-only stage history",
 rejection_reason:"candidate-facing application rejection message",
 status_before_withdrawal:"application status history",
 offer_letter_url:"placement_offers verified storage document",
 offer_letter_sent_at:"placement_offer_status_history release timestamp",
 current_round_id:"placement_job_rounds scoped mapping",
 source:"placement_applications.channel",
 resume_url:"verified application submission attachment",
} as const;
export const LEGACY_COLLEGE_APPLICATION_STATUSES={
 APPLIED:"APPLIED",SHORTLISTED:"SHORTLISTED",ASSESSMENT:"ASSESSMENT",
 INTERVIEW:"INTERVIEW",WAITLISTED:"WAITLISTED",OFFERED:"OFFERED",
 HIRED:"HIRED",REJECTED:"REJECTED",WITHDRAWN:"WITHDRAWN",
} as const;
export function legacyCollegeApplicationStage(status:string){
 return Object.prototype.hasOwnProperty.call(LEGACY_COLLEGE_APPLICATION_STATUSES,status)
  ?LEGACY_COLLEGE_APPLICATION_STATUSES[status as keyof typeof LEGACY_COLLEGE_APPLICATION_STATUSES]
  :null;
}
