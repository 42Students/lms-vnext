import {sql} from "drizzle-orm";
import {check,index,pgTable,text,timestamp,uniqueIndex,uuid,varchar,integer} from "drizzle-orm/pg-core";
import {courseAssignments} from "./assessments";
import {users} from "./users";
/** LEARNER-course-detail-03 / LEARNER-learning-misc-02.
 * Instructor-owned LINKs only; never represent an unscanned FILE as READY. */
export const courseAssignmentMaterials=pgTable("course_assignment_materials",{
 id:uuid("id").defaultRandom().primaryKey(),
 assignmentId:uuid("assignment_id").notNull().references(()=>courseAssignments.id,{onDelete:"restrict"}),
 kind:varchar("kind",{length:12}).notNull().default("LINK"),
 title:text("title").notNull(),
 externalUrl:text("external_url").notNull(),
 sequence:integer("sequence").notNull(),
 createdByUserId:uuid("created_by_user_id").notNull().references(()=>users.id,{onDelete:"restrict"}),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
},table=>[
 index("course_assignment_materials_parent_idx").on(table.assignmentId),
 uniqueIndex("course_assignment_materials_sequence_uq").on(table.assignmentId,table.sequence),
 check("course_assignment_materials_link_ck",sql`${table.kind}='LINK' and length(trim(${table.title})) between 1 and 160 and length(${table.externalUrl}) between 10 and 2048`),
 check("course_assignment_materials_sequence_ck",sql`${table.sequence} between 0 and 19`),
]);
