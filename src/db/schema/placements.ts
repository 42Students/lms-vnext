import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  smallint,
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
    logoPublicUrl: text("logo_public_url"),
    industry: varchar("industry", {length: 160}),
    about: text("about"),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    verifiedByUserId: uuid("verified_by_user_id").references(() => users.id, {onDelete: "restrict"}),
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
    index("placement_companies_verified_idx").on(table.verifiedAt),
    check("placement_companies_verifier_ck", sql`(${table.verifiedAt} is null) = (${table.verifiedByUserId} is null)`),
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
    // DB-047 / DB09: legacy industry_company.export_columns_json is a
    // relationship-scoped default in vNext so one college cannot change
    // another college's disclosure defaults for the same global company.
    // Each actual share still snapshots its own immutable columns separately.
    shareColumnDefaults: jsonb("share_column_defaults").$type<string[]>(),
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
    uniqueIndex("outside_drives_relationship_college_parent_uq").on(
      table.id,
      table.collegeId,
    ),
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
    check(
      "placement_company_relationships_share_columns_ck",
      sql`${table.shareColumnDefaults} is null
        or (
          jsonb_typeof(${table.shareColumnDefaults}) = 'array'
          and ${table.shareColumnDefaults} <@
            '["name","roll","branch","cgpa","tenth","twelfth","email","phone","resume","projects","skillMatch","stage"]'::jsonb
        )`,
    ),
  ],
);


export const placementRecruiterProfiles = pgTable(
  "placement_recruiter_profiles",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "restrict" }),
    companyId: uuid("company_id")
      .notNull()
      .references(() => placementCompanies.id, {
        onDelete: "restrict",
      }),
    title: varchar("title", { length: 160 }),
    status: varchar("status", { length: 24 })
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
    index("placement_recruiter_profiles_company_status_idx").on(
      table.companyId,
      table.status,
    ),
    check(
      "placement_recruiter_profiles_status_ck",
      sql`${table.status} in ('ACTIVE', 'ARCHIVED')`,
    ),
    check(
      "placement_recruiter_profiles_archive_shape_ck",
      sql`(${table.status} = 'ARCHIVED') = (${table.archivedAt} is not null)`,
    ),
  ],
);

export const placementRecruiterCollegeGrants = pgTable(
  "placement_recruiter_college_grants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    recruiterUserId: uuid("recruiter_user_id")
      .notNull()
      .references(() => placementRecruiterProfiles.userId, {
        onDelete: "restrict",
      }),
    companyRelationshipId: uuid("company_relationship_id")
      .notNull()
      .references(() => placementCompanyRelationships.id, {
        onDelete: "restrict",
      }),
    status: varchar("status", { length: 24 })
      .notNull()
      .default("ACTIVE"),
    grantedByUserId: uuid("granted_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    revokedByUserId: uuid("revoked_by_user_id").references(
      () => users.id,
      { onDelete: "restrict" },
    ),
    revokedAt: timestamp("revoked_at", {
      withTimezone: true,
    }),
    /** T-S1-01: NULL fails closed; ACTIVE alone never authorizes access. */
    validUntil: timestamp("valid_until", { withTimezone: true }),
    capabilities: text("capabilities")
      .array()
      .notNull()
      .default(sql`ARRAY['DRIVES']::text[]`),
    verificationStatus: varchar("verification_status", { length: 24 })
      .notNull()
      .default("PENDING"),
    revokeReason: text("revoke_reason"),
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
    uniqueIndex("placement_recruiter_college_grants_active_uq")
      .on(
        table.recruiterUserId,
        table.companyRelationshipId,
      )
      .where(sql`${table.status} = 'ACTIVE'`),
    index("placement_recruiter_college_grants_recruiter_status_idx").on(
      table.recruiterUserId,
      table.status,
    ),
    index("placement_recruiter_college_grants_relationship_status_idx").on(
      table.companyRelationshipId,
      table.status,
    ),
    index("placement_recruiter_grant_validity_idx")
      .on(table.recruiterUserId, table.validUntil)
      .where(sql`${table.status} = 'ACTIVE'`),
    check(
      "placement_recruiter_grant_verification_ck",
      sql`${table.verificationStatus} in ('PENDING', 'VERIFIED', 'REJECTED')`,
    ),
    check(
      "placement_recruiter_grant_validity_ck",
      sql`${table.validUntil} is null or ${table.validUntil} > ${table.createdAt}`,
    ),
    check(
      "placement_recruiter_grant_capabilities_ck",
      sql`cardinality(${table.capabilities}) > 0 and ${table.capabilities} <@ ARRAY['DRIVES','APPLICANT_EXPORT','INTERVIEWS','MESSAGES']::text[]`,
    ),
    check(
      "placement_recruiter_college_grants_status_ck",
      sql`${table.status} in ('ACTIVE', 'REVOKED')`,
    ),
    check(
      "placement_recruiter_college_grants_lifecycle_ck",
      sql`(${table.status} = 'ACTIVE' and ${table.revokedByUserId} is null and ${table.revokedAt} is null)
        or (${table.status} = 'REVOKED' and ${table.revokedByUserId} is not null and ${table.revokedAt} is not null)`,
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


export const placementSeasons = pgTable(
  "placement_seasons",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, {
        onDelete: "restrict",
      }),
    name: text("name").notNull(),
    code: varchar("code", { length: 64 }).notNull(),
    startDate: date("start_date", {
      mode: "string",
    }).notNull(),
    endDate: date("end_date", {
      mode: "string",
    }).notNull(),
    status: varchar("status", { length: 24 })
      .notNull()
      .default("ACTIVE"),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "restrict",
      }),
    closedByUserId: uuid("closed_by_user_id").references(
      () => users.id,
      { onDelete: "restrict" },
    ),
    closedAt: timestamp("closed_at", {
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
    uniqueIndex(
      "placement_seasons_college_code_uq",
    ).on(
      table.collegeId,
      sql`lower(${table.code})`,
    ),
    uniqueIndex(
      "placement_seasons_active_college_uq",
    )
      .on(table.collegeId)
      .where(
        sql`${table.status} = 'ACTIVE'`,
      ),
    index(
      "placement_seasons_college_status_idx",
    ).on(
      table.collegeId,
      table.status,
      table.startDate,
    ),
    check(
      "placement_seasons_name_ck",
      sql`length(trim(${table.name})) > 0 and length(trim(${table.code})) > 0`,
    ),
    check(
      "placement_seasons_dates_ck",
      sql`${table.endDate} >= ${table.startDate}`,
    ),
    check(
      "placement_seasons_status_ck",
      sql`${table.status} in ('ACTIVE', 'CLOSED')`,
    ),
    check(
      "placement_seasons_lifecycle_ck",
      sql`(${table.status} = 'ACTIVE'
          and ${table.closedByUserId} is null
          and ${table.closedAt} is null)
        or (${table.status} = 'CLOSED'
          and ${table.closedByUserId} is not null
          and ${table.closedAt} is not null)`,
    ),
  ],
);

