/** Public placement page settings (opt-in, k-anonymity enforced by the publication API). */
import { sql } from "drizzle-orm";
import { boolean, check, integer, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { colleges } from "./colleges";

export const placementPublicPageSettings = pgTable(
  "placement_public_page_settings",
  {
    collegeId: uuid("college_id")
      .primaryKey()
      .references(() => colleges.id, { onDelete: "restrict" }),
    enabled: boolean("enabled").notNull().default(false),
    placedCount: integer("placed_count"),
    offerCount: integer("offer_count"),
    employerCount: integer("employer_count"),
    populationCount: integer("population_count"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check(
      "placement_public_stats_nonnegative",
      sql`(${table.placedCount} IS NULL OR ${table.placedCount} >= 0) AND (${table.offerCount} IS NULL OR ${table.offerCount} >= 0) AND (${table.employerCount} IS NULL OR ${table.employerCount} >= 0) AND (${table.populationCount} IS NULL OR ${table.populationCount} >= 0)`,
    ),
    check(
      "placement_public_population_guard",
      sql`${table.placedCount} IS NULL OR ${table.populationCount} IS NULL OR ${table.placedCount} <= ${table.populationCount}`,
    ),
  ],
);
