/** Public recruiter join links and their email-code challenges. */
import { sql } from "drizzle-orm";
import { check, index, integer, pgTable, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { colleges } from "./colleges";

export const placementPublicJoinLinks = pgTable(
  "placement_public_join_links",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tokenHash: varchar("token_hash", { length: 64 }).notNull(),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "restrict" }),
    companyId: uuid("company_id"),
    companyDomain: varchar("company_domain", { length: 254 }),
    scope: varchar("scope", { length: 12 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("public_join_links_hash_uq").on(table.tokenHash),
    index("public_join_links_college_idx").on(table.collegeId, table.scope),
    check("placement_public_join_links_token_ck", sql`${table.tokenHash} ~ '^[a-f0-9]{64}$'`),
    check("placement_public_join_links_scope_ck", sql`${table.scope} IN ('COLLEGE','COMPANY')`),
    check(
      "public_join_company_shape",
      sql`(${table.scope}='COLLEGE' AND ${table.companyId} IS NULL AND ${table.companyDomain} IS NULL) OR (${table.scope}='COMPANY' AND ${table.companyId} IS NOT NULL AND ${table.companyDomain} IS NOT NULL)`,
    ),
  ],
);

export const placementPublicJoinChallenges = pgTable(
  "placement_public_join_challenges",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    linkId: uuid("link_id")
      .notNull()
      .references(() => placementPublicJoinLinks.id, { onDelete: "restrict" }),
    workEmail: varchar("work_email", { length: 254 }).notNull(),
    codeHash: varchar("code_hash", { length: 64 }).notNull(),
    attempts: integer("attempts").notNull().default(0),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("public_join_challenges_link_email_idx").on(table.linkId, table.workEmail, table.createdAt.desc()),
    check("placement_public_join_challenges_code_ck", sql`${table.codeHash} ~ '^[a-f0-9]{64}$'`),
    check("placement_public_join_challenges_attempts_ck", sql`${table.attempts} BETWEEN 0 AND 5`),
  ],
);