export const placementJobs = pgTable(
  "placement_jobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "restrict" }),
    seasonId: uuid("season_id")
      .notNull()
      .references(() => placementSeasons.id, {
        onDelete: "restrict",
      }),
    companyRelationshipId: uuid("company_relationship_id")
      .notNull()
      .references(() => placementCompanyRelationships.id, {
        onDelete: "restrict",
      }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    employmentType: varchar("employment_type", { length: 24 })
      .notNull(),
    workMode: varchar("work_mode", { length: 24 }).notNull(),
    locations: text("locations")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    openings: integer("openings"),
    minimumAnnualCtcInr: integer("minimum_annual_ctc_inr"),
    maximumAnnualCtcInr: integer("maximum_annual_ctc_inr"),
    applicationMode: varchar("application_mode", { length: 24 })
      .notNull()
      .default("INTERNAL"),
    externalApplicationUrl: text("external_application_url"),
    applicationDeadline: timestamp("application_deadline", {
      withTimezone: true,
    }),
    status: varchar("status", { length: 24 })
      .notNull()
      .default("DRAFT"),
    /** P-S1-05: persisted dream-drive classification (exempt from held-offer cap). */
    isDream: boolean("is_dream").notNull().default(false),
    /** REC-home-drives-24/25/26: recruiter drive parity fields copied from an approved request draft. */
    recruiterDriveMode: varchar("recruiter_drive_mode", { length: 16 })
      .notNull()
      .default("ON_CAMPUS"),
    eligibleBranches: text("eligible_branches")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    eligiblePassingYear: smallint("eligible_passing_year"),
    ctcLpa: numeric("ctc_lpa", { precision: 8, scale: 2 }),
    fixedCtcLpa: numeric("fixed_ctc_lpa", { precision: 8, scale: 2 }),
    variableCtcLpa: numeric("variable_ctc_lpa", { precision: 8, scale: 2 }),
    stipendPerMonthInr: integer("stipend_per_month_inr"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("placement_jobs_id_college_uq").on(table.id, table.collegeId),
    index("placement_jobs_college_status_idx").on(
      table.collegeId,
      table.status,
    ),
    index("placement_jobs_season_status_idx").on(
      table.seasonId,
      table.status,
    ),
    index("placement_jobs_relationship_idx").on(
      table.companyRelationshipId,
    ),
    check(
      "placement_jobs_status_ck",
      sql`${table.status} in ('DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED', 'CANCELLED')`,
    ),
    check(
      "placement_jobs_employment_type_ck",
      sql`${table.employmentType} in ('FULL_TIME', 'INTERNSHIP', 'CONTRACT')`,
    ),
    check(
      "placement_jobs_recruiter_drive_mode_ck",
      sql`${table.recruiterDriveMode} in ('ON_CAMPUS', 'OFF_CAMPUS')`,
    ),
    check(
      "placement_jobs_recruiter_eligible_passing_year_ck",
      sql`${table.eligiblePassingYear} is null or ${table.eligiblePassingYear} between 2000 and 2199`,
    ),
    check(
      "placement_jobs_recruiter_ctc_breakdown_ck",
      sql`(${table.ctcLpa} is null or ${table.ctcLpa} >= 0)
        and (${table.fixedCtcLpa} is null or ${table.fixedCtcLpa} >= 0)
        and (${table.variableCtcLpa} is null or ${table.variableCtcLpa} >= 0)
        and (${table.ctcLpa} is null or coalesce(${table.fixedCtcLpa}, 0) + coalesce(${table.variableCtcLpa}, 0) <= ${table.ctcLpa})
        and (${table.stipendPerMonthInr} is null or ${table.stipendPerMonthInr} >= 0)`,
    ),
    check(
      "placement_jobs_work_mode_ck",
      sql`${table.workMode} in ('ONSITE', 'HYBRID', 'REMOTE')`,
    ),
    check(
      "placement_jobs_application_mode_ck",
      sql`${table.applicationMode} in ('INTERNAL', 'HYBRID', 'EXTERNAL_ONLY')`,
    ),
    check(
      "placement_jobs_openings_ck",
      sql`${table.openings} is null or ${table.openings} > 0`,
    ),
    check(
      "placement_jobs_ctc_ck",
      sql`(${table.minimumAnnualCtcInr} is null or ${table.minimumAnnualCtcInr} >= 0)
        and (${table.maximumAnnualCtcInr} is null or ${table.maximumAnnualCtcInr} >= 0)
        and (${table.minimumAnnualCtcInr} is null or ${table.maximumAnnualCtcInr} is null or ${table.maximumAnnualCtcInr} >= ${table.minimumAnnualCtcInr})`,
    ),
    check(
      "placement_jobs_external_url_ck",
      sql`(${table.applicationMode} = 'INTERNAL') or (${table.externalApplicationUrl} is not null)`,
    ),
    check(
      "placement_jobs_lifecycle_ck",
      sql`(${table.status} = 'DRAFT' and ${table.publishedAt} is null and ${table.closedAt} is null and ${table.archivedAt} is null)
        or (${table.status} = 'PUBLISHED' and ${table.publishedAt} is not null and ${table.closedAt} is null and ${table.archivedAt} is null)
        or (${table.status} = 'CLOSED' and ${table.publishedAt} is not null and ${table.closedAt} is not null and ${table.archivedAt} is null)
        or (${table.status} = 'CANCELLED' and ${table.publishedAt} is not null and ${table.closedAt} is not null and ${table.archivedAt} is null)
        or (${table.status} = 'ARCHIVED' and ${table.archivedAt} is not null)`,
    ),
  ],
);



export const placementJobRoleOptions = pgTable(
  "placement_job_role_options",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => placementJobs.id, {
        onDelete: "cascade",
      }),
    title: text("title").notNull(),
    employmentType: varchar("employment_type", {
      length: 24,
    }).notNull(),
    workMode: varchar("work_mode", {
      length: 24,
    }).notNull(),
    locations: text("locations")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    openings: integer("openings"),
    minimumAnnualCtcInr: integer(
      "minimum_annual_ctc_inr",
    ),
    maximumAnnualCtcInr: integer(
      "maximum_annual_ctc_inr",
    ),
    // Pay breakdown in lakh per annum (legacy precision, migration 0096).
    fixedLpa: numeric("fixed_lpa", { precision: 10, scale: 2 }),
    variableLpa: numeric("variable_lpa", { precision: 10, scale: 2 }),
    joiningBonusLpa: numeric("joining_bonus_lpa", {
      precision: 10,
      scale: 2,
    }),
    bondMonths: integer("bond_months"),
    bondAmount: numeric("bond_amount", { precision: 12, scale: 2 }),
    isPrimary: boolean("is_primary")
      .notNull()
      .default(false),
    status: varchar("status", { length: 24 })
      .notNull()
      .default("ACTIVE"),
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
    uniqueIndex(
      "placement_job_role_options_job_title_uq",
    )
      .on(table.jobId, table.title)
      .where(
        sql`${table.status} = 'ACTIVE'`,
      ),
    uniqueIndex(
      "placement_job_role_options_primary_uq",
    )
      .on(table.jobId)
      .where(
        sql`${table.isPrimary} = true and ${table.status} = 'ACTIVE'`,
      ),
    index(
      "placement_job_role_options_job_status_idx",
    ).on(table.jobId, table.status),
    check(
      "placement_job_role_options_status_ck",
      sql`${table.status} in ('ACTIVE', 'ARCHIVED')`,
    ),
    check(
      "placement_job_role_options_employment_type_ck",
      sql`${table.employmentType} in ('FULL_TIME', 'INTERNSHIP', 'CONTRACT')`,
    ),
    check(
      "placement_job_role_options_work_mode_ck",
      sql`${table.workMode} in ('ONSITE', 'HYBRID', 'REMOTE')`,
    ),
    check(
      "placement_job_role_options_openings_ck",
      sql`${table.openings} is null or ${table.openings} > 0`,
    ),
    check(
      "placement_job_role_options_ctc_ck",
      sql`(${table.minimumAnnualCtcInr} is null or ${table.minimumAnnualCtcInr} >= 0)
        and (${table.maximumAnnualCtcInr} is null or ${table.maximumAnnualCtcInr} >= 0)
        and (${table.minimumAnnualCtcInr} is null or ${table.maximumAnnualCtcInr} is null or ${table.maximumAnnualCtcInr} >= ${table.minimumAnnualCtcInr})`,
    ),
    check(
      "placement_job_role_options_pay_breakdown_ck",
      sql`(${table.fixedLpa} is null or ${table.fixedLpa} >= 0)
        and (${table.variableLpa} is null or ${table.variableLpa} >= 0)
        and (${table.joiningBonusLpa} is null or ${table.joiningBonusLpa} >= 0)
        and (${table.bondMonths} is null or ${table.bondMonths} between 0 and 120)
        and (${table.bondAmount} is null or ${table.bondAmount} >= 0)`,
    ),
    check(
      "placement_job_role_options_archive_shape_ck",
      sql`(${table.status} = 'ARCHIVED') = (${table.archivedAt} is not null)`,
    ),
  ],
);

