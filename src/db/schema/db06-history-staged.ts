/**
 * DB-035 / DB06 SOURCE-ONLY staging.
 *
 * DO NOT export from src/db/schema/index.ts or register the candidate as a
 * standalone migration. It requires the grading and attendance mutation
 * producers to commit exact immutable events in the SAME release as deferred
 * completeness triggers. The present producer only emits activityEvents, so
 * promotion would break live grading and violate the DB06 cutover contract.
 * A coordinated owner-approved cutover must check source grades for INTEGER
 * overflow, map legacy LONG identifiers using verified UUID crosswalk, and
 * interpret legacy naive LocalDateTime using a verified origin timezone.
 * No historic data is imported in greenfield vNext.
 *
 * Source contracts:
 * - legacy grade_audit_log: immutable before/after grading audit, actor + action
 * - legacy attendance correction: the mutable current row can be updated,
 *   deleted for PRESENT, or recreated; immutable history must therefore be
 *   anchored to schedule/delivery/learner identity rather than the current
 *   attendance_records row.
 */
import { sql } from "drizzle-orm";
import {
  bigint,
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
import {
  courseSectionDeliveries,
  sectionScheduleEventCourses,
} from "./courses";

export const assignmentGradeEventsStaged = pgTable(
  "assignment_grade_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    /** Source BIGINT/time/action are import provenance, never new actor IDs. */
    legacyGradeAuditId: bigint("legacy_grade_audit_id",{mode:"bigint"}),
    legacyAction: varchar("legacy_action",{length:40}),
    legacyOccurredAtLocal: varchar("legacy_occurred_at_local",{length:40}),
    actorNameSnapshot: varchar("actor_name_snapshot",{length:150}),
    assignmentSubmissionId: uuid("assignment_submission_id").notNull(),
    assignmentId: uuid("assignment_id").notNull(),
    deliveryId: uuid("delivery_id").notNull(),
    learnerMembershipId: uuid("learner_membership_id").notNull(),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "restrict" }),

    // Event actor is separate from before/after grader state. A College Admin
    // can publish a Faculty grade, so publisher and grader may legitimately differ.
    actorUserId: uuid("actor_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    actorMembershipId: uuid("actor_membership_id")
      .references(() => collegeMemberships.id, { onDelete: "restrict" }),
    actorRole: varchar("actor_role", { length: 24 }).notNull(),

    action: varchar("action", { length: 40 }).notNull(),
    previousPoints: integer("previous_points"),
    newPoints: integer("new_points"),
    previousFeedback: text("previous_feedback"),
    newFeedback: text("new_feedback"),
    previousGradingStatus: varchar("previous_grading_status", { length: 24 })
      .notNull(),
    newGradingStatus: varchar("new_grading_status", { length: 24 })
      .notNull(),
    previousGradePublished: boolean("previous_grade_published").notNull(),
    newGradePublished: boolean("new_grade_published").notNull(),
    previousGradedByUserId: uuid("previous_graded_by_user_id")
      .references(() => users.id, { onDelete: "restrict" }),
    newGradedByUserId: uuid("new_graded_by_user_id")
      .references(() => users.id, { onDelete: "restrict" }),
    previousGradedAt: timestamp("previous_graded_at", { withTimezone: true }),
    newGradedAt: timestamp("new_graded_at", { withTimezone: true }),

    // assignment_submissions exposes a CAS version. Each history row records
    // exactly one committed version transition.
    submissionVersionBefore: integer("submission_version_before").notNull(),
    submissionVersionAfter: integer("submission_version_after").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // Promotion prerequisite: the parent receives a matching composite UNIQUE.
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

    uniqueIndex("assignment_grade_events_legacy_audit_uq")
      .on(table.legacyGradeAuditId).where(sql`${table.legacyGradeAuditId} is not null`),
    index("assignment_grade_events_submission_cursor_idx")
      .on(table.assignmentSubmissionId,table.occurredAt,table.id),
    uniqueIndex("assignment_grade_events_submission_version_uq").on(
      table.assignmentSubmissionId,
      table.submissionVersionAfter,
    ),
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
      "assignment_grade_events_actor_role_ck",
      sql.raw(`"actor_role" in ('SUPER_ADMIN','COLLEGE_ADMIN','FACULTY')`),
    ),
    check(
      "assignment_grade_events_actor_shape_ck",
      sql.raw(`("actor_role" = 'SUPER_ADMIN' and "actor_membership_id" is null) or ("actor_role" in ('COLLEGE_ADMIN','FACULTY') and "actor_membership_id" is not null)`),
    ),
    check(
      "assignment_grade_events_action_ck",
      sql.raw(`"action" in ('GRADE','REGRADE','PUBLISH_GRADE')`),
    ),
    check(
      "assignment_grade_events_status_ck",
      sql.raw(`"previous_grading_status" in ('NOT_GRADED','GRADED') and "new_grading_status" in ('NOT_GRADED','GRADED')`),
    ),
    check(
      "assignment_grade_events_points_ck",
      sql.raw(`("previous_points" is null or "previous_points" >= 0) and ("new_points" is null or "new_points" >= 0)`),
    ),
    check(
      "assignment_grade_events_version_ck",
      sql.raw(`"submission_version_before" >= 0 and "submission_version_after" = "submission_version_before" + 1`),
    ),
    check(
      "assignment_grade_events_shape_ck",
      sql.raw(`(("action" = 'GRADE' and "previous_grading_status" = 'NOT_GRADED' and "new_grading_status" = 'GRADED' and "previous_points" is null and "new_points" is not null and "previous_grade_published" = false and "new_grade_published" = false and "new_graded_by_user_id" is not null and "new_graded_at" is not null) or ("action" = 'REGRADE' and "previous_grading_status" = 'GRADED' and "new_grading_status" = 'GRADED' and "new_points" is not null and "new_grade_published" = false and "new_graded_by_user_id" is not null and "new_graded_at" is not null) or ("action" = 'PUBLISH_GRADE' and "previous_grading_status" = 'GRADED' and "new_grading_status" = 'GRADED' and "previous_grade_published" = false and "new_grade_published" = true and "previous_points" is not distinct from "new_points" and "previous_feedback" is not distinct from "new_feedback" and "previous_graded_by_user_id" is not distinct from "new_graded_by_user_id" and "previous_graded_at" is not distinct from "new_graded_at"))`),
    ),
  ],
);

