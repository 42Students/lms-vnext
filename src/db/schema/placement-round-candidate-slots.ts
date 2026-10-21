import {sql} from "drizzle-orm";
import {check, index, jsonb, pgTable, text, timestamp, uniqueIndex, uuid, varchar, foreignKey, integer} from "drizzle-orm/pg-core";
import {placementApplications,placementJobRounds,placementJobs} from "./placements";
import {users} from "./users";

/** Registered 0116: candidate interview slot inventory and bookings (TPO-drive-workspace-44). */
export const placementRoundCandidateSlots=pgTable("placement_round_candidate_slots",{
 id:uuid("id").defaultRandom().primaryKey(),
 jobId:uuid("job_id").notNull().references(()=>placementJobs.id),
 roundId:uuid("round_id").notNull().references(()=>placementJobRounds.id),
 applicationId:uuid("application_id").references(()=>placementApplications.id),
 // Historical Interview identity is not native booking or permission state.
 legacyInterviewId:integer("legacy_interview_id"),
 legacyOrganizationId:integer("legacy_organization_id"),
 legacyJobId:integer("legacy_job_id"),
 legacyApplicationId:integer("legacy_application_id"),
 legacyLearnerId:integer("legacy_learner_id"),
 legacyInterviewType:varchar("legacy_interview_type",{length:24}),
 legacyInterviewStatus:varchar("legacy_interview_status",{length:24}),
 legacyInterviewMode:varchar("legacy_interview_mode",{length:24}),
 legacyLocation:text("legacy_location"),
 legacyRoundDescription:text("legacy_round_description"),
 legacySourceTimeZone:varchar("legacy_source_time_zone",{length:80}),
 legacyRoomLabel:text("legacy_room_label"),
 legacyPreviousStatus:varchar("legacy_previous_status",{length:32}),
 legacyInterviewerName:varchar("legacy_interviewer_name",{length:255}),
 legacyDurationMinutes:integer("legacy_duration_minutes"),
 legacyScheduledAt:timestamp("legacy_scheduled_at",{withTimezone:true}),
 legacyScheduledHourAt:timestamp("legacy_scheduled_hour_at",{withTimezone:true}),
 legacyPreviousScheduledAt:timestamp("legacy_previous_scheduled_at",{withTimezone:true}),
 legacyScheduleChangedAt:timestamp("legacy_schedule_changed_at",{withTimezone:true}),
 legacyCreatedById:integer("legacy_created_by_id"),
 legacySourceVersion:integer("legacy_source_version"),
 legacyRescheduleHistory:jsonb("legacy_reschedule_history").$type<Record<string,unknown>>(),
 startsAt:timestamp("starts_at",{withTimezone:true}).notNull(),
 endsAt:timestamp("ends_at",{withTimezone:true}).notNull(),
 room:text("room").notNull(),
 panel:text("panel"),
 status:varchar("status",{length:16}).notNull().default("AVAILABLE"),
 interviewOutcome:varchar("interview_outcome",{length:16}),
 source:varchar("source",{length:16}).notNull().default("TPO"),
 confirmedAt:timestamp("confirmed_at",{withTimezone:true}),
 /** Learner attendance acknowledgment, NOT the TPO booking confirmation. */
 learnerConfirmedAt:timestamp("learner_confirmed_at",{withTimezone:true}),
 changedByUserId:uuid("changed_by_user_id").notNull().references(()=>users.id),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
 updatedAt:timestamp("updated_at",{withTimezone:true}).notNull().defaultNow(),
 version:integer("version").notNull().default(1),
},t=>[
 uniqueIndex("placement_round_candidate_slots_active_application_uq").on(t.roundId,t.applicationId).where(sql`${t.status} = 'BOOKED'`),
 // Across rounds a single application cannot hold two live bookings.
 uniqueIndex("placement_round_candidate_slots_one_live_application_uq")
   .on(t.applicationId).where(sql`${t.status} = 'BOOKED' and ${t.applicationId} is not null`),
 index("placement_round_candidate_slots_legacy_source_idx")
   .on(t.jobId,t.legacyInterviewId).where(sql`${t.legacyInterviewId} is not null`),
 uniqueIndex("placement_round_candidate_slots_active_room_time_uq").on(t.roundId,t.room,t.startsAt).where(sql`${t.status} <> 'CANCELLED'`),
 index("placement_round_candidate_slots_round_date_idx").on(t.roundId,t.startsAt),
 index("placement_round_candidate_slots_application_upcoming_idx").on(t.applicationId,t.startsAt,t.id)
   .where(sql`${t.applicationId} is not null`),
 foreignKey({columns:[t.roundId,t.jobId],foreignColumns:[placementJobRounds.id,placementJobRounds.jobId],name:"candidate_slot_round_job_fk"}),
 check("placement_round_candidate_slots_status_ck",sql`${t.status} in ('AVAILABLE','BOOKED','CANCELLED')`),
 check("placement_round_candidate_slots_legacy_type_ck",
   sql`${t.legacyInterviewType} is null or ${t.legacyInterviewType} in ('SCREENING','TECHNICAL','HR','MANAGERIAL','FINAL')`),
 check("placement_round_candidate_slots_legacy_status_ck",
   sql`${t.legacyInterviewStatus} is null or ${t.legacyInterviewStatus} in ('SCHEDULED','CONFIRMED','RESCHEDULE_REQUESTED','COMPLETED','CANCELLED','NO_SHOW')`),
 check("placement_round_candidate_slots_outcome_ck",
   sql`${t.interviewOutcome} is null or ${t.interviewOutcome} in ('COMPLETED','NO_SHOW')`),
 check("placement_round_candidate_slots_duration_ck",
   sql`${t.legacyDurationMinutes} is null or ${t.legacyDurationMinutes} between 15 and 480`),
 check("placement_round_candidate_slots_source_ck",sql`${t.source} in ('TPO','RECRUITER')`),
 check("placement_round_candidate_slots_version_ck",sql`${t.version} >= 1`),
 check("placement_round_candidate_slots_time_ck",sql`${t.endsAt} > ${t.startsAt}`),
 check("placement_round_candidate_slots_booking_ck",sql`(${t.status} = 'BOOKED' and ${t.applicationId} is not null) or (${t.status} <> 'BOOKED' and ${t.applicationId} is null)`),
 check("placement_round_candidate_slots_room_ck",sql`length(trim(${t.room})) > 0`),
]);
