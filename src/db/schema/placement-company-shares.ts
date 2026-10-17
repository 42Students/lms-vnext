/** Company applicant share capabilities (hashed token) and durable view audit. */
import { sql } from "drizzle-orm";
import {
  check,
  integer,
  jsonb,
  foreignKey,
  index,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { colleges } from "./colleges";
import { collegeMemberships } from "./memberships";
import { placementJobs } from "./placements";

export const placementCompanyApplicantShares = pgTable(
  "placement_company_applicant_shares",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "restrict" }),
    jobId: uuid("job_id")
      .notNull()
      .references(() => placementJobs.id, { onDelete: "restrict" }),
    createdByMembershipId: uuid("created_by_membership_id")
      .notNull()
      .references(() => collegeMemberships.id, { onDelete: "restrict" }),
    tokenHash: varchar("token_hash", { length: 64 }).notNull(),
    codeHash: varchar("code_hash", { length: 64 }).notNull(),
    codeSalt: varchar("code_salt", { length: 32 }).notNull(),
    wrongCodeCount: integer("wrong_code_count").notNull().default(0),
    wrongCodeWindowStart: timestamp("wrong_code_window_start", { withTimezone: true }),
    lockedUntil: timestamp("locked_until", { withTimezone: true }),
    selectedColumns: jsonb("selected_columns").$type<string[]>().notNull()
      .default(sql`'["APPLICATION_ID","NAME","EMAIL"]'::jsonb`),
    shortlistBy: timestamp("shortlist_by", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("pcas_token_hash_uq").on(t.tokenHash),
    uniqueIndex("pcas_share_id_college_uq").on(t.id, t.collegeId),
    index("pcas_college_job_idx").on(t.collegeId, t.jobId),
    check("pcas_wrong_code_count_ck", sql`${t.wrongCodeCount} between 0 and 10`),
    check("pcas_hash_shape_ck", sql`${t.tokenHash} ~ '^[a-f0-9]{64}$'`),
    check("pcas_expiry_ck", sql`${t.expiresAt} > ${t.createdAt}`),
    foreignKey({
      columns: [t.jobId, t.collegeId],
      foreignColumns: [placementJobs.id, placementJobs.collegeId],
      name: "pcas_job_tenant_fk",
    }),
    foreignKey({
      columns: [t.createdByMembershipId, t.collegeId],
      foreignColumns: [collegeMemberships.id, collegeMemberships.collegeId],
      name: "pcas_actor_tenant_fk",
    }),
  ],
);

export const placementCompanyApplicantShareViews = pgTable(
  "placement_company_applicant_share_views",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    shareId: uuid("share_id")
      .notNull()
      .references(() => placementCompanyApplicantShares.id, { onDelete: "restrict" }),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "restrict" }),
    eventKind: varchar("event_kind", { length: 12 }).notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("pcas_views_share_idx").on(t.shareId, t.occurredAt.desc()),
    check("pcas_views_kind_ck", sql`${t.eventKind} IN ('VIEW','CSV','LOCKED')`),
    foreignKey({
      columns: [t.shareId, t.collegeId],
      foreignColumns: [placementCompanyApplicantShares.id, placementCompanyApplicantShares.collegeId],
      name: "pcas_views_tenant_fk",
    }),
  ],
);
