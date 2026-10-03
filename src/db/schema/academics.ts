import { sql } from "drizzle-orm";
import {
  check,
  date,
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
import { departments } from "./departments";
import { collegeMemberships } from "./memberships";
import {
  academicPeriodStatusEnum,
  cohortStatusEnum,
  learnerProgramEnrollmentStatusEnum,
  programStatusEnum,
  scheduleEventStatusEnum,
  sectionEnrollmentStatusEnum,
  sectionFacultyRoleEnum,
  sectionStatusEnum,
} from "./enums";

export const programs = pgTable(
  "programs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    departmentId: uuid("department_id")
      .notNull()
      .references(() => departments.id, {
        onDelete: "restrict",
      }),
    name: text("name").notNull(),
    code: varchar("code", { length: 64 }).notNull(),
    durationTerms: integer("duration_terms").notNull(),
    status: programStatusEnum("status")
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
    uniqueIndex("programs_active_department_name_uq")
      .on(
        table.departmentId,
        sql`lower(${table.name})`,
      )
      .where(sql`${table.status} = 'ACTIVE'`),
    uniqueIndex("programs_active_department_code_uq")
      .on(
        table.departmentId,
        sql`lower(${table.code})`,
      )
      .where(sql`${table.status} = 'ACTIVE'`),
    index("programs_department_status_idx").on(
      table.departmentId,
      table.status,
    ),
    check(
      "programs_duration_terms_ck",
      sql`${table.durationTerms} between 1 and 24`,
    ),
  ],
);

export const academicPeriods = pgTable(
  "academic_periods",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, {
        onDelete: "restrict",
      }),
    name: text("name").notNull(),
    code: varchar("code", { length: 64 }).notNull(),
    startDate: date("start_date", {
      mode: "string",
    }).notNull(),
    endDate: date("end_date", {
      mode: "string",
    }).notNull(),
    status: academicPeriodStatusEnum("status")
      .notNull()
      .default("PLANNED"),
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
    uniqueIndex("academic_periods_college_code_uq").on(
      table.collegeId,
      sql`lower(${table.code})`,
    ),
    index("academic_periods_college_status_idx").on(
      table.collegeId,
      table.status,
    ),
    check(
      "academic_periods_date_order_ck",
      sql`${table.endDate} >= ${table.startDate}`,
    ),
  ],
);

export const cohorts = pgTable(
  "cohorts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    programId: uuid("program_id")
      .notNull()
      .references(() => programs.id, {
        onDelete: "restrict",
      }),
    name: text("name").notNull(),
    code: varchar("code", { length: 64 }).notNull(),
    startPeriodId: uuid("start_period_id")
      .notNull()
      .references(() => academicPeriods.id, {
        onDelete: "restrict",
      }),
    expectedEndPeriodId: uuid(
      "expected_end_period_id",
    ).references(() => academicPeriods.id, {
      onDelete: "restrict",
    }),
    status: cohortStatusEnum("status")
      .notNull()
      .default("PLANNED"),
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
    uniqueIndex("cohorts_program_code_uq").on(
      table.programId,
      sql`lower(${table.code})`,
    ),
    index("cohorts_program_status_idx").on(
      table.programId,
      table.status,
    ),
    index("cohorts_start_period_idx").on(
      table.startPeriodId,
    ),
  ],
);

export const sections = pgTable(
  "sections",
  {
    id: uuid("id").defaultRandom().primaryKey(),
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
    name: text("name").notNull(),
    code: varchar("code", { length: 64 }).notNull(),
    capacity: integer("capacity"),
    status: sectionStatusEnum("status")
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
    uniqueIndex(
      "sections_active_cohort_period_name_uq",
    )
      .on(
        table.cohortId,
        table.academicPeriodId,
        sql`lower(${table.name})`,
      )
      .where(sql`${table.status} = 'ACTIVE'`),
    uniqueIndex(
      "sections_active_cohort_period_code_uq",
    )
      .on(
        table.cohortId,
        table.academicPeriodId,
        sql`lower(${table.code})`,
      )
      .where(sql`${table.status} = 'ACTIVE'`),
    index("sections_period_status_idx").on(
      table.academicPeriodId,
      table.status,
    ),
    index("sections_cohort_status_idx").on(
      table.cohortId,
      table.status,
    ),
    check(
      "sections_capacity_ck",
      sql`${table.capacity} is null or ${table.capacity} > 0`,
    ),
  ],
);

