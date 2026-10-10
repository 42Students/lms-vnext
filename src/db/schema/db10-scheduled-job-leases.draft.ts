/**
 * DB10 scheduled job lease schema DRAFT ONLY.
 * W01 owns registration in the shared schema barrel and Drizzle journal.
 */
import { sql } from "drizzle-orm";
import { bigint, check, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

export const db10ScheduledJobLeases = pgTable(
  "scheduled_job_leases",
  {
    jobName: varchar("job_name", { length: 120 }).primaryKey(),
    lockedUntil: timestamp("locked_until", { withTimezone: true }).notNull(),
    lockedBy: varchar("locked_by", { length: 120 }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    fence: bigint("fence", { mode: "number" }).notNull().default(1),
  },
  (t) => [
    check("db10_scheduled_job_leases_fence_ck", sql`${t.fence} > 0`),
  ],
);
