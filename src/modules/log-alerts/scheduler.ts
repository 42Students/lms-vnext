import { randomUUID } from "node:crypto";
import { and, desc, eq, lt, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { db10ScheduledJobLeases as leases } from "@/db/schema/db10-scheduled-job-leases.draft";
import { db10LogAlertSignatures as signatures, db10LogAlertStates as states, db10LogAlertDailyCounts as daily } from "@/db/schema/db10-log-alerts.draft";
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
  ].join("\n");
}

export async function withScheduledLease(jobName: string, now: Date, task: () => Promise<void>): Promise<boolean> {
  if (!logAlertsRuntimeEnabled()) return false;
  const db = getDb();
  const lockedBy = randomUUID();
  const lockedUntil = new Date(now.getTime() + 90_000);
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

/** Tick may run every 1-2 minutes; exactly one daily message after 09:00 IST. */
export async function runAlertTick(now = new Date()): Promise<{ acquired: boolean; digest: boolean }> {
  if (!logAlertsRuntimeEnabled() || !telegramAlertsConfigured()) return { acquired: false, digest: false };
  const { day, hour } = istDayAndHour(now);
  let digest = false;
  const acquired = await withScheduledLease("telegram-digest", now, async () => {
    if (hour < 9) return;
    const db = getDb();
    await db.insert(states).values({ stateKey: "TELEGRAM_DIGEST" }).onConflictDoNothing();
    const [state] = await db.select().from(states)
      .where(eq(states.stateKey, "TELEGRAM_DIGEST")).limit(1);
    if (state?.lastDigestDay === day) return;
    // Digest covers the completed prior IST calendar date.
    const previous = new Date(Date.parse(day + "T00:00:00Z") - 86_400_000);
    const previousDay = previous.toISOString().slice(0, 10);
    const rows = await db.select({
      hash: signatures.signatureHash, firstSeenAt: signatures.firstSeenAt,
      muted: signatures.muted, dayOccurrences: daily.occurrenceCount,
      spikeCount: daily.spikeCount,
    }).from(daily).innerJoin(signatures, eq(daily.signatureId, signatures.id))
      .where(and(eq(daily.dayKey, previousDay), eq(signatures.environment,
        process.env.APP_ENV === "production" ? "PRODUCTION" :
        process.env.APP_ENV === "uat" ? "UAT" : "DEVELOPMENT")))
      .orderBy(desc(daily.occurrenceCount)).limit(1000);
    const start = new Date(Date.parse(previousDay + "T00:00:00Z") - 330 * 60_000);
    const end = new Date(start.getTime() + 86_400_000);
    const message = formatDailyDigest({
      day: previousDay,
      deploy: /^[0-9a-f]{7,64}$/i.test(process.env.DEPLOY_COMMIT ?? "")
        ? process.env.DEPLOY_COMMIT : undefined,
      total: rows.reduce((sum, row) => sum + row.dayOccurrences, 0),
      firstSeen: rows.filter(row => row.firstSeenAt >= start && row.firstSeenAt < end).length,
      muted: rows.filter(row => row.muted).length,
      spikes: rows.filter(row => row.spikeCount > 0).length,
      top: rows.slice(0, 5).map(row => ({ hash: row.hash, count: row.dayOccurrences })),
    });
    if (!await sendTelegramAlert(message)) return;
    await db.update(states).set({ lastDigestDay: day })
      .where(eq(states.stateKey, "TELEGRAM_DIGEST"));
    digest = true;
  });
  return { acquired, digest };
}
