import { sql } from "drizzle-orm";
import { check, index, integer, pgTable, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { colleges } from "./colleges";
import { departments } from "./departments";

export const lectureHalls = pgTable("lecture_halls", {
  id: uuid("id").defaultRandom().primaryKey(),
  collegeId: uuid("college_id").notNull().references(() => colleges.id, { onDelete: "restrict" }),
  departmentId: uuid("department_id").references(() => departments.id, { onDelete: "restrict" }),
  name: varchar("name", { length: 255 }).notNull(),
  capacity: integer("capacity").notNull(),
  description: varchar("description", { length: 255 }),
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
  check("lecture_halls_status_ck", sql`${t.status} in ('ACTIVE','ARCHIVED')`),
]);
