/** STAGED only: orchestrator registers this schema after migration approval.
 * TPO-companies-01, TPO-settings-audit-55, TPO-campaigns-public-21.
 * Never import into runtime before registration.
 */
import { boolean, check, index, integer, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { colleges, placementPublicJoinLinks } from "@/db/schema";
import { sql } from "drizzle-orm";

export const stagedPublicJoinLinksWithLifecycle = pgTable("placement_public_join_links", {
  id: uuid("id").primaryKey().defaultRandom(),
  tokenHash: varchar("token_hash", { length: 64 }).notNull(),
  collegeId: uuid("college_id").notNull().references(() => colleges.id, { onDelete: "restrict" }),
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
});

/** STAGED: no runtime imports before network-rate migration registration.
 * TPO-campaigns-public-19, TPO-campaigns-public-20.
 */
export const stagedPublicJoinNetworkRateEvents = pgTable("placement_public_join_rate_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  linkId: uuid("link_id").notNull().references(() => placementPublicJoinLinks.id, {
    onDelete: "restrict",
  }),
  ipHash: varchar("ip_hash", { length: 64 }).notNull(),
  action: varchar("action", { length: 12 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, table => [
  index("public_join_rate_network_time_idx").on(
    table.ipHash, table.action, table.createdAt.desc(),
  ),
  index("public_join_rate_link_time_idx").on(
    table.linkId, table.createdAt.desc(),
  ),
  check("public_join_rate_hash_ck", sql`${table.ipHash} ~ '^[a-f0-9]{64}$'`),
  check("public_join_rate_action_ck", sql`${table.action} in ('SEND_CODE','JOIN')`),
]);
