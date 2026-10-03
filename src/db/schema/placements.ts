import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { colleges } from "./colleges";
import { collegeMemberships } from "./memberships";
import { users } from "./users";

export const placementCompanies = pgTable(
  "placement_companies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    websiteUrl: text("website_url"),
    primaryDomain: varchar("primary_domain", {
      length: 255,
    }),
    logoObjectPath: text("logo_object_path"),
    status: varchar("status", { length: 32 })
      .notNull()
      .default("ACTIVE"),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    archivedAt: timestamp("archived_at", {
      withTimezone: true,
    }),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("placement_companies_name_uq").on(
      sql`lower(${table.name})`,
    ),
    uniqueIndex("placement_companies_domain_uq")
      .on(sql`lower(${table.primaryDomain})`)
      .where(sql`${table.primaryDomain} is not null`),
    index("placement_companies_status_idx").on(table.status),
    check(
      "placement_companies_status_ck",
      sql`${table.status} in ('ACTIVE', 'ARCHIVED')`,
    ),
  ],
);

export const placementCompanyRelationships = pgTable(
  "placement_company_relationships",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "restrict" }),
    companyId: uuid("company_id")
      .notNull()
      .references(() => placementCompanies.id, {
        onDelete: "restrict",
      }),
    status: varchar("status", { length: 32 })
      .notNull()
      .default("ACTIVE"),
    isTrusted: boolean("is_trusted").notNull().default(false),
    ownerMembershipId: uuid("owner_membership_id").references(
      () => collegeMemberships.id,
      { onDelete: "restrict" },
    ),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    archivedAt: timestamp("archived_at", {
      withTimezone: true,
    }),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("placement_company_relationships_college_company_uq").on(
      table.collegeId,
      table.companyId,
    ),
    index("placement_company_relationships_college_status_idx").on(
      table.collegeId,
      table.status,
    ),
    index("placement_company_relationships_company_idx").on(
      table.companyId,
    ),
    index("placement_company_relationships_owner_idx").on(
      table.ownerMembershipId,
      table.status,
    ),
    check(
      "placement_company_relationships_status_ck",
      sql`${table.status} in ('ACTIVE', 'ARCHIVED')`,
    ),
    check(
      "placement_company_relationships_archive_shape_ck",
      sql`(${table.status} = 'ARCHIVED') = (${table.archivedAt} is not null)`,
    ),
  ],
);


export const placementCandidatePreferences = pgTable(
  "placement_candidate_preferences",
  {
    membershipId: uuid("membership_id")
      .primaryKey()
      .references(() => collegeMemberships.id, {
        onDelete: "restrict",
      }),
    preferredRoleTitles: text("preferred_role_titles")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    preferredLocations: text("preferred_locations")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    preferredEmploymentTypes: text(
      "preferred_employment_types",
    )
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    preferredWorkMode: varchar("preferred_work_mode", {
      length: 24,
    })
      .notNull()
      .default("NO_PREFERENCE"),
    shiftPreference: varchar("shift_preference", {
      length: 24,
    })
      .notNull()
      .default("NO_PREFERENCE"),
    minimumAnnualCtcInr: integer("minimum_annual_ctc_inr"),
    relocationPreference: varchar(
      "relocation_preference",
      { length: 24 },
    )
      .notNull()
      .default("NO_PREFERENCE"),
    notifyMatchingJobs: boolean("notify_matching_jobs")
      .notNull()
      .default(true),
    notifyApplicationUpdates: boolean(
      "notify_application_updates",
    )
      .notNull()
      .default(true),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "placement_candidate_preferences_work_mode_ck",
      sql`${table.preferredWorkMode} in ('ONSITE', 'HYBRID', 'REMOTE', 'NO_PREFERENCE')`,
    ),
    check(
      "placement_candidate_preferences_shift_ck",
      sql`${table.shiftPreference} in ('DAY', 'NIGHT', 'FLEXIBLE', 'NO_PREFERENCE')`,
    ),
    check(
      "placement_candidate_preferences_relocation_ck",
      sql`${table.relocationPreference} in ('YES', 'NO', 'NO_PREFERENCE')`,
    ),
    check(
      "placement_candidate_preferences_ctc_ck",
      sql`${table.minimumAnnualCtcInr} is null or ${table.minimumAnnualCtcInr} >= 0`,
    ),
  ],
);
