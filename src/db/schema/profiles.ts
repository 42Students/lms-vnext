import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
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
  /** Private storage key, never an expired signed URL or a client-supplied path. */
  resumeObjectPath: varchar("resume_object_path", { length: 1024 }),
  /** Independent compare-and-swap revision for learner document updates. */
  profileDocumentVersion: integer("profile_document_version").notNull().default(0),
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
}, (t) => [
  check("learner_profiles_document_version_ck", sql`${t.profileDocumentVersion} >= 0`),
]);

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
    /** Faculty photo key is owned and signed at access time by storage service. */
    avatarObjectPath: varchar("avatar_object_path", { length: 1024 }),
    profileDocument: jsonb("profile_document")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    profileDocumentVersion: integer("profile_document_version")
      .notNull()
      .default(0),
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
    check(
      "faculty_profiles_document_version_nonnegative",
      sql`${table.profileDocumentVersion} >= 0`,
    ),
  ],
);
