import { sql } from "drizzle-orm";
import {
  boolean,
  check,
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
import { collegeMemberships } from "./memberships";
import { sectionScheduleEvents } from "./academics";
import { users } from "./users";

export const attendancePolicies = pgTable(
  "attendance_policies",
  {
    collegeId: uuid("college_id")
      .primaryKey()
      .references(() => colleges.id, {
        onDelete: "restrict",
      }),
    eligibilityThresholdPercent: integer(
      "eligibility_threshold_percent",
    )
      .notNull()
      .default(75),
    correctionWindowHours: integer(
      "correction_window_hours",
    )
      .notNull()
      .default(24),
    updatedByUserId: uuid(
      "updated_by_user_id",
    ).references(() => users.id, {
      onDelete: "restrict",
    }),
    createdAt: timestamp("created_at", {
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
    check(
      "attendance_policies_threshold_ck",
      sql`${table.eligibilityThresholdPercent} between 1 and 100`,
    ),
    check(
      "attendance_policies_correction_window_ck",
      sql`${table.correctionWindowHours} between 1 and 168`,
    ),
  ],
);

export const attendanceSessions = pgTable(
  "attendance_sessions",
  {
    /** Numeric source schedule key; not a native event FK. */
    legacyClassScheduleId: integer("legacy_class_schedule_id"),
    legacyAttendanceMarkedAt: timestamp("legacy_attendance_marked_at", { withTimezone: true }),
    legacyClassId: integer("legacy_class_id"),
    legacyCourseId: integer("legacy_course_id"),
    legacyFacultyId: integer("legacy_faculty_id"),
    scheduleEventId: uuid("schedule_event_id")
      .primaryKey()
      .references(() => sectionScheduleEvents.id, {
        onDelete: "cascade",
      }),
    status: varchar("status", {
      length: 24,
    })
      .notNull()
      .default("UNMARKED"),
    markedByUserId: uuid(
      "marked_by_user_id",
    ).references(() => users.id, {
      onDelete: "restrict",
    }),
    markedAt: timestamp("marked_at", {
      withTimezone: true,
    }),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index(
      "attendance_sessions_status_idx",
    ).on(table.status, table.updatedAt),
    check(
      "attendance_sessions_status_ck",
      sql`${table.status} in ('UNMARKED', 'MARKED')`,
    ),
    check(
      "attendance_sessions_lifecycle_ck",
      sql`(${table.status} = 'UNMARKED'
          and ${table.markedByUserId} is null
          and ${table.markedAt} is null)
        or (${table.status} = 'MARKED'
          and ${table.markedByUserId} is not null
          and ${table.markedAt} is not null)`,
    ),
  ],
);

export const attendanceRecords = pgTable(
  "attendance_records",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    /** Source attend rows are absences only and may have unknown original actor. */
    legacyAttendId: integer("legacy_attend_id"),
    legacyClassScheduleId: integer("legacy_class_schedule_id"),
    legacyStudentId: text("legacy_student_id"),
    legacyAttendanceStatus: varchar("legacy_attendance_status", { length: 20 }),
    legacyAbsenceReason: text("legacy_absence_reason"),
    legacyMarkedById: integer("legacy_marked_by_id"),
    legacyWasDeleted: boolean("legacy_was_deleted"),
    scheduleEventId: uuid("schedule_event_id")
      .notNull()
      .references(() => sectionScheduleEvents.id, {
        onDelete: "cascade",
      }),
    membershipId: uuid("membership_id")
      .notNull()
      .references(() => collegeMemberships.id, {
        onDelete: "restrict",
      }),
    status: varchar("status", {
      length: 24,
    }).notNull(),
    note: varchar("note", { length: 1000 }),
    markedByUserId: uuid(
      "marked_by_user_id",
    )
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
      "attendance_records_event_membership_uq",
    ).on(
      table.scheduleEventId,
      table.membershipId,
    ),
    index(
      "attendance_records_membership_event_idx",
    ).on(
      table.membershipId,
      table.scheduleEventId,
    ),
    index(
      "attendance_records_event_status_idx",
    ).on(
      table.scheduleEventId,
      table.status,
    ),
    check(
      "attendance_records_status_ck",
      sql`${table.status} in ('PRESENT', 'ABSENT', 'EXCUSED', 'MEDICAL', 'LATE')`,
    ),
  ],
);