export const learnerProgramEnrollments = pgTable(
  "learner_program_enrollments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    membershipId: uuid("membership_id")
      .notNull()
      .references(() => collegeMemberships.id, {
        onDelete: "restrict",
      }),
    programId: uuid("program_id")
      .notNull()
      .references(() => programs.id, {
        onDelete: "restrict",
      }),
    cohortId: uuid("cohort_id")
      .notNull()
      .references(() => cohorts.id, {
        onDelete: "restrict",
      }),
    status: learnerProgramEnrollmentStatusEnum(
      "status",
    )
      .notNull()
      .default("ACTIVE"),
    admittedAt: timestamp("admitted_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    completedAt: timestamp("completed_at", {
      withTimezone: true,
    }),
    withdrawnAt: timestamp("withdrawn_at", {
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
    uniqueIndex(
      "learner_program_enrollments_membership_program_cohort_uq",
    ).on(
      table.membershipId,
      table.programId,
      table.cohortId,
    ),
    uniqueIndex(
      "learner_program_enrollments_active_membership_uq",
    )
      .on(table.membershipId)
      .where(sql`${table.status} = 'ACTIVE'`),
    index(
      "learner_program_enrollments_program_status_idx",
    ).on(table.programId, table.status),
    index(
      "learner_program_enrollments_cohort_status_idx",
    ).on(table.cohortId, table.status),
    check(
      "learner_program_enrollments_lifecycle_ck",
      sql`(${table.status} = 'ACTIVE' and ${table.completedAt} is null and ${table.withdrawnAt} is null)
          or (${table.status} = 'COMPLETED' and ${table.completedAt} is not null and ${table.withdrawnAt} is null)
          or (${table.status} = 'WITHDRAWN' and ${table.withdrawnAt} is not null and ${table.completedAt} is null)`,
    ),
  ],
);

export const sectionEnrollments = pgTable(
  "section_enrollments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    learnerEnrollmentId: uuid(
      "learner_enrollment_id",
    )
      .notNull()
      .references(() => learnerProgramEnrollments.id, {
        onDelete: "restrict",
      }),
    sectionId: uuid("section_id")
      .notNull()
      .references(() => sections.id, {
        onDelete: "restrict",
      }),
    academicPeriodId: uuid("academic_period_id")
      .notNull()
      .references(() => academicPeriods.id, {
        onDelete: "restrict",
      }),
    status: sectionEnrollmentStatusEnum("status")
      .notNull()
      .default("ACTIVE"),
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
    uniqueIndex(
      "section_enrollments_active_period_uq",
    )
      .on(
        table.learnerEnrollmentId,
        table.academicPeriodId,
      )
      .where(sql`${table.status} = 'ACTIVE'`),
    index("section_enrollments_section_status_idx").on(
      table.sectionId,
      table.status,
    ),
    index(
      "section_enrollments_learner_status_idx",
    ).on(
      table.learnerEnrollmentId,
      table.status,
    ),
    check(
      "section_enrollments_lifecycle_ck",
      sql`(${table.status} = 'ACTIVE' and ${table.endedAt} is null)
          or (${table.status} <> 'ACTIVE' and ${table.endedAt} is not null)`,
    ),
  ],
);

export const sectionFacultyAssignments = pgTable(
  "section_faculty_assignments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sectionId: uuid("section_id")
      .notNull()
      .references(() => sections.id, {
        onDelete: "restrict",
      }),
    membershipId: uuid("membership_id")
      .notNull()
      .references(() => collegeMemberships.id, {
        onDelete: "restrict",
      }),
    role: sectionFacultyRoleEnum("role").notNull(),
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
    uniqueIndex(
      "section_faculty_assignments_active_uq",
    )
      .on(
        table.sectionId,
        table.membershipId,
        table.role,
      )
      .where(sql`${table.endedAt} is null`),
    index(
      "section_faculty_assignments_membership_idx",
    ).on(table.membershipId),
  ],
);

export const sectionScheduleEvents = pgTable(
  "section_schedule_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sectionId: uuid("section_id")
      .notNull()
      .references(() => sections.id, {
        onDelete: "restrict",
      }),
    facultyMembershipId: uuid(
      "faculty_membership_id",
    ).references(() => collegeMemberships.id, {
      onDelete: "restrict",
    }),
    title: text("title").notNull(),
    description: text("description"),
    startsAt: timestamp("starts_at", {
      withTimezone: true,
    }).notNull(),
    endsAt: timestamp("ends_at", {
      withTimezone: true,
    }).notNull(),
    location: text("location"),
    status: scheduleEventStatusEnum("status")
      .notNull()
      .default("SCHEDULED"),
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
    index("section_schedule_events_section_time_idx").on(
      table.sectionId,
      table.startsAt,
    ),
    index(
      "section_schedule_events_faculty_time_idx",
    ).on(
      table.facultyMembershipId,
      table.startsAt,
    ),
    check(
      "section_schedule_events_time_order_ck",
      sql`${table.endsAt} > ${table.startsAt}`,
    ),
  ],
);
