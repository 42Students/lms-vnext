/** Recruiter-submitted drive requests; the TPO Requests queue must read this same table. */
import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { colleges } from "./colleges";
import { placementCompanyRelationships, placementJobs } from "./placements";
import { users } from "./users";

export const placementRecruiterDriveRequests = pgTable(
  "placement_recruiter_drive_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "restrict" }),
    companyRelationshipId: uuid("company_relationship_id").notNull(),
    recruiterUserId: uuid("recruiter_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    /**
     * Idempotent per-college submission nonce; the same verified UUID may
     * correlate a recruiter group across colleges without sharing college
     * relationship/approval authority. This is NOT a placement_job ID.
     */
    submissionId: uuid("submission_id").notNull(),
    sourceJobId: uuid("source_job_id"),
    /** A Job exists only after approval; pending requests have no job identity. */
    approvedJobId: uuid("approved_job_id"),
    status: varchar("status", { length: 24 }).notNull().default("REQUEST"),
    draft: jsonb("draft").$type<Record<string, unknown>>().notNull(),
    decisionNote: text("decision_note"),
    decidedByUserId: uuid("decided_by_user_id").references(() => users.id, { onDelete: "restrict" }),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("placement_recruiter_drive_requests_nonce_uq").on(t.recruiterUserId, t.collegeId, t.submissionId),
    index("placement_recruiter_drive_requests_tpo_inbox_idx").on(t.collegeId, t.status, t.createdAt),
    index("placement_recruiter_drive_requests_own_idx").on(t.recruiterUserId, t.collegeId, t.createdAt),
    foreignKey({
      name: "placement_recruiter_drive_requests_relationship_fk",
      columns: [t.companyRelationshipId, t.collegeId],
      foreignColumns: [placementCompanyRelationships.id, placementCompanyRelationships.collegeId],
    }).onDelete("restrict"),
    foreignKey({
      name: "placement_recruiter_drive_requests_source_job_fk",
      columns: [t.sourceJobId, t.collegeId],
      foreignColumns: [placementJobs.id, placementJobs.collegeId],
    }).onDelete("restrict"),
    foreignKey({
      name: "placement_recruiter_drive_requests_approved_job_fk",
      columns: [t.approvedJobId, t.collegeId],
      foreignColumns: [placementJobs.id, placementJobs.collegeId],
    }).onDelete("restrict"),
    check(
      "placement_recruiter_drive_requests_status_ck",
      sql`${t.status} in ('REQUEST','SENT_BACK','DRAFT','REJECTED','CANCELLED')`,
    ),
    check(
      "placement_recruiter_drive_requests_decision_ck",
      sql`(${t.decidedAt} is null) = (${t.decidedByUserId} is null)`,
    ),
    check("placement_recruiter_drive_requests_draft_ck", sql`jsonb_typeof(${t.draft}) = 'object'`),
  ],
);
