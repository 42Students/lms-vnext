/**
 * DB10 scheduler lease execution contract.
 *
 * Legacy source: lms@21bad59d/SchedulerLockService.java and V135.
 * Legacy fails open when the lock database is unavailable. For vNext jobs
 * that can send a duplicate notification or mutate a financial/placement
 * outcome, fail closed instead. This is an explicit safety deviation.
 *
 * THIS MODULE HAS NO STORAGE IMPLEMENTATION OR SCHEDULER BINDING YET.
 * The PostgreSQL store must allocate monotonically increasing fencing tokens
 * in one atomic write, compare token + holder for check/renew, and use DB time.
 * The task must check/renew before every external irreversible side effect.
 * A lease alone cannot guarantee globally exactly-once side effects.
 */

export type JobLeaseGrant = Readonly<{
  name: string;
  holderId: string;
  /** Monotonic per job; safe as string for PostgreSQL bigint. */
  fence: string;
}>;

export type AcquireJobLeaseInput = Readonly<{
  name: string;
  holderId: string;
  ttlSeconds: number;
}>;

export interface ScheduledJobLeaseStore {
  /**
   * Return null if a competing live lease exists. Implement with one atomic
   * database transaction/UPSERT and a DB-derived expiration timestamp.
   * Throw when the backing store cannot be reached. Never fail open.
   */
  acquire(input: AcquireJobLeaseInput): Promise<JobLeaseGrant | null>;

  /**
   * False means this lease was superseded, expired, or revoked. Verify name,
   * holder, fence and expiry in the same DB predicate.
   */
  isCurrent(lease: JobLeaseGrant): Promise<boolean>;

  /**
   * Heartbeat, using DB time and a compare-and-swap of the fencing token.
   * Never reactivate a lease already expired.
   */
  renew(lease: JobLeaseGrant, ttlSeconds: number): Promise<boolean>;
}

export type JobLeaseGuard = Readonly<{
  lease: JobLeaseGrant;
  /** Call before irreversible notification/send/writes. */
  assertCurrent(): Promise<void>;
  /** Extend long-running tasks; throws if another worker owns this lease. */
  renew(): Promise<void>;
}>;

export type JobLeaseRunResult<T> =
  | Readonly<{ ran: false; reason: "HELD_BY_OTHER_WORKER" }>
  | Readonly<{ ran: true; value: T }>;

export class JobLeaseError extends Error {
  constructor(
    readonly code:
      | "JOB_LEASE_INVALID_INPUT"
      | "JOB_LEASE_STORAGE_UNAVAILABLE"
      | "JOB_LEASE_LOST"
      | "JOB_LEASE_INVALID_GRANT",
  ) {
    super(code);
    this.name = "JobLeaseError";
  }
}

function validLeaseParameters(input: AcquireJobLeaseInput) {
  return (
    typeof input.name === "string" &&
    /^[a-zA-Z][a-zA-Z0-9._:-]{0,119}$/.test(input.name) &&
    typeof input.holderId === "string" &&
    input.holderId.trim().length > 0 &&
    input.holderId.length <= 120 &&
    !/[\x00-\x1f\x7f]/.test(input.holderId) &&
    Number.isSafeInteger(input.ttlSeconds) &&
    input.ttlSeconds >= 1 &&
    input.ttlSeconds <= 24 * 60 * 60
  );
}

function validFence(fence: string) {
  // PostgreSQL bigint, positive and nonzero; do not use JS number.
  if (!/^[1-9][0-9]{0,18}$/.test(fence)) {
    return false;
  }
  return BigInt(fence) <= BigInt("9223372036854775807");
}

function validGrant(grant: JobLeaseGrant, input: AcquireJobLeaseInput) {
  return (
    grant !== null &&
    grant.name === input.name &&
    grant.holderId === input.holderId &&
    typeof grant.fence === "string" &&
    validFence(grant.fence)
  );
}

function storeFailure(error: unknown): never {
  if (error instanceof JobLeaseError) throw error;
  // A runtime/DB error must not leak credentials, raw SQL or message content.
  throw new JobLeaseError("JOB_LEASE_STORAGE_UNAVAILABLE");
}

/**
 * Fail-closed runner. A skipped tick is not a successful job execution.
 *
 * No eager release: dropping a lease immediately would allow a second replica
 * to fire during the same scheduled window, duplicating messages.
 *
 * The callback receives a fence guard; the adapter which writes/send effects
 * must verify the fence as part of those effects (ideally transactional outbox).
 */
export async function runScheduledJobWithLease<T>(
  store: ScheduledJobLeaseStore,
  input: AcquireJobLeaseInput,
  work: (guard: JobLeaseGuard) => Promise<T>,
): Promise<JobLeaseRunResult<T>> {
  if (!validLeaseParameters(input)) {
    throw new JobLeaseError("JOB_LEASE_INVALID_INPUT");
  }

  let grant: JobLeaseGrant | null;
  try {
    grant = await store.acquire(input);
  } catch (error) {
    return storeFailure(error);
  }

  if (grant === null) {
    return { ran: false, reason: "HELD_BY_OTHER_WORKER" };
  }
  if (!validGrant(grant, input)) {
    throw new JobLeaseError("JOB_LEASE_INVALID_GRANT");
  }

  const guard: JobLeaseGuard = {
    lease: Object.freeze({ ...grant }),
    async assertCurrent() {
      let current: boolean;
      try {
        current = await store.isCurrent(guard.lease);
      } catch (error) {
        return storeFailure(error);
      }
      if (!current) {
        throw new JobLeaseError("JOB_LEASE_LOST");
      }
    },
    async renew() {
      let renewed: boolean;
      try {
        renewed = await store.renew(guard.lease, input.ttlSeconds);
      } catch (error) {
        return storeFailure(error);
      }
      if (!renewed) {
        throw new JobLeaseError("JOB_LEASE_LOST");
      }
    },
  };

  await guard.assertCurrent();
  return { ran: true, value: await work(guard) };
}
