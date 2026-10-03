import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
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


export const placementJobs = pgTable(
  "placement_jobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "restrict" }),
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
    index("placement_jobs_college_status_idx").on(
      table.collegeId,
      table.status,
    ),
    index("placement_jobs_relationship_idx").on(
      table.companyRelationshipId,
    ),
    check(
      "placement_jobs_status_ck",
      sql`${table.status} in ('DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED')`,
    ),
    check(
      "placement_jobs_employment_type_ck",
      sql`${table.employmentType} in ('FULL_TIME', 'INTERNSHIP', 'CONTRACT')`,
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
        or (${table.status} = 'ARCHIVED' and ${table.archivedAt} is not null)`,
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
    maxGapYears: integer("max_gap_years"),
    allowedPassingYears: integer("allowed_passing_years")
      .array()
      .notNull()
      .default(sql`'{}'::integer[]`),
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
    uniqueIndex(
      "placement_applications_job_membership_uq",
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
        or (${table.fromStatus} = 'SUBMITTED' and ${table.toStatus} = 'WITHDRAWN')`,
    ),
  ],
);
