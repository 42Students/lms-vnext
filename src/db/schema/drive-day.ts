import { sql } from "drizzle-orm";
import {
  check,
  date,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { colleges } from "./colleges";
import { collegeMemberships } from "./memberships";
import {
  placementApplications,
  placementJobRounds,
  placementJobs,
} from "./placements";
import { users } from "./users";

export const placementDriveDayCoordinatorAssignments =
  pgTable(
    "placement_drive_day_coordinator_assignments",
    {
      id: uuid("id").defaultRandom().primaryKey(),
      collegeId: uuid("college_id")
        .notNull()
        .references(() => colleges.id, {
          onDelete: "restrict",
        }),
      jobId: uuid("job_id")
        .notNull()
        .references(() => placementJobs.id, {
          onDelete: "cascade",
        }),
      learnerMembershipId: uuid(
        "learner_membership_id",
      )
        .notNull()
        .references(() => collegeMemberships.id, {
          onDelete: "cascade",
        }),
      onDate: date("on_date", {
        mode: "string",
      }).notNull(),
      createdByUserId: uuid(
        "created_by_user_id",
      )
        .notNull()
        .references(() => users.id, {
          onDelete: "restrict",
        }),
      createdAt: timestamp("created_at", {
        withTimezone: true,
      })
        .notNull()
        .defaultNow(),
    },
    (table) => [
      uniqueIndex(
        "placement_drive_day_coordinator_assignment_uq",
      ).on(
        table.jobId,
        table.learnerMembershipId,
        table.onDate,
      ),
      index(
        "placement_drive_day_coordinator_membership_date_idx",
      ).on(
        table.learnerMembershipId,
        table.onDate,
      ),
      index(
        "placement_drive_day_coordinator_college_date_idx",
      ).on(table.collegeId, table.onDate),
    ],
  );

export const placementRoundAttendance = pgTable(
  "placement_round_attendance",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    roundId: uuid("round_id")
      .notNull()
      .references(() => placementJobRounds.id, {
        onDelete: "cascade",
      }),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => placementApplications.id, {
        onDelete: "cascade",
      }),
    status: varchar("status", {
      length: 24,
    }).notNull(),
    room: text("room"),
    markedByUserId: uuid("marked_by_user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "restrict",
      }),
    markedAt: timestamp("marked_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex(
      "placement_round_attendance_round_application_uq",
    ).on(table.roundId, table.applicationId),
    index(
      "placement_round_attendance_round_status_idx",
    ).on(table.roundId, table.status),
    check(
      "placement_round_attendance_status_ck",
      sql`${table.status} in ('PRESENT', 'IN_INTERVIEW', 'DONE', 'ABSENT')`,
    ),
  ],
);
