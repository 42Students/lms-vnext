/** STAGED ONLY: orchestrator owns registered migration / DB promotion. */
import {pgTable,uuid,varchar,integer,text,timestamp,index,uniqueIndex,foreignKey} from "drizzle-orm/pg-core";
import {placementJobRounds,placementJobs} from "@/db/schema/placements";
import {colleges} from "@/db/schema/colleges";
import {users} from "@/db/schema/users";
export const hrInterviewSlots=pgTable("placement_hr_interview_slots",{
 id:uuid("id").defaultRandom().primaryKey(),
 collegeId:uuid("college_id").notNull().references(()=>colleges.id),
 jobId:uuid("job_id").notNull().references(()=>placementJobs.id),
 roundId:uuid("round_id").notNull().references(()=>placementJobRounds.id),
 startAt:timestamp("start_at",{withTimezone:true}).notNull(),
 endAt:timestamp("end_at",{withTimezone:true}).notNull(),
 timezone:varchar("timezone",{length:64}).notNull(),
 mode:varchar("mode",{length:24}).notNull(),
 meetingLocation:text("meeting_location"),
 panelLabel:varchar("panel_label",{length:160}),
 capacity:integer("capacity").notNull(),
 bookedCount:integer("booked_count").notNull().default(0),
 status:varchar("status",{length:24}).notNull().default("PROPOSED"),
 version:integer("version").notNull().default(1),
 createdByUserId:uuid("created_by_user_id").notNull().references(()=>users.id),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
 updatedAt:timestamp("updated_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[
 index("hr_interview_slots_college_round_idx").on(t.collegeId,t.roundId,t.startAt),
 uniqueIndex("hr_interview_slots_round_start_uq").on(t.roundId,t.startAt),
 foreignKey({columns:[t.jobId,t.collegeId],foreignColumns:[placementJobs.id,placementJobs.collegeId],name:"hr_slot_job_college_fk"}),
 foreignKey({columns:[t.roundId,t.jobId],foreignColumns:[placementJobRounds.id,placementJobRounds.jobId],name:"hr_slot_round_job_fk"}),
]);