export const placementCandidateAcademicEvidence = pgTable(
  "placement_candidate_academic_evidence",
  {
    membershipId: uuid("membership_id")
      .primaryKey()
      .references(() => collegeMemberships.id, {
        onDelete: "restrict",
      }),
    cgpaHundredths: integer("cgpa_hundredths"),
    activeBacklogs: integer("active_backlogs"),
    pastBacklogs: integer("past_backlogs"),
    tenthPctBasisPoints: integer("tenth_pct_basis_points"),
    twelfthPctBasisPoints: integer("twelfth_pct_basis_points"),
    diplomaPctBasisPoints: integer("diploma_pct_basis_points"),
    undergraduatePctBasisPoints: integer(
      "undergraduate_pct_basis_points",
    ),
    gapYears: integer("gap_years"),
    isLateralEntry: boolean("is_lateral_entry")
      .notNull()
      .default(false),
    passingYear: integer("passing_year"),
    source: varchar("source", { length: 16 })
      .notNull()
      .default("SELF"),
    verifiedByUserId: uuid("verified_by_user_id").references(
      () => users.id,
      { onDelete: "restrict" },
    ),
    verifiedAt: timestamp("verified_at", {
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
    check(
      "placement_candidate_academic_evidence_cgpa_ck",
      sql`${table.cgpaHundredths} is null or ${table.cgpaHundredths} between 0 and 1000`,
    ),
    check(
      "placement_candidate_academic_evidence_backlogs_ck",
      sql`(${table.activeBacklogs} is null or ${table.activeBacklogs} >= 0)
        and (${table.pastBacklogs} is null or ${table.pastBacklogs} >= 0)`,
    ),
    check(
      "placement_candidate_academic_evidence_percentages_ck",
      sql`(${table.tenthPctBasisPoints} is null or ${table.tenthPctBasisPoints} between 0 and 10000)
        and (${table.twelfthPctBasisPoints} is null or ${table.twelfthPctBasisPoints} between 0 and 10000)
        and (${table.diplomaPctBasisPoints} is null or ${table.diplomaPctBasisPoints} between 0 and 10000)
        and (${table.undergraduatePctBasisPoints} is null or ${table.undergraduatePctBasisPoints} between 0 and 10000)`,
    ),
    check(
      "placement_candidate_academic_evidence_gap_ck",
      sql`${table.gapYears} is null or ${table.gapYears} >= 0`,
    ),
    check(
      "placement_candidate_academic_evidence_passing_year_ck",
      sql`${table.passingYear} is null or ${table.passingYear} between 1950 and 2200`,
    ),
    check(
      "placement_candidate_academic_evidence_source_ck",
      sql`${table.source} in ('SELF', 'VERIFIED')`,
    ),
    check(
      "placement_candidate_academic_evidence_verification_ck",
      sql`(${table.source} = 'VERIFIED' and ${table.verifiedByUserId} is not null and ${table.verifiedAt} is not null)
        or (${table.source} = 'SELF' and ${table.verifiedByUserId} is null and ${table.verifiedAt} is null)`,
    ),
  ],
);

export const placementJobEligibilityPolicies = pgTable(
  "placement_job_eligibility_policies",
  {
    jobId: uuid("job_id")
      .primaryKey()
      .references(() => placementJobs.id, {
        onDelete: "restrict",
      }),
    allowedProgramIds: uuid("allowed_program_ids")
      .array()
      .notNull()
      .default(sql`'{}'::uuid[]`),
    allowedCohortIds: uuid("allowed_cohort_ids")
      .array()
      .notNull()
      .default(sql`'{}'::uuid[]`),
    /** P-S2-04: section targeting; empty = no section restriction. */
    allowedSectionIds: uuid("allowed_section_ids")
      .array()
      .notNull()
      .default(sql`'{}'::uuid[]`),
    minCgpaHundredths: integer("min_cgpa_hundredths"),
    maxActiveBacklogs: integer("max_active_backlogs"),
    maxPastBacklogs: integer("max_past_backlogs"),
    minTenthPctBasisPoints: integer(
      "min_tenth_pct_basis_points",
    ),
    minTwelfthPctBasisPoints: integer(
      "min_twelfth_pct_basis_points",
    ),
    minDiplomaPctBasisPoints: integer(
      "min_diploma_pct_basis_points",
    ),
    minUndergraduatePctBasisPoints: integer(
      "min_undergraduate_pct_basis_points",
    ),
    /** P-S2-02: minimum percentage throughout (basis points; 75.25% = 7525). */
    minPctThroughoutBasisPoints: integer(
      "min_pct_throughout_basis_points",
    ),
    maxGapYears: integer("max_gap_years"),
    allowedPassingYears: integer("allowed_passing_years")
      .array()
      .notNull()
      .default(sql`'{}'::integer[]`),
    /** P-S2-01: when true, SELF-sourced evidence never satisfies a threshold. */
    requireVerifiedEvidence: boolean("require_verified_evidence")
      .notNull()
      .default(false),
    missingEvidencePolicy: varchar(
      "missing_evidence_policy",
      { length: 32 },
    )
      .notNull()
      .default("ALLOW_WITH_FLAG"),
    updatedByUserId: uuid("updated_by_user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "restrict",
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
    check(
      "placement_job_eligibility_policy_cgpa_ck",
      sql`${table.minCgpaHundredths} is null or ${table.minCgpaHundredths} between 0 and 1000`,
    ),
    check(
      "placement_job_eligibility_policy_backlogs_ck",
      sql`(${table.maxActiveBacklogs} is null or ${table.maxActiveBacklogs} >= 0)
        and (${table.maxPastBacklogs} is null or ${table.maxPastBacklogs} >= 0)`,
    ),
    check(
      "placement_job_eligibility_policy_percentages_ck",
      sql`(${table.minTenthPctBasisPoints} is null or ${table.minTenthPctBasisPoints} between 0 and 10000)
        and (${table.minTwelfthPctBasisPoints} is null or ${table.minTwelfthPctBasisPoints} between 0 and 10000)
        and (${table.minDiplomaPctBasisPoints} is null or ${table.minDiplomaPctBasisPoints} between 0 and 10000)
        and (${table.minUndergraduatePctBasisPoints} is null or ${table.minUndergraduatePctBasisPoints} between 0 and 10000)`,
    ),
    check(
      "placement_job_policy_pct_throughout_ck",
      sql`${table.minPctThroughoutBasisPoints} is null or ${table.minPctThroughoutBasisPoints} between 0 and 10000`,
    ),
    check(
      "placement_job_eligibility_policy_gap_ck",
      sql`${table.maxGapYears} is null or ${table.maxGapYears} >= 0`,
    ),
    check(
      "placement_job_eligibility_policy_missing_ck",
      sql`${table.missingEvidencePolicy} in ('ALLOW_WITH_FLAG', 'REQUIRE_COMPLETE')`,
    ),
  ],
);

export const placementEligibilityOverrides = pgTable(
  "placement_eligibility_overrides",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => placementJobs.id, {
        onDelete: "restrict",
      }),
    membershipId: uuid("membership_id")
      .notNull()
      .references(() => collegeMemberships.id, {
        onDelete: "restrict",
      }),
    decision: varchar("decision", { length: 16 }).notNull(),
    reason: text("reason").notNull(),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "restrict",
      }),
    revokedAt: timestamp("revoked_at", {
      withTimezone: true,
    }),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex(
      "placement_eligibility_overrides_active_uq",
    )
      .on(table.jobId, table.membershipId)
      .where(sql`${table.revokedAt} is null`),
    index("placement_eligibility_overrides_member_idx").on(
      table.membershipId,
      table.revokedAt,
    ),
    check(
      "placement_eligibility_overrides_decision_ck",
      sql`${table.decision} in ('INCLUDE', 'EXCLUDE')`,
    ),
    check(
      "placement_eligibility_overrides_reason_ck",
      sql`length(trim(${table.reason})) > 0`,
    ),
  ],
);


