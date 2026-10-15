/** External drive records: facts recorded by staff, not published platform jobs. */
import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { colleges } from "./colleges";
import { placementCompanyRelationships } from "./placements";
import { users } from "./users";

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
    check("outside_drives_title_ck", sql`length(btrim(${t.title})) > 0`),
    check("outside_drives_role_ck", sql`${t.recordedByRole} in ('TPO','RECRUITER')`),
    foreignKey({
      columns: [t.companyRelationshipId, t.collegeId],
      foreignColumns: [placementCompanyRelationships.id, placementCompanyRelationships.collegeId],
      name: "outside_drives_relationship_college_fk",
    }),
  ],
);
