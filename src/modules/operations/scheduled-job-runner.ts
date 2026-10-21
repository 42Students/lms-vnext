/**
 * DB10 production-job execution boundary for the existing operations lease model.
 *
 * It intentionally does NOT implement distributed persistence. A PostgreSQL
 * adapter must atomically claim the lease, allocate increasing fencing numbers
 * and compare holder + fence + DB time in check/renew operations.
 *
 * This runner never fails open, and never releases a successful lease early.
 * The caller must renew / assertCurrent before irreversible side effects.
 * Exactly-once delivery still requires an outbox / recipient idempotency keys.
 */
import type { JobLease } from "./scheduled-job-lease";

export interface ScheduledJobLeaseStore {
  acquire(input: {
    jobName: string;
    holderId: string;
    ttlMs: number;
  }): Promise<JobLease | null>;
  isCurrent(lease: JobLease): Promise<boolean>;
  renew(lease: JobLease, ttlMs: number): Promise<JobLease | null>;
}

export class ScheduledJobRunnerError extends Error {
  constructor(
    readonly code:
      | "INVALID_JOB_INPUT"
      | "INVALID_LEASE_GRANT"
      | "LEASE_STORE_UNAVAILABLE"
      | "LEASE_LOST",
  ) {
    super(code);
    this.name = "ScheduledJobRunnerError";
  }
}

export type ScheduledJobFence = {
  readonly lease: Readonly<JobLease>;
  assertCurrent(): Promise<void>;
  renew(): Promise<void>;
};

export type ScheduledJobRunResult<T> =
  | { ran: false; reason: "HELD_BY_OTHER_WORKER" }
  | { ran: true; result: T };

function validateRunInput(input: {
  jobName: string;
  holderId: string;
  ttlMs: number;
}) {
  if (
    typeof input.jobName !== "string" ||
    !/^[a-zA-Z][a-zA-Z0-9.:_-]{0,119}$/.test(input.jobName) ||
    typeof input.holderId !== "string" ||
    !input.holderId.trim() ||
    input.holderId.length > 120 ||
    /[\x00-\x1f\x7f]/.test(input.holderId) ||
    !Number.isSafeInteger(input.ttlMs) ||
    input.ttlMs < 1 ||
    input.ttlMs > 86_400_000
  ) {
    throw new ScheduledJobRunnerError("INVALID_JOB_INPUT");
  }
}

function validGrant(grant: JobLease, input: {
  jobName: string;
  holderId: string;
}) {
  return Boolean(
    grant &&
    grant.jobName === input.jobName &&
    grant.holderId === input.holderId &&
    Number.isSafeInteger(grant.fence) &&
    grant.fence > 0 &&
    grant.lockedUntil instanceof Date &&
    Number.isFinite(grant.lockedUntil.getTime()),
  );
}

function storeUnavailable(): never {
  // Do not expose backend exception messages, credentials or SQL to callers.
  throw new ScheduledJobRunnerError("LEASE_STORE_UNAVAILABLE");
}

async function guardedStoreCall<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch {
    return storeUnavailable();
  }
}

/**
 * Runs only while the storage-backed lease is current. The adapter is the
 * concurrency authority; this function does not emulate a lock in memory.
 * A rejected claim is an intentional skipped tick, not a success.
 */
export async function executeScheduledJobWithLease<T>(
  store: ScheduledJobLeaseStore,
  input: { jobName: string; holderId: string; ttlMs: number },
  work: (guard: ScheduledJobFence) => Promise<T>,
): Promise<ScheduledJobRunResult<T>> {
  validateRunInput(input);
  const acquired = await guardedStoreCall(() => store.acquire(input));
  if (acquired === null) {
    return { ran: false, reason: "HELD_BY_OTHER_WORKER" };
  }
  if (!validGrant(acquired, input)) {
    throw new ScheduledJobRunnerError("INVALID_LEASE_GRANT");
  }

  let lease: JobLease = { ...acquired };
  const fence: ScheduledJobFence = {
    get lease() {
      return Object.freeze({ ...lease });
    },
    async assertCurrent() {
      const current = await guardedStoreCall(() => store.isCurrent(lease));
      if (!current) {
        throw new ScheduledJobRunnerError("LEASE_LOST");
      }
    },
    async renew() {
      const next = await guardedStoreCall(() => store.renew(lease, input.ttlMs));
      if (next === null) {
        throw new ScheduledJobRunnerError("LEASE_LOST");
      }
      if (!validGrant(next, input) || next.fence !== lease.fence) {
        throw new ScheduledJobRunnerError("INVALID_LEASE_GRANT");
      }
      lease = { ...next };
    },
  };

  await fence.assertCurrent();
  const result = await work(fence);
  return { ran: true, result };
}