export const placementApplications = pgTable(
  "placement_applications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => placementJobs.id, {
        onDelete: "restrict",
      }),
    roleOptionId: uuid("role_option_id")
      .notNull()
      .references(() => placementJobRoleOptions.id, {
        onDelete: "restrict",
      }),
    membershipId: uuid("membership_id")
      .notNull()
      .references(() => collegeMemberships.id, {
        onDelete: "restrict",
      }),
    channel: varchar("channel", { length: 16 }).notNull(),
    status: varchar("status", { length: 24 })
      .notNull()
      .default("SUBMITTED"),
    eligibilityStatus: varchar("eligibility_status", {
      length: 40,
    }).notNull(),
    eligibilitySnapshot: jsonb(
      "eligibility_snapshot",
    ).notNull(),
    submittedByUserId: uuid("submitted_by_user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "restrict",
      }),
    submittedAt: timestamp("submitted_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    withdrawnAt: timestamp("withdrawn_at", {
      withTimezone: true,
    }),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("placement_applications_id_job_uq").on(table.id, table.jobId),
    uniqueIndex(
      "placement_applications_role_membership_uq",
    ).on(table.roleOptionId, table.membershipId),
    index(
      "placement_applications_job_membership_idx",
    ).on(table.jobId, table.membershipId),
    index("placement_applications_job_status_idx").on(
      table.jobId,
      table.status,
    ),
    index(
      "placement_applications_membership_status_idx",
    ).on(table.membershipId, table.status),
    check(
      "placement_applications_channel_ck",
      sql`${table.channel} in ('INTERNAL', 'EXTERNAL')`,
    ),
    check(
      "placement_applications_status_ck",
      sql`${table.status} in ('SUBMITTED', 'WITHDRAWN')`,
    ),
    check(
      "placement_applications_eligibility_status_ck",
      sql`${table.eligibilityStatus} in ('ELIGIBLE', 'ELIGIBLE_WITH_MISSING_EVIDENCE')`,
    ),
    check(
      "placement_applications_lifecycle_ck",
      sql`(${table.status} = 'SUBMITTED' and ${table.withdrawnAt} is null)
        or (${table.status} = 'WITHDRAWN' and ${table.withdrawnAt} is not null)`,
    ),
  ],
);


