import { sql } from "drizzle-orm";
import { boolean, check, index, integer, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { colleges } from "./colleges";
import { departments } from "./departments";

export const lectureHalls = pgTable("lecture_halls", {
  id: uuid("id").defaultRandom().primaryKey(),
  legacyLectureHallId: integer("legacy_lecture_hall_id"),
  legacyCollegeId: integer("legacy_college_id"),
  legacyDepartmentId: integer("legacy_department_id"),
  legacyRoomTypeOrdinal: integer("legacy_room_type_ordinal"),
  legacyWasDeleted: boolean("legacy_was_deleted"),
  collegeId: uuid("college_id").notNull().references(() => colleges.id, { onDelete: "restrict" }),
  departmentId: uuid("department_id").references(() => departments.id, { onDelete: "restrict" }),
  name: varchar("name", { length: 255 }).notNull(),
  capacity: integer("capacity").notNull(),
  description: text("description"),
  roomType: varchar("room_type", { length: 64 }).notNull(),
  status: varchar("status", { length: 32 }).notNull().default("ACTIVE"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [
  uniqueIndex("lecture_halls_active_college_name_uq").on(t.collegeId, sql`lower(${t.name})`).where(sql`${t.status} = 'ACTIVE'`),
  index("lecture_halls_department_idx").on(t.departmentId, t.status),
  check("lecture_halls_name_ck", sql`btrim(${t.name}) <> ''`),
  check("lecture_halls_capacity_ck", sql`${t.capacity} between 1 and 5000`),
  check("lecture_halls_room_type_ck", sql`${t.roomType} in ('CLASSROOM','LECTURE_HALL','LAB','SEMINAR_HALL','AUDITORIUM','CONFERENCE_ROOM')`),
  index("lecture_halls_legacy_source_idx").on(t.collegeId, t.legacyLectureHallId)
    .where(sql`${t.legacyLectureHallId} is not null`),
  check("lecture_halls_legacy_room_type_ordinal_ck",
    sql`${t.legacyRoomTypeOrdinal} is null or ${t.legacyRoomTypeOrdinal} between 0 and 5`),
  check("lecture_halls_status_ck", sql`${t.status} in ('ACTIVE','ARCHIVED')`),
]);