/**
 * Source-accurate cadence descriptors for the deployment scheduler. These
 * declarations do not create timers or send notifications. A separate, IAM-
 * authenticated worker must bind each handler and the durable idempotent
 * outbox; never start these loops inside a request-serving Next.js process.
 * Fixed delays are measured after completion, not interchangeable with cron.
 */
export const LEGACY_NOTIFICATION_JOB_SCHEDULES = {
  release: { jobName: "notification.release", fixedDelayMs: 60_000, ttlMs: 5 * 60_000, batchSize: 200 },
  cleanup: { jobName: "notification.cleanup", fixedDelayMs: 60 * 60_000, ttlMs: 60 * 60_000 },
  interviewReminder: { jobName: "notification.interviewReminders", cron: "0 0 19 * * *", timeZone: "Asia/Kolkata", ttlMs: 60 * 60_000 },
  assignmentReminder: { jobName: "notification.assignmentReminders", cron: "0 0 9 * * *", timeZone: "Asia/Kolkata", ttlMs: 60 * 60_000 },
  deadlineToday: { jobName: "tpo.deadlineToday", cron: "0 0 8 * * *", timeZone: "Asia/Kolkata", ttlMs: 30 * 60_000 },
  offersExpiringSoon: { jobName: "tpo.offersExpiringSoon", fixedDelayMs: 60 * 60_000, ttlMs: 50 * 60_000 },
} as const;

/** India has a fixed UTC+05:30 offset; return next local day as a half-open
 * UTC range, independent of the runtime JVM/Node host timezone. */
export function tomorrowInIndiaUtcWindow(now: Date): { from: Date; to: Date } {
  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) {
    throw new ScheduledJobRunnerError("INVALID_JOB_INPUT");
  }
  const offsetMs = (5 * 60 + 30) * 60_000;
  const local = new Date(now.getTime() + offsetMs);
  const nextLocalMidnightUtc = Date.UTC(
    local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() + 1,
  ) - offsetMs;
  return {
    from: new Date(nextLocalMidnightUtc),
    to: new Date(nextLocalMidnightUtc + 24 * 60 * 60_000),
  };
}

/** Legacy daily assignment and quiz reminders use [12h,36h) before dueAt.
 * Callers must skip missing/invalid due dates without aborting other rows.
 * Persisted canonical dueAt has precedence over a legacy JSON date fallback. */
export function isAssignmentReminderDue(now: Date, dueAt: Date | null): boolean {
  if (!(now instanceof Date) || !Number.isFinite(now.getTime()) ||
      !(dueAt instanceof Date) || !Number.isFinite(dueAt.getTime())) return false;
  const remaining = dueAt.getTime() - now.getTime();
  return remaining >= 12 * 60 * 60_000 && remaining < 36 * 60 * 60_000;
}

/**
 * Process at most 200 due notifications per tick, isolating ordinary
 * per-row failures. The provided handlers must persist SENT before best-effort
 * SSE, and persist FAILED with a bounded safe reason. Lease loss is fatal and
 * must not be turned into an ordinary row-level failure.
 */
export async function processFencedNotificationBatch<T>(
  fence: ScheduledJobFence,
  due: readonly T[],
  sendAndPersist: (entry: T, fence: ScheduledJobFence) => Promise<void>,
  persistFailed: (entry: T, safeReason: string) => Promise<void>,
): Promise<{ processed: number; failed: number; remaining: number }> {
  let processed = 0;
  let failed = 0;
  const rows = due.slice(0, 200);
  for (const entry of rows) {
    await fence.assertCurrent();
    try {
      await sendAndPersist(entry, fence);
    } catch (error) {
      if (error instanceof ScheduledJobRunnerError) throw error;
      await fence.assertCurrent();
      // Never write raw provider/SQL exception messages into a user-facing row.
      await persistFailed(entry, "Scheduled delivery could not be completed.");
      failed += 1;
    }
    processed += 1;
  }
  return { processed, failed, remaining: Math.max(0, due.length - processed) };
}

