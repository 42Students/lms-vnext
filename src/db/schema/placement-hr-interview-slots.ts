/** Recruiter interview slots: aggregate capacity only, never learner identities. */
import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { colleges } from "./colleges";
import { placementJobRounds, placementJobs } from "./placements";
import { users } from "./users";

export const hrInterviewSlots = pgTable(
  "placement_hr_interview_slots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    collegeId: uuid("college_id").notNull().references(() => colleges.id),
    jobId: uuid("job_id").notNull().references(() => placementJobs.id),
    roundId: uuid("round_id").notNull().references(() => placementJobRounds.id),
    startAt: timestamp("start_at", { withTimezone: true }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true }).notNull(),
    timezone: varchar("timezone", { length: 64 }).notNull(),
    mode: varchar("mode", { length: 24 }).notNull(),
    meetingLocation: text("meeting_location"),
    panelLabel: varchar("panel_label", { length: 160 }),
    capacity: integer("capacity").notNull(),
    bookedCount: integer("booked_count").notNull().default(0),
    status: varchar("status", { length: 24 }).notNull().default("PROPOSED"),
    version: integer("version").notNull().default(1),
    createdByUserId: uuid("created_by_user_id").notNull().references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("hr_interview_slots_college_round_idx").on(t.collegeId, t.roundId, t.startAt),
    uniqueIndex("hr_interview_slots_round_start_uq").on(t.roundId, t.startAt),
    check("hr_slot_mode_ck", sql`${t.mode} in ('ON_CAMPUS','VIRTUAL')`),
    check("hr_slot_capacity_ck", sql`${t.capacity} between 1 and 100`),
    check("hr_slot_status_ck", sql`${t.status} in ('PROPOSED','OFFERED','BOOKED','CANCELLED')`),
    check("hr_slot_version_ck", sql`${t.version} > 0`),
    check("hr_slot_count_ck", sql`${t.bookedCount} between 0 and ${t.capacity}`),
    check("hr_slot_end_ck", sql`${t.endAt} > ${t.startAt}`),
    check("hr_slot_status_book_ck", sql`${t.status} <> 'BOOKED' or ${t.bookedCount} > 0`),
    foreignKey({
      columns: [t.jobId, t.collegeId],
      foreignColumns: [placementJobs.id, placementJobs.collegeId],
      name: "hr_slot_job_college_fk",
    }),
    foreignKey({
      columns: [t.roundId, t.jobId],
      foreignColumns: [placementJobRounds.id, placementJobRounds.jobId],
      name: "hr_slot_round_job_fk",
    }),
  ],
);
