import "server-only";
import { sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { TPO_JOB_TIME_ZONE, TPO_SCHEDULED_JOBS } from "./tpo-scheduled-job-registry";

type LeaseHealthRow = {
  job_name: string;
  locked_until: Date;
  updated_at: Date;
  fence: string;
  active: boolean;
};

/**
 * Internal-only lease inspection. updated_at means claim/renew activity,
 * NOT last successful execution. Never represent a never-run or failed job
 * as healthy merely because its lease was acquired.
 */
export async function getTpoScheduledJobLeaseHealth() {
  const response = await getDb().execute<LeaseHealthRow>(sql`
    select job_name, locked_until, updated_at, fence::text as fence,
      locked_until > clock_timestamp() as active
    from scheduled_job_leases
    where job_name like 'tpo.%'
    order by updated_at desc
    limit 100
  `);
  const byName = new Map(response.rows.map((row) => [row.job_name, row]));
  return Object.entries(TPO_SCHEDULED_JOBS).map(([jobName, contract]) => {
    const row = byName.get(jobName);
    return {
      jobName,
      description: contract.description,
      schedule: contract.schedule,
      timeZone: TPO_JOB_TIME_ZONE,
      handlerWired: contract.wired,
      leaseState: !row ? "NEVER_CLAIMED" : row.active ? "HELD" : "EXPIRED",
      leaseExpiresAt: row?.locked_until?.toISOString() ?? null,
      lastLeaseActivityAt: row?.updated_at?.toISOString() ?? null,
      fence: row?.fence ?? null,
      lastSuccessfulRunAt: null,
      outcomesTracked: false,
    };
  });
}
