import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  foreignKey,
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

/** Legacy placement import contract. vNext uses UUID and timestamptz (IST
 * source civil dates require explicit timezone conversion), never reuses
 * integer IDs as authorization identifiers. Legacy soft-deleted companies
 * import as ARCHIVED and retain the source tombstone. Global company identity
 * is canonical; college relationships carry CRM notes and access grants.
 * Domain trust is per placement_company_domains row, not inferred from
 * placement_companies.verifiedAt. No historical data is auto-migrated. */
export const placementCompanies = pgTable(
  "placement_companies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    legacyCompanyId: integer("legacy_company_id"),
    legacyCreatedByRole: varchar("legacy_created_by_role",{length:20}),
    legacyWasDeleted: boolean("legacy_was_deleted"),
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
    /** Explicit CAS token. Writer must compare version and atomically increment. */
    version: integer("version").notNull().default(1),
  },
  (table) => [
    // Display names are not globally unique; verified domains identify companies.
    uniqueIndex("placement_companies_domain_uq")
      .on(sql`lower(${table.primaryDomain})`)
      .where(sql`${table.primaryDomain} is not null`),
    index("placement_companies_status_idx").on(table.status),
    index("placement_companies_name_idx").on(sql`lower(${table.name})`),
    check("placement_companies_version_ck", sql`${table.version} > 0`),
    uniqueIndex("placement_companies_legacy_company_uq").on(table.legacyCompanyId)
      .where(sql`${table.legacyCompanyId} is not null`),
    check("placement_companies_legacy_lengths_ck", sql`
      length(trim(${table.name})) between 2 and 150
      and (${table.websiteUrl} is null or length(${table.websiteUrl}) <= 500)
      and (${table.logoPublicUrl} is null or length(${table.logoPublicUrl}) <= 500)
      and (${table.industry} is null or length(${table.industry}) <= 100)`),
    check("placement_companies_legacy_about_ck",sql`
      ${table.about} is null or length(${table.about})<=2000`),
    check("placement_companies_legacy_deleted_ck",sql`
      ${table.legacyWasDeleted} is distinct from true or ${table.status} = 'ARCHIVED'`),
    index("placement_companies_verified_idx").on(table.verifiedAt),
    check("placement_companies_verifier_ck", sql`(${table.verifiedAt} is null) = (${table.verifiedByUserId} is null)`),
    check(
      "placement_companies_status_ck",
      sql`${table.status} in ('ACTIVE', 'ARCHIVED')`,
    ),
  ],
);

