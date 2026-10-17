import { createHash, createHmac, randomUUID } from "node:crypto";
import { and, count, eq, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  db10LogAlertSignatures as signatures,
  db10LogAlertSignatureAccounts as accounts,
  db10LogAlertStates as states,
  db10LogAlertDailyCounts as daily,
  db10LogAlertObservedEvents as observed,
} from "@/db/schema/db10-log-alerts.draft";
import { logAlertsRuntimeEnabled } from "./readiness";
import { redactAlertText, safeAlertPath, safeAlertLabel } from "./redaction";
import { alertEnvironment, errorSignatureHash } from "./signature";
import { burstSlot, countSuppressedOccurrence, decideAlert, reopenRegressedSignature } from "./policy";
import { sendTelegramAlert, telegramAlertsConfigured } from "./telegram-notifier";

export type ReportableError = {
  event: string;
  error: unknown;
  requestId?: string;
  path?: string;
  status?: number;
  component?: string;
  userId?: string;
  collegeId?: string;
  /** Cloud Logging insertId scoped to logName; never forwarded to Telegram. */
  sourceEventId?: string;
};
const fallbackSeen = new Set<string>();
let fallbackMinute = 0;
let fallbackSent = 0;

export function formatAlert(input: {
  kind: string; environment: string; time: Date; event: string;
  path: string; message: string; requestId?: string; status?: number;
  count?: number; affectedAccounts?: number; component?: string;
}): string {
  return [
    "vNext " + input.kind,
    "Environment: " + input.environment,
    "Time: " + input.time.toISOString(),
    "Event: " + safeAlertLabel(input.event),
    "Route: " + safeAlertPath(input.path),
    "Component: " + safeAlertLabel(input.component),
    "Status: " + (input.status ?? "-"),
    "Request ID: " + (input.requestId && /^(?:[0-9a-f]{8}|[0-9a-f]{8}-[0-9a-f-]{27,})$/i.test(input.requestId) ? input.requestId : "-"),
    "Count: " + (input.count ?? 1),
    "Affected accounts: " + (input.affectedAccounts ?? 0),
    "Message: " + redactAlertText(input.message),
  ].join("\n");
}

/** Same request + error is counted once, whether encountered in-process or in Cloud Logging. */
export function observedEventHash(
  environment: string, signatureHash: string, requestId?: string, sourceEventId?: string,
): string | null {
  // Prefer the shared request reference, so Cloud Logging and logError agree.
  // A Cloud provider entry without a request ID still has a stable insert ID.
  const key = requestId && /^(?:[0-9a-f]{8}|[0-9a-f-]{36})$/i.test(requestId)
    ? "request:" + requestId.toLowerCase()
    : sourceEventId && sourceEventId.length <= 1024
      ? "cloud:" + sourceEventId : null;
  if (!key) return null;
  return createHash("sha256").update(
    environment + ":" + signatureHash + ":" + key,
  ).digest("hex");
}

function trustedAccountHash(input: ReportableError): string | null {
  const key = process.env.LOG_ALERT_ACCOUNT_HASH_KEY;
  if (!key || !input.userId || !/^[a-f0-9-]{20,64}$/i.test(input.userId)) return null;
  return createHmac("sha256", key)
    .update((input.collegeId ?? "platform") + ":" + input.userId).digest("hex");
}

async function emergencySend(hash: string, message: string): Promise<boolean> {
  const minute = Math.floor(Date.now() / 60_000);
  if (minute !== fallbackMinute) {
    fallbackMinute = minute;
    fallbackSent = 0;
  }
  if (fallbackSeen.has(hash)) return true;
  if (fallbackSent >= 4) return false;
  if (await sendTelegramAlert(message + "\nAlert persistence pending DB10 migration")) {
    fallbackSeen.add(hash);
    fallbackSent += 1;
    if (fallbackSeen.size > 500) fallbackSeen.clear();
    return true;
  }
  return false;
}

