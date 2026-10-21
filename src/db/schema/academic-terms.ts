import { sql } from "drizzle-orm";
import { check, index, integer, jsonb, pgTable, text, timestamp, unique, uuid, boolean, varchar } from "drizzle-orm/pg-core";
import { programs } from "./academics";
import { courses } from "./courses";
import { courseOfferingTypeEnum } from "./enums";

/** Registered DB-005 curriculum parents. Cohort promotion/offering links remain a later DB02 slice. */
export const programTerms = pgTable("program_terms", {
  id: uuid("id").defaultRandom().primaryKey(),
  programId: uuid("program_id").notNull().references(() => programs.id, { onDelete: "restrict" }),
  termNumber: integer("term_number").notNull(),
  name: text("name").notNull(),
  /** Imported semester and program structure records have separate numeric source IDs. */
  legacySemesterId: integer("legacy_semester_id"),
  legacyStructureId: integer("legacy_structure_id"),
  /** Historical COMPLETED must never be collapsed into the mutable isActive flag. */
  legacyStructureStatus: varchar("legacy_structure_status", { length: 16 }),
  legacyStartDate: varchar("legacy_start_date", { length: 255 }),
  legacyEndDate: varchar("legacy_end_date", { length: 255 }),
  legacyCourseIds: jsonb("legacy_course_ids").$type<unknown>(),
  legacyWasDeleted: boolean("legacy_was_deleted"),
  isActive: boolean("is_active").notNull().default(true),
  totalCredits: integer("total_credits"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  unique("program_terms_program_number_uq").on(table.programId, table.termNumber),
  index("program_terms_program_active_idx").on(table.programId, table.isActive, table.termNumber),
  check("program_terms_term_number_ck", sql`${table.termNumber} >= 1`),
  check("program_terms_name_ck", sql`btrim(${table.name}) <> ''`),
  check("program_terms_legacy_structure_status_ck",
    sql`${table.legacyStructureStatus} is null or ${table.legacyStructureStatus} in ('ACTIVE', 'INACTIVE', 'COMPLETED')`),
  index("program_terms_legacy_structure_idx").on(table.programId, table.legacyStructureId)
    .where(sql`${table.legacyStructureId} is not null`),
  index("program_terms_legacy_semester_idx").on(table.programId, table.legacySemesterId)
    .where(sql`${table.legacySemesterId} is not null`),
  check("program_terms_total_credits_ck", sql`${table.totalCredits} is null or ${table.totalCredits} >= 0`),
]);

export const programTermCourses = pgTable("program_term_courses", {
  id: uuid("id").defaultRandom().primaryKey(),
  programTermId: uuid("program_term_id").notNull().references(() => programTerms.id, { onDelete: "restrict" }),
  courseId: uuid("course_id").notNull().references(() => courses.id, { onDelete: "restrict" }),
  type: courseOfferingTypeEnum("type").notNull().default("CORE"),
  /** Legacy nullable mandatory flag is not identical to CORE/ELECTIVE. */
  legacySemesterCourseId: integer("legacy_semester_course_id"),
  legacyIsMandatory: boolean("legacy_is_mandatory"),
  legacyCourseOrder: integer("legacy_course_order"),
  legacyWasDeleted: boolean("legacy_was_deleted"),
  credits: integer("credits").default(3),
  displayOrder: integer("display_order").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  unique("program_term_courses_term_course_uq").on(table.programTermId, table.courseId),
  index("program_term_courses_course_idx").on(table.courseId, table.programTermId),
  index("program_term_courses_legacy_source_idx").on(table.programTermId, table.legacySemesterCourseId)
    .where(sql`${table.legacySemesterCourseId} is not null`),
  check("program_term_courses_credits_ck", sql`${table.credits} is null or ${table.credits} between 0 and 30`),
  check("program_term_courses_display_order_ck", sql`${table.displayOrder} >= 1`),
]);
