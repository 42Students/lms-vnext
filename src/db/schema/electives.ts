import { sql } from "drizzle-orm";
import { check, foreignKey, index, integer, bigint, pgTable, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { colleges } from "./colleges";
import { academicPeriods, groupBackedClassOfferings, programs } from "./academics";
import { courses, courseSectionDeliveries } from "./courses";
import { lmsGroups } from "./groups";
export const electiveSlots = pgTable("elective_slots", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  legacySlotId:integer("legacy_slot_id"),
  legacyProgramId:integer("legacy_program_id"),
  legacyRevision:bigint("legacy_revision",{mode:"bigint"}),
  legacyCreatedAtLocal:varchar("legacy_created_at_local",{length:36}),
  collegeId: uuid("college_id").notNull().references(() => colleges.id, { onDelete: "restrict" }),
  programId: uuid("program_id").notNull().references(() => programs.id, { onDelete: "restrict" }),
  academicPeriodId: uuid("academic_period_id").references(() => academicPeriods.id, { onDelete: "restrict" }),
  semesterNumber: integer("semester_number").notNull(),
  academicYear: varchar("academic_year", { length: 20 }),
  name: varchar("name", { length: 150 }).notNull(),
  description: varchar("description", { length: 1000 }),
  credits: integer("credits").default(3).notNull(),
  minPick: integer("min_pick").default(1).notNull(),
  maxPick: integer("max_pick").default(1).notNull(),
  status: varchar("status", { length: 20 }).default('ACTIVE').notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  version: integer("version").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, t => [
  uniqueIndex("elective_slots_legacy_id_uq").on(t.legacySlotId)
    .where(sql`${t.legacySlotId} is not null`),
  index("elective_slots_college_program_term_idx").on(t.collegeId, t.programId, t.semesterNumber),
  index("elective_slots_period_status_idx").on(t.academicPeriodId, t.status),
  check("elective_slots_semester_ck", sql.raw("\"semester_number\" BETWEEN 1 AND 12")),
  check("elective_slots_picks_ck", sql.raw("\"credits\" BETWEEN 0 AND 30 AND \"min_pick\" >= 0 AND \"max_pick\" >= 1 AND \"min_pick\" <= \"max_pick\"")),
  check("elective_slots_status_ck", sql.raw("\"status\" IN ('ACTIVE','ARCHIVED')")),
  check("elective_slots_name_ck", sql.raw("length(trim(\"name\")) > 0")),
  check("elective_slots_version_ck", sql.raw("\"version\" >= 0")),
]);

export const electiveOfferings = pgTable("elective_offerings", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  legacyOfferingId:integer("legacy_offering_id"),
  legacyClassId:integer("legacy_class_id"),
  legacyCourseId:integer("legacy_course_id"),
  legacyRevision:bigint("legacy_revision",{mode:"bigint"}),
  slotId: uuid("slot_id").notNull().references(() => electiveSlots.id, { onDelete: "restrict" }),
  courseId: uuid("course_id").notNull().references(() => courses.id, { onDelete: "restrict" }),
  groupId: uuid("group_id").notNull().references(() => lmsGroups.id, { onDelete: "restrict" }),
  backedDeliveryId: uuid("backed_delivery_id").notNull().references(() => courseSectionDeliveries.id, { onDelete: "restrict" }),
  /** Distinct legacy GROUP_BACKED class identity; nullable until attendance/grade services bind it. */
  backedClassOfferingId: uuid("backed_class_offering_id").references(() => groupBackedClassOfferings.id, { onDelete: "restrict" }),
  capacity: integer("capacity"),
  status: varchar("status", { length: 20 }).default('ACTIVE').notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  version: integer("version").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, t => [
  uniqueIndex("elective_offerings_legacy_id_uq").on(t.legacyOfferingId)
    .where(sql`${t.legacyOfferingId} is not null`),
  index("elective_offerings_legacy_class_idx").on(t.legacyClassId)
    .where(sql`${t.legacyClassId} is not null`),
  uniqueIndex("elective_offerings_group_uq").on(t.groupId),
  uniqueIndex("elective_offerings_delivery_uq").on(t.backedDeliveryId),
  uniqueIndex("elective_offerings_backed_class_uq").on(t.backedClassOfferingId).where(sql`${t.backedClassOfferingId} is not null`),
  foreignKey({
    name: "elective_offerings_backed_class_group_fk",
    columns: [t.backedClassOfferingId, t.groupId],
    foreignColumns: [groupBackedClassOfferings.id, groupBackedClassOfferings.rosterGroupId],
  }).onDelete("restrict"),
  uniqueIndex("elective_offerings_slot_active_course_uq").on(t.slotId, t.courseId).where(sql.raw("\"status\" = 'ACTIVE' AND \"deleted_at\" IS NULL")),
  index("elective_offerings_slot_status_idx").on(t.slotId, t.status),
  index("elective_offerings_course_idx").on(t.courseId),
  check("elective_offerings_capacity_ck", sql.raw("\"capacity\" IS NULL OR \"capacity\" > 0")),
  check("elective_offerings_status_ck", sql.raw("\"status\" IN ('ACTIVE','ARCHIVED')")),
  check("elective_offerings_version_ck", sql.raw("\"version\" >= 0")),
]);