export const placementApplicationStatusHistory = pgTable(
  "placement_application_status_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => placementApplications.id, {
        onDelete: "restrict",
      }),
    fromStatus: varchar("from_status", { length: 24 }),
    toStatus: varchar("to_status", { length: 24 }).notNull(),
    actorUserId: uuid("actor_user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "restrict",
      }),
    reason: text("reason"),
    /** P-S1-06: durable cascade correlation id (nullable). */
    cascadeId: uuid("cascade_id"),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index(
      "placement_application_status_history_application_idx",
    ).on(table.applicationId, table.createdAt),
    index("placement_application_history_cascade_id_idx")
      .on(table.cascadeId)
      .where(sql`${table.cascadeId} is not null`),
    check(
      "placement_application_status_history_from_ck",
      sql`${table.fromStatus} is null or ${table.fromStatus} in ('SUBMITTED', 'WITHDRAWN')`,
    ),
    check(
      "placement_application_status_history_to_ck",
      sql`${table.toStatus} in ('SUBMITTED', 'WITHDRAWN')`,
    ),
    check(
      "placement_application_status_history_transition_ck",
      sql`(${table.fromStatus} is null and ${table.toStatus} = 'SUBMITTED')
        or (${table.fromStatus} = 'SUBMITTED' and ${table.toStatus} = 'WITHDRAWN')
        or (${table.fromStatus} = 'WITHDRAWN' and ${table.toStatus} = 'SUBMITTED')`,
    ),
  ],
);


export const placementApplicationScreenings = pgTable(
  "placement_application_screenings",
  {
    applicationId: uuid("application_id")
      .primaryKey()
      .references(() => placementApplications.id, {
        onDelete: "restrict",
      }),
    status: varchar("status", { length: 24 })
      .notNull()
      .default("PENDING"),
    candidateMessage: text("candidate_message"),
    internalReason: text("internal_reason"),
    decidedByUserId: uuid("decided_by_user_id").references(
      () => users.id,
      { onDelete: "restrict" },
    ),
    decidedAt: timestamp("decided_at", {
      withTimezone: true,
    }),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index(
      "placement_application_screenings_status_idx",
    ).on(table.status, table.updatedAt),
    check(
      "placement_application_screenings_status_ck",
      sql`${table.status} in ('PENDING', 'HOLD', 'SHORTLISTED', 'REJECTED')`,
    ),
    check(
      "placement_application_screenings_shape_ck",
      sql`(${table.status} = 'PENDING'
          and ${table.decidedByUserId} is null
          and ${table.decidedAt} is null
          and ${table.candidateMessage} is null
          and ${table.internalReason} is null)
        or (${table.status} = 'HOLD'
          and ${table.decidedByUserId} is not null
          and ${table.decidedAt} is not null
          and coalesce(length(trim(${table.internalReason})), 0) > 0)
        or (${table.status} = 'SHORTLISTED'
          and ${table.decidedByUserId} is not null
          and ${table.decidedAt} is not null)
        or (${table.status} = 'REJECTED'
          and ${table.decidedByUserId} is not null
          and ${table.decidedAt} is not null
          and coalesce(length(trim(${table.candidateMessage})), 0) > 0)`,
    ),
  ],
);

export const placementApplicationScreeningHistory = pgTable(
  "placement_application_screening_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => placementApplications.id, {
        onDelete: "restrict",
      }),
    fromStatus: varchar("from_status", {
      length: 24,
    }).notNull(),
    toStatus: varchar("to_status", {
      length: 24,
    }).notNull(),
    candidateMessage: text("candidate_message"),
    internalReason: text("internal_reason"),
    actorUserId: uuid("actor_user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "restrict",
      }),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index(
      "placement_application_screening_history_application_idx",
    ).on(table.applicationId, table.createdAt),
    check(
      "placement_application_screening_history_status_ck",
      sql`${table.fromStatus} in ('PENDING', 'HOLD', 'SHORTLISTED', 'REJECTED')
        and ${table.toStatus} in ('PENDING', 'HOLD', 'SHORTLISTED', 'REJECTED')`,
    ),
    check(
      "placement_application_screening_history_transition_ck",
      sql`(${table.fromStatus} = 'PENDING'
          and ${table.toStatus} in ('HOLD', 'SHORTLISTED', 'REJECTED'))
        or (${table.fromStatus} = 'HOLD'
          and ${table.toStatus} in ('SHORTLISTED', 'REJECTED'))
        or (${table.fromStatus} = 'SHORTLISTED'
          and ${table.toStatus} = 'REJECTED')
        or (${table.fromStatus} = 'REJECTED'
          and ${table.toStatus} = 'PENDING')`,
    ),
  ],
);


export const placementJobRounds = pgTable(
  "placement_job_rounds",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => placementJobs.id, {
        onDelete: "restrict",
      }),
    sequence: integer("sequence").notNull(),
    kind: varchar("kind", { length: 24 }).notNull(),
    name: text("name").notNull(),
    mode: varchar("mode", { length: 24 }),
    scheduledAt: timestamp("scheduled_at", {
      withTimezone: true,
    }),
    timezone: varchar("timezone", { length: 64 }),
    venue: text("venue"),
    meetingUrl: text("meeting_url"),
    whatToBring: text("what_to_bring"),
    platform: text("platform"),
    testUrl: text("test_url"),
    durationMinutes: integer("duration_minutes"),
    resultsDueAt: timestamp("results_due_at", {
      withTimezone: true,
    }),
    status: varchar("status", { length: 24 })
      .notNull()
      .default("PENDING"),
    completedAt: timestamp("completed_at", {
      withTimezone: true,
    }),
    cancelledAt: timestamp("cancelled_at", {
      withTimezone: true,
    }),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "restrict",
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
    uniqueIndex("hr_interview_round_job_parent_uq").on(
      table.id,
      table.jobId,
    ),
    uniqueIndex(
      "placement_job_rounds_active_sequence_uq",
    )
      .on(table.jobId, table.sequence)
      .where(sql`${table.status} <> 'CANCELLED'`),
    index("placement_job_rounds_job_status_idx").on(
      table.jobId,
      table.status,
    ),
    check(
      "placement_job_rounds_sequence_ck",
      sql`${table.sequence} > 0`,
    ),
    check(
      "placement_job_rounds_kind_ck",
      sql`${table.kind} in ('TALK', 'TEST', 'VENDOR_TEST', 'GD', 'INTERVIEW')`,
    ),
    check(
      "placement_job_rounds_mode_ck",
      sql`${table.mode} is null or ${table.mode} in ('ON_CAMPUS', 'VIRTUAL')`,
    ),
    check(
      "placement_job_rounds_status_ck",
      sql`${table.status} in ('PENDING', 'SCHEDULED', 'COMPLETED', 'CANCELLED')`,
    ),
    check(
      "placement_job_rounds_duration_ck",
      sql`${table.durationMinutes} is null or (${table.durationMinutes} > 0 and ${table.durationMinutes} <= 1440)`,
    ),
    check(
      "placement_job_rounds_schedule_pair_ck",
      sql`(${table.scheduledAt} is null and ${table.timezone} is null)
        or (${table.scheduledAt} is not null and ${table.timezone} is not null)`,
    ),
    check(
      "placement_job_rounds_results_due_ck",
      sql`${table.resultsDueAt} is null
        or ${table.scheduledAt} is null
        or ${table.resultsDueAt} >= ${table.scheduledAt}`,
    ),
    check(
      "placement_job_rounds_delivery_ck",
      sql`${table.status} not in ('SCHEDULED', 'COMPLETED')
        or (${table.mode} = 'ON_CAMPUS'
          and coalesce(length(trim(${table.venue})), 0) > 0)
        or (${table.mode} = 'VIRTUAL'
          and coalesce(length(trim(${table.meetingUrl})), 0) > 0)`,
    ),
    check(
      "placement_job_rounds_lifecycle_ck",
      sql`(${table.status} = 'PENDING'
          and ${table.scheduledAt} is null
          and ${table.timezone} is null
          and ${table.completedAt} is null
          and ${table.cancelledAt} is null)
        or (${table.status} = 'SCHEDULED'
          and ${table.scheduledAt} is not null
          and ${table.timezone} is not null
          and ${table.mode} is not null
          and ${table.completedAt} is null
          and ${table.cancelledAt} is null)
        or (${table.status} = 'COMPLETED'
          and ${table.scheduledAt} is not null
          and ${table.timezone} is not null
          and ${table.mode} is not null
          and ${table.completedAt} is not null
          and ${table.cancelledAt} is null)
        or (${table.status} = 'CANCELLED'
          and ${table.completedAt} is null
          and ${table.cancelledAt} is not null)`,
    ),
  ],
);

