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
import {
  academicPeriods,
  cohorts,
  sectionScheduleEvents,
  sections,
} from "./academics";
import { departments } from "./departments";
import { collegeMemberships } from "./memberships";
import { users } from "./users";
import {
  courseOfferingStatusEnum,
  courseOfferingTypeEnum,
  courseStatusEnum,
  courseTeachingRoleEnum,
  learningPathStatusEnum,
  courseLessonStatusEnum,
  lessonContentTypeEnum,
  lessonContentStatusEnum,
} from "./enums";

export const courses = pgTable(
  "courses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    departmentId: uuid("department_id")
      .notNull()
      .references(() => departments.id, {
        onDelete: "restrict",
      }),
    name: text("name").notNull(),
    code: varchar("code", { length: 64 }).notNull(),
    description: text("description"),
    status: courseStatusEnum("status")
      .notNull()
      .default("ACTIVE"),
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
    uniqueIndex("courses_active_department_name_uq")
      .on(
        table.departmentId,
        sql`lower(${table.name})`,
      )
      .where(sql`${table.status} = 'ACTIVE'`),
    uniqueIndex("courses_active_department_code_uq")
      .on(
        table.departmentId,
        sql`lower(${table.code})`,
      )
      .where(sql`${table.status} = 'ACTIVE'`),
    index("courses_department_status_idx").on(
      table.departmentId,
      table.status,
    ),
  ],
);

export const courseOfferings = pgTable(
  "course_offerings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, {
        onDelete: "restrict",
      }),
    cohortId: uuid("cohort_id")
      .notNull()
      .references(() => cohorts.id, {
        onDelete: "restrict",
      }),
    academicPeriodId: uuid("academic_period_id")
      .notNull()
      .references(() => academicPeriods.id, {
        onDelete: "restrict",
      }),
    type: courseOfferingTypeEnum("type")
      .notNull()
      .default("CORE"),
    credits: integer("credits"),
    displayOrder: integer("display_order")
      .notNull()
      .default(0),
    status: courseOfferingStatusEnum("status")
      .notNull()
      .default("ACTIVE"),
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
    uniqueIndex("course_offerings_active_uq")
      .on(
        table.courseId,
        table.cohortId,
        table.academicPeriodId,
      )
      .where(sql`${table.status} = 'ACTIVE'`),
    index("course_offerings_cohort_period_status_idx").on(
      table.cohortId,
      table.academicPeriodId,
      table.status,
    ),
    index("course_offerings_course_status_idx").on(
      table.courseId,
      table.status,
    ),
    check(
      "course_offerings_credits_ck",
      sql`${table.credits} is null or (${table.credits} between 1 and 30)`,
    ),
    check(
      "course_offerings_display_order_ck",
      sql`${table.displayOrder} >= 0`,
    ),
  ],
);

export const courseSectionDeliveries = pgTable(
  "course_section_deliveries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    offeringId: uuid("offering_id")
      .notNull()
      .references(() => courseOfferings.id, {
        onDelete: "restrict",
      }),
    sectionId: uuid("section_id")
      .notNull()
      .references(() => sections.id, {
        onDelete: "restrict",
      }),
    startedAt: timestamp("started_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    endedAt: timestamp("ended_at", {
      withTimezone: true,
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
    uniqueIndex("course_section_deliveries_active_uq")
      .on(table.offeringId, table.sectionId)
      .where(sql`${table.endedAt} is null`),
    index("course_section_deliveries_section_idx").on(
      table.sectionId,
    ),
    index("course_section_deliveries_offering_idx").on(
      table.offeringId,
    ),
  ],
);

export const sectionScheduleEventCourses = pgTable(
  "section_schedule_event_courses",
  {
    scheduleEventId: uuid("schedule_event_id")
      .primaryKey()
      .references(() => sectionScheduleEvents.id, {
        onDelete: "cascade",
      }),
    deliveryId: uuid("delivery_id")
      .notNull()
      .references(() => courseSectionDeliveries.id, {
        onDelete: "restrict",
      }),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("section_schedule_event_courses_delivery_idx").on(
      table.deliveryId,
    ),
  ],
);

export const courseTeachingAssignments = pgTable(
  "course_teaching_assignments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
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
    role: courseTeachingRoleEnum("role").notNull(),
    startedAt: timestamp("started_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    endedAt: timestamp("ended_at", {
      withTimezone: true,
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
    uniqueIndex("course_teaching_assignments_active_uq")
      .on(
        table.deliveryId,
        table.membershipId,
        table.role,
      )
      .where(sql`${table.endedAt} is null`),
    uniqueIndex(
      "course_teaching_assignments_active_primary_uq",
    )
      .on(table.deliveryId)
      .where(
        sql`${table.endedAt} is null and ${table.role} = 'PRIMARY'`,
      ),
    index(
      "course_teaching_assignments_membership_idx",
    ).on(table.membershipId),
    index(
      "course_teaching_assignments_delivery_idx",
    ).on(table.deliveryId),
  ],
);

export const courseLearningPaths = pgTable(
  "course_learning_paths",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    offeringId: uuid("offering_id")
      .notNull()
      .references(() => courseOfferings.id, {
        onDelete: "restrict",
      }),
    title: text("title").notNull(),
    description: text("description"),
    status: learningPathStatusEnum("status")
      .notNull()
      .default("DRAFT"),
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
    uniqueIndex("course_learning_paths_current_uq")
      .on(table.offeringId)
      .where(sql`${table.status} <> 'ARCHIVED'`),
    index("course_learning_paths_offering_status_idx")
      .on(table.offeringId, table.status),
  ],
);

