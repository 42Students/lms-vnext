import { sql } from "drizzle-orm";
import {
  boolean,
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
import { lectureHalls } from "./lecture-halls";
import { departments } from "./departments";
import { collegeMemberships } from "./memberships";
import { lmsGroups } from "./groups";
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
    legacyProgramId: integer("legacy_program_id"),
    legacyDurationYears: integer("legacy_duration_years"),
    legacyWasDeleted: boolean("legacy_was_deleted"),
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
    uniqueIndex("programs_legacy_id_uq").on(table.legacyProgramId)
      .where(sql`${table.legacyProgramId} is not null`),
    check("programs_legacy_deleted_ck",sql`${table.legacyWasDeleted} is distinct from true or ${table.status} <> 'ACTIVE'`),
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
    legacyAcademicYearName: varchar("legacy_academic_year_name",{length:32}),
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
    legacyBatchId: integer("legacy_batch_id"),
    legacyAcademicYearRaw: varchar("legacy_academic_year_raw",{length:32}),
    legacyWasDeleted: boolean("legacy_was_deleted"),
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
    academicYear: varchar("academic_year", { length: 16 }),
    startDate: date("start_date", { mode: "string" }),
    endDate: date("end_date", { mode: "string" }),
    inactiveAt: timestamp("inactive_at", { withTimezone: true }),
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
    uniqueIndex("cohorts_legacy_batch_id_uq").on(table.legacyBatchId)
      .where(sql`${table.legacyBatchId} is not null`),
    check("cohorts_legacy_deleted_ck",sql`${table.legacyWasDeleted} is distinct from true or ${table.status} = 'ARCHIVED'`),
    check(
      "cohorts_legacy_date_order_ck",
      sql`${table.startDate} is null or ${table.endDate} is null or ${table.endDate} >= ${table.startDate}`,
    ),
    uniqueIndex("cohorts_program_code_uq").on(
      table.programId,
      sql`lower(${table.code})`,
    ),
    /** Legacy batch identity used case-insensitive name under one program. */
    uniqueIndex("cohorts_program_active_name_uq")
      .on(table.programId, sql`lower(${table.name})`)
      .where(sql`${table.status} <> 'ARCHIVED'`),
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
    legacyClassId: integer("legacy_class_id"),
    legacyWasDeleted: boolean("legacy_was_deleted"),
    legacyStartsAt: timestamp("legacy_starts_at",{withTimezone:true}),
    legacyEndsAt: timestamp("legacy_ends_at",{withTimezone:true}),
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
    // Legacy class fidelity (migration 0098): capacity floor and description.
    minSize: integer("min_size"),
    /** Registered DB02 fields distinct from old starts_on/min_size columns. */
    minimumCapacity: integer("minimum_capacity").notNull().default(0),
    startDate: date("start_date", { mode: "string" }),
    endDate: date("end_date", { mode: "string" }),
    description: text("description"),
    /** Optional legacy class-specific bounds; otherwise use academic period. */
    startsOn: date("starts_on", { mode: "string" }),
    endsOn: date("ends_on", { mode: "string" }),
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
    uniqueIndex("sections_legacy_class_id_uq").on(table.legacyClassId)
      .where(sql`${table.legacyClassId} is not null`),
    check("sections_legacy_deleted_ck",sql`${table.legacyWasDeleted} is distinct from true or ${table.status} <> 'ACTIVE'`),
    check("sections_legacy_time_order_ck",sql`${table.legacyStartsAt} is null or ${table.legacyEndsAt} is null or ${table.legacyEndsAt} >= ${table.legacyStartsAt}`),
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
      "sections_date_pair_ck",
      sql`(${table.startsOn} is null and ${table.endsOn} is null)
        or (${table.startsOn} is not null and ${table.endsOn} is not null and ${table.endsOn} >= ${table.startsOn})`,
    ),
    check(
      "sections_capacity_ck",
      sql`${table.capacity} is null or ${table.capacity} > 0`,
    ),
    check(
      "sections_min_size_ck",
      sql`${table.minSize} is null or (${table.minSize} >= 0 and (${table.capacity} is null or ${table.minSize} <= ${table.capacity}))`,
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

/**
 * Legacy GROUP_BACKED class offering is not a synthetic academic section.
 * Audience comes from ACTIVE lms_group_members, not section_enrollments.
 */
export const groupBackedClassOfferings = pgTable(
  "group_backed_class_offerings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    legacyClassId: integer("legacy_class_id"),
    legacyWasDeleted: boolean("legacy_was_deleted"),
    academicPeriodId: uuid("academic_period_id").notNull().references(
      () => academicPeriods.id, { onDelete: "restrict" },
    ),
    rosterGroupId: uuid("roster_group_id").notNull().references(
      () => lmsGroups.id, { onDelete: "restrict" },
    ),
    name: text("name").notNull(),
    description: text("description"),
    startsOn: date("starts_on", { mode: "string" }),
    endsOn: date("ends_on", { mode: "string" }),
    status: varchar("status", { length: 16 }).notNull().default("ACTIVE"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("group_backed_offerings_legacy_class_id_uq").on(t.legacyClassId)
      .where(sql`${t.legacyClassId} is not null`),
    check("group_backed_offerings_legacy_deleted_ck",sql`${t.legacyWasDeleted} is distinct from true or ${t.status} = 'ARCHIVED'`),
    uniqueIndex("group_backed_offerings_period_group_uq").on(
      t.academicPeriodId, t.rosterGroupId,
    ).where(sql`${t.status} = 'ACTIVE'`),
    // Composite target for elective group-backed class identity; no cross-roster attachment.
    uniqueIndex("group_backed_offerings_id_group_uq").on(t.id, t.rosterGroupId),
    index("group_backed_offerings_group_status_idx").on(t.rosterGroupId, t.status),
    check("group_backed_offerings_status_ck", sql`${t.status} in ('ACTIVE', 'ARCHIVED')`),
    check("group_backed_offerings_name_ck", sql`length(trim(${t.name})) > 0`),
    check(
      "group_backed_offerings_date_ck",
      sql`(${t.startsOn} is null and ${t.endsOn} is null)
        or (${t.startsOn} is not null and ${t.endsOn} is not null and ${t.endsOn} >= ${t.startsOn})`,
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
    legacyAssignmentId: integer("legacy_assignment_id"),
    legacyCourseId: integer("legacy_course_id"),
    legacyDeactivatedAt: timestamp("legacy_deactivated_at",{withTimezone:true}),
    legacyWasDeleted: boolean("legacy_was_deleted"),
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
    uniqueIndex("section_faculty_assignments_legacy_id_uq").on(table.legacyAssignmentId)
      .where(sql`${table.legacyAssignmentId} is not null`),
    check("section_faculty_legacy_ended_ck",sql`${table.legacyWasDeleted} is distinct from true or ${table.endedAt} is not null`),
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
    legacyScheduleId: integer("legacy_schedule_id"),
    legacyCourseSlug: varchar("legacy_course_slug",{length:120}),
    legacyRoomNumber: varchar("legacy_room_number",{length:160}),
    legacyCancelledAt: timestamp("legacy_cancelled_at",{withTimezone:true}),
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
    lectureHallId: uuid("lecture_hall_id").references(() => lectureHalls.id, { onDelete: "restrict" }),
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
    uniqueIndex("section_schedule_events_legacy_id_uq").on(table.legacyScheduleId)
      .where(sql`${table.legacyScheduleId} is not null`),
    index("section_schedule_events_hall_time_idx").on(table.lectureHallId, table.startsAt, table.endsAt)
      .where(sql`${table.lectureHallId} is not null and ${table.status} = 'SCHEDULED'`),
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

/** Old _Class fields map into two distinct vNext classroom representations.
 * A GROUP_BACKED class uses active LMS group membership, never fabricated
 * section_enrollments. Archived classes are not reused in active audiences. */
export const LEGACY_CLASS_COLUMN_MAP={
 id:"sections.legacy_class_id | group_backed_class_offerings.legacy_class_id",
 name:"sections.name | group_backed_class_offerings.name",
 description:"sections.description | group_backed_class_offerings.description",
 startDate:"starts_on with academic_periods.start_date fallback",
 endDate:"ends_on with academic_periods.end_date fallback",
 upperBound:"sections.capacity",lowerBound:"sections.min_size",
 classType:"SECTION | GROUP_BACKED",
 rosterGroup:"group_backed_class_offerings.roster_group_id",
} as const;

/** Class dates take precedence; missing bounds inherit the scoped period's
 * civil date strings without a browser-timezone conversion. */
export function effectiveAcademicClassDates(input:{
 startsOn:string|null;endsOn:string|null;
 periodStartsOn:string;periodEndsOn:string;
}):{startDate:string;endDate:string}{
 return {startDate:input.startsOn??input.periodStartsOn,
  endDate:input.endsOn??input.periodEndsOn};
}

/** The old class_schedule row was not an enrolment or course-section record.
 * Resolve every old numeric ID against the selected college before insertion:
 * ClassSchedule.classId → sections.id (or GROUP_BACKED offering with active
 * LMS group roster); courseId → course_section_deliveries.id through an
 * authorized course/section pairing; facultyId → active faculty membership;
 * lectureHallId → same-college lecture_halls.id. Its transient courseSlug is
 * display provenance, never a cross-tenant access key. MarkedAt belongs in
 * attendance_sessions; old deleted=true cancels the schedule event. */
export const LEGACY_CLASS_SCHEDULE_FIELD_MAP={
 id:"section_schedule_events.legacy_schedule_id",
 classId:"section_schedule_events.section_id or group-backed delivery crosswalk",
 courseId:"section_schedule_event_courses.course_section_delivery_id",
 courseSlug:"section_schedule_events.legacy_course_slug",
 facultyId:"section_schedule_events.faculty_membership_id",
 lectureHallId:"section_schedule_events.lecture_hall_id",
 title:"section_schedule_events.title",
 startTime:"section_schedule_events.starts_at",
 endTime:"section_schedule_events.ends_at",
 markedAt:"attendance_sessions.marked_at",
 isDeleted:"section_schedule_events.status=CANCELLED",
 createdAt:"section_schedule_events.created_at",
 updatedAt:"section_schedule_events.updated_at",
} as const;

/** Strictly parse unzoned historical MySQL ClassSchedule wall-clock instants
 * as Asia/Kolkata time. Explicit offset/Z instants retain their own zone.
 * Reject rollover dates and missing seconds, never rely on the server locale. */
export function parseLegacyClassScheduleInstant(raw:string):Date{
 const value=raw.trim().replace(" ","T");
 const plain=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;
 const absolute=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/;
 if(!plain.test(value)&&!absolute.test(value))
  throw new Error("Legacy class schedule time needs documented timezone");
 const instant=new Date(plain.test(value)?value+"+05:30":value);
 if(!Number.isFinite(instant.getTime()))
  throw new Error("Invalid class schedule time");
 if(plain.test(value)){
  const recovered=new Date(instant.getTime()+330*60_000).toISOString().slice(0,19);
  if(recovered!==value)throw new Error("Invalid legacy civil date/time");
 }
 return instant;
}
/** Half-open interval overlap: touching endpoints are not a conflict. Caller
 * must lock college schedule changes under pg_advisory_xact_lock or use a DB
 * exclusion constraint before writing; this predicate alone is not race-safe. */
export function legacySchedulesOverlap(
 left:{startsAt:Date;endsAt:Date},right:{startsAt:Date;endsAt:Date},
):boolean{
 return left.startsAt.getTime()<right.endsAt.getTime()&&
  right.startsAt.getTime()<left.endsAt.getTime();
}

/** Legacy NewProgram stored only (int ID, title, int dept ID, years).
 * Program codes are mandatory in vNext, so generate a stable per-source code
 * that cannot collide with another program in the verified department.
 * The importer must reject orphan departments, preserve the old created/
 * updated chronology and convert is_deleted=true to ARCHIVED. */
export const LEGACY_NEW_PROGRAM_FIELD_MAP={
 id:"programs.legacy_program_id",
 name:"programs.name",
 dept_id:"programs.department_id (verified same-college UUID crosswalk)",
 duration_years:"programs.legacy_duration_years and duration_terms=years*2",
 created_at:"programs.created_at (source zone review)",
 updated_at:"programs.updated_at (source zone review)",
 is_deleted:"programs.status=ARCHIVED and legacy_was_deleted",
} as const;
export function legacyNewProgramImport(input:{
 legacyId:number;name:string;durationYears:number;departmentId:string;
 legacyWasDeleted:boolean;existingCodes:readonly string[];
}){
 if(!Number.isSafeInteger(input.legacyId)||input.legacyId<=0)
  throw new Error("Unmapped historical program identity");
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.departmentId))
  throw new Error("Program department must resolve to a scoped UUID");
 const name=input.name.trim().replace(/\s+/g," ");
 if(name.length<2||name.length>200)
  throw new Error("Historic program name needs review");
 if(!Number.isSafeInteger(input.durationYears)||input.durationYears<1||input.durationYears>10)
  throw new Error("Historic program duration needs review");
 const prefix=name.normalize("NFKD").replace(/[\u0300-\u036f]/g,"")
  .toUpperCase().replace(/[^A-Z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,32);
 const code=(prefix||"PROGRAM")+"-"+input.legacyId;
 if(input.existingCodes.some(value=>value.toUpperCase()===code))
  throw new Error("Program code conflict; import requires explicit review");
 return {legacyProgramId:input.legacyId,name,departmentId:input.departmentId,
  legacyDurationYears:input.durationYears,durationTerms:input.durationYears*2,
  code,status:input.legacyWasDeleted?"ARCHIVED" as const:"ACTIVE" as const,
  legacyWasDeleted:input.legacyWasDeleted};
}

/** Mapping old semester_number/academic_year into the new period + program
 * term model. An academic year is a named civil interval and cannot be
 * derived by dividing an ordinal without an approved program curriculum. */
export function legacyProgramSemesterImport(input:{
 sourceSemesterId:number;semesterNumber:number;sourceAcademicYear:string;
 programId:string;collegeId:string;academicPeriodId:string;
 active:boolean;totalCredits:number|null;title:string|null;
 approvedTermNumbers:ReadonlyMap<number,number>;
}){
 const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
 if(!Number.isSafeInteger(input.sourceSemesterId)||input.sourceSemesterId<1||
  !Number.isSafeInteger(input.semesterNumber)||input.semesterNumber<1||
  !uuid.test(input.programId)||!uuid.test(input.collegeId)||
  !uuid.test(input.academicPeriodId)||input.sourceAcademicYear.length>32||
  input.totalCredits!==null&&(!Number.isFinite(input.totalCredits)||input.totalCredits<0))
  throw new Error("Unverified legacy semester mapping");
 const termNumber=input.approvedTermNumbers.get(input.semesterNumber);
 if(!termNumber||!Number.isSafeInteger(termNumber)||termNumber<1)
  throw new Error("Semester requires program-specific approved term mapping");
 return {legacySemesterId:input.sourceSemesterId,
  programId:input.programId,collegeId:input.collegeId,
  academicPeriodId:input.academicPeriodId,termNumber,
  semesterNumber:input.semesterNumber,
  academicYearName:input.sourceAcademicYear.trim(),
  name:input.title?.trim()||"Semester "+input.semesterNumber,
  credits:input.totalCredits,status:input.active?"ACTIVE" as const:"PLANNED" as const,
  autoActivate:false as const};
}