export const placementJobRoundEvents = pgTable(
  "placement_job_round_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    roundId: uuid("round_id")
      .notNull()
      .references(() => placementJobRounds.id, {
        onDelete: "restrict",
      }),
    eventType: varchar("event_type", {
      length: 32,
    }).notNull(),
    actorUserId: uuid("actor_user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "restrict",
      }),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index(
      "placement_job_round_events_round_created_idx",
    ).on(table.roundId, table.createdAt),
    check(
      "placement_job_round_events_type_ck",
      sql`${table.eventType} in ('CREATED', 'UPDATED', 'SCHEDULED', 'RESCHEDULED', 'REORDERED', 'COMPLETED', 'CANCELLED')`,
    ),
  ],
);


export const placementRoundResults = pgTable(
  "placement_round_results",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    roundId: uuid("round_id")
      .notNull()
      .references(() => placementJobRounds.id, {
        onDelete: "restrict",
      }),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => placementApplications.id, {
        onDelete: "restrict",
      }),
    version: integer("version").notNull(),
    outcome: varchar("outcome", { length: 24 }).notNull(),
    waitlistRank: integer("waitlist_rank"),
    scorePercent: integer("score_percent"),
    reasonCategory: varchar("reason_category", {
      length: 32,
    }),
    candidateMessage: text("candidate_message"),
    internalComment: text("internal_comment"),
    source: varchar("source", { length: 16 })
      .notNull()
      .default("TPO"),
    status: varchar("status", { length: 24 })
      .notNull()
      .default("STAGED"),
    submittedByUserId: uuid("submitted_by_user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "restrict",
      }),
    submittedAt: timestamp("submitted_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    appliedByUserId: uuid("applied_by_user_id").references(
      () => users.id,
      { onDelete: "restrict" },
    ),
    appliedAt: timestamp("applied_at", {
      withTimezone: true,
    }),
    supersededAt: timestamp("superseded_at", {
      withTimezone: true,
    }),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex(
      "placement_round_results_round_application_version_uq",
    ).on(
      table.roundId,
      table.applicationId,
      table.version,
    ),
    uniqueIndex(
      "placement_round_results_current_uq",
    )
      .on(table.roundId, table.applicationId)
      .where(sql`${table.status} <> 'SUPERSEDED'`),
    index(
      "placement_round_results_round_status_idx",
    ).on(table.roundId, table.status),
    index(
      "placement_round_results_application_status_idx",
    ).on(table.applicationId, table.status),
    check(
      "placement_round_results_version_ck",
      sql`${table.version} > 0`,
    ),
    check(
      "placement_round_results_outcome_ck",
      sql`${table.outcome} in ('PASS', 'FAIL', 'HOLD', 'ABSENT')`,
    ),
    check(
      "placement_round_results_waitlist_ck",
      sql`(${table.outcome} = 'HOLD'
          and ${table.waitlistRank} is not null
          and ${table.waitlistRank} > 0)
        or (${table.outcome} <> 'HOLD'
          and ${table.waitlistRank} is null)`,
    ),
    check(
      "placement_round_results_score_ck",
      sql`${table.scorePercent} is null
        or (${table.scorePercent} >= 0 and ${table.scorePercent} <= 100)`,
    ),
    check(
      "placement_round_results_reason_category_ck",
      sql`${table.reasonCategory} is null
        or ${table.reasonCategory} in ('APTITUDE', 'TECHNICAL', 'COMMUNICATION', 'OTHER')`,
    ),
    check(
      "placement_round_results_source_ck",
      sql`${table.source} in ('TPO', 'HR', 'IMPORT')`,
    ),
    check(
      "placement_round_results_status_ck",
      sql`${table.status} in ('STAGED', 'APPLIED', 'SUPERSEDED')`,
    ),
    check(
      "placement_round_results_candidate_message_ck",
      sql`${table.outcome} = 'PASS'
        or coalesce(length(trim(${table.candidateMessage})), 0) > 0`,
    ),
    check(
      "placement_round_results_lifecycle_ck",
      sql`(${table.status} = 'STAGED'
          and ${table.appliedByUserId} is null
          and ${table.appliedAt} is null
          and ${table.supersededAt} is null)
        or (${table.status} = 'APPLIED'
          and ${table.appliedByUserId} is not null
          and ${table.appliedAt} is not null
          and ${table.supersededAt} is null)
        or (${table.status} = 'SUPERSEDED'
          and ${table.appliedByUserId} is null
          and ${table.appliedAt} is null
          and ${table.supersededAt} is not null)`,
    ),
  ],
);


