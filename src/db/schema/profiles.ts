import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { collegeMemberships } from "./memberships";
import { departments } from "./departments";

export const learnerProfiles = pgTable("learner_profiles", {
  membershipId: uuid("membership_id")
    .primaryKey()
    .references(() => collegeMemberships.id, { onDelete: "restrict" }),
  rollNumber: varchar("roll_number", { length: 128 }),
  registrationNumber: varchar("registration_number", { length: 128 }),
  profileDocument: jsonb("profile_document")
    .$type<Record<string, unknown>>()
    .notNull()
    .default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const facultyProfiles = pgTable(
  "faculty_profiles",
  {
    membershipId: uuid("membership_id")
      .primaryKey()
      .references(() => collegeMemberships.id, { onDelete: "restrict" }),
    primaryDepartmentId: uuid("primary_department_id").references(
      () => departments.id,
      { onDelete: "restrict" },
    ),
    employmentType: varchar("employment_type", { length: 128 }),
    academicTitle: varchar("academic_title", { length: 128 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("faculty_profiles_primary_department_idx").on(
      table.primaryDepartmentId,
    ),
  ],
);
