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
 * Fail closed when a deployment missed the registered 0133 migration, or
 * replay left an incompatible schema. This checks database metadata rather
 * than trusting a feature flag or treating a missing table as an empty queue.
 * Invoke at worker startup and before accepting a scheduler tick.
 */
export async function assertPostgresScheduledJobLeaseReady(): Promise<void> {
  let ready: { present: boolean; primary_key: boolean; fenced: boolean;
    holder: boolean; expiry: boolean; positive_fence: boolean } | undefined;
  try {
    const result = await getDb().execute<{
      present: boolean; primary_key: boolean; fenced: boolean;
      holder: boolean; expiry: boolean; positive_fence: boolean;
    }>(sql`
      select
        to_regclass('public.scheduled_job_leases') is not null as present,
        exists (
          select 1 from pg_constraint
          where conrelid = to_regclass('public.scheduled_job_leases')
            and contype = 'p'
        ) as primary_key,
        exists (
          select 1 from information_schema.columns
          where table_schema = 'public' and table_name = 'scheduled_job_leases'
            and column_name = 'fence' and data_type = 'bigint'
            and is_nullable = 'NO'
        ) as fenced,
        exists (
          select 1 from information_schema.columns
          where table_schema = 'public' and table_name = 'scheduled_job_leases'
            and column_name = 'locked_by' and is_nullable = 'NO'
        ) as holder,
        exists (
          select 1 from information_schema.columns
          where table_schema = 'public' and table_name = 'scheduled_job_leases'
            and column_name = 'locked_until'
            and data_type = 'timestamp with time zone'
            and is_nullable = 'NO'
        ) as expiry,
        exists (
          select 1 from pg_constraint
          where conrelid = to_regclass('public.scheduled_job_leases')
            and contype = 'c'
            and pg_get_constraintdef(oid) ilike '%fence > 0%'
        ) as positive_fence
    `);
    ready = result.rows[0];
  } catch {
    throw new Error("SCHEDULED_JOB_LEASE_SCHEMA_UNAVAILABLE");
  }
  if (!ready?.present || !ready.primary_key || !ready.fenced ||
      !ready.holder || !ready.expiry || !ready.positive_fence) {
    throw new Error("SCHEDULED_JOB_LEASE_SCHEMA_UNAVAILABLE");
  }
}

/**
 * PostgreSQL is the clock and concurrency authority. Acquisition uses one
 * atomic INSERT..ON CONFLICT..DO UPDATE WHERE expired, increasing the fence
 * exactly once for each successful takeover. A held lease returns null.
 */
export const postgresScheduledJobLeaseStore: ScheduledJobLeaseStore = {
  async acquire(input) {
    // Migration/schema readiness is a hard gate, not an optional fallback.
    await assertPostgresScheduledJobLeaseReady();
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