export const placementOffers = pgTable(
  "placement_offers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => placementApplications.id, {
        onDelete: "restrict",
      }),
    version: integer("version").notNull(),
    kind: varchar("kind", { length: 8 }).notNull().default("OFFER"),
    status: varchar("status", { length: 24 })
      .notNull()
      .default("ISSUED"),
    roleTitle: text("role_title").notNull(),
    offerLetterUrl: text("offer_letter_url"),
    offerLetterAttachedAt: timestamp("offer_letter_attached_at", {withTimezone:true}),
    offerLetterAttachedByUserId: uuid("offer_letter_attached_by_user_id")
      .references(()=>users.id,{onDelete:"restrict"}),
    annualCtcInr: integer("annual_ctc_inr"),
    // Pay breakdown (migration 0096). All nullable: annual_ctc_inr stays the
    // single headline figure; these keep legacy fixed/variable/bonus/bond detail.
    fixedLpa: numeric("fixed_lpa", { precision: 10, scale: 2 }),
    variableLpa: numeric("variable_lpa", { precision: 10, scale: 2 }),
    joiningBonusLpa: numeric("joining_bonus_lpa", {
      precision: 10,
      scale: 2,
    }),
    bondMonths: integer("bond_months"),
    bondAmount: numeric("bond_amount", { precision: 12, scale: 2 }),
    acceptanceChannel: varchar("acceptance_channel", { length: 24 }),
    acceptedDisputableUntil: timestamp("accepted_disputable_until", {
      withTimezone: true,
    }),
    cascadeId: uuid("cascade_id"),
    revokeReason: varchar("revoke_reason", { length: 500 }),
    joiningDate: date("joining_date", {
      mode: "string",
    }),
    expiresAt: timestamp("expires_at", {
      withTimezone: true,
    }),
    issuedByUserId: uuid("issued_by_user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "restrict",
      }),
    issuedAt: timestamp("issued_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    respondedByUserId: uuid(
      "responded_by_user_id",
    ).references(() => users.id, {
      onDelete: "restrict",
    }),
    respondedAt: timestamp("responded_at", {
      withTimezone: true,
    }),
    withdrawnByUserId: uuid(
      "withdrawn_by_user_id",
    ).references(() => users.id, {
      onDelete: "restrict",
    }),
    withdrawnAt: timestamp("withdrawn_at", {
      withTimezone: true,
    }),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex(
      "placement_offers_application_version_uq",
    ).on(table.applicationId, table.version),
    uniqueIndex(
      "placement_offers_active_application_uq",
    )
      .on(table.applicationId)
      .where(
        sql`${table.status} in ('ISSUED', 'ACCEPTED')`,
      ),
    index(
      "placement_offers_application_status_idx",
    ).on(table.applicationId, table.status),
    check(
      "placement_offers_version_ck",
      sql`${table.version} > 0`,
    ),
    check(
      "placement_offers_status_ck",
      sql`${table.status} in ('ISSUED', 'ACCEPTED', 'DECLINED', 'WITHDRAWN', 'EXPIRED')`,
    ),
    check(
      "placement_offers_kind_ck",
      sql`${table.kind} in ('OFFER', 'LOI')`,
    ),
    check(
      "placement_offers_role_title_ck",
      sql`length(trim(${table.roleTitle})) > 0`,
    ),
    check(
      "placement_offers_pay_breakdown_ck",
      sql`(${table.fixedLpa} is null or ${table.fixedLpa} >= 0)
        and (${table.variableLpa} is null or ${table.variableLpa} >= 0)
        and (${table.joiningBonusLpa} is null or ${table.joiningBonusLpa} >= 0)
        and (${table.bondMonths} is null or ${table.bondMonths} between 0 and 120)
        and (${table.bondAmount} is null or ${table.bondAmount} >= 0)`,
    ),
    check(
      "placement_offers_acceptance_channel_ck",
      sql`${table.acceptanceChannel} is null or ${table.acceptanceChannel} in ('IN_APP', 'EXTERNAL_IMPORT')`,
    ),
    check(
      "placement_offers_revoke_reason_ck",
      sql`${table.revokeReason} is null or length(trim(${table.revokeReason})) > 0`,
    ),
    index("placement_offers_cascade_id_idx")
      .on(table.cascadeId)
      .where(sql`${table.cascadeId} is not null`),
    check(
      "placement_offers_ctc_ck",
      sql`${table.annualCtcInr} is null or ${table.annualCtcInr} >= 0`,
    ),
    check(
      "placement_offers_expiry_ck",
      sql`${table.expiresAt} is null or ${table.expiresAt} > ${table.issuedAt}`,
    ),
    check(
      "placement_offers_lifecycle_ck",
      sql`(${table.status} in ('ISSUED', 'EXPIRED')
          and ${table.respondedByUserId} is null
          and ${table.respondedAt} is null
          and ${table.withdrawnByUserId} is null
          and ${table.withdrawnAt} is null)
        or (${table.status} in ('ACCEPTED', 'DECLINED')
          and ${table.respondedByUserId} is not null
          and ${table.respondedAt} is not null
          and ${table.withdrawnByUserId} is null
          and ${table.withdrawnAt} is null)
        or (${table.status} = 'WITHDRAWN'
          and ${table.withdrawnByUserId} is not null
          and ${table.withdrawnAt} is not null)`,
    ),
  ],
);

export const placementOfferStatusHistory = pgTable(
  "placement_offer_status_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    offerId: uuid("offer_id")
      .notNull()
      .references(() => placementOffers.id, {
        onDelete: "restrict",
      }),
    fromStatus: varchar("from_status", {
      length: 24,
    }),
    toStatus: varchar("to_status", {
      length: 24,
    }).notNull(),
    actorUserId: uuid("actor_user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "restrict",
      }),
    reason: text("reason"),
    /** P-S1-06: durable cascade correlation id (nullable). */
    cascadeId: uuid("cascade_id"),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index(
      "placement_offer_status_history_offer_idx",
    ).on(table.offerId, table.createdAt),
    index("placement_offer_history_cascade_id_idx")
      .on(table.cascadeId)
      .where(sql`${table.cascadeId} is not null`),
    check(
      "placement_offer_status_history_status_ck",
      sql`(${table.fromStatus} is null or ${table.fromStatus} in ('ISSUED', 'ACCEPTED', 'DECLINED', 'WITHDRAWN', 'EXPIRED'))
        and ${table.toStatus} in ('ISSUED', 'ACCEPTED', 'DECLINED', 'WITHDRAWN', 'EXPIRED')`,
    ),
    check(
      "placement_offer_status_history_transition_ck",
      sql`(${table.fromStatus} is null and ${table.toStatus} = 'ISSUED')
        or (${table.fromStatus} = 'ISSUED' and ${table.toStatus} in ('ACCEPTED', 'DECLINED', 'WITHDRAWN', 'EXPIRED'))
        or (${table.fromStatus} = 'ACCEPTED' and ${table.toStatus} in ('WITHDRAWN', 'ISSUED'))
        or (${table.fromStatus} = 'DECLINED' and ${table.toStatus} = 'ISSUED')`,
    ),
  ],
);



