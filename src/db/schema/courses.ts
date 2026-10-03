import { sql } from "drizzle-orm";
import {
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
  sections,
} from "./academics";
import { departments } from "./departments";
import { collegeMemberships } from "./memberships";
import {
  courseOfferingStatusEnum,
  courseOfferingTypeEnum,
  courseStatusEnum,
  courseTeachingRoleEnum,
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
