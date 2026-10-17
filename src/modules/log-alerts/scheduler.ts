import { cloudLoggingAccessToken, isCloudLogNamespace, isCloudLogProject, readCloudLogErrorPage } from "./cloud-log-reader";
import { reportErrorForAlert } from "./reporter";
import { randomUUID } from "node:crypto";
import { and, desc, eq, isNull, lt, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { db10ScheduledJobLeases as leases } from "@/db/schema/db10-scheduled-job-leases.draft";
import { db10LogAlertSignatures as signatures, db10LogAlertStates as states, db10LogAlertDailyCounts as daily, db10LogAlertObservedEvents as observed } from "@/db/schema/db10-log-alerts.draft";
import { logAlertsRuntimeEnabled } from "./readiness";
import { sendTelegramAlert, telegramAlertsConfigured } from "./telegram-notifier";

export function istDayAndHour(now: Date) {
  const ist = new Date(now.getTime() + 330 * 60_000);
  return { day: ist.toISOString().slice(0, 10), hour: ist.getUTCHours() };
}

export function formatDailyDigest(input: {
  day: string; total: number; firstSeen: number;
  muted: number; spikes: number; top: { hash: string; count: number }[];
  deploy?: string;
  health?: string;
}): string {
  return [
    "vNext daily error digest (" + input.day + ", IST)",
    "Errors: " + input.total,
    "Recurring occurrences: " + Math.max(0, input.total - input.firstSeen),
    "New signatures: " + input.firstSeen,
    "Muted signatures: " + input.muted,
    "Spike signatures: " + input.spikes,
    "Top recurring:",
    ...(input.top.length ? input.top.map((item) =>
      item.hash.slice(0, 12) + ": " + item.count + " occurrences") : ["None"]),
    "Deploy: " + (input.deploy ?? "not recorded"),
    "Health watch: " + (input.health ?? "not configured"),
  ].join("\n");
}

export function healthWatchStatus(
  row: { lockedBy: string; updatedAt: Date } | undefined,
  now: Date,
): string {
  if (!row) return "not configured";
  if (now.getTime() - row.updatedAt.getTime() > 5 * 60_000) return "watcher stale";
  if (row.lockedBy === "HEALTHY") return "healthy";
  if (row.lockedBy === "DOWN") return "not responding";
  return "degraded";
}

export async function withScheduledLease(jobName: string, now: Date, task: () => Promise<void>): Promise<boolean> {
  if (!logAlertsRuntimeEnabled()) return false;
  const db = getDb();
  const lockedBy = randomUUID();
  const lockedUntil = new Date(now.getTime() + 180_000);
  const [acquired] = await db.insert(leases).values({
    jobName, lockedBy, lockedUntil,
  }).onConflictDoUpdate({
    target: leases.jobName,
    set: { lockedBy, lockedUntil, updatedAt: now,
      fence: sql.raw("scheduled_job_leases.fence + 1") },
    setWhere: lt(leases.lockedUntil, now),
  }).returning({ lockedBy: leases.lockedBy });
  if (!acquired || acquired.lockedBy !== lockedBy) return false;
  try {
    await task();
  } finally {
    await db.update(leases).set({ lockedUntil: now, updatedAt: new Date() })
      .where(and(eq(leases.jobName, jobName), eq(leases.lockedBy, lockedBy)));
  }
  return true;
}

/** Subsequent burst errors are recorded in the state row and sent during the next tick. */
export function burstOverflowText(count: number, environment: string): string {
  const safeCount = Number.isSafeInteger(count) && count > 0 ? count : 0;
  return "vNext alert burst: " + safeCount +
    " more new or recurring errors; see the Logs page. Environment: " + environment;
}

async function flushOverflow(now: Date): Promise<boolean> {
  const environment = process.env.APP_ENV === "production" ? "PRODUCTION" :
    process.env.APP_ENV === "uat" ? "UAT" : "DEVELOPMENT";
  return getDb().transaction(async (tx) => {
    const key = "TELEGRAM_BURST_" + environment;
    const [state] = await tx.select().from(states)
      .where(eq(states.stateKey, key)).for("update").limit(1);
    if (!state?.overflowCount) return false;
    const minute = new Date(Math.floor(now.getTime() / 60_000) * 60_000);
    const sent = state.burstMinuteAt?.getTime() === minute.getTime()
      ? state.burstCount : 0;
    if (sent >= 5) return false;
    if (!await sendTelegramAlert(burstOverflowText(state.overflowCount, environment))) {
      return false;
    }
    await tx.update(states).set({
      overflowCount: 0,
      burstMinuteAt: minute,
      burstCount: sent + 1,
    }).where(eq(states.stateKey, key));
    return true;
  });
}

/** Replays a post-fix regression that was counted but could not be delivered. */
export async function sweepUndeliveredRegressions(now: Date): Promise<number> {
  const environment = process.env.APP_ENV === "production" ? "PRODUCTION" :
    process.env.APP_ENV === "uat" ? "UAT" : "DEVELOPMENT";
  let delivered = 0;
  await withScheduledLease("telegram-regression-sweep", now, async () => {
    const threshold = new Date(now.getTime() - 86_400_000);
    const candidates = await getDb().select({ id: signatures.id })
      .from(signatures)
      .where(and(
        eq(signatures.environment, environment),
        eq(signatures.fixStatus, "FIXED"),
        isNull(signatures.regressedAt),
        lt(signatures.fixedAt, threshold),
        sql`${signatures.lastSeenAt} >= ${signatures.fixedAt} + interval '24 hours'`,
      )).orderBy(desc(signatures.lastSeenAt)).limit(5);
    for (const candidate of candidates) {
      await getDb().transaction(async (tx) => {
        const key = "TELEGRAM_BURST_" + environment;
        await tx.insert(states).values({ stateKey: key }).onConflictDoNothing();
        const [state] = await tx.select().from(states)
          .where(eq(states.stateKey, key)).for("update").limit(1);
        const [current] = await tx.select().from(signatures)
          .where(eq(signatures.id, candidate.id)).for("update").limit(1);
        if (!state || !current || current.fixStatus !== "FIXED" || !current.fixedAt ||
            current.regressedAt || current.lastSeenAt.getTime() <
              current.fixedAt.getTime() + 86_400_000) return;
        const minute = new Date(Math.floor(now.getTime() / 60_000) * 60_000);
        const spent = state.burstMinuteAt?.getTime() === minute.getTime()
          ? state.burstCount : 0;
        if (spent >= 5) return; // Leave pending for the next in-cluster tick.
        const ok = await sendTelegramAlert(
          "vNext regression detected after fix. Environment: " + environment +
          "\nSignature: " + current.signatureHash.slice(0, 12) +
          "\nCount: " + current.occurrenceCount.toString() +
          "\nSee the Logs page.",
          { acknowledgeSignatureId: current.id },
        );
        if (!ok) return; // Delivery-gated transition, retry next tick.
        await tx.update(signatures)
          .set({ fixStatus: "OPEN", regressedAt: now })
          .where(eq(signatures.id, current.id));
        await tx.update(states).set({
          burstMinuteAt: minute, burstCount: spent + 1,
        }).where(eq(states.stateKey, key));
        delivered++;
      });
    }
  });
  return delivered;
}


let cloudPollFailureLogged = false;

function noteCloudPollingFailure() {
  if (cloudPollFailureLogged) return;
  cloudPollFailureLogged = true;
  process.stderr.write("[log-alerts] Cloud Logging poll unavailable; other scheduled checks continue\n");
}

/** Operator-opted Cloud Logging backup. Production cannot silently query the dev namespace. */
export function cloudPollSettings(env: NodeJS.ProcessEnv = process.env):
  { project: string; namespace: string } | null {
  if (env.LOG_ALERT_CLOUD_POLL_ENABLED !== "true") return null;
  const project = env.GOOGLE_CLOUD_PROJECT;
  const namespace = env.LOG_ALERT_K8S_NAMESPACE ??
    (!env.APP_ENV || env.APP_ENV === "development" ? "lms-dev-2026" : "");
  if (!isCloudLogProject(project) || !isCloudLogNamespace(namespace)) return null;
  return { project, namespace };
}

/**
 * Consume ordered Cloud Logging entries with the durable poll cursor.
 * A delivery failure stops before advancing the cursor, so the same log
 * can be retried. Process a bounded batch to keep the lease under 3 minutes.
 */
export function cloudPollWindow(
  state: {
    pollCursorAt: Date | null; pollPageToken: string | null;
    pollWindowStartAt: Date | null; pollWindowEndAt: Date | null;
  } | undefined,
  now: Date,
): { start: Date; end: Date; pageToken?: string } | null {
  if (state?.pollPageToken && state.pollWindowStartAt && state.pollWindowEndAt) {
    return { start: state.pollWindowStartAt, end: state.pollWindowEndAt, pageToken: state.pollPageToken };
  }
  const end = new Date(now.getTime() - 60_000);
  const checkpoint = state?.pollCursorAt ?? new Date(now.getTime() - 600_000);
  // Replay a small overlap; provider event/request hashes suppress duplicates
  // while catching identical timestamps and delayed ingestion.
  const start = new Date(checkpoint.getTime() - (state?.pollCursorAt ? 120_000 : 0));
  return end > start ? { start, end } : null;
}

/**
 * A checkpoint names a complete provider page, not merely its last timestamp.
 * The cloud list API may return >12 events at the same instant, so advancing
 * just a timestamp after processing a partial page loses events permanently.
 */
export async function pollCloudLoggingErrors(now = new Date()): Promise<number> {
  const settings = cloudPollSettings();
  if (!settings || !logAlertsRuntimeEnabled() || !telegramAlertsConfigured()) return 0;
  let handled = 0;
  await withScheduledLease("telegram-cloud-log-poll", now, async () => {
    const db = getDb();
    const stateKey = "PRODUCTION_ERROR_POLL";
    await db.insert(states).values({ stateKey }).onConflictDoNothing();
    const [state] = await db.select().from(states)
      .where(eq(states.stateKey, stateKey)).limit(1);
    const window = cloudPollWindow(state, now);
    if (!window) return;
    const token = await cloudLoggingAccessToken();
    let nextPageToken = window.pageToken;
    // At most two pages of 12, protecting the CronJob HTTP time limit.
    for (let page = 0; page < 2; page++) {
      let result: Awaited<ReturnType<typeof readCloudLogErrorPage>>;
      try {
        result = await readCloudLogErrorPage({
          project: settings.project, namespace: settings.namespace,
          start: window.start, end: window.end, token,
          ...(nextPageToken ? { pageToken: nextPageToken } : {}),
        });
      } catch (error) {
        if (error instanceof Error && error.message === "LOG_PROVIDER_CURSOR_EXPIRED") {
          // Replay from the durable completed-window watermark, safely deduped.
          await db.update(states).set({
            pollPageToken: null, pollWindowStartAt: null, pollWindowEndAt: null,
          }).where(eq(states.stateKey, stateKey));
          return;
        }
        throw error;
      }
      for (const record of result.errors) {
        if (record.timestamp <= window.start || record.timestamp > window.end) continue;
        const success = await reportErrorForAlert({
          event: record.event, error: record.message, path: record.path,
          requestId: record.requestId, component: record.component,
          sourceEventId: record.id,
        });
        if (!success) return; // This page is replayed on next tick, not skipped.
        handled++;
      }
      if (!result.nextPageToken) {
        await db.update(states).set({
          pollCursorAt: window.end, pollPageToken: null,
          pollWindowStartAt: null, pollWindowEndAt: null,
        }).where(eq(states.stateKey, stateKey));
        break;
      }
      nextPageToken = result.nextPageToken;
      // The entire page has been acknowledged; store exact continuation.
      await db.update(states).set({
        pollPageToken: nextPageToken,
        pollWindowStartAt: window.start, pollWindowEndAt: window.end,
      }).where(eq(states.stateKey, stateKey));
    }
  });
  cloudPollFailureLogged = false;
  return handled;
}

/** Tick may run every 1-2 minutes; exactly one daily message after 09:00 IST. */
export async function runAlertTick(now = new Date()): Promise<{ acquired: boolean; digest: boolean }> {
  if (!logAlertsRuntimeEnabled() || !telegramAlertsConfigured()) return { acquired: false, digest: false };
  const { day, hour } = istDayAndHour(now);
  // Burst overflow is not lost even if no subsequent error arrives to trigger a send.
  // The locked state row preserves the five-per-minute ceiling across web replicas.
  await flushOverflow(now);
  await sweepUndeliveredRegressions(now);
  try {
    await pollCloudLoggingErrors(now);
  } catch {
    // Cloud Logging may lack IAM permission or Workload Identity temporarily.
    // Do not lose the digest or recovery sweep because a backup source is down.
    // Never log a provider exception: URLs and request headers are sensitive.
    noteCloudPollingFailure();
  }
  let digest = false;
  const acquired = await withScheduledLease("telegram-digest", now, async () => {
    if (hour < 9) return;
    const db = getDb();
    await db.insert(states).values({ stateKey: "TELEGRAM_DIGEST" }).onConflictDoNothing();
    const [state] = await db.select().from(states)
      .where(eq(states.stateKey, "TELEGRAM_DIGEST")).limit(1);
    if (state?.lastDigestDay === day) return;
    // Bound the privacy-preserving event fingerprint table's growth.
    await db.delete(observed)
      .where(lt(observed.observedAt, new Date(now.getTime() - 30 * 86_400_000)));
    // Digest covers the completed prior IST calendar date.
    const previous = new Date(Date.parse(day + "T00:00:00Z") - 86_400_000);
    const previousDay = previous.toISOString().slice(0, 10);
    const predicate = and(eq(daily.dayKey, previousDay), eq(signatures.environment,
      process.env.APP_ENV === "production" ? "PRODUCTION" :
      process.env.APP_ENV === "uat" ? "UAT" : "DEVELOPMENT"));
    const start = new Date(Date.parse(previousDay + "T00:00:00Z") - 330 * 60_000);
    const end = new Date(start.getTime() + 86_400_000);
    // Aggregate over ALL daily rows, not just the five displayed signatures.
    const [counts] = await db.select({
      total: sql<string>`coalesce(sum(${daily.occurrenceCount}), 0)::text`,
      firstSeen: sql<string>`count(*) filter (where ${signatures.firstSeenAt} >= ${start} and ${signatures.firstSeenAt} < ${end})::text`,
      muted: sql<string>`count(*) filter (where ${signatures.muted})::text`,
      spikes: sql<string>`count(*) filter (where ${daily.spikeCount} > 0)::text`,
    }).from(daily).innerJoin(signatures, eq(daily.signatureId, signatures.id))
      .where(predicate);
    const top = await db.select({
      hash: signatures.signatureHash, count: daily.occurrenceCount,
    }).from(daily).innerJoin(signatures, eq(daily.signatureId, signatures.id))
      .where(predicate).orderBy(desc(daily.occurrenceCount)).limit(5);
    const [health] = await db.select({
      lockedBy: leases.lockedBy,
      updatedAt: leases.updatedAt,
    }).from(leases).where(eq(leases.jobName, "vnext-health-watch")).limit(1);
    const message = formatDailyDigest({
      day: previousDay,
      health: healthWatchStatus(health, now),
      deploy: /^[0-9a-f]{7,64}$/i.test(process.env.DEPLOY_COMMIT ?? "")
        ? process.env.DEPLOY_COMMIT : undefined,
      total: Number(counts?.total ?? 0),
      firstSeen: Number(counts?.firstSeen ?? 0),
      muted: Number(counts?.muted ?? 0),
      spikes: Number(counts?.spikes ?? 0),
      top: top.map(row => ({ hash: row.hash, count: row.count })),
    });
    if (!await sendTelegramAlert(message)) return;
    await db.update(states).set({ lastDigestDay: day })
      .where(eq(states.stateKey, "TELEGRAM_DIGEST"));
    digest = true;
  });
  return { acquired, digest };
}
