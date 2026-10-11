/**
 * DB-035 / DB06 SOURCE-ONLY staging.
 *
 * DO NOT export from src/db/schema/index.ts and do not assume these tables
 * exist until Chat 1 migration integration reconciles the prerequisite
 * composite targets and executes PostgreSQL acceptance.
 *
 * Source contracts:
 * - legacy grade_audit_log: immutable before/after grading audit
 * - legacy attend: corrections overwrite/revive current state, so vNext needs
 *   an immutable correction trail beside attendance_records
 */
import { sql } from "drizzle-orm";
import {
  boolean,
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
import { collegeMemberships } from "./memberships";
import { users } from "./users";
import { assignmentSubmissions } from "./assessments";
import { attendanceRecords } from "./attendance";
import { sectionScheduleEvents } from "./academics";

export const assignmentGradeEventsStaged = pgTable(
  "assignment_grade_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    assignmentSubmissionId: uuid("assignment_submission_id").notNull(),
    assignmentId: uuid("assignment_id").notNull(),
    deliveryId: uuid("delivery_id").notNull(),
    learnerMembershipId: uuid("learner_membership_id").notNull(),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "restrict" }),
    actorUserId: uuid("actor_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    actorMembershipId: uuid("actor_membership_id")
      .references(() => collegeMemberships.id, { onDelete: "restrict" }),
    action: varchar("action", { length: 40 }).notNull(),
    previousPoints: integer("previous_points"),
    newPoints: integer("new_points"),
    previousGradingStatus: varchar("previous_grading_status", { length: 24 })
      .notNull(),
    newGradingStatus: varchar("new_grading_status", { length: 24 })
      .notNull(),
    previousGradePublished: boolean("previous_grade_published").notNull(),
    newGradePublished: boolean("new_grade_published").notNull(),
    submissionVersionBefore: integer("submission_version_before").notNull(),
    submissionVersionAfter: integer("submission_version_after").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      name: "assignment_grade_events_submission_identity_fk",
      columns: [
        table.assignmentSubmissionId,
        table.assignmentId,
        table.deliveryId,
        table.learnerMembershipId,
      ],
      foreignColumns: [
        assignmentSubmissions.id,
        assignmentSubmissions.assignmentId,
        assignmentSubmissions.deliveryId,
        assignmentSubmissions.membershipId,
      ],
    }).onDelete("restrict"),
    index("assignment_grade_events_submission_time_idx").on(
      table.assignmentSubmissionId,
      table.occurredAt,
    ),
    index("assignment_grade_events_college_time_idx").on(
      table.collegeId,
      table.occurredAt,
    ),
    index("assignment_grade_events_actor_time_idx").on(
      table.actorUserId,
      table.occurredAt,
    ),
    check(
      "assignment_grade_events_action_ck",
      sql`${table.action} in ('GRADE','REGRADE','PUBLISH_GRADE')`,
    ),
    check(
      "assignment_grade_events_status_ck",
      sql`${table.previousGradingStatus} in ('NOT_GRADED','GRADED')
        and ${table.newGradingStatus} in ('NOT_GRADED','GRADED')`,
    ),
    check(
      "assignment_grade_events_points_ck",
      sql`(${table.previousPoints} is null or ${table.previousPoints} >= 0)
        and (${table.newPoints} is null or ${table.newPoints} >= 0)`,
    ),
    check(
      "assignment_grade_events_version_ck",
      sql`${table.submissionVersionBefore} >= 0
        and ${table.submissionVersionAfter} = ${table.submissionVersionBefore} + 1`,
    ),
    check(
      "assignment_grade_events_shape_ck",
      sql`(
        ${table.action} in ('GRADE','REGRADE')
        and ${table.newGradingStatus} = 'GRADED'
        and ${table.newPoints} is not null
        and ${table.newGradePublished} = false
      ) or (
        ${table.action} = 'PUBLISH_GRADE'
        and ${table.previousGradingStatus} = 'GRADED'
        and ${table.newGradingStatus} = 'GRADED'
        and ${table.previousGradePublished} = false
        and ${table.newGradePublished} = true
        and ${table.previousPoints} is not distinct from ${table.newPoints}
      )`,
    ),
  ],
);

export const attendanceRecordEventsStaged = pgTable(
  "attendance_record_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    attendanceRecordId: uuid("attendance_record_id").notNull(),
    scheduleEventId: uuid("schedule_event_id")
      .notNull()
      .references(() => sectionScheduleEvents.id, { onDelete: "restrict" }),
    membershipId: uuid("membership_id")
      .notNull()
      .references(() => collegeMemberships.id, { onDelete: "restrict" }),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "restrict" }),
    actorUserId: uuid("actor_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    actorMembershipId: uuid("actor_membership_id")
      .references(() => collegeMemberships.id, { onDelete: "restrict" }),
    action: varchar("action", { length: 24 }).notNull(),
    previousStatus: varchar("previous_status", { length: 24 }),
    newStatus: varchar("new_status", { length: 24 }).notNull(),
    previousNote: text("previous_note"),
    newNote: text("new_note"),
    recordVersionBefore: integer("record_version_before"),
    recordVersionAfter: integer("record_version_after").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      name: "attendance_record_events_record_identity_fk",
      columns: [
        table.attendanceRecordId,
        table.scheduleEventId,
        table.membershipId,
      ],
      foreignColumns: [
        attendanceRecords.id,
        attendanceRecords.scheduleEventId,
        attendanceRecords.membershipId,
      ],
    }).onDelete("restrict"),
    uniqueIndex("attendance_record_events_record_version_uq").on(
      table.attendanceRecordId,
      table.recordVersionAfter,
    ),
    index("attendance_record_events_record_time_idx").on(
      table.attendanceRecordId,
      table.occurredAt,
    ),
    index("attendance_record_events_member_time_idx").on(
      table.membershipId,
      table.occurredAt,
    ),
    index("attendance_record_events_college_time_idx").on(
      table.collegeId,
      table.occurredAt,
    ),
    check(
      "attendance_record_events_action_ck",
      sql`${table.action} in ('MARK','CORRECT')`,
    ),
    check(
      "attendance_record_events_status_ck",
      sql`${table.newStatus} in ('PRESENT','ABSENT','EXCUSED','MEDICAL','LATE')
        and (
          ${table.previousStatus} is null
          or ${table.previousStatus} in ('PRESENT','ABSENT','EXCUSED','MEDICAL','LATE')
        )`,
    ),
    check(
      "attendance_record_events_shape_ck",
      sql`(
        ${table.action} = 'MARK'
        and ${table.previousStatus} is null
        and ${table.recordVersionBefore} is null
        and ${table.recordVersionAfter} = 0
      ) or (
        ${table.action} = 'CORRECT'
        and ${table.previousStatus} is not null
        and ${table.recordVersionBefore} is not null
        and ${table.recordVersionBefore} >= 0
        and ${table.recordVersionAfter} = ${table.recordVersionBefore} + 1
      )`,
    ),
  ],
);

// Promotion prerequisites intentionally live in the staged SQL rather than
// mutating active tables in this source-only file:
// - UNIQUE (id, assignment_id, delivery_id, membership_id) on assignment_submissions
// - version integer NOT NULL DEFAULT 0 on attendance_records with CAS semantics
// - UNIQUE (id, schedule_event_id, membership_id) on attendance_records
// - tenant/actor consistency triggers
// - append-only UPDATE/DELETE/TRUNCATE rejection
