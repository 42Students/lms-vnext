import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  bigint,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import {
  courseLessons,
  courseSectionDeliveries,
} from "./courses";
import { collegeMemberships } from "./memberships";
import { users } from "./users";
import {
  courseQuizStatusEnum,
  quizQuestionTypeEnum,
} from "./enums";

export const courseQuizzes = pgTable(
  "course_quizzes",
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
    // Source keys remain import-only; native UUIDs and membership guards apply.
    legacyQuizId: integer("legacy_quiz_id"),
    legacyCourseId: integer("legacy_course_id"),
    legacyClassId: integer("legacy_class_id"),
    legacyFacultyId: integer("legacy_faculty_id"),
    legacyActive: boolean("legacy_active"),
    legacyEnabled: boolean("legacy_enabled"),
    legacyDeletedAt: timestamp("legacy_deleted_at",{withTimezone:true}),
    legacyQuizVersion: integer("legacy_quiz_version"),
    legacyResultsReleased: boolean("legacy_results_released"),
    title: text("title").notNull(),
    description: text("description"),
    dueAt: timestamp("due_at", {
      withTimezone: true,
    }),
    maxAttempts: integer("max_attempts")
      .notNull()
      .default(1),
    totalPoints: integer("total_points")
      .notNull(),
    sequence: integer("sequence").notNull(),
    status: courseQuizStatusEnum("status")
      .notNull()
      .default("DRAFT"),
    resultsPublished: boolean(
      "results_published",
    )
      .notNull()
      .default(false),
    // Legacy fidelity (migration 0098).
    shuffleQuestions: boolean("shuffle_questions")
      .notNull()
      .default(false),
    shuffleOptions: boolean("shuffle_options")
      .notNull()
      .default(false),
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
      "course_quizzes_generic_active_name_uq",
    )
      .on(
        table.lessonId,
        sql`lower(${table.title})`,
      )
      .where(
        sql`${table.deliveryId} is null and ${table.status} <> 'ARCHIVED'`,
      ),
    uniqueIndex(
      "course_quizzes_delivery_active_name_uq",
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
      "course_quizzes_generic_active_sequence_uq",
    )
      .on(table.lessonId, table.sequence)
      .where(
        sql`${table.deliveryId} is null and ${table.status} <> 'ARCHIVED'`,
      ),
    uniqueIndex(
      "course_quizzes_delivery_active_sequence_uq",
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
      "course_quizzes_lesson_status_idx",
    ).on(table.lessonId, table.status),
    index("course_quizzes_legacy_identity_idx")
      .on(table.legacyCourseId,table.legacyClassId,table.legacyQuizId)
      .where(sql`${table.legacyQuizId} is not null`),
    index(
      "course_quizzes_delivery_status_idx",
    ).on(table.deliveryId, table.status),
    check(
      "course_quizzes_max_attempts_ck",
      sql`${table.maxAttempts} between 1 and 20`,
    ),
    check(
      "course_quizzes_total_points_ck",
      sql`${table.totalPoints} between 1 and 10000`,
    ),
    check(
      "course_quizzes_sequence_ck",
      sql`${table.sequence} >= 0`,
    ),
  ],
);

export const quizQuestions = pgTable(
  "quiz_questions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    quizId: uuid("quiz_id")
      .notNull()
      .references(() => courseQuizzes.id, {
        onDelete: "restrict",
      }),
    legacyQuestionId: integer("legacy_question_id"),
    legacySortOrder: integer("legacy_sort_order"),
    legacyQuestionType: varchar("legacy_question_type",{length:50}),
    deletedAt: timestamp("deleted_at",{withTimezone:true}),
    legacyWasDeleted: boolean("legacy_was_deleted"),
    questionType:
      quizQuestionTypeEnum(
        "question_type",
      ).notNull(),
    prompt: text("prompt").notNull(),
    points: integer("points").notNull(),
    sequence: integer("sequence").notNull(),
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
      "quiz_questions_quiz_sequence_uq",
    ).on(table.quizId, table.sequence),
    index("quiz_questions_active_order_idx")
      .on(table.quizId,table.sequence,table.id)
      .where(sql`${table.deletedAt} is null`),
    index("quiz_questions_quiz_idx").on(
      table.quizId,
    ),
    check(
      "quiz_questions_points_ck",
      sql`${table.points} between 1 and 100`,
    ),
    check(
      "quiz_questions_sequence_ck",
      sql`${table.sequence} >= 0`,
    ),
  ],
);

