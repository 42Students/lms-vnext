/** Proposal only. Do not import from registered migrations until the owner registers DB migration. */
import { boolean, integer, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
export const publicPlacementPageSettings = pgTable("placement_public_page_settings",{
  collegeId:uuid("college_id").primaryKey(),
  enabled:boolean("enabled").notNull().default(false),
  placedCount:integer("placed_count"),
  offerCount:integer("offer_count"),
  employerCount:integer("employer_count"),
  populationCount:integer("population_count"),
  publishedAt:timestamp("published_at",{withTimezone:true}),
  updatedAt:timestamp("updated_at",{withTimezone:true}).notNull().defaultNow(),
});
