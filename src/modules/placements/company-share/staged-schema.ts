/** Staged only. The orchestrator must register and replay the SQL migration. */
import { check, index, pgTable, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const placementCompanyApplicantShares = pgTable("placement_company_applicant_shares", {
  id: uuid("id").defaultRandom().primaryKey(),
  collegeId: uuid("college_id").notNull(),
  jobId: uuid("job_id").notNull(),
  createdByMembershipId: uuid("created_by_membership_id").notNull(),
  tokenHash: varchar("token_hash", {length:64}).notNull(),
  expiresAt: timestamp("expires_at", {withTimezone:true}).notNull(),
  revokedAt: timestamp("revoked_at", {withTimezone:true}),
  createdAt: timestamp("created_at", {withTimezone:true}).notNull().defaultNow(),
}, t => [
  uniqueIndex("pcas_token_hash_uq").on(t.tokenHash),
  index("pcas_college_job_idx").on(t.collegeId,t.jobId),
  check("pcas_hash_shape_ck",sql`${t.tokenHash} ~ '^[a-f0-9]{64}$'`),
  check("pcas_expiry_ck",sql`${t.expiresAt} > ${t.createdAt}`),
]);

export const placementCompanyApplicantShareViews = pgTable("placement_company_applicant_share_views",{
  id:uuid("id").defaultRandom().primaryKey(),
  shareId:uuid("share_id").notNull(),
  collegeId:uuid("college_id").notNull(),
  eventKind:varchar("event_kind",{length:12}).notNull(),
  occurredAt:timestamp("occurred_at",{withTimezone:true}).notNull().defaultNow(),
}, t=>[
  index("pcas_views_share_idx").on(t.shareId,t.occurredAt),
  check("pcas_views_kind_ck",sql`${t.eventKind} IN ('VIEW','CSV')`),
]);
