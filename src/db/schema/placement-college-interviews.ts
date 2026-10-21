import {sql} from "drizzle-orm";
import {check,foreignKey,index,integer,pgTable,text,timestamp,uniqueIndex,uuid,varchar} from "drizzle-orm/pg-core";
import {placementApplications,placementJobRounds,placementJobs} from "./placements";
import {users} from "./users";

/** Proposed COL-placements-04 candidate interview appointments and recorded outcomes. */
export const placementCollegeInterviews=pgTable("placement_college_interviews",{
 id:uuid("id").defaultRandom().primaryKey(),
 legacyInterviewId:integer("legacy_interview_id"),
 legacyJobId:integer("legacy_job_id"),
 legacyVenue:text("legacy_venue"),
 jobId:uuid("job_id").notNull().references(()=>placementJobs.id),
 roundId:uuid("round_id").notNull().references(()=>placementJobRounds.id),
 applicationId:uuid("application_id").notNull().references(()=>placementApplications.id),
 scheduledAt:timestamp("scheduled_at",{withTimezone:true}).notNull(),
 durationMinutes:integer("duration_minutes").notNull(),
 mode:varchar("mode",{length:24}).notNull(),
 venue:text("venue"),
 meetingUrl:text("meeting_url"),
 interviewer:text("interviewer"),
 status:varchar("status",{length:24}).notNull().default("SCHEDULED"),
 outcomeNote:text("outcome_note"),
 createdByUserId:uuid("created_by_user_id").notNull().references(()=>users.id),
 updatedByUserId:uuid("updated_by_user_id").notNull().references(()=>users.id),
 completedAt:timestamp("completed_at",{withTimezone:true}),
 cancelledAt:timestamp("cancelled_at",{withTimezone:true}),
 version:integer("version").notNull().default(1),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
 updatedAt:timestamp("updated_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[
 foreignKey({columns:[t.roundId,t.jobId],foreignColumns:[placementJobRounds.id,placementJobRounds.jobId],
  name:"college_interview_round_job_fk"}),
 uniqueIndex("college_interview_active_application_round_uq").on(t.roundId,t.applicationId)
  .where(sql`${t.status} <> 'CANCELLED'`),
 index("college_interview_job_time_idx").on(t.jobId,t.scheduledAt),
 check("college_interview_status_ck",sql`${t.status} in ('SCHEDULED','COMPLETED','NO_SHOW','CANCELLED')`),
 check("college_interview_mode_ck",sql`${t.mode} in ('ON_CAMPUS','VIRTUAL')`),
 check("college_interview_duration_ck",sql`${t.durationMinutes} between 5 and 480`),
 check("college_interview_version_ck",sql`${t.version}>0`),
 check("college_interview_location_ck",sql`(${t.mode}='ON_CAMPUS' and length(trim(coalesce(${t.venue},'')))>=2) or
   (${t.mode}='VIRTUAL' and length(trim(coalesce(${t.meetingUrl},'')))>=8)`),
 check("college_interview_lifecycle_ck",sql`(${t.status}='SCHEDULED' and ${t.completedAt} is null and ${t.cancelledAt} is null) or
   (${t.status} in ('COMPLETED','NO_SHOW') and ${t.completedAt} is not null and ${t.cancelledAt} is null) or
   (${t.status}='CANCELLED' and ${t.cancelledAt} is not null and ${t.completedAt} is null)`),
]);
