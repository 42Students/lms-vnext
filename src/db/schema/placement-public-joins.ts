/** Public recruiter join links and their email-code challenges. */
import { sql } from "drizzle-orm";
import { boolean, check, foreignKey, index, integer, pgTable, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { colleges } from "./colleges";

export const placementPublicJoinLinks = pgTable(
  "placement_public_join_links",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tokenHash: varchar("token_hash", { length: 64 }).notNull(),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "restrict" }),
    /** Original college_public_link is keyed by INTEGER college_id, not token UUID. */
    legacyCollegeId: integer("legacy_college_id"),
    /** Raw nonce was a secret reconstructing the old HMAC token; store only
     * a separately keyed digest for reconciliation and rotate the public URL. */
    legacyNonceDigest: varchar("legacy_nonce_digest", { length: 64 }),
    companyId: uuid("company_id"),
    companyDomain: varchar("company_domain", { length: 254 }),
    scope: varchar("scope", { length: 12 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    enabled: boolean("enabled").notNull().default(true),
    postWithoutApproval: boolean("post_without_approval").notNull().default(false),
    opensCount: integer("opens_count").notNull().default(0),
    joinsCount: integer("joins_count").notNull().default(0),
  },
  (table) => [
    check("placement_public_join_links_opens_count_ck", sql`${table.opensCount} >= 0`),
    check("placement_public_join_links_joins_count_ck", sql`${table.joinsCount} >= 0`),
    check("placement_public_join_links_legacy_nonce_ck",
      sql`${table.legacyNonceDigest} is null or ${table.legacyNonceDigest} ~ '^[a-f0-9]{64}$'`),
    uniqueIndex("public_join_links_hash_uq").on(table.tokenHash),
    index("public_join_links_college_idx").on(table.collegeId, table.scope),
    uniqueIndex("public_join_one_active_college_uq").on(table.collegeId)
      .where(sql`${table.scope} = 'COLLEGE' and ${table.revokedAt} is null and ${table.enabled} = true`),
    uniqueIndex("public_join_one_active_company_uq").on(table.collegeId,table.companyId)
      .where(sql`${table.scope} = 'COMPANY' and ${table.revokedAt} is null and ${table.enabled} = true`),
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

/** Per-network (hashed IP) throttle events for public join OTP send and join. */
export const placementPublicJoinRateEvents = pgTable(
  "placement_public_join_rate_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    linkId: uuid("link_id").notNull(),
    ipHash: varchar("ip_hash", { length: 64 }).notNull(),
    action: varchar("action", { length: 12 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    foreignKey({
      name: "public_join_rate_link_fk",
      columns: [table.linkId],
      foreignColumns: [placementPublicJoinLinks.id],
    }).onDelete("restrict"),
    index("public_join_rate_network_time_idx").on(table.ipHash, table.action, table.createdAt.desc()),
    index("public_join_rate_link_time_idx").on(table.linkId, table.createdAt.desc()),
    check("public_join_rate_hash_ck", sql`${table.ipHash} ~ '^[a-f0-9]{64}$'`),
    check("public_join_rate_action_ck", sql`${table.action} in ('SEND_CODE','JOIN')`),
  ],
);

/** Per-network (hashed IP) throttle events for the public "Recruit from us" send-code and recruit actions. */
export const placementPublicEnquiryRateEvents = pgTable(
  "placement_public_enquiry_rate_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "restrict" }),
    ipHash: varchar("ip_hash", { length: 64 }).notNull(),
    action: varchar("action", { length: 12 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("public_enquiry_rate_ip_action_idx").on(table.ipHash, table.action, table.createdAt.desc()),
    check("public_enquiry_rate_ip_ck", sql`${table.ipHash} ~ '^[a-f0-9]{64}$'`),
    check("public_enquiry_rate_action_ck", sql`${table.action} in ('SEND_CODE','RECRUIT')`),
  ],
);

/** Old slug is a lookup hint, never the modern secret-bearing join token. */
export function parseLegacyPublicJoinSlug(raw:unknown):string|null {
 if(typeof raw!=="string"||raw.length>120)return null;
 const slug=raw.trim().toLowerCase();
 return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)?slug:null;
}
