/** External drive records: facts recorded by staff, not published platform jobs. */
import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  uniqueIndex,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { colleges } from "./colleges";
import { placementCompanyRelationships } from "./placements";
import { users } from "./users";
import {collegeMemberships} from "./college-memberships";

export const placementOutsideDriveRecords = pgTable(
  "placement_outside_drive_records",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    collegeId: uuid("college_id").notNull().references(() => colleges.id),
    companyRelationshipId: uuid("company_relationship_id")
      .notNull()
      .references(() => placementCompanyRelationships.id),
    title: varchar("title", { length: 200 }).notNull(),
    externalReferenceUrl: text("external_reference_url"),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    notes: text("notes"),
    recordedByUserId: uuid("recorded_by_user_id").notNull().references(() => users.id),
    recordedByRole: varchar("recorded_by_role", { length: 16 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("outside_drives_college_date_idx").on(t.collegeId, t.occurredAt),
    uniqueIndex("outside_drives_id_college_uq").on(t.id,t.collegeId),
    check("outside_drives_title_ck", sql`length(btrim(${t.title})) > 0`),
    check("outside_drives_role_ck", sql`${t.recordedByRole} in ('TPO','RECRUITER')`),
    foreignKey({
      columns: [t.companyRelationshipId, t.collegeId],
      foreignColumns: [placementCompanyRelationships.id, placementCompanyRelationships.collegeId],
      name: "outside_drives_relationship_college_fk",
    }),
  ],
);

/** TPO-drives-31 proposed registered outside-drive participant evidence. It is
 * NEVER an open placement application and does not trigger learner reminders. */
export const placementOutsideDriveParticipants=pgTable("placement_outside_drive_participants",{
 id:uuid("id").defaultRandom().primaryKey(),
 outsideDriveId:uuid("outside_drive_id").notNull().references(()=>placementOutsideDriveRecords.id,{onDelete:"restrict"}),
 collegeId:uuid("college_id").notNull().references(()=>colleges.id,{onDelete:"restrict"}),
 membershipId:uuid("membership_id").notNull().references(()=>collegeMemberships.id,{onDelete:"restrict"}),
 result:varchar("result",{length:20}).notNull().default("PARTICIPATED"),
 updatedByUserId:uuid("updated_by_user_id").notNull().references(()=>users.id,{onDelete:"restrict"}),
 notes:text("notes"),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
 updatedAt:timestamp("updated_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[
 uniqueIndex("outside_drive_participant_once_uq").on(t.outsideDriveId,t.membershipId),
 index("outside_drive_participant_college_idx").on(t.collegeId,t.outsideDriveId),
 check("outside_drive_participant_result_ck",sql`${t.result} in ('PARTICIPATED','PASSED','FAILED','SELECTED','HIRED')`),
 foreignKey({name:"outside_drive_participant_record_college_fk",
  columns:[t.outsideDriveId,t.collegeId],
  foreignColumns:[placementOutsideDriveRecords.id,placementOutsideDriveRecords.collegeId]}).onDelete("restrict"),
 foreignKey({name:"outside_drive_participant_learner_college_fk",
  columns:[t.membershipId,t.collegeId],
  foreignColumns:[collegeMemberships.id,collegeMemberships.collegeId]}).onDelete("restrict"),
]);