/** Global state row holds an exclusive lock across delivery, preventing duplicate sends. */
export async function reportErrorForAlert(input: ReportableError): Promise<boolean> {
  if (!telegramAlertsConfigured()) return false;
  const now = new Date();
  const environment = alertEnvironment();
  const dayKey = new Date(now.getTime() + 330 * 60_000).toISOString().slice(0, 10);
  const message = redactAlertText(input.error instanceof Error ? input.error.message : input.error);
  const path = safeAlertPath(input.path);
  const hash = errorSignatureHash({ environment, message, path });
  const eventHash = observedEventHash(environment, hash, input.requestId, input.sourceEventId);
  const summary = formatAlert({
    kind: "new error", environment, time: now,
    event: input.event, path, message, requestId: input.requestId,
    status: input.status, component: input.component,
  });

  if (!logAlertsRuntimeEnabled()) {
    return emergencySend(hash, summary);
  }
  let providerAccepted = false;
  let outcome = true;
  try {
    await getDb().transaction(async (tx) => {
      const key = "TELEGRAM_BURST_" + environment;
      await tx.insert(states).values({ stateKey: key }).onConflictDoNothing();
      const [state] = await tx.select().from(states)
        .where(eq(states.stateKey, key)).limit(1).for("update");
      if (!state) return;
      if (eventHash) {
        const [existingEvent] = await tx.select({ eventHash: observed.eventHash })
          .from(observed).where(eq(observed.eventHash, eventHash)).limit(1);
        if (existingEvent) return; // Both reporting paths already handled this incident.
      }
      const rememberEvent = async () => {
        if (eventHash) await tx.insert(observed)
          .values({ eventHash, observedAt: now }).onConflictDoNothing();
      };
      const minute = new Date(Math.floor(now.getTime() / 60_000) * 60_000);
      const spent = state.burstMinuteAt?.getTime() === minute.getTime() ? state.burstCount : 0;
      const [current] = await tx.select().from(signatures).where(and(
        eq(signatures.environment, environment),
        eq(signatures.signatureHash, hash),
      )).limit(1).for("update");
      const inWindow = Boolean(current?.recentWindowAt &&
        now.getTime() - current.recentWindowAt.getTime() < 300_000);
      const recentCount = current && inWindow ? current.recentWindowCount + 1 : 1;
      const decision = decideAlert({
        known: Boolean(current), muted: current?.muted ?? false,
        fixStatus: current?.fixStatus ?? "OPEN", fixedAt: current?.fixedAt ?? null,
        recentCount, lastSpikeAt: current?.lastSpikeAlertAt ?? null, now,
      });
      const accountHash = trustedAccountHash(input);
      if (current) {
        await tx.update(signatures).set({
          lastSeenAt: now, occurrenceCount: sql.raw("log_alert_signatures.occurrence_count + 1"),
          recentWindowAt: inWindow ? current.recentWindowAt : now,
          recentWindowCount: recentCount,
          dayKey, dayOccurrences: current.dayKey === dayKey ? current.dayOccurrences + 1 : 1,
        }).where(eq(signatures.id, current.id));
        await tx.insert(daily).values({
          signatureId: current.id, dayKey, occurrenceCount: 1,
        }).onConflictDoUpdate({
          target: [daily.signatureId, daily.dayKey],
          set: { occurrenceCount: sql.raw("log_alert_daily_counts.occurrence_count + 1") },
        });
        if (accountHash) await tx.insert(accounts).values({
          signatureId: current.id, accountKeyHash: accountHash, firstSeenAt: now,
        }).onConflictDoNothing();
      }
      if (decision === "NONE") { await rememberEvent(); return; }
      const slot = burstSlot(spent);
      if (slot === "SUPPRESS") {
        // New signatures are still undelivered and retryable. A polling retry
        // is not a new occurrence and must NOT inflate the overflow counter.
        outcome = Boolean(current);
        if (!countSuppressedOccurrence(Boolean(current))) return;
        await tx.update(states).set({
          burstMinuteAt: minute, overflowCount: sql.raw("log_alert_states.overflow_count + 1"),
        }).where(eq(states.stateKey, key));
        await rememberEvent();
        return;
      }
      if (slot === "SUMMARY") {
        outcome = Boolean(current);
        if (await sendTelegramAlert("vNext alert burst: 1 more new or recurring error; see the Logs page. Environment: " + environment)) {
          await tx.update(states).set({
            burstMinuteAt: minute, burstCount: spent + 1,
          }).where(eq(states.stateKey, key));
          // The fifth post already summarized the overflow. Do not enqueue it
          // again for a duplicate next-tick summary.
          // New signatures must remain retryable even after the summary is sent.
          if (current) await rememberEvent();
        } else {
          outcome = Boolean(current);
        }
        return;
      }
      const [radius] = current
        ? await tx.select({ total: count() }).from(accounts).where(eq(accounts.signatureId, current.id))
        : [{ total: accountHash ? 1 : 0 }];
      const id = current?.id ?? randomUUID();
      const kind = decision === "NEW" ? "new error" : decision === "SPIKE" ? "error spike" : "regression";
      const delivered = await sendTelegramAlert(formatAlert({
        kind, environment, time: now, event: input.event, path, message,
        requestId: input.requestId, status: input.status, component: input.component,
        count: current ? Number(current.occurrenceCount) + 1 : 1,
        affectedAccounts: radius?.total ?? 0,
      }), { acknowledgeSignatureId: id });
      if (!delivered) {
        // A known signature was counted even if an optional spike/regression
        // notification failed; a new signature must remain retryable.
        outcome = Boolean(current);
        if (current) await rememberEvent();
        return;
      }
      providerAccepted = true;
      if (!current) {
        await tx.insert(signatures).values({
          id, environment, signatureHash: hash, sampleMessage: message,
          samplePath: path, firstSeenAt: now, lastSeenAt: now,
          occurrenceCount: 1n, recentWindowAt: now, recentWindowCount: 1,
          alertedAt: now, dayKey, dayOccurrences: 1,
        });
        await tx.insert(daily).values({ signatureId: id, dayKey, occurrenceCount: 1 });
        if (accountHash) await tx.insert(accounts).values({
          signatureId: id, accountKeyHash: accountHash, firstSeenAt: now,
        }).onConflictDoNothing();
      } else if (decision === "REGRESSION") {
        await tx.update(signatures).set(reopenRegressedSignature(now))
          .where(eq(signatures.id, id));
      } else {
        await tx.update(signatures).set({ lastSpikeAlertAt: now })
          .where(eq(signatures.id, id));
        await tx.update(daily).set({ spikeCount: sql.raw("log_alert_daily_counts.spike_count + 1") })
          .where(and(eq(daily.signatureId, id), eq(daily.dayKey, dayKey)));
      }
      await tx.update(states).set({
        burstMinuteAt: minute, burstCount: spent + 1,
      }).where(eq(states.stateKey, key));
      await rememberEvent();
    });
    return outcome;
  } catch {
    // Never throw into the originating request. Do not retry an accepted
    // message immediately if the DB commit failed: it could double notify.
    if (!providerAccepted) return emergencySend(hash, summary);
    return false;
  }
}