/** Canonical company redirects; redirects never delete historical drive references. */
export const placementCompanyMergeHistory = pgTable(
  "placement_company_merge_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sourceCompanyId: uuid("source_company_id").notNull().references(
      () => placementCompanies.id, { onDelete: "restrict" },
    ),
    targetCompanyId: uuid("target_company_id").notNull().references(
      () => placementCompanies.id, { onDelete: "restrict" },
    ),
    reason: text("reason"),
    mergedByUserId: uuid("merged_by_user_id").notNull().references(
      () => users.id, { onDelete: "restrict" },
    ),
    mergedAt: timestamp("merged_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("placement_company_merge_source_uq").on(table.sourceCompanyId),
    index("placement_company_merge_target_idx").on(table.targetCompanyId),
    check("placement_company_merge_distinct_ck", sql`${table.sourceCompanyId} <> ${table.targetCompanyId}`),
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
    /** Per-college CRM fields; never disclose from the global company row. */
    internalNotes: text("internal_notes"),
    contactPersonName: varchar("contact_person_name", { length: 150 }),
    contactEmail: varchar("contact_email", { length: 150 }),
    contactPhone: varchar("contact_phone", { length: 30 }),
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
    check(
      "placement_company_relationships_notes_len_ck",
      sql`${table.internalNotes} is null or length(${table.internalNotes}) <= 2000`,
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
    /** Legacy designation label maps to title for UI display. */
    title: varchar("title", { length: 160 }),
    suspendedAt: timestamp("suspended_at", {withTimezone:true}),
    suspensionReason: varchar("suspension_reason",{length:500}),
    legacyRecruiterId: integer("legacy_recruiter_id"),
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
    uniqueIndex("placement_recruiter_profiles_legacy_id_uq")
      .on(table.legacyRecruiterId).where(sql`${table.legacyRecruiterId} is not null`),
    check("placement_recruiter_profiles_suspension_ck",sql`
      (${table.status} = 'SUSPENDED') = (${table.suspendedAt} is not null)
      and (${table.suspensionReason} is null or length(${table.suspensionReason}) <= 500)`),
    check(
      "placement_recruiter_profiles_status_ck",
      sql`${table.status} in ('ACTIVE', 'SUSPENDED', 'ARCHIVED')`,
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
    /** Lead ownership is resolved by FK in migration 0197, not from client input. */
    pendingRecruiterLeadId: uuid("pending_recruiter_lead_id"),
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
    grantedByType: varchar("granted_by_type", { length: 32 }),
    revokedByType: varchar("revoked_by_type", { length: 32 }),
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
    /** Optional migration-only, never used to authorize privileges. */
    legacyImportMetadata: jsonb("legacy_import_metadata").$type<{
      accessId?: number;
      recruiterId?: number;
      collegeId?: number;
      organizationId?: number | null;
      originalActorType?: string;
      originalVersion?: number;
      indefiniteValidUntil?: boolean;
      unknownCapabilities?: string[];
    }>(),
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
    version: integer("version").notNull().default(1),
  },
  (table) => [
    uniqueIndex("placement_recruiter_college_grants_active_uq")
      .on(
        table.recruiterUserId,
        table.companyRelationshipId,
      )
      .where(sql`${table.status} in ('ACTIVE', 'PENDING_RECRUITER')`),
    index("placement_recruiter_grants_pending_recruiter_idx")
      .on(table.recruiterUserId, table.status)
      .where(sql`${table.status} = 'PENDING_RECRUITER'`),
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
    check("placement_recruiter_grants_version_ck", sql`${table.version} > 0`),
    check(
      "placement_recruiter_grant_revoke_reason_length_ck",
      sql`${table.revokeReason} is null or length(${table.revokeReason}) <= 500`,
    ),
    check(
      "placement_recruiter_grant_verification_ck",
      sql`${table.verificationStatus} in ('PENDING', 'VERIFIED', 'REJECTED')`,
    ),
    check(
      "placement_recruiter_grant_validity_ck",
      sql`${table.validUntil} is null or ${table.validUntil} > ${table.createdAt}`,
    ),
    check(
      "placement_recruiter_grant_legacy_metadata_ck",
      sql`${table.legacyImportMetadata} is null or jsonb_typeof(${table.legacyImportMetadata}) = 'object'`,
    ),
    check(
      "placement_recruiter_grant_capabilities_ck",
      sql`cardinality(${table.capabilities}) > 0 and ${table.capabilities} <@ ARRAY['DRIVES','APPLICANT_EXPORT','INTERVIEWS','MESSAGES']::text[]`,
    ),
    check(
      "placement_recruiter_college_grants_status_ck",
      sql`${table.status} in ('ACTIVE', 'REVOKED', 'PENDING_RECRUITER')`,
    ),
    check(
      "placement_recruiter_college_grants_lifecycle_ck",
      sql`(${table.status} in ('ACTIVE', 'PENDING_RECRUITER') and ${table.revokedByUserId} is null and ${table.revokedAt} is null)
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
    /** Private placement assistance interest: YES/NO/NEED_MORE_INFO. */
    papInterest: varchar("pap_interest", { length: 20 }),
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
      "placement_candidate_preferences_pap_ck",
      sql`${table.papInterest} is null or ${table.papInterest} in ('YES', 'NO', 'NEED_MORE_INFO')`,
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
    // Cohort invitations remain authoritative until a season explicitly opts
    // in to the independent legacy registration-open lifecycle.
    registrationControlled: boolean("registration_controlled").notNull().default(false),
    isRegistrationOpen: boolean("is_registration_open").notNull().default(false),
    registrationDeadline: timestamp("registration_deadline", {withTimezone: true}),
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
    check("placement_seasons_registration_control_ck",
      sql`not ${table.isRegistrationOpen} or (${table.registrationControlled} and ${table.status} = 'ACTIVE')`),
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
    /** Source IDs/slugs are import locators, never tenant-independent grants. */
    legacyJobId: integer("legacy_job_id"),
    legacySlug: varchar("legacy_slug",{length:160}),
    legacySeasonId: integer("legacy_season_id"),
    legacyPostedAt: timestamp("legacy_posted_at",{withTimezone:true}),
    legacyCreatorRole: varchar("legacy_creator_role",{length:24}),
    legacyWasDeleted: boolean("legacy_was_deleted"),
    legacyIsDraft: boolean("legacy_is_draft"),
    legacyIsActive: boolean("legacy_is_active"),
    legacyVisibilityType: varchar("legacy_visibility_type",{length:24}),
    legacyTargeting: jsonb("legacy_targeting").$type<Record<string,unknown>>(),
    legacyDriveMode: varchar("legacy_drive_mode",{length:24}),
    legacyJobCategory: varchar("legacy_job_category",{length:24}),
    legacyCategoryOverrideReason: varchar("legacy_category_override_reason",{length:500}),
    legacyResultsAutoApply: boolean("legacy_results_auto_apply"),
    legacyScreeningVersion: integer("legacy_screening_version"),
    legacyCandidatePreferences: jsonb("legacy_candidate_preferences")
      .$type<Record<string,unknown>>(),
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
    /** Supplemental display-only legacy terms; eligibility remains in the enforced policy. */
    legacyPostingDetails:jsonb("legacy_posting_details").$type<{
      responsibilities:string;
      campusPool?:{hostCollege:string;reportingTime:string|null;travelNote:string};
      portal?:{studentsRegisterSeparately:boolean;name:string;url:string};
      skillsWanted?:string[];
      assessmentUrl:string|null;
      assessmentDeadline:string|null;
      importantDates:Array<{label:string;at:string;type?:string;dateType?:string}>;
      candidatePreferences:{
        preferredDegree:string;specialization:string;graduationYear:number|null;
        minGpa:number|null;city:string;
      };
      customEligibilityRules:Array<{label:string;value:string}>;
    }>(),
    employmentType: varchar("employment_type", { length: 24 })
      .notNull(),
    /** College job-type label retained on drives, including hidden/renamed historic types. */
    jobTypeLabel: varchar("job_type_label", { length: 40 }),
    /** NULL explicitly means no audited placed answer yet; never infer from employment type. */
    countsAsPlaced: boolean("counts_as_placed"),
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
    publicExternalSlug: varchar("public_external_slug", { length: 20 }),
    externalApplicationUrl: text("external_application_url"),
    applicationDeadline: timestamp("application_deadline", {
      withTimezone: true,
    }),
    status: varchar("status", { length: 24 })
      .notNull()
      .default("DRAFT"),
    /** P-S1-05: persisted dream-drive classification (exempt from held-offer cap). */
    isDream: boolean("is_dream").notNull().default(false),
    /** Legacy outside/off-campus placements must not be counted as campus jobs. */
    recordedOutside: boolean("recorded_outside").notNull().default(false),
    /** Object path only; never persist an expiring signed JD download URL. */
    jobDescriptionObjectPath: text("job_description_object_path"),
    /** Source URL used solely to reconcile historical drive documents. */
    legacyJobDescriptionUrl: text("legacy_job_description_url"),
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
    /** TPO-inbox-team-33: explicitly assigned placement team owner, never inferred from the creator. */
    ownerMembershipId: uuid("owner_membership_id").references(
      () => collegeMemberships.id, { onDelete: "restrict" },
    ),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    /** Atomic optimistic version independent of updatedAt timestamp precision. */
    version: integer("version").notNull().default(1),
  },
  (table) => [
    uniqueIndex("placement_jobs_id_college_uq").on(table.id, table.collegeId),
    uniqueIndex("placement_jobs_public_external_slug_uq")
      .on(table.publicExternalSlug)
      .where(sql`${table.publicExternalSlug} is not null`),
    check("placement_jobs_public_external_slug_ck",
      sql`${table.publicExternalSlug} is null or (${table.publicExternalSlug} ~ '^smr-[0-9a-f]{16}$' and ${table.applicationMode} in ('HYBRID', 'EXTERNAL_ONLY'))`),
    uniqueIndex("placement_jobs_legacy_id_uq").on(table.legacyJobId)
      .where(sql`${table.legacyJobId} is not null`),
    uniqueIndex("placement_jobs_legacy_slug_uq").on(sql`lower(${table.legacySlug})`)
      .where(sql`${table.legacySlug} is not null`),
    check("placement_jobs_legacy_targeting_ck",sql`
      ${table.legacyTargeting} is null or jsonb_typeof(${table.legacyTargeting}) = 'object'`),
    check("placement_jobs_legacy_preferences_ck",sql`
      ${table.legacyCandidatePreferences} is null or
      jsonb_typeof(${table.legacyCandidatePreferences})='object'`),
    check("placement_jobs_legacy_category_ck",sql`
      ${table.legacyCategoryOverrideReason} is null or
      length(${table.legacyCategoryOverrideReason})<=500`),
    check("placement_jobs_legacy_deleted_ck",sql`
      ${table.legacyWasDeleted} is distinct from true or ${table.status} = 'ARCHIVED'`),
    check("placement_jobs_version_ck", sql`${table.version} > 0`),
    index("placement_jobs_college_status_idx").on(
      table.collegeId,
      table.status,
    ),
    index("placement_jobs_college_job_type_idx").on(
      table.collegeId,
      sql`lower(${table.jobTypeLabel})`,
    ),
    index("placement_jobs_season_status_idx").on(
      table.seasonId,
      table.status,
    ),
    /** Efficient deadline sweeps: only live published drives are eligible. */
    index("placement_jobs_published_deadline_idx")
      .on(table.applicationDeadline)
      .where(sql`${table.status} = 'PUBLISHED' and ${table.applicationDeadline} is not null`),
    index("placement_jobs_relationship_idx").on(
      table.companyRelationshipId,
    ),
    foreignKey({
      name: "placement_jobs_owner_college_fk",
      columns: [table.ownerMembershipId, table.collegeId],
      foreignColumns: [collegeMemberships.id, collegeMemberships.collegeId],
    }).onDelete("restrict"),
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
    /** Original package-array order, separate from job role identity. */
    position: smallint("position"),
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
    /** Exact legacy package CTC; min/max INR remain normalized range fields. */
    ctcLpa: numeric("ctc_lpa", { precision: 12, scale: 4 }),
    stipendPerMonthInr: numeric("stipend_per_month_inr", { precision: 12, scale: 2 }),
    stipendMonths: integer("stipend_months"),
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
    uniqueIndex("placement_role_options_job_position_uq").on(table.jobId,table.position)
      .where(sql`${table.position} is not null and ${table.status} = 'ACTIVE'`),
    check("placement_role_options_position_ck",sql`
      ${table.position} is null or ${table.position} between 0 and 100`),
    // Parent key for the role-option/job composite FK on applications.
    uniqueIndex("placement_job_role_options_id_job_uq").on(table.id, table.jobId),
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
    check("placement_job_role_options_legacy_title_ck",sql`
      length(trim(${table.title})) between 1 and 100`),
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
      "placement_job_role_options_package_pay_ck",
      sql`(${table.ctcLpa} is null or ${table.ctcLpa} >= 0)
        and (${table.stipendPerMonthInr} is null or ${table.stipendPerMonthInr} >= 0)
        and (${table.stipendMonths} is null or ${table.stipendMonths} > 0)`,
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

/** Legacy CandidateAcademicSummary migration crosswalk. The 13 source
 * academic fields are not reclassified as college-verified merely because
 * the learner imported them. Verification requires a persisted authorized
 * actor, timestamp and source provenance. Decimal marks become integer
 * basis points only after finite 0–100 range checks; missing is NULL. */
export const LEGACY_CANDIDATE_ACADEMIC_FIELD_MAP={
 tenthPercentage:"tenthPctBasisPoints",
 twelfthPercentage:"twelfthPctBasisPoints",
 diplomaPercentage:"diplomaPctBasisPoints",
 undergraduatePercentage:"undergraduatePctBasisPoints",
 postgraduatePercentage:"postgraduatePctBasisPoints",
 cgpa:"cgpaHundredths",
 activeBacklogs:"activeBacklogs",
 pastBacklogs:"pastBacklogs",
 gapYears:"gapYears",
 passingYear:"passingYear",
 lateralEntry:"isLateralEntry",
 postgraduateQualified:"hasPostgraduateQualification",
 verificationStatus:"source/verifiedAt/verifiedByUserId",
} as const;
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
    /** For actual PG qualifications only; NULL means unprovided, not zero. */
    postgraduatePctBasisPoints: integer("postgraduate_pct_basis_points"),
    hasPostgraduateQualification: boolean("has_postgraduate_qualification"),
    gapYears: integer("gap_years"),
    isLateralEntry: boolean("is_lateral_entry")
      .notNull()
      .default(false),
    passingYear: integer("passing_year"),
    source: varchar("source", { length: 16 })
      .notNull()
      .default("SELF"),
    sourceMetadata: jsonb("source_metadata").$type<Record<string, unknown>>(),
    importedAt: timestamp("imported_at", { withTimezone: true }),
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
        and (${table.undergraduatePctBasisPoints} is null or ${table.undergraduatePctBasisPoints} between 0 and 10000)
        and (${table.postgraduatePctBasisPoints} is null or ${table.postgraduatePctBasisPoints} between 0 and 10000)`,
    ),
    check(
      "placement_candidate_academic_evidence_pg_qualification_ck",
      sql`${table.postgraduatePctBasisPoints} is null or ${table.hasPostgraduateQualification} is true`,
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
    /** PG eligibility only when the learner has relevant postgraduate evidence. */
    minPostgraduatePctBasisPoints: integer("min_postgraduate_pct_basis_points"),
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
        and (${table.minUndergraduatePctBasisPoints} is null or ${table.minUndergraduatePctBasisPoints} between 0 and 10000)
        and (${table.minPostgraduatePctBasisPoints} is null or ${table.minPostgraduatePctBasisPoints} between 0 and 10000)`,
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


/** Historical application crosswalk: old learner_id -> scoped membership_id,
 * job_id -> canonical job UUID; old applied_at -> first_applied_at, last
 * submission -> submitted_at; old rejection text -> candidate-facing screening
 * message, other internal notes -> private artifacts. Legacy one-application
 * per job differs intentionally from vNext one-per-role-option enrollment.
 * Old APPLIED displays as SUBMITTED; WITHDRAWN is not a shortlist stage.
 * Offer letters and score provenance are joined from offers and screening,
 * never from a fabricated application score. Imported legacy_deleted rows
 * must not be silently resurrected as active applications. */
/** Lossless importer plan for the old single job_application row. New
 * application state, mutable stage, offer lifecycle, and score evidence are
 * separate authorities; never treat a mutable stage label as consent or an
 * application status. The original numeric key is only provenance. */
/** Invalid/unknown source imports default to external; the persisted
 * application channel is assigned explicitly, not by a database default. */
export function legacyApplicationSourceChannel(raw:unknown):"INTERNAL"|"EXTERNAL"{
 const source=typeof raw==="string"?raw.trim().toUpperCase():"";
 return source==="INTERNAL"?"INTERNAL":"EXTERNAL";
}
/** Historic DRAFT_LIKE is a request workflow, not published job visibility. */
export type LegacyDriveLifecycleState=
 "REQUEST"|"SENT_BACK"|"REJECTED"|"DRAFT"|"PUBLISHED"|"CLOSED"|"CANCELLED";
export function projectLegacyDriveLifecycle(status:LegacyDriveLifecycleState){
 const isDraft=status==="REQUEST"||status==="SENT_BACK"||
  status==="REJECTED"||status==="DRAFT";
 const isActive=status!=="CLOSED"&&status!=="CANCELLED";
 return {isDraft,isActive,listedToLearners:status==="PUBLISHED",
  canResubmit:status==="SENT_BACK",
  canWithdrawRequest:status==="SENT_BACK"||status==="REQUEST"};
}
export const LEGACY_APPLICATION_SOURCE_CROSSWALK={
 id:"placementApplications.legacyApplicationId",
 learnerId:"placementApplications.membershipId (verified college UUID mapping)",
 jobId:"placementApplications.jobId (verified same-college job)",
 organizationId:"placementJobs.collegeId -> colleges.organizationId",
 appliedAt:"placementApplications.firstAppliedAt",
 updatedAt:"placementApplications.updatedAt",
 isDeleted:"placementApplications.legacyWasDeleted",
 version:"placementApplications.version",
 status:"placementApplicationLegacyStatusHistory.newStatus + placementCollegeApplicationStages.stage",
 notes:"private staff activity history",
 score:"placementApplicationScreenings / assessment evidence",
 offer:"placementOffers + placementOfferStatusHistory",
 currentRound:"placementApplications.currentRoundId",
} as const;
export function legacyApplicationStateProjection(sourceStatus:string){
 const stageByStatus:Readonly<Record<string,string>>={
  APPLIED:"APPLIED",SHORTLISTED:"SHORTLISTED",ASSESSMENT:"ASSESSMENT",
  INTERVIEW:"INTERVIEW",WAITLISTED:"WAITLISTED",OFFERED:"OFFERED",
  HIRED:"HIRED",REJECTED:"REJECTED",
 };
 if(sourceStatus==="WITHDRAWN")
  return {applicationStatus:"WITHDRAWN" as const,stage:"WITHDRAWN"};
 const stage=stageByStatus[sourceStatus];
 if(!stage)throw new Error("Unsupported source application status");
 return {applicationStatus:"SUBMITTED" as const,stage};
}

export const placementApplications = pgTable(
  "placement_applications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    legacyApplicationId: integer("legacy_application_id"),
    legacyWasDeleted: boolean("legacy_was_deleted"),
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
    /** Track provider separately from broad submission channel. */
    sourceProvider: varchar("source_provider", { length: 50 }),
    papRequested: boolean("pap_requested").notNull().default(false),
    /** Nonsequential company/ATS reference, never the internal application UUID. */
    publicRef: varchar("public_ref", { length: 33 })
      .notNull()
      .default(sql`'A' || upper(replace(gen_random_uuid()::text, '-', ''))`),
    externalRef: text("external_ref"),
    currentRoundId: uuid("current_round_id"),
    appliedByCollege: boolean("applied_by_college").notNull().default(false),
    appliedByCollegeOptOutUntil: timestamp("applied_by_college_opt_out_until", { withTimezone: true }),
    ineligibleFlagAt: timestamp("ineligible_flag_at", { withTimezone: true }),
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
    /** Original registration time, not the latest reapplication time. */
    firstAppliedAt: timestamp("first_applied_at", {withTimezone:true}).defaultNow(),
    withdrawnAt: timestamp("withdrawn_at", {
      withTimezone: true,
    }),
    withdrawalReason: varchar("withdrawal_reason", { length: 64 }),
    statusBeforeWithdrawal: varchar("status_before_withdrawal", { length: 30 }),
    statusUpdatedAt: timestamp("status_updated_at", { withTimezone: true }),
    statusUpdatedByUserId: uuid("status_updated_by_user_id").references(
      () => users.id, { onDelete: "restrict" },
    ),
    version: integer("version").notNull().default(1),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // Individual FKs alone allow an application to refer to a role option
    // from another job; the pair must identify the SAME persisted drive.
    foreignKey({
      name: "placement_applications_role_option_job_fk",
      columns: [table.roleOptionId, table.jobId],
      foreignColumns: [placementJobRoleOptions.id, placementJobRoleOptions.jobId],
    }).onDelete("restrict"),
    uniqueIndex("placement_applications_id_job_uq").on(table.id, table.jobId),
    uniqueIndex("placement_applications_public_ref_uq").on(table.publicRef),
    uniqueIndex("placement_applications_legacy_id_uq").on(table.legacyApplicationId)
      .where(sql`${table.legacyApplicationId} is not null`),
    check("placement_applications_external_ref_len_ck",sql`
      ${table.externalRef} is null or length(${table.externalRef}) <= 500`),
    check("placement_applications_legacy_deleted_ck",sql`
      ${table.legacyWasDeleted} is distinct from true or ${table.status} = 'WITHDRAWN'`),
    check("placement_applications_version_ck", sql`${table.version} > 0`),
    foreignKey({
      name: "placement_applications_current_round_job_fk",
      columns: [table.currentRoundId, table.jobId],
      foreignColumns: [placementJobRounds.id, placementJobRounds.jobId],
    }).onDelete("restrict"),
    uniqueIndex(
      "placement_applications_role_membership_uq",
    ).on(table.roleOptionId, table.membershipId),
    index(
      "placement_applications_job_membership_idx",
    ).on(table.jobId, table.membershipId),
    /** Organization queries join jobs by college; index submissions within a job. */
    index("placement_applications_job_submitted_idx").on(
      table.jobId, table.submittedAt,
    ),
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


/** Staff-only attachments/provenance. Never project these directly to learners. */
export const placementApplicationPrivateArtifacts = pgTable(
  "placement_application_private_artifacts",
  {
    applicationId: uuid("application_id")
      .primaryKey()
      .references(() => placementApplications.id, { onDelete: "restrict" }),
    assessmentUrl: text("assessment_url"),
    assessmentObjectPath: text("assessment_object_path"),
    /** Stable object path, NOT an expiring signed download URL. */
    resumeObjectPath: text("resume_object_path"),
    legacyResumeUrl: text("legacy_resume_url"),
    resumeHistory: jsonb("resume_history")
      .$type<Array<{ objectPath?: string; legacyUrl?: string; replacedAt: string }>>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    internalNotes: text("internal_notes"),
    updatedByUserId: uuid("updated_by_user_id").references(
      () => users.id, { onDelete: "restrict" },
    ),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "placement_application_private_assessment_url_ck",
      sql`${table.assessmentUrl} is null or
        (length(${table.assessmentUrl}) <= 2048
         and ${table.assessmentUrl} ~* '^https?://')`,
    ),
    check("placement_application_private_assessment_key_ck",
      sql`${table.assessmentObjectPath} is null or (length(${table.assessmentObjectPath}) between 5 and 700 and ${table.assessmentObjectPath} !~ '(^/|[.][.]|[[:cntrl:]])')`),
    check("placement_application_private_resume_key_ck",
      sql`${table.resumeObjectPath} is null or (length(${table.resumeObjectPath}) between 5 and 700 and ${table.resumeObjectPath} !~ '(^/|[.][.]|[[:cntrl:]])')`),
    check(
      "placement_application_private_resume_history_ck",
      sql`jsonb_typeof(${table.resumeHistory}) = 'array'`,
    ),
  ],
);

/**
 * Import-only compatibility events; modern lifecycle/stages remain authoritative.
 * Preserve unknown historical actors without inventing a privileged system user.
 */
export const placementLegacyApplicationStatusEvents = pgTable(
  "placement_legacy_application_status_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    applicationId: uuid("application_id").notNull().references(
      () => placementApplications.id, { onDelete: "restrict" },
    ),
    sourceLegacyEventId: varchar("source_legacy_event_id", { length: 40 }),
    oldStatus: varchar("old_status", { length: 50 }),
    newStatus: varchar("new_status", { length: 50 }).notNull(),
    reason: varchar("reason", { length: 500 }),
    actorUserId: uuid("actor_user_id").references(
      () => users.id, { onDelete: "restrict" },
    ),
    sourceActorType: varchar("source_actor_type", { length: 32 }),
    /** Imported status rows may have been soft-deleted, never assume active. */
    sourceDeleted: boolean("source_deleted").notNull().default(false),
    changedAt: timestamp("changed_at", { withTimezone: true }).notNull(),
  },
  (t) => [
    uniqueIndex("placement_legacy_status_source_uq")
      .on(t.applicationId, t.sourceLegacyEventId)
      .where(sql`${t.sourceLegacyEventId} is not null`),
    index("placement_legacy_status_timeline_idx").on(t.applicationId, t.changedAt),
    index("placement_legacy_status_visible_timeline_idx")
      .on(t.applicationId,t.changedAt,t.id)
      .where(sql`${t.sourceDeleted} = false`),
    check("placement_legacy_status_nonblank_ck", sql`length(trim(${t.newStatus})) > 0`),
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
    index("placement_application_history_state_time_idx")
      .on(table.applicationId,table.toStatus,table.createdAt),
    index("placement_application_history_time_idx").on(table.createdAt,table.id),
    index("placement_application_history_cascade_id_idx")
      .on(table.cascadeId)
      .where(sql`${table.cascadeId} is not null`),
    check("placement_application_history_reason_len_ck",sql`
      ${table.reason} is null or length(${table.reason}) <= 500`),
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
    check("placement_screenings_candidate_message_len_ck",sql`
      ${table.candidateMessage} is null or length(${table.candidateMessage}) <= 500`),
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
    legacyRoundId: integer("legacy_round_id"),
    /** Round description and assessment/interview subtype are presentation data. */
    legacyRoundDescription: text("legacy_round_description"),
    legacyInterviewType: varchar("legacy_interview_type",{length:80}),
    legacyMode: varchar("legacy_mode",{length:20}),
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
    /** Learner assessment submission cutoff; distinct from result publication deadline. */
    assessmentDueAt: timestamp("assessment_due_at", {withTimezone:true}),
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
    uniqueIndex("placement_job_rounds_legacy_id_uq").on(table.legacyRoundId)
      .where(sql`${table.legacyRoundId} is not null`),
    check("placement_job_rounds_legacy_description_ck",sql`
      ${table.legacyRoundDescription} is null or length(${table.legacyRoundDescription}) <= 2000`),
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
    // 10 fractional digits retain historical Double scores without
    // rounding them to an integer; Drizzle reads/writes finite JS numbers.
    scorePercent: numeric("score_percent", {precision:18,scale:10,mode:"number"}),
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
      sql`${table.source} in ('TPO', 'HR', 'IMPORT', 'FACULTY')`,
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


/** Offer migration crosswalk: respondBy -> expiresAt, letterUrl ->
 * offerLetterUrl, legacy createdAt -> legacyCreatedAt, source numeric ID ->
 * legacyOfferId, and version -> per-application issuance ordinal. Joining date
 * is a civil DATE, not an instant. Provider acceptance is not learner response.
 * Staff/audited release and terminal withdrawal are separate lifecycle facts. */
export const placementOffers = pgTable(
  "placement_offers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => placementApplications.id, {
        onDelete: "restrict",
      }),
    /** Historic numeric key and ordering timestamp, neither grants authority. */
    legacyOfferId: integer("legacy_offer_id"),
    legacyCreatedAt: timestamp("legacy_created_at", {withTimezone:true}),
    /** Offer issuance ordinal per application, not optimistic row revision. */
    version: integer("version").notNull(),
    rowVersion: integer("row_version").notNull().default(1),
    /** Source-compatible nullable role title and lossless pre-rounded CTC. */
    legacyRoleOptionName: text("legacy_role_option_name"),
    legacyCtcLpa: numeric("legacy_ctc_lpa"),
    kind: varchar("kind", { length: 8 }).notNull().default("OFFER"),
    status: varchar("status", { length: 24 })
      .notNull()
      .default("ISSUED"),
    roleTitle: text("role_title").notNull(),
    offerLetterUrl: text("offer_letter_url"),
    offerLetterObjectPath: text("offer_letter_object_path"),
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
    /** TPO/RECRUITER creator differs from verification and actual release. */
    createdByType: varchar("created_by_type", { length: 24 }),
    verifiedByUserId: uuid("verified_by_user_id").references(
      () => users.id, { onDelete: "restrict" },
    ),
    releasedAt: timestamp("released_at", { withTimezone: true }),
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
    uniqueIndex("placement_offers_legacy_id_uq").on(table.legacyOfferId)
      .where(sql`${table.legacyOfferId} is not null`),
    check("placement_offer_letter_key_ck",
      sql`${table.offerLetterObjectPath} is null or (length(${table.offerLetterObjectPath}) between 5 and 700 and ${table.offerLetterObjectPath} !~ '(^/|[.][.]|[[:cntrl:]])')`),
    index("placement_offers_expiry_due_idx").on(table.expiresAt)
      .where(sql`${table.status} = 'ISSUED' and ${table.expiresAt} is not null`),
    index("placement_offers_dispute_due_idx").on(table.acceptedDisputableUntil)
      .where(sql`${table.status} = 'ACCEPTED' and ${table.acceptedDisputableUntil} is not null`),
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
    check("placement_offers_row_version_ck", sql`${table.rowVersion} > 0`),
    check(
      "placement_offers_created_by_type_ck",
      sql`${table.createdByType} is null or ${table.createdByType} in ('TPO', 'RECRUITER')`,
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



/**
 * Append-only private interview evidence. Slot booking, applied round results,
 * and learner-visible status remain in their existing authoritative tables.
 * Never expose staff feedback through learner read projections.
 */
export const placementInterviewPrivateEvents = pgTable(
  "placement_interview_private_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    jobId: uuid("job_id").notNull().references(
      () => placementJobs.id, { onDelete: "restrict" },
    ),
    roundId: uuid("round_id").notNull().references(
      () => placementJobRounds.id, { onDelete: "restrict" },
    ),
    applicationId: uuid("application_id").notNull().references(
      () => placementApplications.id, { onDelete: "restrict" },
    ),
    eventType: varchar("event_type", { length: 32 }).notNull(),
    /** Previous and new schedule are timestamptz; imported local times need IST conversion. */
    previousScheduledAt: timestamp("previous_scheduled_at", { withTimezone: true }),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    /** Legacy interview IDs are provenance only, not runtime foreign keys. */
    legacyInterviewId: varchar("legacy_interview_id", { length: 40 }),
    /** Staff-only rating, recommendation and interviewer notes. */
    privateFeedback: jsonb("private_feedback").$type<Record<string, unknown>>(),
    actorUserId: uuid("actor_user_id").notNull().references(
      () => users.id, { onDelete: "restrict" },
    ),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      name: "placement_interview_events_round_job_fk",
      columns: [table.roundId, table.jobId],
      foreignColumns: [placementJobRounds.id, placementJobRounds.jobId],
    }).onDelete("restrict"),
    foreignKey({
      name: "placement_interview_events_app_job_fk",
      columns: [table.applicationId, table.jobId],
      foreignColumns: [placementApplications.id, placementApplications.jobId],
    }).onDelete("restrict"),
    index("placement_interview_private_events_subject_idx").on(
      table.roundId, table.applicationId, table.createdAt,
    ),
    check(
      "placement_interview_private_events_type_ck",
      sql`${table.eventType} in ('SCHEDULED', 'CONFIRMED', 'RESCHEDULE_REQUESTED', 'RESCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'FEEDBACK_RECORDED')`,
    ),
    check(
      "placement_interview_private_events_feedback_ck",
      sql`${table.privateFeedback} is null or jsonb_typeof(${table.privateFeedback}) = 'object'`,
    ),
  ],
);

export const placementLearnerRequests = pgTable(
  "placement_learner_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    // Migration 0133 permits application-free learner support requests.
    // Only APPLICATION_WITHDRAWAL, ROUND_RESCHEDULE and OFFER_EXTENSION
    // require an application. Membership identity remains mandatory.
    applicationId: uuid("application_id")
      .references(() => placementApplications.id, {
        onDelete: "restrict",
      }),
    // Added by migration 0133 (backfilled from the application, then NOT NULL).
    learnerMembershipId: uuid("learner_membership_id").notNull(),
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
      sql`${table.requestType} in ('APPLICATION_WITHDRAWAL','ROUND_RESCHEDULE','OFFER_EXTENSION','OFF_CAMPUS_OFFER','REGISTRATION_CHANGE','ABSENCE_DISPUTE','CORRECTION_WITH_PROOF','PLACEMENT_AFTER_PLACEMENT')`,
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
      sql`(${table.requestType} = 'APPLICATION_WITHDRAWAL' and ${table.applicationId} is not null and ${table.roundId} is null and ${table.offerId} is null)
        or (${table.requestType} = 'ROUND_RESCHEDULE' and ${table.applicationId} is not null and ${table.roundId} is not null and ${table.offerId} is null)
        or (${table.requestType} = 'OFFER_EXTENSION' and ${table.applicationId} is not null and ${table.roundId} is null and ${table.offerId} is not null)
        or (${table.requestType} in ('OFF_CAMPUS_OFFER','REGISTRATION_CHANGE','ABSENCE_DISPUTE','CORRECTION_WITH_PROOF','PLACEMENT_AFTER_PLACEMENT')
          and ${table.roundId} is null and ${table.offerId} is null
          and jsonb_typeof(${table.effectPayload}) = 'object')`,
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

/** Audit crosswalk: public placement views may not project these private fields. */
export const LEGACY_PLACEMENT_APPLICATION_FIELD_OWNER = {
  resume_url: "placement_application_private_artifacts.resume_object_path",
  resume_history: "placement_application_private_artifacts.resume_history",
  assessment_url: "placement_application_private_artifacts.assessment_url",
  offer_letter_url: "placement_offers.offer_letter_object_path",
  pap_requested: "placement_applications.pap_requested",
  external_ref: "placement_applications.external_ref",
  current_round_id: "placement_applications.current_round_id",
  applied_by_college: "placement_applications.applied_by_college",
  applied_by_college_opt_out_until: "placement_applications.applied_by_college_opt_out_until",
  status_before_withdrawal: "placement_applications.status_before_withdrawal",
  private_gender: "REQUIRES_PURPOSE_AND_CANDIDATE_CONSENT_NOT_IMPORTED",
} as const;

/** Scoped, revocable job URLs do not grant access to private application data. */
export const placementPublicExternalJobLinks = pgTable(
  "placement_public_external_job_links",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    jobId: uuid("job_id").notNull(),
    collegeId: uuid("college_id").notNull(),
    slug: varchar("slug", { length: 20 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    viewsCount: integer("views_count").notNull().default(0),
  },
  (table) => [
    foreignKey({
      name: "public_external_job_scoped_fk",
      columns: [table.jobId, table.collegeId],
      foreignColumns: [placementJobs.id, placementJobs.collegeId],
    }).onDelete("restrict"),
    uniqueIndex("public_external_job_slug_uq").on(table.slug),
    index("public_external_job_college_idx").on(table.collegeId, table.jobId),
    check("public_external_job_slug_ck", sql`${table.slug} ~ '^smr-[0-9a-f]{16}$'`),
    check("public_external_job_views_ck", sql`${table.viewsCount} >= 0`),
  ],
);

/** Unknown PG evidence never behaves as confirmed absence of qualification. */
export function evaluatePostgraduatePlacementRequirement(input: {
  minimumBasisPoints: number | null;
  hasPostgraduateQualification: boolean | null;
  postgraduatePctBasisPoints: number | null;
}): "PASS" | "FAIL" | "MISSING" | "NOT_APPLICABLE" {
  if (input.minimumBasisPoints === null) return "NOT_APPLICABLE";
  if (input.hasPostgraduateQualification === false) return "NOT_APPLICABLE";
  if (input.hasPostgraduateQualification === null) return "MISSING";
  if (input.postgraduatePctBasisPoints === null) return "MISSING";
  return input.postgraduatePctBasisPoints >= input.minimumBasisPoints ? "PASS" : "FAIL";
}

/** Source JobApplication uses one learner+job status; vNext permits distinct
 * role-option submissions and retains each as its own application. During an
 * explicitly approved legacy import choose a single mapped role option per
 * old job record, then prevent duplicate source legacy_application_id rows.
 * Status projection joins job/application, manual screening, college stage,
 * verified offer release and joining histories. Never infer OFFERED from a
 * draft or from SELECTED before verification. */
export const LEGACY_JOB_APPLICATION_STAGE_CROSSWALK={
 APPLIED:{application:"SUBMITTED",stage:"APPLIED",screening:null,offer:null},
 SHORTLISTED:{application:"SUBMITTED",stage:"SHORTLISTED",screening:"SHORTLISTED",offer:null},
 ASSESSMENT:{application:"SUBMITTED",stage:"ASSESSMENT",screening:"SHORTLISTED",offer:null},
 INTERVIEW:{application:"SUBMITTED",stage:"INTERVIEW",screening:"SHORTLISTED",offer:null},
 WAITLISTED:{application:"SUBMITTED",stage:"WAITLISTED",screening:"SHORTLISTED",offer:null},
 OFFERED:{application:"SUBMITTED",stage:"OFFERED",screening:"SHORTLISTED",offer:"ISSUED"},
 HIRED:{application:"SUBMITTED",stage:"HIRED",screening:"SHORTLISTED",offer:"ACCEPTED"},
 REJECTED:{application:"SUBMITTED",stage:"REJECTED",screening:"REJECTED",offer:null},
 WITHDRAWN:{application:"WITHDRAWN",stage:null,screening:null,offer:null},
} as const;
/** Selected and pending-verification are recorded as placement-drive selection
 * steps, not artificially issued offers. "Released" maps to ISSUED with
 * releasedAt + verifier, and REVOKED maps to WITHDRAWN with audited reason.
 * Joining outcome has its own source-backed timeline, independent of consent
 * to the offer. Source offer @Version is separate from issuance version. */
export const LEGACY_TPO_OFFER_STATE_CROSSWALK={
 SELECTED:{selection:"SELECTED",offerStatus:null},
 PENDING_VERIFICATION:{selection:"PENDING_VERIFICATION",offerStatus:null},
 RELEASED:{selection:"RELEASED",offerStatus:"ISSUED"},
 ACCEPTED:{selection:"RELEASED",offerStatus:"ACCEPTED"},
 DECLINED:{selection:"RELEASED",offerStatus:"DECLINED"},
 EXPIRED:{selection:"RELEASED",offerStatus:"EXPIRED"},
 WITHDRAWN:{selection:"RELEASED",offerStatus:"WITHDRAWN"},
 REVOKED:{selection:"REVOKED",offerStatus:"WITHDRAWN"},
} as const;

/** Import-only grant capability crosswalk. Unknown values are retained for
 * review, not included in an effective vNext entitlement. A missing company
 * relationship or verification blocks activation regardless of capabilities. */
export const LEGACY_RECRUITER_GRANT_CAPABILITIES=[
 "DRIVES","APPLICANT_EXPORT","INTERVIEWS","MESSAGES",
] as const;
export function legacyRecruiterCapabilityDisposition(raw:readonly string[]){
 const allowed=new Set<string>(LEGACY_RECRUITER_GRANT_CAPABILITIES);
 const accepted=[...new Set(raw.filter(value=>allowed.has(value)))];
 const unknown=[...new Set(raw.filter(value=>!allowed.has(value)))];
 return {accepted,unknown,requiresReview:unknown.length>0||accepted.length===0};
}
/** One historical Interview row maps to a booked candidate slot and
 * immutable lifecycle/feedback events; never a globally unscoped interview. */
export const LEGACY_INTERVIEW_FIELD_DISPOSITION={
 id:"placementRoundCandidateSlots.legacyInterviewId",
 job:"placementRoundCandidateSlots.jobId via scoped placementJobs",
 application:"placementRoundCandidateSlots.applicationId",
 learner:"placementApplications.membershipId",
 interviewType:"placementRoundCandidateSlots.legacyInterviewType",
 interviewStatus:"placementRoundCandidateSlots.legacyInterviewStatus",
 scheduledDate:"placementRoundCandidateSlots.legacyScheduledAt",
 location:"placementRoundCandidateSlots.legacyLocation",
 interviewer:"placementRoundCandidateSlots.legacyInterviewerName",
 feedback:"placementInterviewPrivateEvents.privateFeedback (staff only)",
 reschedules:"placementRoundCandidateSlots.legacyRescheduleHistory and private events",
} as const;
export const LEGACY_COMPANY_RELATIONSHIP_FIELD_DISPOSITION={
 id:"placementCompanyRelationships.id (import alias required)",
 collegeId:"placementCompanyRelationships.collegeId",
 companyId:"placementCompanyRelationships.companyId",
 contactName:"placementCompanyRelationships.contactPersonName (private college CRM)",
 contactEmail:"placementCompanyRelationships.contactEmail (private college CRM)",
 contactPhone:"placementCompanyRelationships.contactPhone (private college CRM)",
 ownerFacultyId:"archived source mapping, activate only after same-college verified owner membership",
 internalNotes:"placementCompanyRelationships.internalNotes (never org-public)",
 isTrusted:"placementCompanyRelationships.isTrusted",
 joinTokenHash:"placementPublicJoinLinks.tokenHash (rotated, never reuse legacy token)",
 joinOpens:"placementPublicJoinLinks.opensCount (atomic)",
 joinCount:"placementPublicJoinLinks.joinsCount (atomic)",
} as const;

/** Legacy round identity is an import alias, never an unscoped grant.
 * Local MySQL schedule times must be converted using the verified source
 * college timezone; absent creator IDs require a dedicated service actor,
 * not impersonation of an arbitrary human user. */
export const LEGACY_ROUND_FIELD_DISPOSITION={
 id:"placementJobRounds.legacyRoundId",
 jobId:"placementJobRounds.jobId via verified same-college mapping",
 sequence:"placementJobRounds.sequence",
 description:"placementJobRounds.legacyRoundDescription",
 interviewType:"placementJobRounds.legacyInterviewType",
 mode:"placementJobRounds.legacyMode",
 scheduledDate:"placementJobRounds.scheduledAt after explicit source-zone conversion",
 createdBy:"placementJobRounds.createdByUserId (verified or service actor)",
 meetingLink:"placementJobRounds.meetingUrl",
 testLink:"placementJobRounds.testUrl",
 resultsDueAt:"placementJobRounds.resultsDueAt",
} as const;
export const LEGACY_PLACEMENT_ACTOR_POLICY={
 verified:"Preserve original actor after verified numeric-to-UUID user mapping",
 missing:"Use explicit tenant-scoped service actor and retain null historic source attribution",
 unknown:"Quarantine unverified identities, never attribute a real faculty or TPO user",
} as const;

/** The old recruiter row type and organization source ID cannot grant
 * current tenant access. Suspension is a persisted profile state plus
 * session/OTP revocation request, not a fake revoked company grant. */
export const LEGACY_RECRUITER_SUSPENSION_ACTION={
 profileStatus:"SUSPENDED",
 recordReason:"placementRecruiterProfiles.suspensionReason",
 revokedSessionScope:"current principal, all selected memberships",
 revokeOutstandingLoginChallenges:true,
 retainCollegeGrantsForAudit:true,
} as const;

/** A global company may have several college relationships; that does not
 * create new global company identities. Aliases require one canonical UUID
 * and verified-domain proof before switching active recruiter grants. */
export function legacyCompanyCanonicalization(input:{
 legacyCompanyId:number;canonicalCompanyId:string;collegeId:string;
 relationshipId:string;verifiedDomain:boolean;aliasCompanyId:string|null;
}){
 const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
 if(!Number.isSafeInteger(input.legacyCompanyId)||input.legacyCompanyId<1||
   !uuid.test(input.canonicalCompanyId)||!uuid.test(input.collegeId)||
   !uuid.test(input.relationshipId)||!input.verifiedDomain)
  throw Error("Cannot promote unverified global company alias");
 if(input.aliasCompanyId!==null&&!uuid.test(input.aliasCompanyId))
  throw Error("Company alias needs a canonical identity");
 if(input.aliasCompanyId===input.canonicalCompanyId)
  throw Error("Company cannot alias itself");
 return {...input,requiresRelationshipGrant:true as const,
   reuseCanonicalCompany:true as const};
}


/** Lossless projection rules for an old Job entity. Request-state records
 * remain recruiter requests, not an invented published placement_job row.
 * A historic organization-wide drive needs explicit host-college fanout
 * approval; we never infer a campus from its first application.
 */
export function legacyPlacementJobLifecycleImport(input:{
  legacyJobId:number;
  sourceStatus:"REQUEST"|"SENT_BACK"|"REJECTED"|"DRAFT"|"PUBLISHED"|"CLOSED"|"CANCELLED";
  isDraft:boolean;isActive:boolean;isDeleted:boolean;
  organizationId:string;collegeId:string|null;seasonId:string|null;
  sourceVersion:number;
}){
 if(!Number.isSafeInteger(input.legacyJobId)||input.legacyJobId<1||
    !Number.isSafeInteger(input.sourceVersion)||input.sourceVersion<0)
  throw new Error("Invalid source job identity or version");
 if(!input.organizationId||!input.seasonId)
  throw new Error("Source job needs a verified organization and season crosswalk");
 const request=["REQUEST","SENT_BACK","REJECTED"].includes(input.sourceStatus);
 if(request)return {
   destination:"RECRUITER_DRIVE_REQUEST" as const,
   sourceId:input.legacyJobId,status:input.sourceStatus,
   sourceVersion:input.sourceVersion,
 };
 if(!input.collegeId)return {
   destination:"REQUIRES_ORGANIZATION_WIDE_APPROVAL" as const,
   sourceId:input.legacyJobId,sourceVersion:input.sourceVersion,
 };
 const status=input.isDeleted?"ARCHIVED":
   input.sourceStatus==="CANCELLED"?"CANCELLED":
   input.sourceStatus==="CLOSED"||!input.isActive?"CLOSED":
   input.isDraft?"DRAFT":"PUBLISHED";
 return {destination:"COLLEGE_JOB" as const,legacyJobId:input.legacyJobId,
   collegeId:input.collegeId,seasonId:input.seasonId,
   organizationId:input.organizationId,status,sourceVersion:input.sourceVersion,
   legacyWasDeleted:input.isDeleted,
   /** Include archived source rows in audit/history, not the active drive list. */
   visibleToLearners:status==="PUBLISHED",
 };
}

/** Never include write-only evaluation config or raw assessment credentials
 * in the public job DTO, even when an importer archived original JSON. */
export function redactLegacyPlacementJobDetails<T extends Record<string,unknown>>(
 source:T,
):Omit<T,"evaluationConfig"|"assessmentUrl"|"legacyTargeting">{
 const {evaluationConfig: _evaluationConfig,
  assessmentUrl: _assessmentUrl,
  legacyTargeting: _legacyTargeting,...safe}=source;
 return safe;
}


/** Old industry-company merges used numeric identity and could leave
 * historical job references to the source company. The new canonical merge
 * retains every source through immutable placement_company_merge_history,
 * rather than deleting or reparenting audited applications. */
export function legacyCompanyMergeMigrationPlan(rows:readonly {
  legacySourceId:number;legacyTargetId:number;
  sourceCompanyUuid:string;targetCompanyUuid:string;
  mergedByUserId:string;reason:string|null;mergedAt:string;
}[]){
 const id=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
 const edges=new Map<number,number>();
 for(const row of rows){
  if(!Number.isSafeInteger(row.legacySourceId)||row.legacySourceId<1||
    !Number.isSafeInteger(row.legacyTargetId)||row.legacyTargetId<1||
    row.legacySourceId===row.legacyTargetId||
    !id.test(row.sourceCompanyUuid)||!id.test(row.targetCompanyUuid)||
    row.sourceCompanyUuid===row.targetCompanyUuid||
    !id.test(row.mergedByUserId)||
    !Number.isFinite(Date.parse(row.mergedAt))||
    !/(?:Z|[+-]\d{2}:\d{2})$/.test(row.mergedAt))
   throw new Error("Invalid legacy company merge crosswalk");
  if(edges.has(row.legacySourceId))
   throw new Error("Duplicate legacy company merge source");
  edges.set(row.legacySourceId,row.legacyTargetId);
 }
 for(const source of edges.keys()){
  const traversed=new Set<number>();
  let next:number|undefined=source;
  while(next!==undefined){
   if(traversed.has(next))throw new Error("Cyclic historic company merges");
   traversed.add(next);
   next=edges.get(next);
  }
 }
 return rows.map(row=>({
  sourceCompanyId:row.sourceCompanyUuid,targetCompanyId:row.targetCompanyUuid,
  mergedByUserId:row.mergedByUserId,reason:row.reason?.trim().slice(0,2000)??null,
  mergedAt:new Date(row.mergedAt),
  preserveHistoricalJobRelationships:true as const,
 }));
}

/** No AI screening is activated. A historic interviewer's 1–5 feedback
 * and old source action are retained as staff-audited evidence, never
 * recomputed into a candidate ranking. Terminal transitions remain in
 * separate application/offer status histories. */
export function legacyInterviewFeedbackImport(input:{
 legacyFeedbackId:number;collegeId:string;applicationId:string;roundId:string;
 rating:number|null;remarks:string|null;
 action:string;submittedAt:string;revisedFromId:number|null;
}){
 const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
 if(!Number.isSafeInteger(input.legacyFeedbackId)||input.legacyFeedbackId<1||
    !uuid.test(input.collegeId)||!uuid.test(input.applicationId)||!uuid.test(input.roundId)||
    input.rating!==null&&(!Number.isSafeInteger(input.rating)||input.rating<1||input.rating>5)||
    input.remarks!==null&&input.remarks.length>2000||
    !/^(SUBMIT|REVISE|FINALIZE)$/.test(input.action)||
    input.revisedFromId!==null&&(
      !Number.isSafeInteger(input.revisedFromId)||input.revisedFromId<1||
      input.revisedFromId===input.legacyFeedbackId)||
    !/(?:Z|[+-]\d{2}:\d{2})$/.test(input.submittedAt)||
    !Number.isFinite(Date.parse(input.submittedAt)))
  throw new Error("Invalid historic interview feedback");
 return {...input,submittedAt:new Date(input.submittedAt),
  staffOnly:true as const,affectsCurrentTerminalStatus:false as const};
}


/** College CRM data from an old IndustryCompany stays private to that
 * college's relationship; never attach the contact or notes to the global
 * canonical company row. Merge restoration does not imply a new grant. */
export function legacyCollegeCompanyRelationshipImport(input:{
  companyId:string;collegeId:string;
  sourceCompanyId:number;legacyStatus:string;legacyArchivedAt:string|null;
  contactName:string|null;contactEmail:string|null;contactPhone:string|null;
  internalNotes:string|null;ownerMembershipId:string|null;
  ownerCollegeId:string|null;
}){
 const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
 if(!uuid.test(input.companyId)||!uuid.test(input.collegeId)||
    !Number.isSafeInteger(input.sourceCompanyId)||input.sourceCompanyId<1)
  throw new Error("Unverified historic company relationship");
 if(input.ownerMembershipId!==null&&(
    !uuid.test(input.ownerMembershipId)||input.ownerCollegeId!==input.collegeId))
  throw new Error("Company CRM owner outside this college");
 const status=input.legacyStatus==="ACTIVE"?"ACTIVE":
   ["DELETED","INACTIVE","ARCHIVED"].includes(input.legacyStatus)?"ARCHIVED":null;
 if(!status)throw new Error("Unsupported historic company relationship status");
 if(status==="ARCHIVED"&&!input.legacyArchivedAt)
  throw new Error("Historic company archive requires verified source time");
 const at=input.legacyArchivedAt===null?null:new Date(input.legacyArchivedAt);
 if(at!==null&&(!Number.isFinite(at.getTime())||
   !/(?:Z|[+-]\d{2}:\d{2})$/.test(input.legacyArchivedAt!)))
  throw new Error("Archive date needs verified timezone");
 if(input.contactName!==null&&input.contactName.length>150||
    input.contactEmail!==null&&input.contactEmail.length>150||
    input.contactPhone!==null&&input.contactPhone.length>30||
    input.internalNotes!==null&&input.internalNotes.length>2000)
  throw new Error("Company contact or notes exceed the private CRM limit");
 return {collegeId:input.collegeId,companyId:input.companyId,status,
  archivedAt:status==="ARCHIVED"?at:null,
  ownerMembershipId:input.ownerMembershipId,
  contactPersonName:input.contactName?.trim()??null,
  contactEmail:input.contactEmail?.trim()??null,
  contactPhone:input.contactPhone?.trim()??null,
  internalNotes:input.internalNotes?.trim()??null,
  newRecruiterGrantAuthorized:false as const};
}


/** One-way historic offer fields. SELECTED is a staging decision, not an
 * issued letter; RELEASED becomes a dated ISSUED offer after a scoped TPO
 * approval. Joining belongs to joining_outcomes, never a fabricated offer
 * acceptance. The archived original LPA remains exact decimal provenance. */
export const LEGACY_PLACEMENT_OFFER_FIELDS={
 id:"placement_offers.legacy_offer_id",
 applicationId:"placement_offers.application_id (validated UUID crosswalk)",
 roleName:"placement_offers.role_title",
 roleOptionName:"placement_offers.legacy_role_option_name",
 ctcLpa:"placement_offers.legacy_ctc_lpa",
 ctcInr:"placement_offers.annual_ctc_inr",
 fixedCtc:"placement_offers.fixed_lpa",
 variableCtc:"placement_offers.variable_lpa",
 joiningBonus:"placement_offers.joining_bonus_lpa",
 bondMonths:"placement_offers.bond_months",
 joiningDate:"placement_offers.joining_date (civil DATE)",
 offerLetterUrl:"placement_offers.offer_letter_object_path (scanned signed grant)",
 expiryDate:"placement_offers.expires_at (timezone validated)",
 accepted:"placement_offers.status = ACCEPTED",
 declined:"placement_offers.status = DECLINED",
 issuedAt:"placement_offers.issued_at",
 createdBy:"placement_offers.issued_by_user_id (verified actor crosswalk)",
 releasedBy:"placement_offers.verified_by_user_id",
 statusHistory:"placement_offer_status_history",
 joiningStatus:"placement_joining_outcomes",
 dispute:"placement_offer_status_history / dispute case",
} as const;
export function legacyPlacementOfferStageDisposition(input:{
 sourceOfferId:number;applicationId:string;collegeId:string;
 selected:boolean;released:boolean;withdrawn:boolean;
 accepted:boolean|null;declined:boolean|null;
 sourceCtcLpa:string|null;
 releasedAt:string|null;
}){
 const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
 if(!Number.isSafeInteger(input.sourceOfferId)||input.sourceOfferId<1||
   !uuid.test(input.applicationId)||!uuid.test(input.collegeId))
  throw new Error("Unmapped legacy offer identity");
 if(input.accepted&&input.declined||input.released&&!input.selected||
    (input.accepted||input.declined||input.withdrawn)&&!input.released||
    input.withdrawn&&(input.accepted||input.declined))
  throw new Error("Conflicting old offer state");
 if(input.releasedAt!==null&&(
   !/(?:Z|[+-]\d{2}:\d{2})$/.test(input.releasedAt)||
   !Number.isFinite(Date.parse(input.releasedAt))))
  throw new Error("Historic release instant requires source timezone verification");
 const ctc=input.sourceCtcLpa?.trim()??"";
 if(ctc&&!/^(?:0|[1-9]\d{0,4})(?:\.\d{1,4})?$/.test(ctc))
  throw new Error("Invalid historic CTC LPA");
 let annualCtcInr:number|null=null;
 if(ctc){
  const [integer="0",fraction=""]=ctc.split(".");
  const scaled=BigInt(integer)*10000n+BigInt(fraction.padEnd(4,"0"));
  const rupees=(scaled*100000n+5000n)/10000n;
  if(rupees>2147483647n)throw new Error("Historic offer CTC exceeds int32 INR");
  annualCtcInr=Number(rupees);
 }
 const state=!input.selected?"NOT_SELECTED":
   !input.released?"SELECTION_STAGED":
   input.withdrawn?"WITHDRAWN":
   input.accepted?"ACCEPTED":
   input.declined?"DECLINED":"ISSUED";
 if(input.released&&input.releasedAt===null)
  throw new Error("Released offer requires verified release time");
 return {legacyOfferId:input.sourceOfferId,
  applicationId:input.applicationId,collegeId:input.collegeId,
  annualCtcInr,legacyCtcLpa:ctc||null,
  state,offerIssuable:state==="ISSUED",
  releaseAt:input.releasedAt===null?null:new Date(input.releasedAt),
  requiresVerifiedIssuer:true as const,
  joiningOutcomeStoredSeparately:true as const};
}