export const attendanceRecordEventsStaged = pgTable(
  "attendance_record_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // Final normalized current-row model: DB-042 retains one row for every
    // learner once attendance is marked, including explicit PRESENT. History
    // can therefore use immutable row identity plus monotonic row version.
    attendanceRecordId: uuid("attendance_record_id").notNull(),
    scheduleEventId: uuid("schedule_event_id")
      .notNull()
      .references(() => sectionScheduleEvents.id, { onDelete: "restrict" }),
    deliveryId: uuid("delivery_id")
      .notNull()
      .references(() => courseSectionDeliveries.id, { onDelete: "restrict" }),
    membershipId: uuid("membership_id")
      .notNull()
      .references(() => collegeMemberships.id, { onDelete: "restrict" }),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "restrict" }),

    // Event actor is separate from the row's previous/new marker snapshot.
    actorUserId: uuid("actor_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    actorMembershipId: uuid("actor_membership_id")
      .references(() => collegeMemberships.id, { onDelete: "restrict" }),
    actorRole: varchar("actor_role", { length: 24 }).notNull(),

    action: varchar("action", { length: 24 }).notNull(),
    previousStatus: varchar("previous_status", { length: 24 }),
    newStatus: varchar("new_status", { length: 24 }).notNull(),
    previousNote: text("previous_note"),
    newNote: text("new_note"),
    previousMarkedByUserId: uuid("previous_marked_by_user_id")
      .references(() => users.id, { onDelete: "restrict" }),
    newMarkedByUserId: uuid("new_marked_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    previousMarkedAt: timestamp("previous_marked_at", { withTimezone: true }),
    newMarkedAt: timestamp("new_marked_at", { withTimezone: true }).notNull(),

    recordVersionBefore: integer("record_version_before"),
    recordVersionAfter: integer("record_version_after").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // Promotion prerequisites add matching UNIQUE targets to both parent
    // relations before these composite FKs are registered.
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
    foreignKey({
      name: "attendance_record_events_delivery_identity_fk",
      columns: [table.scheduleEventId, table.deliveryId],
      foreignColumns: [
        sectionScheduleEventCourses.scheduleEventId,
        sectionScheduleEventCourses.deliveryId,
      ],
    }).onDelete("restrict"),

    uniqueIndex("attendance_record_events_record_version_uq").on(
      table.attendanceRecordId,
      table.recordVersionAfter,
    ),
    index("attendance_record_events_member_time_idx").on(
      table.membershipId,
      table.occurredAt,
    ),
    index("attendance_record_events_session_time_idx").on(
      table.scheduleEventId,
      table.occurredAt,
    ),
    index("attendance_record_events_college_time_idx").on(
      table.collegeId,
      table.occurredAt,
    ),
    index("attendance_record_events_actor_time_idx").on(
      table.actorUserId,
      table.occurredAt,
    ),
    check(
      "attendance_record_events_actor_role_ck",
      sql.raw(`"actor_role" in ('SUPER_ADMIN','COLLEGE_ADMIN','FACULTY')`),
    ),
    check(
      "attendance_record_events_actor_shape_ck",
      sql.raw(`("actor_role" = 'SUPER_ADMIN' and "actor_membership_id" is null) or ("actor_role" in ('COLLEGE_ADMIN','FACULTY') and "actor_membership_id" is not null)`),
    ),
    check(
      "attendance_record_events_action_ck",
      sql.raw(`"action" in ('MARK','CORRECT')`),
    ),
    check(
      "attendance_record_events_status_ck",
      sql.raw(`"new_status" in ('PRESENT','ABSENT','EXCUSED','MEDICAL','LATE') and ("previous_status" is null or "previous_status" in ('PRESENT','ABSENT','EXCUSED','MEDICAL','LATE'))`),
    ),
    check(
      "attendance_record_events_version_ck",
      sql.raw(`("action" = 'MARK' and "record_version_before" is null and "record_version_after" = 0) or ("action" = 'CORRECT' and "record_version_before" is not null and "record_version_before" >= 0 and "record_version_after" = "record_version_before" + 1)`),
    ),
    check(
      "attendance_record_events_shape_ck",
      sql.raw(`("action" = 'MARK' and "previous_status" is null and "previous_note" is null and "previous_marked_by_user_id" is null and "previous_marked_at" is null) or ("action" = 'CORRECT' and "previous_status" is not null and "previous_marked_by_user_id" is not null and "previous_marked_at" is not null)`),
    ),
  ],
);

// Promotion prerequisites intentionally live in staged SQL instead of mutating
// active tables in this source-only file:
// - UNIQUE (id, assignment_id, delivery_id, membership_id) on assignment_submissions
// - grade-event INSERT guard: exact tenant, actor and current-row post-state
// - attendance-event INSERT guard: stable current-row identity, schedule/delivery
//   link, learner tenant, actor role/teaching scope, optimistic version and
//   exact before/after current-row state
// - append-only UPDATE/DELETE/TRUNCATE rejection for both history tables
// - transactional producer cutover in grade/publish + Faculty/Admin attendance

/** Legacy names are display aliases; canonical events keep typed actions.
 * Absent events are "not graded" only when the history store is active.
 * A staged/unavailable store must never be shown as an empty audit. */
export const LEGACY_GRADE_AUDIT_ACTION_COPY={
 GRADE:"Grade",
 REGRADE:"Regrade",
 PUBLISH_GRADE:"Publish grade",
} as const;
export function gradeAuditHistoryDisplayState(
 enabled:boolean,rows:readonly unknown[],
):"UNAVAILABLE"|"NEVER_GRADED"|"READY"{
 return !enabled?"UNAVAILABLE":rows.length===0?"NEVER_GRADED":"READY";
}
