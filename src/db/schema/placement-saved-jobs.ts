import { index, pgTable, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { colleges } from "./colleges";
import { collegeMemberships } from "./memberships";
import { placementJobs } from "./placements";

/** Legacy learner_saved_job: a learner's persistent shortlist, not a job application. */
export const placementSavedJobs = pgTable(
  "placement_saved_jobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    collegeId: uuid("college_id").notNull()
      .references(() => colleges.id, { onDelete: "restrict" }),
    membershipId: uuid("membership_id").notNull()
      .references(() => collegeMemberships.id, { onDelete: "restrict" }),
    jobId: uuid("job_id").notNull()
      .references(() => placementJobs.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("placement_saved_jobs_membership_job_uq").on(
      table.membershipId, table.jobId,
    ),
    index("placement_saved_jobs_college_member_idx").on(
      table.collegeId, table.membershipId,
    ),
  ],
);
