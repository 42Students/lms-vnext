import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  integer,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { colleges } from "./colleges";

/**
 * DB09-A: college-wide offer cascade policy, not the job-specific
 * placement_job_eligibility_policies table.
 *
 * Legacy: V162 college_placement_rules (7 fields).
 * The version is deliberately a PostgreSQL bigint to preserve the
 * legacy JPA @Version optimistic-concurrency semantics.
 */
export const placementCollegeRules = pgTable(
  "placement_college_rules",
  {
    collegeId: uuid("college_id")
      .primaryKey()
      .references(() => colleges.id, { onDelete: "restrict" }),
    countsAsPlacedAt: varchar("counts_as_placed_at", { length: 20 })
      .notNull()
      .default("OFFER_RELEASED"),
    maxHeldOffers: integer("max_held_offers")
      .notNull()
      .default(1),
    upliftPct: integer("uplift_pct")
      .notNull()
      .default(40),
    minResponseHours: integer("min_response_hours")
      .notNull()
      .default(48),
    version: bigint("version", { mode: "number" })
      .notNull()
      .default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "placement_college_rules_counts_at_ck",
      sql`${table.countsAsPlacedAt} in ('SELECTED', 'OFFER_RELEASED', 'OFFER_ACCEPTED')`,
    ),
    check(
      "placement_college_rules_bounds_ck",
      sql`${table.maxHeldOffers} between 1 and 5 and ${table.upliftPct} between 0 and 200 and ${table.minResponseHours} between 12 and 168 and ${table.version} >= 0`,
    ),
  ],
);

/**
 * Legacy: V162 college_what_companies_see (7 fields).
 * New `version` prevents two TPOs overwriting each other's privacy
 * controls without acknowledgement (intentional security improvement).
 * Defaults match the legacy model rather than permitting all fields.
 */
export const placementCompanyVisibilitySettings = pgTable(
  "placement_company_visibility_settings",
  {
    collegeId: uuid("college_id")
      .primaryKey()
      .references(() => colleges.id, { onDelete: "restrict" }),
    showCgpaExact: boolean("show_cgpa_exact")
      .notNull()
      .default(false),
    showTenthTwelfth: boolean("show_tenth_twelfth")
      .notNull()
      .default(true),
    showProjectLinks: boolean("show_project_links")
      .notNull()
      .default(true),
    showAssessmentScores: boolean("show_assessment_scores")
      .notNull()
      .default(false),
    showAttendance: boolean("show_attendance")
      .notNull()
      .default(false),
    version: bigint("version", { mode: "number" })
      .notNull()
      .default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "placement_company_visibility_version_ck",
      sql`${table.version} >= 0`,
    ),
  ],
);
