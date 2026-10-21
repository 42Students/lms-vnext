import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  numeric,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
  text,
} from "drizzle-orm/pg-core";
import { colleges } from "./colleges";
import { collegeMemberships } from "./memberships";
import { placementApplications, placementJobRounds, placementJobs } from "./placements";
import { users } from "./users";

/**
 * Registered in migration 0094. DB08-C: a REAL off-campus placement, never a synthetic placement job,
 * application or on-campus offer.
 *
 * The optional letter is a PRIVATE storage object reference, never a public
 * URL. A VERIFIED status requires a reviewer and timestamp. Pending/rejected
 * offers cannot enter held-CTC or placed aggregations.
 */
export const placementExternalOffers = pgTable(
  "placement_external_offers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    collegeId: uuid("college_id").notNull()
      .references(() => colleges.id, { onDelete: "restrict" }),
    membershipId: uuid("membership_id").notNull()
      .references(() => collegeMemberships.id, { onDelete: "restrict" }),
    companyName: varchar("company_name", { length: 200 }).notNull(),
    ctcLpa: numeric("ctc_lpa", { precision: 10, scale: 2 }),
    privateLetterObjectPath: text("private_letter_object_path"),
    submittedByUserId: uuid("submitted_by_user_id").notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    status: varchar("status", { length: 24 }).notNull().default("SUBMITTED"),
    reviewedByUserId: uuid("reviewed_by_user_id")
      .references(() => users.id, { onDelete: "restrict" }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    reviewReason: varchar("review_reason", { length: 500 }),
    revokedByUserId: uuid("revoked_by_user_id")
      .references(() => users.id, { onDelete: "restrict" }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    revokeReason: varchar("revoke_reason", { length: 500 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("placement_external_offers_college_status_idx").on(t.collegeId, t.status),
    index("placement_external_offers_member_status_idx").on(t.membershipId, t.status),
    check("placement_external_offers_company_name_ck",
      sql`length(trim(${t.companyName})) > 0`),
    check("placement_external_offers_ctc_ck",
      sql`${t.ctcLpa} is null or ${t.ctcLpa} >= 0`),
    check("placement_external_offers_status_ck",
      sql`${t.status} in ('SUBMITTED','VERIFIED','REJECTED','REVOKED')`),
    check("placement_external_offers_verified_ck",
      sql`(${t.status} = 'SUBMITTED' and ${t.reviewedByUserId} is null and ${t.reviewedAt} is null
        and ${t.revokedByUserId} is null and ${t.revokedAt} is null)
        or (${t.status} in ('VERIFIED','REJECTED') and ${t.reviewedByUserId} is not null
          and ${t.reviewedAt} is not null and ${t.revokedByUserId} is null and ${t.revokedAt} is null)
        or (${t.status} = 'REVOKED' and ${t.reviewedByUserId} is not null
          and ${t.reviewedAt} is not null and ${t.revokedByUserId} is not null
          and ${t.revokedAt} is not null)`),
    check("placement_external_offers_revoke_reason_ck",
      sql`${t.status} <> 'REVOKED' or length(trim(coalesce(${t.revokeReason},''))) > 0`),
  ],
);

export const placementExternalOfferEvents = pgTable(
  "placement_external_offer_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    offerId: uuid("offer_id").notNull()
      .references(() => placementExternalOffers.id, { onDelete: "restrict" }),
    priorStatus: varchar("prior_status", { length: 24 }),
    nextStatus: varchar("next_status", { length: 24 }).notNull(),
    actorUserId: uuid("actor_user_id").notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    reason: varchar("reason", { length: 500 }),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("placement_external_offer_events_offer_idx").on(t.offerId, t.occurredAt),
    check("placement_external_offer_events_status_ck",
      sql`${t.nextStatus} in ('SUBMITTED','VERIFIED','REJECTED','REVOKED')`),
  ],
);

/**
 * A learner's saved job is NOT an application. It is private to their college.
 * Legacy learner_saved_job int learnerId/jobId -> trusted membership/job UUID
 * crosswalk. Legacy created_at is savedAt only after source-zone validation;
 * historical duplicates across colleges must not become global saved jobs.
 */
export const placementSavedJobs = pgTable(
  "placement_saved_jobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    collegeId: uuid("college_id").notNull()
      .references(() => colleges.id, { onDelete: "restrict" }),
    membershipId: uuid("membership_id").notNull()
      .references(() => collegeMemberships.id, { onDelete: "restrict" }),
    jobId: uuid("job_id").notNull()
      .references(() => placementJobs.id, { onDelete: "restrict" }),
    savedAt: timestamp("saved_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    foreignKey({
      name: "placement_saved_jobs_member_college_fk",
      columns: [t.membershipId, t.collegeId],
      foreignColumns: [collegeMemberships.id, collegeMemberships.collegeId],
    }).onDelete("restrict"),
    foreignKey({
      name: "placement_saved_jobs_job_college_fk",
      columns: [t.jobId, t.collegeId],
      foreignColumns: [placementJobs.id, placementJobs.collegeId],
    }).onDelete("restrict"),
    uniqueIndex("placement_saved_jobs_member_job_uq").on(t.membershipId, t.jobId),
    index("placement_saved_jobs_college_idx").on(t.collegeId, t.membershipId),
  ],
);

/** LEARNER-placements-35: a learner's own intention to attend a scheduled round (not staff attendance). */
export const placementLearnerRoundConfirmations = pgTable(
  "placement_learner_round_confirmations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    collegeId: uuid("college_id").notNull()
      .references(() => colleges.id, { onDelete: "restrict" }),
    membershipId: uuid("membership_id").notNull()
      .references(() => collegeMemberships.id, { onDelete: "restrict" }),
    applicationId: uuid("application_id").notNull()
      .references(() => placementApplications.id, { onDelete: "restrict" }),
    roundId: uuid("round_id").notNull()
      .references(() => placementJobRounds.id, { onDelete: "restrict" }),
    status: varchar("status", { length: 16 }).notNull().default("CONFIRMED"),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("placement_learner_round_confirmations_uq").on(t.applicationId, t.roundId),
    index("placement_learner_round_confirmations_owner_idx").on(t.collegeId, t.membershipId, sql`${t.updatedAt} desc`),
    check("placement_learner_round_confirmations_status_ck", sql`${t.status} in ('CONFIRMED','CANCELLED')`),
  ],
);
