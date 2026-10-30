import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  date,
  index,
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
  academicPeriods,
  cohorts,
  sectionScheduleEvents,
  sections,
} from "./academics";
import { departments } from "./departments";
import { collegeMemberships } from "./memberships";
import { users } from "./users";
import { organizations } from "./organizations";
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
    // Legacy IDs must be resolved from scoped import maps before storing UUIDs.
    slug: varchar("slug", { length: 64 }),
    parentCourseId: uuid("parent_course_id"),
    createdByOrganizationId: uuid("created_by_organization_id")
      .references(() => organizations.id, { onDelete: "restrict" }),
    // SA-academics-people-50: distinct legacy catalogue presentation metadata.
    shortTitle: varchar("short_title", { length: 255 }),
    officialCode: varchar("official_code", { length: 64 }),
    cardColor: varchar("card_color", { length: 7 }),
    takeaways: text("takeaways"),
    description: text("description"),
    // Old active, enabled, and soft deletion were independent flags.
    enabled: boolean("enabled").notNull().default(true),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    legacyMetadata: jsonb("legacy_metadata").$type<Record<string, unknown>>(),
    // Separate old overview heading, image and ordered bullet list.
    introductionHeading: text("introduction_heading"),
    imageUrl: text("image_url"),
    imageUrlLearningPath: text("image_url_learning_path"),
    thumbnailUrl: text("thumbnail_url"),
    // Only render sanitized HTML with an explicitly reviewed sanitizer.
    legacyIntroductionHtml: text("legacy_introduction_html"),
    legacyCourseStartDateText: text("legacy_course_start_date_text"),
    legacyCourseEndDateText: text("legacy_course_end_date_text"),
    orderedTakeaways: jsonb("ordered_takeaways").$type<string[]>(),
    legacyAllowedForDisplay: integer("legacy_allowed_for_display"),
    legacyCourseId: integer("legacy_course_id"),
    legacyCategory: varchar("legacy_category", {length:120}),
    legacyCourseType: varchar("legacy_course_type", {length:60}),
    legacyPriceInr: integer("legacy_price_inr"),
    legacyPopularityCount: integer("legacy_popularity_count"),
    version: bigint("version", { mode: "number" }).notNull().default(0),
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
    uniqueIndex("courses_active_department_name_trim_uq")
      .on(
        table.departmentId,
        sql`lower(btrim(${table.name}))`,
      )
      .where(sql`${table.status} = 'ACTIVE' and ${table.deletedAt} is null`),
    uniqueIndex("courses_active_department_code_live_uq")
      .on(
        table.departmentId,
        sql`lower(btrim(${table.code}))`,
      )
      .where(sql`${table.status} = 'ACTIVE' and ${table.deletedAt} is null`),
    index("courses_department_status_idx").on(
      table.departmentId,
      table.status,
    ),
    uniqueIndex("courses_slug_uq").on(table.slug)
      .where(sql`${table.slug} is not null`),
    // Legacy short-title duplicates must be reconciled before 0205 is applied.
    uniqueIndex("courses_active_department_short_title_trim_uq")
      .on(table.departmentId, sql`lower(btrim(${table.shortTitle}))`)
      .where(sql`${table.status} = 'ACTIVE' and ${table.deletedAt} is null and ${table.shortTitle} is not null`),
    index("courses_legacy_id_idx").on(table.departmentId,table.legacyCourseId)
      .where(sql`${table.legacyCourseId} is not null`),
    index("courses_visible_department_idx")
      .on(table.departmentId, table.status, table.enabled)
      .where(sql`${table.deletedAt} is null`),
    check("db05_course_name_nonblank_ck",sql`btrim(${table.name}) <> ''`),
    check("db05_course_short_title_nonblank_ck",sql`${table.shortTitle} is null or btrim(${table.shortTitle}) <> ''`),
    check("db05_course_slug_nonblank_ck",sql`${table.slug} is null or btrim(${table.slug}) <> ''`),
    check("courses_card_color_hex_ck",
      sql`${table.cardColor} IS NULL OR ${table.cardColor} ~ '^#[0-9A-Fa-f]{6}$'`,
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
    /** Registered 0303 NOT NULL field; FK is SQL-owned to avoid the
     * courses <-> academic-terms module import cycle. */
    programTermId: uuid("program_term_id").notNull(),
    /** Registered DB02 curriculum, independent of the legacy semester ID. */
    programTermCourseId: uuid("program_term_course_id"),
    legacySemesterCourseId: integer("legacy_semester_course_id"),
    legacySortOrder: integer("legacy_sort_order"),
    legacyWasElective: boolean("legacy_was_elective"),
    type: courseOfferingTypeEnum("type")
      .notNull()
      .default("CORE"),
    // Legacy semester_course credit default; explicit null remains allowed.
    credits: integer("credits").default(3),
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
    index("course_offerings_legacy_semester_id_idx")
      .on(table.courseId,table.legacySemesterCourseId)
      .where(sql`${table.legacySemesterCourseId} is not null`),
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
    // Composite parent identity for exact delivery/offering scope witnesses.
    uniqueIndex("course_section_deliveries_id_offering_uq")
      .on(table.id, table.offeringId),
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
    role: courseTeachingRoleEnum("role").notNull().default("PRIMARY"),
    legacyMappingId: integer("legacy_mapping_id"),
    legacyClassId: integer("legacy_class_id"),
    legacyCourseId: integer("legacy_course_id"),
    legacyWasActive: boolean("legacy_was_active"),
    startedAt: timestamp("started_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    endedAt: timestamp("ended_at", {
      withTimezone: true,
    }),
    // Legacy start/end dates are dates, not instant timestamps.
    startDate: date("start_date", { mode: "string" }),
    endDate: date("end_date", { mode: "string" }),
    version: bigint("version", { mode: "number" }).notNull().default(0),
    // Historical denormalized year/semester are provenance, not auth scope.
    legacyAcademicYear: varchar("legacy_academic_year", { length: 16 }),
    legacySemesterNumber: integer("legacy_semester_number"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
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
    index("course_teaching_assignments_legacy_mapping_idx")
      .on(table.deliveryId,table.legacyMappingId)
      .where(sql`${table.legacyMappingId} is not null`),
    index("course_teaching_assignments_membership_dates_idx")
      .on(table.membershipId, table.startDate, table.endDate),
    check("course_teaching_assignments_date_order_ck",
      sql`${table.startDate} is null or ${table.endDate} is null or ${table.endDate} >= ${table.startDate}`),
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
    // status maps old active; visibleToStudents maps enabled.
    // The old is_deleted state is independent of both.
    visibleToStudents: boolean("visible_to_students").notNull().default(true),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    version: bigint("version", { mode: "number" }).notNull().default(0),
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
    index("course_lessons_live_learner_idx")
      .on(table.learningPathId, table.sequence)
      .where(sql`${table.status} = 'ACTIVE' and ${table.visibleToStudents} = true and ${table.deletedAt} is null`),
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
    // Historical JSON/HTML/material arrays remain intact for importer review.
    // Runtime normalized URL/storage/notes fields retain priority.
    legacyContentData: jsonb("legacy_content_data").$type<Record<string, unknown>>(),
    legacyContentType: varchar("legacy_content_type", { length: 80 }),
    // Legacy faculty attribution is separate from the authenticated creator.
    legacyFacultyMembershipId: uuid("legacy_faculty_membership_id")
      .references(() => collegeMemberships.id, { onDelete: "restrict" }),
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
    // DRAFT remains unexposed regardless of these legacy visibility snapshots.
    visibleToStudents: boolean("visible_to_students").notNull().default(true),
    legacyActive: boolean("legacy_active"),
    deletedWithLesson: boolean("deleted_with_lesson").notNull().default(false),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    // Legacy India wall-clock LocalDateTime; never reinterpret as UTC.
    deadlineLocal: timestamp("deadline_local", { withTimezone: false }),
    version: bigint("version", { mode: "number" }).notNull().default(0),
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
    // Preserve recorded duration when lesson-content media is unavailable.
    durationSeconds: integer("duration_seconds").notNull().default(0),
    completedAt: timestamp("completed_at", {
      withTimezone: true,
    }),
    // Legacy fidelity (migration 0098).
    firstCompletedAt: timestamp("first_completed_at", {
      withTimezone: true,
    }),
    attempt: integer("attempt").notNull().default(1),
    legacyProgressId: integer("legacy_progress_id"),
    legacyWasDeleted: boolean("legacy_was_deleted"),
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
      "learner_content_progress_membership_content_attempt_uq",
    ).on(
      table.membershipId,
      table.lessonContentId,
      table.attempt,
    ),
    index(
      "learner_content_progress_membership_idx",
    ).on(table.membershipId),
    // Readers must request latest attempt explicitly before 0203 registration.
    index("learner_content_progress_latest_attempt_idx")
      .on(table.membershipId, table.lessonContentId, sql`${table.attempt} DESC`),
    index("learner_content_progress_active_latest_idx")
      .on(table.membershipId,table.lessonContentId,sql`${table.attempt} DESC`)
      .where(sql`${table.legacyWasDeleted} is null or ${table.legacyWasDeleted} = false`),
    index(
      "learner_content_progress_content_idx",
    ).on(table.lessonContentId),
    check(
      "learner_content_progress_position_ck",
      sql`${table.lastPositionSeconds} >= 0`,
    ),
    check("learner_content_progress_duration_ck",
      sql`${table.durationSeconds} >= 0`),
    check(
      "learner_content_progress_attempt_ck",
      sql`${table.attempt} >= 1`,
    ),
  ],
);
