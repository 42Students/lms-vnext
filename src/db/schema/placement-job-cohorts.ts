import { index, pgTable, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { cohorts } from "./academics";
import { colleges } from "./colleges";
import { placementJobs } from "./placements";
import { users } from "./users";

/**
 * DB08 W04 staged schema: drive targeting uses real academic cohorts instead
 * of passing-year/branch strings or an obligatory placement season.
 * W01 must integrate the numbered migration and retire season_id separately.
 */
export const placementJobCohortTargets = pgTable(
  "placement_job_cohort_targets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    collegeId: uuid("college_id").notNull()
      .references(() => colleges.id, { onDelete: "restrict" }),
    jobId: uuid("job_id").notNull()
      .references(() => placementJobs.id, { onDelete: "restrict" }),
    cohortId: uuid("cohort_id").notNull()
      .references(() => cohorts.id, { onDelete: "restrict" }),
    createdByUserId: uuid("created_by_user_id").notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("placement_job_cohort_targets_job_cohort_uq").on(t.jobId,t.cohortId),
    index("placement_job_cohort_targets_college_cohort_idx").on(t.collegeId,t.cohortId),
    index("placement_job_cohort_targets_college_job_idx").on(t.collegeId,t.jobId),
  ],
);
