import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  date,
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
import { cohorts } from "./academics";
import { colleges } from "./colleges";
import { collegeMemberships } from "./memberships";
import {
  placementJobs,
  placementLearnerRequests,
  placementSeasons,
} from "./placements";
import { users } from "./users";

/**
 * DB08-B: placement-specific cohort lifecycle, separate from academic cohort
 * and season. No row means NOT_STARTED, not a synthetic default.
 * Same-college linkage is checked in the owning service because cohorts derive
 * their college through program -> department.
 */
export const placementBatches = pgTable(
  "placement_batches",
  {
    cohortId: uuid("cohort_id")
      .primaryKey()
      .references(() => cohorts.id, { onDelete: "restrict" }),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "restrict" }),
    registrationDeadline: timestamp("registration_deadline", {
      withTimezone: true,
    }),
    invitedAt: timestamp("invited_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    rulesOverride: jsonb("rules_override"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("placement_batches_college_idx").on(table.collegeId),
    check(
      "placement_batches_lifecycle_ck",
      sql`${table.finishedAt} is null or
        (${table.invitedAt} is not null and ${table.finishedAt} >= ${table.invitedAt})`,
    ),
  ],
);

/**
 * DB08-B: legacy placement_registration is one choice per learner+season,
 * independent from generic job preferences and application state.
 */
export const placementRegistrations = pgTable(
  "placement_registrations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    membershipId: uuid("membership_id")
      .notNull()
      .references(() => collegeMemberships.id, { onDelete: "restrict" }),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "restrict" }),
    seasonId: uuid("season_id")
      .notNull()
      .references(() => placementSeasons.id, { onDelete: "restrict" }),
    choice: varchar("choice", { length: 20 }).notNull(),
    consentVersion: varchar("consent_version", { length: 10 }),
    consentAt: timestamp("consent_at", { withTimezone: true }),
    source: varchar("source", { length: 15 }).notNull().default("SELF"),
    outcomeLabel: varchar("outcome_label", { length: 60 }),
    outcomeDetail: varchar("outcome_detail", { length: 200 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("placement_registrations_membership_season_uq").on(
      table.membershipId,
      table.seasonId,
    ),
    index("placement_registrations_college_season_idx").on(
      table.collegeId,
      table.seasonId,
      table.choice,
    ),
    check(
      "placement_registrations_choice_ck",
      sql`${table.choice} in ('PLACEMENTS', 'HIGHER_STUDIES', 'NOT_INTERESTED')`,
    ),
    check(
      "placement_registrations_source_ck",
      sql`${table.source} in ('SELF', 'TPO', 'BACKFILL')`,
    ),
    check(
      "placement_registrations_consent_pair_ck",
      sql`(${table.consentVersion} is null and ${table.consentAt} is null)
        or (${table.consentVersion} is not null and ${table.consentAt} is not null)`,
    ),
  ],
);

/**
 * DB08-C: historical holds persist after lifting. A missing end date and
 * missing drive count mean indefinite debarment, as with nullable legacy data.
 */
export const placementDebarments = pgTable(
  "placement_debarments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "restrict" }),
    membershipId: uuid("membership_id")
      .notNull()
      .references(() => collegeMemberships.id, { onDelete: "restrict" }),
    reason: varchar("reason", { length: 500 }).notNull(),
    untilDate: date("until_date", { mode: "string" }),
    untilDrives: integer("until_drives"),
    drivesCounted: integer("drives_counted").notNull().default(0),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    liftedByUserId: uuid("lifted_by_user_id").references(
      () => users.id,
      { onDelete: "restrict" },
    ),
    liftedAt: timestamp("lifted_at", { withTimezone: true }),
    liftedReason: varchar("lifted_reason", { length: 500 }),
  },
  (table) => [
    uniqueIndex("placement_debarments_one_unlifted_uq")
      .on(table.collegeId, table.membershipId)
      .where(sql`${table.liftedAt} is null`),
    index("placement_debarments_history_idx").on(
      table.collegeId,
      table.membershipId,
      table.createdAt,
    ),
    check(
      "placement_debarments_reason_ck",
      sql`length(trim(${table.reason})) > 0`,
    ),
    check(
      "placement_debarments_count_ck",
      sql`${table.drivesCounted} >= 0 and
        (${table.untilDrives} is null or ${table.untilDrives} > 0)`,
    ),
    check(
      "placement_debarments_lift_ck",
      sql`(${table.liftedAt} is null and ${table.liftedByUserId} is null
        and ${table.liftedReason} is null)
        or (${table.liftedAt} is not null and ${table.liftedByUserId} is not null
        and length(trim(coalesce(${table.liftedReason}, ''))) > 0)`,
    ),
  ],
);

/** Each counted job drive is unique so retries do not increase the counter. */
export const placementDebarmentDriveEvents = pgTable(
  "placement_debarment_drive_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    debarmentId: uuid("debarment_id")
      .notNull()
      .references(() => placementDebarments.id, { onDelete: "restrict" }),
    jobId: uuid("job_id")
      .notNull()
      .references(() => placementJobs.id, { onDelete: "restrict" }),
    countedByUserId: uuid("counted_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    countedAt: timestamp("counted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("placement_debarment_drive_once_uq").on(
      table.debarmentId,
      table.jobId,
    ),
  ],
);

/** DB08-D: a verified off-campus result is NOT a fictional job/application. */
export const placementExternalOutcomes = pgTable(
  "placement_external_outcomes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "restrict" }),
    membershipId: uuid("membership_id")
      .notNull()
      .references(() => collegeMemberships.id, { onDelete: "restrict" }),
    requestId: uuid("request_id").references(
      () => placementLearnerRequests.id,
      { onDelete: "restrict" },
    ),
    companyName: varchar("company_name", { length: 200 }).notNull(),
    annualCtcInr: bigint("annual_ctc_inr", { mode: "number" }),
    letterObjectPath: text("letter_object_path"),
    verifiedByUserId: uuid("verified_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    verifiedAt: timestamp("verified_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    revokedByUserId: uuid("revoked_by_user_id").references(
      () => users.id,
      { onDelete: "restrict" },
    ),
    revocationReason: text("revocation_reason"),
  },
  (table) => [
    uniqueIndex("placement_external_outcomes_request_uq")
      .on(table.requestId)
      .where(sql`${table.requestId} is not null`),
    index("placement_external_outcomes_college_membership_idx").on(
      table.collegeId,
      table.membershipId,
      table.revokedAt,
    ),
    check(
      "placement_external_outcomes_company_ck",
      sql`length(trim(${table.companyName})) > 0`,
    ),
    check(
      "placement_external_outcomes_ctc_ck",
      sql`${table.annualCtcInr} is null or ${table.annualCtcInr} >= 0`,
    ),
    check(
      "placement_external_outcomes_revoke_ck",
      sql`(${table.revokedAt} is null and ${table.revokedByUserId} is null
        and ${table.revocationReason} is null)
        or (${table.revokedAt} is not null and ${table.revokedByUserId} is not null
        and length(trim(coalesce(${table.revocationReason}, ''))) > 0)`,
    ),
  ],
);
