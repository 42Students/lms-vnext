/**
 * DB10 scheduled job lease/fencing contract.
 * Legacy oracle: V135__scheduled_job_lock.sql and SchedulerLockService.
 *
 * Pure policy helpers; NOT a distributed lock implementation by themselves.
 * postgres-scheduled-job-lease-store.ts implements DB-clock atomic UPSERT and
 * incrementing fencing tokens against the scheduled_job_leases table included
 * in Drizzle migration 0133. Deployment still must verify migration replay,
 * wire the scheduler and enforce an outbox/recipient idempotency key before
 * enabling customer-facing reminder jobs. Fail closed on lease-store failures.
 * HELD is an ordinary skipped tick; store unavailable and lost fencing MUST
 * emit operational alerts and never cause unleased or duplicate delivery.
 */
import {TPO_SCHEDULED_JOBS,TPO_JOB_TIME_ZONE} from "./tpo-scheduled-job-registry";

/** Canonical name/cadence metadata is shared with the actual worker registry.
 * Fixed-delay source jobs execute after the prior completion, not at an
 * arbitrary cron boundary. Worker metrics must distinguish HELD from failed.
 * All expirations/checks use PostgreSQL time in the lease-store adapter,
 * never trust a replica's local clock for fencing. */
export const CANONICAL_TPO_JOB_NAMES=Object.keys(TPO_SCHEDULED_JOBS) as
  (keyof typeof TPO_SCHEDULED_JOBS)[];
export function scheduledJobMetadata(name:keyof typeof TPO_SCHEDULED_JOBS){
  return {jobName:name,timeZone:TPO_JOB_TIME_ZONE,...TPO_SCHEDULED_JOBS[name]};
}
export type JobLease = {
  jobName: string;
  holderId: string;
  lockedUntil: Date;
  fence: number;
};

export type LeaseAttempt = {
  jobName: string;
  holderId: string;
  now: Date;
  ttlMs: number;
};

export type LeaseClaimResult =
  | { acquired: true; lease: JobLease }
  | { acquired: false; lease: JobLease; reason: "HELD" };

export class JobLeaseInputError extends Error {
  constructor() {
    super("INVALID_LEASE_INPUT");
    this.name = "JobLeaseInputError";
  }
}

function validate(attempt: LeaseAttempt) {
  if (
    !attempt.jobName.trim() ||
    attempt.jobName.length > 120 ||
    !attempt.holderId.trim() ||
    attempt.holderId.length > 120 ||
    !(attempt.now instanceof Date) ||
    !Number.isFinite(attempt.now.getTime()) ||
    !Number.isSafeInteger(attempt.ttlMs) ||
    attempt.ttlMs <= 0 ||
    attempt.ttlMs > 24 * 60 * 60 * 1000 ||
    !Number.isFinite(attempt.now.getTime() + attempt.ttlMs)
  ) {
    throw new JobLeaseInputError();
  }
}

function checkSnapshot(snapshot: JobLease | null, attempt: LeaseAttempt) {
  if (
    snapshot &&
    (snapshot.jobName !== attempt.jobName ||
      !Number.isSafeInteger(snapshot.fence) ||
      snapshot.fence < 1 ||
      !Number.isFinite(snapshot.lockedUntil.getTime()))
  ) {
    throw new JobLeaseInputError();
  }
}

/**
 * An expired lease may be claimed by another worker. Even a matching holder
 * must wait until expiry if it is a new scheduled tick, matching legacy
 * runExclusively semantics (no eager release).
 */
export function proposeJobLeaseClaim(
  snapshot: JobLease | null,
  attempt: LeaseAttempt,
): LeaseClaimResult {
  validate(attempt);
  checkSnapshot(snapshot, attempt);
  if (snapshot && snapshot.lockedUntil.getTime() > attempt.now.getTime()) {
    return { acquired: false, lease: snapshot, reason: "HELD" };
  }
  const nextFence = (snapshot?.fence ?? 0) + 1;
  if (!Number.isSafeInteger(nextFence)) {
    throw new JobLeaseInputError();
  }
  return {
    acquired: true,
    lease: {
      jobName: attempt.jobName,
      holderId: attempt.holderId,
      lockedUntil: new Date(attempt.now.getTime() + attempt.ttlMs),
      fence: nextFence,
    },
  };
}

/**
 * Renewal by the current owner is only legal before expiry. The database
 * must compare holder AND fence in the same statement as updating the TTL.
 */
export function proposeJobLeaseRenewal(
  snapshot: JobLease,
  holderId: string,
  expectedFence: number,
  now: Date,
  ttlMs: number,
): JobLease | null {
  validate({ jobName: snapshot.jobName, holderId, now, ttlMs });
  if (
    snapshot.holderId !== holderId ||
    snapshot.fence !== expectedFence ||
    snapshot.lockedUntil.getTime() <= now.getTime()
  ) {
    return null;
  }
  return {
    ...snapshot,
    lockedUntil: new Date(now.getTime() + ttlMs),
  };
}

export function isCurrentJobLease(
  snapshot: JobLease | null,
  jobName: string,
  holderId: string,
  expectedFence: number,
  now: Date,
): boolean {
  return Boolean(
    snapshot &&
    snapshot.jobName === jobName &&
    snapshot.holderId === holderId &&
    snapshot.fence === expectedFence &&
    now instanceof Date &&
    Number.isFinite(now.getTime()) &&
    snapshot.lockedUntil.getTime() > now.getTime(),
  );
}

/**
 * Legacy TPO deadline-today cadence. A deployment-owned worker must register
 * this schedule in Asia/Kolkata and call executeScheduledJobWithLease with the
 * durable PostgreSQL adapter. This policy declaration does NOT start a cron.
 * The outbox dispatcher has a separate cadence and must never share this lock.
 */
export const TPO_DEADLINE_TODAY_SCHEDULE = {
  jobName: "tpo.deadlineToday",
  cron: "0 0 8 * * *",
  timeZone: "Asia/Kolkata",
  ttlMs: 30 * 60 * 1000,
} as const;
