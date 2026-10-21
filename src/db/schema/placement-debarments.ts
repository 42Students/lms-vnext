import { sql } from "drizzle-orm";
import {
  check,
  date,
  index,
  integer,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { colleges } from "./colleges";
import { collegeMemberships } from "./memberships";
import { placementJobs } from "./placements";
import { users } from "./users";

/**
 * An administrative placement exclusion. Historic rows survive expiration/lift.
 * Legacy V1 interprets until_date first; otherwise count the next N drives.
 */
export const placementDebarments = pgTable(
  "placement_debarments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    legacyDebarmentId: integer("legacy_debarment_id"),
    legacyStudentId: integer("legacy_student_id"),
    legacyCreatorId: integer("legacy_creator_id"),
    legacyCreatorRole: varchar("legacy_creator_role",{length:32}),
    collegeId: uuid("college_id").notNull()
      .references(() => colleges.id, { onDelete: "restrict" }),
    membershipId: uuid("membership_id").notNull()
      .references(() => collegeMemberships.id, { onDelete: "restrict" }),
    reason: varchar("reason", { length: 500 }).notNull(),
    untilDate: date("until_date", { mode: "string" }),
    untilDrives: integer("until_drives"),
    drivesCounted: integer("drives_counted").notNull().default(0),
    createdByUserId: uuid("created_by_user_id").notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull().defaultNow(),
    liftedAt: timestamp("lifted_at", { withTimezone: true }),
    liftedByUserId: uuid("lifted_by_user_id")
      .references(() => users.id, { onDelete: "restrict" }),
    liftedReason: varchar("lifted_reason", { length: 500 }),
  },
  (t) => [
    index("placement_debarments_member_time_idx").on(t.membershipId, t.createdAt),
    index("placement_debarments_college_idx").on(t.collegeId, t.liftedAt),
    uniqueIndex("placement_debarments_college_legacy_id_uq").on(t.collegeId,t.legacyDebarmentId)
      .where(sql`${t.legacyDebarmentId} is not null`),
    check("placement_debarments_reason_ck", sql`length(trim(${t.reason})) > 0`),
    check("placement_debarments_until_drives_ck",
      sql`${t.untilDrives} is null or ${t.untilDrives} > 0`),
    check("placement_debarments_count_ck", sql`${t.drivesCounted} >= 0`),
    check("placement_debarments_lift_ck",
      sql`(${t.liftedAt} is null and ${t.liftedByUserId} is null and ${t.liftedReason} is null)
        or (${t.liftedAt} is not null and ${t.liftedByUserId} is not null
          and length(trim(coalesce(${t.liftedReason}, ''))) > 0)`),
  ],
);

/** One counted job per debarment; retries must not increase drive count twice. */
export const placementDebarmentDriveEvents = pgTable(
  "placement_debarment_drive_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    debarmentId: uuid("debarment_id").notNull()
      .references(() => placementDebarments.id, { onDelete: "restrict" }),
    jobId: uuid("job_id").notNull()
      .references(() => placementJobs.id, { onDelete: "restrict" }),
    recordedByUserId: uuid("recorded_by_user_id").notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    recordedAt: timestamp("recorded_at", { withTimezone: true })
      .notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("placement_debarment_drives_unique_uq").on(t.debarmentId, t.jobId),
    index("placement_debarment_drives_job_idx").on(t.jobId),
  ],
);

/** Immutable administrative audit, even after debarment is lifted. */
export const placementDebarmentHistory = pgTable(
  "placement_debarment_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    debarmentId: uuid("debarment_id").notNull()
      .references(() => placementDebarments.id, { onDelete: "restrict" }),
    eventType: varchar("event_type", { length: 24 }).notNull(),
    jobId: uuid("job_id").references(() => placementJobs.id, { onDelete: "restrict" }),
    reason: varchar("reason", { length: 500 }),
    actorUserId: uuid("actor_user_id").notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    occurredAt: timestamp("occurred_at", { withTimezone: true })
      .notNull().defaultNow(),
  },
  (t) => [
    index("placement_debarment_history_parent_time_idx").on(t.debarmentId, t.occurredAt),
    check("placement_debarment_history_type_ck",
      sql`${t.eventType} in ('CREATED','DRIVE_COUNTED','LIFTED')`),
    check("placement_debarment_history_job_ck",
      sql`(${t.eventType} = 'DRIVE_COUNTED' and ${t.jobId} is not null)
        or (${t.eventType} <> 'DRIVE_COUNTED' and ${t.jobId} is null)`),
  ],
);
