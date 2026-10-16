import {sql} from "drizzle-orm";
import {check, index, pgTable, text, timestamp, uniqueIndex, uuid, varchar, foreignKey, integer} from "drizzle-orm/pg-core";
import {placementApplications,placementJobRounds,placementJobs} from "./placements";
import {users} from "./users";

/** Registered 0116: candidate interview slot inventory and bookings (TPO-drive-workspace-44). */
export const placementRoundCandidateSlots=pgTable("placement_round_candidate_slots",{
 id:uuid("id").defaultRandom().primaryKey(),
 jobId:uuid("job_id").notNull().references(()=>placementJobs.id),
 roundId:uuid("round_id").notNull().references(()=>placementJobRounds.id),
 applicationId:uuid("application_id").references(()=>placementApplications.id),
 startsAt:timestamp("starts_at",{withTimezone:true}).notNull(),
 endsAt:timestamp("ends_at",{withTimezone:true}).notNull(),
 room:text("room").notNull(),
 panel:text("panel"),
 status:varchar("status",{length:16}).notNull().default("AVAILABLE"),
 source:varchar("source",{length:16}).notNull().default("TPO"),
 confirmedAt:timestamp("confirmed_at",{withTimezone:true}),
 changedByUserId:uuid("changed_by_user_id").notNull().references(()=>users.id),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
 updatedAt:timestamp("updated_at",{withTimezone:true}).notNull().defaultNow(),
 version:integer("version").notNull().default(1),
},t=>[
 uniqueIndex("placement_round_candidate_slots_active_application_uq").on(t.roundId,t.applicationId).where(sql`${t.status} = 'BOOKED'`),
 uniqueIndex("placement_round_candidate_slots_active_room_time_uq").on(t.roundId,t.room,t.startsAt).where(sql`${t.status} <> 'CANCELLED'`),
 index("placement_round_candidate_slots_round_date_idx").on(t.roundId,t.startsAt),
 foreignKey({columns:[t.roundId,t.jobId],foreignColumns:[placementJobRounds.id,placementJobRounds.jobId],name:"candidate_slot_round_job_fk"}),
 check("placement_round_candidate_slots_status_ck",sql`${t.status} in ('AVAILABLE','BOOKED','CANCELLED')`),
 check("placement_round_candidate_slots_source_ck",sql`${t.source} in ('TPO','RECRUITER')`),
 check("placement_round_candidate_slots_version_ck",sql`${t.version} >= 1`),
 check("placement_round_candidate_slots_time_ck",sql`${t.endsAt} > ${t.startsAt}`),
 check("placement_round_candidate_slots_booking_ck",sql`(${t.status} = 'BOOKED' and ${t.applicationId} is not null) or (${t.status} <> 'BOOKED' and ${t.applicationId} is null)`),
 check("placement_round_candidate_slots_room_ck",sql`length(trim(${t.room})) > 0`),
]);
