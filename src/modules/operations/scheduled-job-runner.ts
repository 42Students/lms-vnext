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
