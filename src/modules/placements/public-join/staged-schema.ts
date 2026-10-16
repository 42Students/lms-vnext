/** STAGED only: orchestrator registers this schema after migration approval.
 * (link lifecycle columns registered in migration 0099)
 * Never import into runtime before registration.
 */
import { check, index, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { placementPublicJoinLinks } from "@/db/schema";
import { sql } from "drizzle-orm";

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