export const placementLearnerRequests = pgTable(
  "placement_learner_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => placementApplications.id, {
        onDelete: "restrict",
      }),
    requestType: varchar("request_type", {
      length: 40,
    }).notNull(),
    roundId: uuid("round_id").references(
      () => placementJobRounds.id,
      { onDelete: "restrict" },
    ),
    offerId: uuid("offer_id").references(
      () => placementOffers.id,
      { onDelete: "restrict" },
    ),
    scopeKey: text("scope_key").notNull(),
    reason: text("reason").notNull(),
    effectPayload: jsonb("effect_payload")
      .notNull()
      .default(sql`'{}'::jsonb`),
    status: varchar("status", { length: 24 })
      .notNull()
      .default("PENDING"),
    requestedByUserId: uuid("requested_by_user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "restrict",
      }),
    requestedAt: timestamp("requested_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    decidedByUserId: uuid("decided_by_user_id").references(
      () => users.id,
      { onDelete: "restrict" },
    ),
    decidedAt: timestamp("decided_at", {
      withTimezone: true,
    }),
    decisionNote: text("decision_note"),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("placement_learner_requests_pending_scope_uq")
      .on(table.scopeKey)
      .where(sql`${table.status} = 'PENDING'`),
    index("placement_learner_requests_application_status_idx").on(
      table.applicationId,
      table.status,
      table.requestedAt,
    ),
    index("placement_learner_requests_type_status_idx").on(
      table.requestType,
      table.status,
      table.requestedAt,
    ),
    check(
      "placement_learner_requests_type_ck",
      sql`${table.requestType} in ('APPLICATION_WITHDRAWAL', 'ROUND_RESCHEDULE', 'OFFER_EXTENSION')`,
    ),
    check(
      "placement_learner_requests_status_ck",
      sql`${table.status} in ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')`,
    ),
    check(
      "placement_learner_requests_reason_ck",
      sql`length(trim(${table.reason})) >= 3`,
    ),
    check(
      "placement_learner_requests_target_shape_ck",
      sql`(${table.requestType} = 'APPLICATION_WITHDRAWAL' and ${table.roundId} is null and ${table.offerId} is null)
        or (${table.requestType} = 'ROUND_RESCHEDULE' and ${table.roundId} is not null and ${table.offerId} is null)
        or (${table.requestType} = 'OFFER_EXTENSION' and ${table.roundId} is null and ${table.offerId} is not null)`,
    ),
    check(
      "placement_learner_requests_lifecycle_ck",
      sql`(${table.status} = 'PENDING' and ${table.decidedByUserId} is null and ${table.decidedAt} is null)
        or (${table.status} in ('APPROVED', 'REJECTED', 'CANCELLED') and ${table.decidedByUserId} is not null and ${table.decidedAt} is not null)`,
    ),
  ],
);

export const placementApplicationRoundExceptions = pgTable(
  "placement_application_round_exceptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => placementApplications.id, {
        onDelete: "restrict",
      }),
    roundId: uuid("round_id")
      .notNull()
      .references(() => placementJobRounds.id, {
        onDelete: "restrict",
      }),
    requestId: uuid("request_id")
      .notNull()
      .references(() => placementLearnerRequests.id, {
        onDelete: "restrict",
      }),
    scheduledAt: timestamp("scheduled_at", {
      withTimezone: true,
    }).notNull(),
    timezone: varchar("timezone", {
      length: 64,
    }).notNull(),
    mode: varchar("mode", { length: 24 }).notNull(),
    venue: text("venue"),
    meetingUrl: text("meeting_url"),
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
    uniqueIndex("placement_application_round_exceptions_scope_uq").on(
      table.applicationId,
      table.roundId,
    ),
    uniqueIndex("placement_application_round_exceptions_request_uq").on(
      table.requestId,
    ),
    index("placement_application_round_exceptions_round_idx").on(
      table.roundId,
      table.scheduledAt,
    ),
    check(
      "placement_application_round_exceptions_mode_ck",
      sql`${table.mode} in ('ON_CAMPUS', 'VIRTUAL')`,
    ),
    check(
      "placement_application_round_exceptions_delivery_ck",
      sql`(${table.mode} = 'ON_CAMPUS' and coalesce(length(trim(${table.venue})), 0) > 0 and ${table.meetingUrl} is null)
        or (${table.mode} = 'VIRTUAL' and coalesce(length(trim(${table.meetingUrl})), 0) > 0 and ${table.venue} is null)`,
    ),
  ],
);

export const placementJoiningOutcomes = pgTable(
  "placement_joining_outcomes",
  {
    offerId: uuid("offer_id")
      .primaryKey()
      .references(() => placementOffers.id, {
        onDelete: "restrict",
      }),
    status: varchar("status", { length: 24 })
      .notNull()
      .default("PENDING"),
    joiningDate: date("joining_date", {
      mode: "string",
    }),
    reason: text("reason"),
    recordedByUserId: uuid(
      "recorded_by_user_id",
    ).references(() => users.id, {
      onDelete: "restrict",
    }),
    recordedAt: timestamp("recorded_at", {
      withTimezone: true,
    }),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index(
      "placement_joining_outcomes_status_idx",
    ).on(table.status, table.updatedAt),
    check(
      "placement_joining_outcomes_status_ck",
      sql`${table.status} in ('PENDING', 'JOINED', 'DID_NOT_JOIN', 'DEFERRED')`,
    ),
    check(
      "placement_joining_outcomes_shape_ck",
      sql`(${table.status} = 'PENDING'
          and ${table.joiningDate} is null
          and ${table.reason} is null
          and ${table.recordedByUserId} is null
          and ${table.recordedAt} is null)
        or (${table.status} = 'JOINED'
          and ${table.joiningDate} is not null
          and ${table.recordedByUserId} is not null
          and ${table.recordedAt} is not null)
        or (${table.status} = 'DID_NOT_JOIN'
          and coalesce(length(trim(${table.reason})), 0) > 0
          and ${table.recordedByUserId} is not null
          and ${table.recordedAt} is not null)
        or (${table.status} = 'DEFERRED'
          and ${table.joiningDate} is not null
          and coalesce(length(trim(${table.reason})), 0) > 0
          and ${table.recordedByUserId} is not null
          and ${table.recordedAt} is not null)`,
    ),
  ],
);

export const placementJoiningHistory = pgTable(
  "placement_joining_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    offerId: uuid("offer_id")
      .notNull()
      .references(() => placementOffers.id, {
        onDelete: "restrict",
      }),
    fromStatus: varchar("from_status", {
      length: 24,
    }).notNull(),
    toStatus: varchar("to_status", {
      length: 24,
    }).notNull(),
    joiningDate: date("joining_date", {
      mode: "string",
    }),
    reason: text("reason"),
    actorUserId: uuid("actor_user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "restrict",
      }),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index(
      "placement_joining_history_offer_idx",
    ).on(table.offerId, table.createdAt),
    check(
      "placement_joining_history_status_ck",
      sql`${table.fromStatus} in ('PENDING', 'JOINED', 'DID_NOT_JOIN', 'DEFERRED')
        and ${table.toStatus} in ('JOINED', 'DID_NOT_JOIN', 'DEFERRED')`,
    ),
  ],
);