export const quizOptions = pgTable(
  "quiz_options",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    questionId: uuid("question_id")
      .notNull()
      .references(() => quizQuestions.id, {
        onDelete: "restrict",
      }),
    legacyOptionId: integer("legacy_option_id"),
    legacySortOrder: integer("legacy_sort_order"),
    deletedAt: timestamp("deleted_at",{withTimezone:true}),
    legacyWasDeleted: boolean("legacy_was_deleted"),
    optionText: text("option_text").notNull(),
    isCorrect: boolean("is_correct")
      .notNull()
      .default(false),
    sequence: integer("sequence").notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex(
      "quiz_options_question_sequence_uq",
    ).on(table.questionId, table.sequence),
    index("quiz_options_active_order_idx")
      .on(table.questionId,table.sequence,table.id)
      .where(sql`${table.deletedAt} is null`),
    index("quiz_options_question_idx").on(
      table.questionId,
    ),
    check(
      "quiz_options_sequence_ck",
      sql`${table.sequence} >= 0`,
    ),
  ],
);

export const quizAttempts = pgTable(
  "quiz_attempts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    quizId: uuid("quiz_id")
      .notNull()
      .references(() => courseQuizzes.id, {
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
    legacyAttemptId: integer("legacy_attempt_id"),
    legacyLearnerId: integer("legacy_learner_id"),
    legacyStatus: varchar("legacy_status", { length: 24 }),
    legacyScore: bigint("legacy_score", { mode: "bigint" }),
    legacyMaxScore: bigint("legacy_max_score", { mode: "bigint" }),
    legacyDeleted: boolean("legacy_deleted"),
    legacyUpdatedAt: timestamp("legacy_updated_at", { withTimezone: true }),
    legacySubmittedLocal: timestamp("legacy_submitted_local",{withTimezone:false}),
    legacySourceTimeZone: varchar("legacy_source_time_zone",{length:80}),
    deletedAt: timestamp("deleted_at",{withTimezone:true}),
    attemptNumber: integer("attempt_number")
      .notNull(),
    score: integer("score").notNull(),
    maxScore: integer("max_score").notNull(),
    submittedAt: timestamp("submitted_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex(
      "quiz_attempts_quiz_membership_number_uq",
    ).on(
      table.quizId,
      table.membershipId,
      table.attemptNumber,
    ),
    index(
      "quiz_attempts_quiz_delivery_idx",
    ).on(table.quizId, table.deliveryId),
    index("quiz_attempts_current_history_idx")
      .on(table.quizId,table.membershipId,table.submittedAt,table.id)
      .where(sql`${table.deletedAt} is null`),
    index(
      "quiz_attempts_membership_idx",
    ).on(table.membershipId),
    check(
      "quiz_attempts_number_ck",
      sql`${table.attemptNumber} >= 1`,
    ),
    check(
      "quiz_attempts_score_ck",
      sql`${table.maxScore} > 0 and ${table.score} >= 0 and ${table.score} <= ${table.maxScore}`,
    ),
  ],
);

export const quizAttemptAnswers = pgTable(
  "quiz_attempt_answers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    attemptId: uuid("attempt_id")
      .notNull()
      .references(() => quizAttempts.id, {
        onDelete: "restrict",
      }),
    legacyAnswerId: integer("legacy_answer_id"),
    legacyOptionIdsCsv: varchar("legacy_option_ids_csv", { length: 500 }),
    legacyPointsAwarded: bigint("legacy_points_awarded", { mode: "bigint" }),
    legacyDeleted: boolean("legacy_deleted"),
    questionId: uuid("question_id")
      .notNull()
      .references(() => quizQuestions.id, {
        onDelete: "restrict",
      }),
    questionType:
      quizQuestionTypeEnum(
        "question_type",
      ).notNull(),
    promptSnapshot: text(
      "prompt_snapshot",
    ).notNull(),
    pointsPossible: integer(
      "points_possible",
    ).notNull(),
    selectedOptionIds: jsonb(
      "selected_option_ids",
    )
      .$type<string[]>()
      .notNull(),
    optionsSnapshot: jsonb(
      "options_snapshot",
    )
      .$type<
        Array<{
          id: string;
          text: string;
          sequence: number;
          correct: boolean;
        }>
      >()
      .notNull(),
    correct: boolean("correct")
      .notNull(),
    pointsAwarded: integer(
      "points_awarded",
    ).notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex(
      "quiz_attempt_answers_attempt_question_uq",
    ).on(table.attemptId, table.questionId),
    index(
      "quiz_attempt_answers_attempt_idx",
    ).on(table.attemptId),
    check(
      "quiz_attempt_answers_points_ck",
      sql`${table.pointsPossible} >= 1 and ${table.pointsAwarded} >= 0 and ${table.pointsAwarded} <= ${table.pointsPossible}`,
    ),
  ],
);
