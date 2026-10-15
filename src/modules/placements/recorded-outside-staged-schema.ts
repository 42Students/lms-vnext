/** STAGED ONLY. External drive records are not published platform jobs. */
import {pgTable,uuid,text,varchar,timestamp,index,foreignKey} from "drizzle-orm/pg-core";
import {colleges} from "@/db/schema/colleges";
import {users} from "@/db/schema/users";
import {placementCompanyRelationships} from "@/db/schema/placements";
export const placementOutsideDriveRecords=pgTable("placement_outside_drive_records",{
 id:uuid("id").defaultRandom().primaryKey(),
 collegeId:uuid("college_id").notNull().references(()=>colleges.id),
 companyRelationshipId:uuid("company_relationship_id").notNull().references(()=>placementCompanyRelationships.id),
 title:varchar("title",{length:200}).notNull(),
 externalReferenceUrl:text("external_reference_url"),
 occurredAt:timestamp("occurred_at",{withTimezone:true}).notNull(),
 notes:text("notes"),
 recordedByUserId:uuid("recorded_by_user_id").notNull().references(()=>users.id),
 recordedByRole:varchar("recorded_by_role",{length:16}).notNull(),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[
 index("outside_drives_college_date_idx").on(t.collegeId,t.occurredAt),
 foreignKey({columns:[t.companyRelationshipId,t.collegeId],
  foreignColumns:[placementCompanyRelationships.id,placementCompanyRelationships.collegeId],
  name:"outside_drives_relationship_college_fk"}),
]);
