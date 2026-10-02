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
import {
  academicPeriodStatusEnum,
  cohortStatusEnum,
  programStatusEnum,
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