export const courseLessons = pgTable(
  "course_lessons",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    learningPathId: uuid("learning_path_id")
      .notNull()
      .references(() => courseLearningPaths.id, {
        onDelete: "restrict",
      }),
    name: text("name").notNull(),
    description: text("description"),
    sequence: integer("sequence").notNull(),
    status: courseLessonStatusEnum("status")
      .notNull()
      .default("ACTIVE"),
    visibleToStudents: boolean("visible_to_students").notNull().default(true),
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
    index("course_lessons_active_visible_idx")
      .on(table.learningPathId, table.visibleToStudents, table.sequence)
      .where(sql`${table.status} = 'ACTIVE'`),
    uniqueIndex("course_lessons_active_name_uq")
      .on(
        table.learningPathId,
        sql`lower(${table.name})`,
      )
      .where(sql`${table.status} = 'ACTIVE'`),
    uniqueIndex("course_lessons_active_sequence_uq")
      .on(table.learningPathId, table.sequence)
      .where(sql`${table.status} = 'ACTIVE'`),
    index("course_lessons_path_status_idx").on(
      table.learningPathId,
      table.status,
    ),
    check(
      "course_lessons_sequence_ck",
      sql`${table.sequence} >= 0`,
    ),
  ],
);

export const lessonContents = pgTable(
  "lesson_contents",
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
    contentType:
      lessonContentTypeEnum("content_type")
        .notNull(),
    title: text("title").notNull(),
    notes: text("notes"),
    externalUrl: text("external_url"),
    storageKey: text("storage_key"),
    durationSeconds: integer("duration_seconds"),
    // FAC-courses-19: educator-assigned learning points across content kinds.
    points: integer("points").notNull().default(1),
    startsAt: timestamp("starts_at", {
      withTimezone: true,
    }),
    endsAt: timestamp("ends_at", {
      withTimezone: true,
    }),
    sequence: integer("sequence").notNull(),
    status: lessonContentStatusEnum("status")
      .notNull()
      .default("DRAFT"),
    visibleToStudents: boolean("visible_to_students").notNull().default(true),
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
    index("lesson_contents_lesson_status_sequence_idx")
      .on(
        table.lessonId,
        table.status,
        table.sequence,
      ),
    index("lesson_contents_delivery_status_idx")
      .on(table.deliveryId, table.status),
    index("lesson_contents_visible_for_students_idx")
      .on(table.lessonId, table.deliveryId, table.status)
      .where(sql`${table.visibleToStudents} = true`),
    check(
      "lesson_contents_sequence_ck",
      sql`${table.sequence} >= 0`,
    ),
    check("lesson_contents_points_ck", sql`${table.points} between 0 and 1000`),
    check(
      "lesson_contents_duration_ck",
      sql`${table.durationSeconds} is null or ${table.durationSeconds} between 1 and 86400`,
    ),
    check(
      "lesson_contents_shape_ck",
      sql`(
        (${table.contentType} = 'RESOURCE'
          and (${table.notes} is not null or ${table.externalUrl} is not null or ${table.storageKey} is not null)
          and ${table.durationSeconds} is null
          and ${table.startsAt} is null and ${table.endsAt} is null)
        or
        (${table.contentType} = 'VIDEO'
          and ${table.storageKey} is not null
          and ${table.externalUrl} is null
          and ${table.durationSeconds} is not null
          and ${table.startsAt} is null and ${table.endsAt} is null)
        or
        (${table.contentType} = 'YOUTUBE'
          and ${table.externalUrl} is not null
          and ${table.storageKey} is null
          and ${table.durationSeconds} is not null
          and ${table.startsAt} is null and ${table.endsAt} is null)
        or
        (${table.contentType} = 'LIVE_CLASS'
          and ${table.externalUrl} is not null
          and ${table.storageKey} is null
          and ${table.durationSeconds} is null
          and ${table.startsAt} is not null
          and ${table.endsAt} is not null
          and ${table.endsAt} > ${table.startsAt})
      )`,
    ),
  ],
);


export const learnerContentProgress = pgTable(
  "learner_content_progress",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    membershipId: uuid("membership_id")
      .notNull()
      .references(() => collegeMemberships.id, {
        onDelete: "restrict",
      }),
    lessonContentId: uuid("lesson_content_id")
      .notNull()
      .references(() => lessonContents.id, {
        onDelete: "restrict",
      }),
    lastPositionSeconds: integer(
      "last_position_seconds",
    )
      .notNull()
      .default(0),
    completedAt: timestamp("completed_at", {
      withTimezone: true,
    }),
    // Legacy fidelity (migration 0098).
    firstCompletedAt: timestamp("first_completed_at", {
      withTimezone: true,
    }),
    attempt: integer("attempt").notNull().default(1),
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
      "learner_content_progress_membership_content_uq",
    ).on(
      table.membershipId,
      table.lessonContentId,
    ),
    index(
      "learner_content_progress_membership_idx",
    ).on(table.membershipId),
    index(
      "learner_content_progress_content_idx",
    ).on(table.lessonContentId),
    check(
      "learner_content_progress_position_ck",
      sql`${table.lastPositionSeconds} >= 0`,
    ),
    check(
      "learner_content_progress_attempt_ck",
      sql`${table.attempt} >= 1`,
    ),
  ],
);
