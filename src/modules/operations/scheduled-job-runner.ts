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
import {createHmac,randomUUID} from "node:crypto";
import {TPO_SCHEDULED_JOBS,TPO_JOB_TIME_ZONE} from "./tpo-scheduled-job-registry";

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
  // Legacy Sunday 02:00 was JVM-local. Choose Asia/Kolkata explicitly.
  // A deployment-owned Cloud Scheduler executes it; this object starts no cron.
  cleanup: { jobName: "notification.cleanup", cron: "0 2 * * 0",
    timeZone: "Asia/Kolkata", ttlMs: 60 * 60_000, retentionDays: 90, batchSize: 200 },
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

/**
 * Durable notification dedupe identity. A lease prevents concurrent runners;
 * it does NOT prevent a duplicate after crash/retry or lease expiry. Every
 * producer must store this key in the UNIQUE notification_delivery_outbox
 * dedupe_key column in the SAME transaction that queues the recipient.
 * The key deliberately contains no raw email/phone/PII.
 */
export function scheduledRecipientIdempotencyKey(input: {
  organizationId: string;
  collegeId: string;
  sourceEventId: string;
  recipientUserId: string;
  kind: string;
  windowKey: string;
}, secretBase64: string): string {
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (![input.organizationId, input.collegeId, input.sourceEventId,
         input.recipientUserId].every(id => uuid.test(id)) ||
      !/^[A-Z][A-Z0-9_]{1,63}$/.test(input.kind) ||
      !/^\d{4}-\d{2}-\d{2}(?:T\d{2})?$/.test(input.windowKey) ||
      !/^[A-Za-z0-9+/]{42,}={0,2}$/.test(secretBase64)) {
    throw new ScheduledJobRunnerError("INVALID_JOB_INPUT");
  }
  const secret = Buffer.from(secretBase64, "base64");
  if (secret.length < 32) throw new ScheduledJobRunnerError("INVALID_JOB_INPUT");
  const canonical = [input.organizationId, input.collegeId, input.sourceEventId,
    input.recipientUserId, input.kind, input.windowKey].join(":").toLowerCase();
  return createHmac("sha256", secret).update("notification:v1:").update(canonical)
    .digest("hex");
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
  warn?: (safeCode:"INVALID_LEGACY_DUE_AT")=>void,
): Date | null {
  // The canonical persisted due date always takes precedence, even when
  // legacy lesson JSON disagrees. Bad legacy data only skips this row.
  if(canonicalDueAt instanceof Date&&Number.isFinite(canonicalDueAt.getTime()))
    return canonicalDueAt;
  if(!legacyDueAt)return null; // No due date is an ordinary healthy no-op.
  const raw=legacyDueAt.trim();
  if(!raw)return null;
  const withOffset=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/;
  if(withOffset.test(raw)){
    const parsed=new Date(raw);
    if(Number.isFinite(parsed.getTime()))return parsed;
    warn?.("INVALID_LEGACY_DUE_AT");return null;
  }
  // Historical SQL dates and date-only strings are India-local, not
  // server-local. Check every component after reconstruction, so Feb 30,
  // hour 25, impossible leap days and timezone ambiguities are rejected.
  const match=/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(raw);
  if(!match){warn?.("INVALID_LEGACY_DUE_AT");return null;}
  const year=Number(match[1]),month=Number(match[2]),day=Number(match[3]),
    hour=Number(match[4]??"0"),minute=Number(match[5]??"0"),
    second=Number(match[6]??"0");
  if(year<2000||year>2200||month<1||month>12||day<1||day>31||
    hour>23||minute>59||second>59){
    warn?.("INVALID_LEGACY_DUE_AT");return null;
  }
  const offset=330*60_000;
  const instant=new Date(Date.UTC(year,month-1,day,hour,minute,second)-offset);
  const local=new Date(instant.getTime()+offset);
  if(local.getUTCFullYear()!==year||local.getUTCMonth()+1!==month||
    local.getUTCDate()!==day||local.getUTCHours()!==hour||
    local.getUTCMinutes()!==minute||local.getUTCSeconds()!==second){
    warn?.("INVALID_LEGACY_DUE_AT");return null;
  }
  return instant;
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

/**
 * One process instance holds a stable random salt until termination;
 * a restart or another pod gets a different holder, even with the same
 * hostname. Do not place machine credentials or full hostname in audit logs.
 */
const scheduledInstanceSalt=randomUUID().slice(0,16);
export function scheduledJobWorkerIdentity(hostname?:string):{
  holderId:string;hostPresent:boolean;
}{
  const host=hostname??process.env.HOSTNAME??"";
  const normalized=host.trim();
  const valid=/^[a-zA-Z0-9][a-zA-Z0-9.-]{0,59}$/.test(normalized);
  return{
    holderId:(valid?normalized:"worker-unknown")+"-"+scheduledInstanceSalt,
    hostPresent:valid,
  };
}

export type ScheduledJobOperatorSnapshot={
  jobName:string;lastRunAt:Date|null;lastOutcome:"COMPLETED"|"SKIPPED"|"FAILED"|null;
  completed:number;skipped:number;failed:number;
};
export type ScheduledJobOperatorRow=ScheduledJobOperatorSnapshot&{
  description:string;cadence:string;timeZone:string;wired:boolean;
  nextRunAt:Date|null;healthy:boolean;
};
/** Read-only job catalogue joined with validated persisted health snapshots.
 * Exact next-run depends on the external scheduler's own run state. Never
 * claim a scheduled fire was completed from a cron expression alone.
 */
export function listScheduledJobOperatorRows(
  snapshots:readonly ScheduledJobOperatorSnapshot[],
):ScheduledJobOperatorRow[]{
  const jobs=[
    ...Object.entries(LEGACY_NOTIFICATION_JOB_SCHEDULES).map(([,job])=>({
      jobName:job.jobName,
      description:job.jobName.replaceAll("."," "),
      cadence:"cron" in job?job.cron:"fixedDelayMs" in job?String(job.fixedDelayMs)+" ms":"unknown",
      timeZone:"timeZone" in job?job.timeZone:"UTC",
      wired:false,
    })),
    ...Object.entries(TPO_SCHEDULED_JOBS).map(([name,job])=>({
      jobName:name,description:job.description,
      cadence:job.schedule,timeZone:TPO_JOB_TIME_ZONE,wired:job.wired,
    })),
  ];
  const byName=new Map(snapshots.filter(row=>
    /^[a-zA-Z][a-zA-Z0-9.:_-]{0,119}$/.test(row.jobName) &&
    ["COMPLETED","SKIPPED","FAILED",null].includes(row.lastOutcome) &&
    [row.completed,row.failed,row.skipped].every(value=>
      Number.isSafeInteger(value)&&value>=0)
  ).map(row=>[row.jobName,row]));
  return jobs.map(job=>{
    const snapshot=byName.get(job.jobName);
    const lastRunAt=snapshot?.lastRunAt instanceof Date&&
      Number.isFinite(snapshot.lastRunAt.getTime())?snapshot.lastRunAt:null;
    return{
      ...job,lastRunAt,lastOutcome:snapshot?.lastOutcome??null,
      completed:snapshot?.completed??0,skipped:snapshot?.skipped??0,
      failed:snapshot?.failed??0,nextRunAt:null,
      healthy:job.wired&&lastRunAt!==null&&snapshot?.lastOutcome==="COMPLETED",
    };
  }).sort((a,b)=>(b.lastRunAt?.getTime()??0)-(a.lastRunAt?.getTime()??0)||
    a.jobName.localeCompare(b.jobName));
}

/** Build a bounded soft-delete batch for the Sunday 02:00 IST cleanup.
 * fetchEligible() MUST use an index on (deleted_at, created_at) and read
 * only un-deleted notifications older than cutoff (limit 200). The callback
 * MUST compare the lease fence in the transaction that updates deleted_at;
 * this helper by itself does not create any DB/cron side effect.
 */
export async function executeFencedNotificationCleanup(
  fence:ScheduledJobFence,now:Date,
  fetchEligible:(cutoff:Date,limit:number)=>Promise<readonly string[]>,
  markSoftDeleted:(ids:readonly string[],cutoff:Date,guard:ScheduledJobFence)=>Promise<number>,
):Promise<{deleted:number;hasMore:boolean;cutoff:Date}>{
  if(!(now instanceof Date)||!Number.isFinite(now.getTime()))
    throw new ScheduledJobRunnerError("INVALID_JOB_INPUT");
  const cutoff=new Date(now.getTime()-90*24*60*60_000);
  await fence.assertCurrent();
  const ids=await fetchEligible(cutoff,201);
  if(!ids.length)return{deleted:0,hasMore:false,cutoff}; // healthy no-op
  if(ids.length>201||ids.some(id=>!/^[0-9a-f-]{36}$/i.test(id)))
    throw new ScheduledJobRunnerError("INVALID_JOB_INPUT");
  await fence.assertCurrent();
  const deleted=await markSoftDeleted(ids.slice(0,200),cutoff,fence);
  if(!Number.isSafeInteger(deleted)||deleted<0||deleted>200)
    throw new ScheduledJobRunnerError("INVALID_JOB_INPUT");
  return{deleted,hasMore:ids.length>200,cutoff};
}

/** Release/reminder candidates are read from persisted lesson dueAt first.
 * A missing date produces an empty batch with no failed reminders.
 * Invalid migration fallback dates are counted, not emitted as row payloads.
 */
export function collectDueScheduledContentIds(
  now:Date,rows:readonly {id:string;dueAt:Date|null;legacyDueAt:string|null}[],
):{ids:string[];invalidLegacyDates:number}{
  const ids:string[]=[],seen=new Set<string>();
  let invalidLegacyDates=0;
  for(const row of rows.slice(0,1000)){
    const due=resolveScheduledContentDueAt(row.dueAt,row.legacyDueAt,
      ()=>{invalidLegacyDates++;});
    if(!due||!isAssignmentReminderDue(now,due)||!row.id||
      row.id.length>120||seen.has(row.id))continue;
    seen.add(row.id);ids.push(row.id);
  }
  return{ids,invalidLegacyDates};
}

export function scheduledJobFailureExplanation(
  error:unknown,
):"Lease store unavailable"|"Worker lost lease"|"Invalid job configuration"|"Job execution failed"{
 if(error instanceof ScheduledJobRunnerError){
  if(error.code==="LEASE_STORE_UNAVAILABLE")return"Lease store unavailable";
  if(error.code==="LEASE_LOST")return"Worker lost lease";
  if(error.code==="INVALID_JOB_INPUT"||error.code==="INVALID_LEASE_GRANT")
    return"Invalid job configuration";
 }
 return"Job execution failed";
}
