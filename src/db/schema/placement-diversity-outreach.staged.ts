/**
 * Private, privacy-reviewed diversity OUTREACH only. This is not the job
 * eligibility policy and must never enter recruiter, ATS, public job, CSV or
 * learner-screening projections. Retain a separate purpose-specific table.
 * 0310 is a staged migration; runtime stays disabled until college privacy
 * approval, journal replay and negative-role/tenant testing are complete.
 */
import { sql } from "drizzle-orm";
import { check, integer, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { placementJobs } from "./placements";
import { users } from "./users";

export const placementJobDiversityOutreach = pgTable("placement_job_diversity_outreach", {
  jobId: uuid("job_id").primaryKey()
    .references(() => placementJobs.id, { onDelete: "restrict" }),
  targetGender: varchar("target_gender", { length: 32 }).notNull(),
  reason: text("reason").notNull(),
  status: varchar("status", { length: 16 }).notNull().default("DRAFT"),
  version: integer("version").notNull().default(1),
  createdByUserId: uuid("created_by_user_id").notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  approvedByUserId: uuid("approved_by_user_id")
    .references(() => users.id, { onDelete: "restrict" }),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [
  check("placement_job_diversity_gender_ck",
    sql`${t.targetGender} in ('FEMALE','MALE','NON_BINARY','SELF_DESCRIBED')`),
  check("placement_job_diversity_reason_ck",
    sql`length(btrim(${t.reason})) between 20 and 1000`),
  check("placement_job_diversity_status_ck",
    sql`${t.status} in ('DRAFT','APPROVED','DISABLED')`),
  check("placement_job_diversity_version_ck", sql`${t.version} >= 1`),
  check("placement_job_diversity_approval_ck",
    sql`(${t.approvedByUserId} is null) = (${t.approvedAt} is null)`),
  check("placement_job_diversity_separation_ck",
    sql`${t.approvedByUserId} is null or ${t.createdByUserId} <> ${t.approvedByUserId}`),
  check("placement_job_diversity_approved_ck",
    sql`${t.status} <> 'APPROVED' or ${t.approvedByUserId} is not null`),
]);
