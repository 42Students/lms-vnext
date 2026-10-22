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
  legacyNameWasNull: boolean("legacy_name_was_null"),
  legacyOriginalCapacity: integer("legacy_original_capacity"),
  legacyOriginalRoomType: varchar("legacy_original_room_type",{length:80}),
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
  index("lecture_halls_active_college_idx").on(t.collegeId,t.status,t.name),
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

/** The legacy room table used college/department integer IDs and a room-type
 * ordinal. This mapper deliberately requires the verified tenant crosswalk;
 * historical deleted rows remain archived, not silently resurrected. */
const LEGACY_ROOM_TYPES=[
  "CLASSROOM","LECTURE_HALL","LAB","SEMINAR_HALL","AUDITORIUM","CONFERENCE_ROOM",
] as const;
export function planLegacyLectureHallImport(input:{
  legacyId:number;legacyCollegeId:number;legacyDepartmentId:number|null;
  legacyRoomTypeOrdinal:number;name:string|null;capacity:number;
  isDeleted:boolean;createdAtLocal:string;updatedAtLocal:string;
},mapping:{collegeId:string;legacyCollegeId:number;
  departmentByLegacyId:ReadonlyMap<number,string>},
){
  if(!Number.isSafeInteger(input.legacyId)||input.legacyId<=0||
    input.legacyCollegeId!==mapping.legacyCollegeId)
    throw new Error("Historic room identity is not mapped to this college");
  const roomType=LEGACY_ROOM_TYPES[input.legacyRoomTypeOrdinal];
  if(!roomType)throw new Error("Historic room type requires review");
  // Legacy dept_id=0 denotes a room without a department. Never crosswalk zero.
  const departmentId=(input.legacyDepartmentId===null||input.legacyDepartmentId===0)?null:
    mapping.departmentByLegacyId.get(input.legacyDepartmentId);
  if(input.legacyDepartmentId!==null&&input.legacyDepartmentId!==0&&!departmentId)
    throw new Error("Historic room department needs a college-scoped mapping");
  if(!input.name?.trim()||!Number.isSafeInteger(input.capacity)||
    input.capacity<1||input.capacity>5000)
    throw new Error("Historic room name/capacity requires review");
  // LocalDateTime is source-local, not UTC. These strings are retained as
  // provenance until an importer converts both using the verified college zone.
  const civil=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,6})?)?$/;
  if(!civil.test(input.createdAtLocal)||!civil.test(input.updatedAtLocal))
    throw new Error("Legacy room timestamps need timezone review");
  return {collegeId:mapping.collegeId,departmentId:departmentId??null,
    name:input.name.trim(),capacity:input.capacity,roomType,
    status:input.isDeleted?"ARCHIVED" as const:"ACTIVE" as const,
    legacyLectureHallId:input.legacyId,legacyCollegeId:input.legacyCollegeId,
    legacyDepartmentId:input.legacyDepartmentId,
    legacyRoomTypeOrdinal:input.legacyRoomTypeOrdinal,
    legacyWasDeleted:input.isDeleted,
    sourceCreatedAtLocal:input.createdAtLocal,
    sourceUpdatedAtLocal:input.updatedAtLocal};
}
