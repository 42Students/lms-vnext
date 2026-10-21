import { sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import type { JobLease } from "./scheduled-job-lease";
import { scheduledJobWorkerIdentity, type ScheduledJobLeaseStore } from "./scheduled-job-runner";

/** V135 scheduled_job_lock is replaced by migration 0133's PostgreSQL
 * scheduled_job_leases; never create a parallel table or re-import old
 * integer IDs. Equality with DB clock means the preceding lease has ended,
 * so <= clock_timestamp() takeover is intentional (legacy used strict <).
 */
export const SCHEDULED_JOB_LEASE_TABLE="scheduled_job_leases" as const;
/** Stable inside a process for acquire, check, and renew; a fresh process
 * gets a distinct random suffix and must not impersonate a prior worker.
 */
export function postgresJobLeaseIdentity(jobName:string,hostname?:string){
 return {jobName:safeJobName(jobName),holderId:scheduledJobWorkerIdentity(hostname).holderId};
}
type LeaseRow = {
  job_name: string;
  locked_until: Date;
  locked_by: string;
  fence: number | string;
};

function safeJobName(value: string) {
  if (!/^[a-zA-Z][a-zA-Z0-9.:_-]{0,119}$/.test(value)) {
    throw new Error("INVALID_JOB_NAME");
  }
  return value;
}

function safeHolder(value: string) {
  if (!value.trim() || value.length > 120 || /[\x00-\x1f\x7f]/.test(value)) {
    throw new Error("INVALID_HOLDER");
  }
  return value;
}

function safeTtl(value: number) {
  if (!Number.isSafeInteger(value) || value < 1 || value > 86_400_000) {
    throw new Error("INVALID_TTL");
  }
  return value;
}

function toLease(row: LeaseRow | undefined): JobLease | null {
  if (!row) return null;
  const fence = typeof row.fence === "number" ? row.fence : Number(row.fence);
  const lockedUntil = new Date(row.locked_until);
  if (!Number.isSafeInteger(fence) || fence < 1 || !Number.isFinite(lockedUntil.getTime())) {
    throw new Error("INVALID_LEASE_ROW");
  }
  return {
    jobName: row.job_name,
    holderId: row.locked_by,
    lockedUntil,
    fence,
  };
}

/**
 * PostgreSQL is the clock and concurrency authority. Acquisition uses one
 * atomic INSERT..ON CONFLICT..DO UPDATE WHERE expired, increasing the fence
 * exactly once for each successful takeover. A held lease returns null.
 */
export const postgresScheduledJobLeaseStore: ScheduledJobLeaseStore = {
  async acquire(input) {
    const jobName = safeJobName(input.jobName);
    const holderId = safeHolder(input.holderId);
    const ttlMs = safeTtl(input.ttlMs);

    const result = await getDb().execute<LeaseRow>(sql`
      insert into scheduled_job_leases
        (job_name, locked_until, locked_by, updated_at, fence)
      values (
        ${jobName},
        clock_timestamp() + (${ttlMs} * interval '1 millisecond'),
        ${holderId},
        clock_timestamp(),
        1
      )
      on conflict (job_name) do update
      set locked_until =
            clock_timestamp() + (${ttlMs} * interval '1 millisecond'),
          locked_by = excluded.locked_by,
          updated_at = clock_timestamp(),
          fence = scheduled_job_leases.fence + 1
      where scheduled_job_leases.locked_until <= clock_timestamp()
      returning job_name, locked_until, locked_by, fence
    `);

    return toLease(result.rows[0]);
  },

  async renew(lease, ttlInput) {
    const jobName = safeJobName(lease.jobName);
    const holderId = safeHolder(lease.holderId);
    const ttlMs = safeTtl(ttlInput);
    if (!Number.isSafeInteger(lease.fence) || lease.fence < 1) {
      throw new Error("INVALID_FENCE");
    }

    const result = await getDb().execute<LeaseRow>(sql`
      update scheduled_job_leases
      set locked_until =
            clock_timestamp() + (${ttlMs} * interval '1 millisecond'),
          updated_at = clock_timestamp()
      where job_name = ${jobName}
        and locked_by = ${holderId}
        and fence = ${lease.fence}
        and locked_until > clock_timestamp()
      returning job_name, locked_until, locked_by, fence
    `);

    return toLease(result.rows[0]);
  },

  async isCurrent(lease) {
    const jobName = safeJobName(lease.jobName);
    const holderId = safeHolder(lease.holderId);
    if (!Number.isSafeInteger(lease.fence) || lease.fence < 1) {
      throw new Error("INVALID_FENCE");
    }

    const result = await getDb().execute<{ current: boolean }>(sql`
      select exists (
        select 1
        from scheduled_job_leases
        where job_name = ${jobName}
          and locked_by = ${holderId}
          and fence = ${lease.fence}
          and locked_until > clock_timestamp()
      ) as current
    `);

    return result.rows[0]?.current === true;
  },
};