export type ScheduledJobObservation = {
  jobName: string;
  outcome: "SKIPPED" | "COMPLETED" | "FAILED";
  reason?: "HELD_BY_OTHER_WORKER" | "LEASE_STORE_UNAVAILABLE" | "LEASE_LOST" | "JOB_ERROR";
};

/** Optional operational logger/metrics hook with no secret-bearing exception
 * text. A telemetry outage cannot turn a successful delivery into a failure. */
export async function executeObservedScheduledJobWithLease<T>(
  store: ScheduledJobLeaseStore,
  input: { jobName: string; holderId: string; ttlMs: number },
  work: (guard: ScheduledJobFence) => Promise<T>,
  observe: (event: ScheduledJobObservation) => void,
): Promise<ScheduledJobRunResult<T>> {
  const report = (event: ScheduledJobObservation) => {
    try { observe(event); } catch { /* metrics must be best effort */ }
  };
  try {
    const outcome = await executeScheduledJobWithLease(store, input, work);
    report({ jobName: input.jobName, outcome: outcome.ran ? "COMPLETED" : "SKIPPED",
      ...(outcome.ran ? {} : { reason: "HELD_BY_OTHER_WORKER" as const }) });
    return outcome;
  } catch (error) {
    const reason = error instanceof ScheduledJobRunnerError &&
      (error.code === "LEASE_STORE_UNAVAILABLE" || error.code === "LEASE_LOST")
      ? error.code : "JOB_ERROR";
    report({ jobName: input.jobName, outcome: "FAILED", reason });
    throw error;
  }
}

/**
 * Additional legacy operational schedules requiring deployment bindings.
 * They must be registered as external, authenticated workers, not setInterval
 * timers in Next.js web replicas. Unlike TPO job contracts in
 * tpo-scheduled-job-registry.ts, these remain unwired source specifications.
 */
export const LEGACY_LOG_MONITOR_SCHEDULES = {
  deployHealth: {
    cron: "*/5 * * * *", timeZone: "UTC", initialDelayMs: 3 * 60_000,
    wired: false, description: "Compare rollout deploy health",
  },
  cloudLogPoll: {
    cron: "*/2 * * * *", timeZone: "UTC", initialDelayMs: 60_000,
    wired: false, description: "Poll Cloud Logging, checkpoint page cursors",
  },
  logDigestDaily: {
    cron: "30 3 * * *", timeZone: "UTC",
    wired: false, description: "09:00 IST daily log digest",
  },
  logDigestWeekly: {
    cron: "30 3 * * 1", timeZone: "UTC",
    wired: false, description: "09:00 IST Monday log digest",
  },
} as const;

/** Safe legacy fallback for migrated due dates only. Callers should prefer a
 * canonical persisted date, never reinterpret ambiguous local date strings,
 * and skip a single malformed content row rather than abort the full batch. */
export function resolveScheduledContentDueAt(
  canonicalDueAt: Date | null,
  legacyDueAt: string | null,
): Date | null {
  if (canonicalDueAt instanceof Date &&
      Number.isFinite(canonicalDueAt.getTime())) return canonicalDueAt;
  if (!legacyDueAt ||
      !/^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}(?::\\d{2}(?:\\.\\d{1,3})?)?(?:Z|[+-]\\d{2}:\\d{2})$/.test(legacyDueAt)) return null;
  const parsed = new Date(legacyDueAt);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

/** Scheduler boundaries should report failure without terminating request
 * handling, and simply retry a future tick. This is not permission to ignore
 * lost leases inside a running worker: those stop all sends immediately. */
export async function runObservedScheduledTick<T>(
  store: ScheduledJobLeaseStore,
  input: { jobName: string; holderId: string; ttlMs: number },
  work: (guard: ScheduledJobFence) => Promise<T>,
  observe: (event: ScheduledJobObservation) => void,
): Promise<ScheduledJobRunResult<T> | { ran: false; reason: "TICK_FAILED" }> {
  try {
    return await executeObservedScheduledJobWithLease(store, input, work, observe);
  } catch {
    // Errors have already been surfaced by the observer using a safe code.
    // Cloud Scheduler or a cron operator must separately surface alert state.
    return { ran: false, reason: "TICK_FAILED" };
  }
}
