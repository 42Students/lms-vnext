/** STAGED only: orchestrator registers this schema after migration approval.
 * TPO-companies-01, TPO-settings-audit-55, TPO-campaigns-public-21.
 * Never import into runtime before registration.
 */
import { boolean, integer, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { colleges } from "@/db/schema";

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
