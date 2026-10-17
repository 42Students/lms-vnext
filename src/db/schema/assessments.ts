import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import {
  courseLessons,
  courseSectionDeliveries,
} from "./courses";
import { collegeMemberships } from "./memberships";
import { users } from "./users";
import {
  assignmentGradingStatusEnum,
  assignmentSubmissionTypeEnum,
  courseAssignmentStatusEnum,
} from "./enums";

export const courseAssignments = pgTable(
  "course_assignments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    lessonId: uuid("lesson_id")
      .notNull()
      .references(() => courseLessons.id, {
        onDelete: "restrict",
      }),
    deliveryId: uuid("delivery_id")
      .references(() => courseSectionDeliveries.id, {
        onDelete: "restrict",
      }),
    title: text("title").notNull(),
    description: text("description"),
    dueAt: timestamp("due_at", {
      withTimezone: true,
    }),
    maxPoints: integer("max_points").notNull(),
    sequence: integer("sequence").notNull(),
    status: courseAssignmentStatusEnum("status")
      .notNull()
      .default("DRAFT"),
    /** FAC-assessments-01/02: allowed learner submission methods (JSON array, 1-5 entries). */
    allowedSubmissionMethods: jsonb("allowed_submission_methods")
      .$type<string[]>()
      .notNull()
      .default([
        "WRITTEN_RESPONSE",
        "PDF_UPLOAD",
        "FILE_UPLOAD",
        "REPOSITORY_LINK",
        "EXTERNAL_LINK",
      ]),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id, {
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
    uniqueIndex(
      "course_assignments_generic_active_name_uq",
    )
      .on(
        table.lessonId,
        sql`lower(${table.title})`,
      )
      .where(
        sql`${table.deliveryId} is null and ${table.status} <> 'ARCHIVED'`,
      ),
    uniqueIndex(
      "course_assignments_delivery_active_name_uq",
    )
      .on(
        table.lessonId,
        table.deliveryId,
        sql`lower(${table.title})`,
      )
      .where(
        sql`${table.deliveryId} is not null and ${table.status} <> 'ARCHIVED'`,
      ),
    uniqueIndex(
      "course_assignments_generic_active_sequence_uq",
    )
      .on(table.lessonId, table.sequence)
      .where(
        sql`${table.deliveryId} is null and ${table.status} <> 'ARCHIVED'`,
      ),
    uniqueIndex(
      "course_assignments_delivery_active_sequence_uq",
    )
      .on(
        table.lessonId,
        table.deliveryId,
        table.sequence,
      )
      .where(
        sql`${table.deliveryId} is not null and ${table.status} <> 'ARCHIVED'`,
      ),
    index(
      "course_assignments_lesson_status_idx",
    ).on(table.lessonId, table.status),
    index(
      "course_assignments_delivery_status_idx",
    ).on(table.deliveryId, table.status),
    check(
      "course_assignments_points_ck",
      sql`${table.maxPoints} between 0 and 10000`,
    ),
    check(
      "course_assignments_sequence_ck",
      sql`${table.sequence} >= 0`,
    ),
    check(
      "course_assignments_methods_shape_ck",
      sql`jsonb_typeof(${table.allowedSubmissionMethods}) = 'array' and jsonb_array_length(${table.allowedSubmissionMethods}) between 1 and 5`,
    ),
  ],
);

export const assignmentSubmissions = pgTable(
  "assignment_submissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    assignmentId: uuid("assignment_id")
      .notNull()
      .references(() => courseAssignments.id, {
        onDelete: "restrict",
      }),
    deliveryId: uuid("delivery_id")
      .notNull()
      .references(() => courseSectionDeliveries.id, {
        onDelete: "restrict",
      }),
    membershipId: uuid("membership_id")
      .notNull()
      .references(() => collegeMemberships.id, {
        onDelete: "restrict",
      }),
    submissionType:
      assignmentSubmissionTypeEnum(
        "submission_type",
      ).notNull(),
    textContent: text("text_content"),
    submissionUrl: text("submission_url"),
    submittedAt: timestamp("submitted_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    pointsAwarded: integer("points_awarded"),
    // Legacy fidelity (migration 0098): resubmission counter and prior grade.
    attemptNumber: integer("attempt_number").notNull().default(1),
    previousPoints: integer("previous_points"),
    feedback: text("feedback"),
    gradingStatus:
      assignmentGradingStatusEnum(
        "grading_status",
      )
        .notNull()
        .default("NOT_GRADED"),
    gradePublished: boolean("grade_published")
      .notNull()
      .default(false),
    gradedByUserId: uuid("graded_by_user_id")
      .references(() => users.id, {
        onDelete: "restrict",
      }),
    gradedAt: timestamp("graded_at", {
      withTimezone: true,
    }),
    version: integer("version")
      .notNull()
      .default(0),
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
    uniqueIndex(
      "assignment_submissions_assignment_membership_uq",
    ).on(
      table.assignmentId,
      table.membershipId,
    ),
    // Parent key for assignment_submission_files composite tenant/owner FK.
    uniqueIndex("assignment_submissions_id_assignment_member_uq").on(
      table.id,
      table.assignmentId,
      table.membershipId,
    ),
    index(
      "assignment_submissions_assignment_delivery_idx",
    ).on(
      table.assignmentId,
      table.deliveryId,
    ),
    index(
      "assignment_submissions_membership_idx",
    ).on(table.membershipId),
    check(
      "assignment_submissions_payload_ck",
      sql`(
        (${table.submissionType} = 'TEXT'
          and ${table.textContent} is not null
          and length(trim(${table.textContent})) > 0
          and ${table.submissionUrl} is null)
        or
        (${table.submissionType} = 'LINK'
          and ${table.submissionUrl} is not null
          and ${table.textContent} is null)
        or
        (${table.submissionType} = 'FILE')
      )`,
    ),
    // FILE submissions carry their files in assignment_submission_files; a
    // deferred constraint trigger (migration 0080) requires at least one
    // READY file at commit time.
    check(
      "assignment_submissions_attempt_ck",
      sql`${table.attemptNumber} >= 1 and (${table.previousPoints} is null or ${table.previousPoints} >= 0)`,
    ),
    check(
      "assignment_submissions_points_ck",
      sql`${table.pointsAwarded} is null or ${table.pointsAwarded} >= 0`,
    ),
    check(
      "assignment_submissions_version_ck",
      sql`${table.version} >= 0`,
    ),
    check(
      "assignment_submissions_grading_ck",
      sql`(
        (${table.gradingStatus} = 'NOT_GRADED'
          and ${table.pointsAwarded} is null
          and ${table.gradedByUserId} is null
          and ${table.gradedAt} is null
          and ${table.gradePublished} = false)
        or
        (${table.gradingStatus} = 'GRADED'
          and ${table.pointsAwarded} is not null
          and ${table.gradedByUserId} is not null
          and ${table.gradedAt} is not null)
      )`,
    ),
  ],
);
