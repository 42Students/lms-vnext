import { sql } from "drizzle-orm";
import { check, index, integer, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { placementApplications, placementJobs, placementOffers } from "./placements";
import { users } from "./users";

/**
 * Registered by migration 0115 for TPO-drive-workspace-47/48.
 * Selection is not an issued offer; only the verified release step sends an offer.
 */
export const placementDriveSelections = pgTable("placement_drive_selections", {
  id: uuid("id").defaultRandom().primaryKey(),
  jobId: uuid("job_id").notNull().references(() => placementJobs.id, { onDelete: "restrict" }),
  applicationId: uuid("application_id").notNull().references(() => placementApplications.id, { onDelete: "restrict" }),
  roleTitle: text("role_title").notNull(),
  annualCtcInr: integer("annual_ctc_inr"),
  status: varchar("status", { length: 16 }).notNull().default("SELECTED"),
  recordedByUserId: uuid("recorded_by_user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().defaultNow(),
  verifiedByUserId: uuid("verified_by_user_id").references(() => users.id, { onDelete: "restrict" }),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  releasedOfferId: uuid("released_offer_id").references(() => placementOffers.id, { onDelete: "restrict" }),
  releasedAt: timestamp("released_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [
  uniqueIndex("placement_drive_selections_application_uq").on(t.applicationId),
  index("placement_drive_selections_job_status_idx").on(t.jobId, t.status),
  check("placement_drive_selections_status_ck", sql`${t.status} in ('SELECTED','VERIFIED','RELEASED')`),
  check("placement_drive_selections_ctc_ck", sql`${t.annualCtcInr} is null or ${t.annualCtcInr} between 0 and 100000000`),
  check("placement_drive_selections_verified_ck", sql`(${t.status} = 'SELECTED' and ${t.verifiedAt} is null and ${t.releasedAt} is null and ${t.releasedOfferId} is null) or (${t.status} = 'VERIFIED' and ${t.verifiedAt} is not null and ${t.releasedAt} is null and ${t.releasedOfferId} is null) or (${t.status} = 'RELEASED' and ${t.verifiedAt} is not null and ${t.releasedOfferId} is not null and ${t.releasedAt} is not null)`),
]);
