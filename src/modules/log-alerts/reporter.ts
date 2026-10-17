import { createHmac, randomUUID } from "node:crypto";
import { and, count, eq, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  db10LogAlertSignatures as signatures,
  db10LogAlertSignatureAccounts as accounts,
  db10LogAlertStates as states,
} from "@/db/schema/db10-log-alerts.draft";
import { logAlertsRuntimeEnabled } from "./readiness";
import { redactAlertText, safeAlertPath, safeAlertLabel } from "./redaction";
import { alertEnvironment, errorSignatureHash } from "./signature";
import { burstSlot, decideAlert } from "./policy";
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
    "Request ID: " + safeAlertLabel(input.requestId),
    "Count: " + (input.count ?? 1),
    "Affected accounts: " + (input.affectedAccounts ?? 0),
    "Message: " + redactAlertText(input.message),
  ].join("\n");
}

function trustedAccountHash(input: ReportableError): string | null {
  const key = process.env.LOG_ALERT_ACCOUNT_HASH_KEY;
  if (!key || !input.userId || !/^[a-f0-9-]{20,64}$/i.test(input.userId)) return null;
  return createHmac("sha256", key)
    .update((input.collegeId ?? "platform") + ":" + input.userId).digest("hex");
}

async function emergencySend(hash: string, message: string): Promise<void> {
  const minute = Math.floor(Date.now() / 60_000);
  if (minute !== fallbackMinute) {
    fallbackMinute = minute;
    fallbackSent = 0;
  }
  if (fallbackSeen.has(hash) || fallbackSent >= 4) return;
  if (await sendTelegramAlert(message + "\nAlert persistence pending DB10 migration")) {
    fallbackSeen.add(hash);
    fallbackSent += 1;
    if (fallbackSeen.size > 500) fallbackSeen.clear();
  }
}

/** Global state row holds an exclusive lock across delivery, preventing duplicate sends. */
export async function reportErrorForAlert(input: ReportableError): Promise<void> {
  if (!telegramAlertsConfigured()) return;
  const now = new Date();
  const environment = alertEnvironment();
  const dayKey = new Date(now.getTime() + 330 * 60_000).toISOString().slice(0, 10);
  const message = redactAlertText(input.error instanceof Error ? input.error.message : input.error);
  const path = safeAlertPath(input.path);
  const hash = errorSignatureHash({ environment, message, path });
  const summary = formatAlert({
    kind: "new error", environment, time: now,
    event: input.event, path, message, requestId: input.requestId,
    status: input.status, component: input.component,
  });

  if (!logAlertsRuntimeEnabled()) {
    await emergencySend(hash, summary);
    return;
  }
  try {
    await getDb().transaction(async (tx) => {
      const key = "TELEGRAM_BURST_" + environment;
      await tx.insert(states).values({ stateKey: key }).onConflictDoNothing();
      const [state] = await tx.select().from(states)
        .where(eq(states.stateKey, key)).limit(1).for("update");
      if (!state) return;
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
        if (accountHash) await tx.insert(accounts).values({
          signatureId: current.id, accountKeyHash: accountHash, firstSeenAt: now,
        }).onConflictDoNothing();
      }
      if (decision === "NONE") return;
      const slot = burstSlot(spent);
      if (slot === "SUPPRESS") {
        await tx.update(states).set({
          burstMinuteAt: minute, overflowCount: sql.raw("log_alert_states.overflow_count + 1"),
        }).where(eq(states.stateKey, key));
        return;
      }
      if (slot === "SUMMARY") {
        if (await sendTelegramAlert("vNext alert burst: more errors detected; see the Logs page. Environment: " + environment)) {
          await tx.update(states).set({
            burstMinuteAt: minute, burstCount: spent + 1,
            overflowCount: sql.raw("log_alert_states.overflow_count + 1"),
          }).where(eq(states.stateKey, key));
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
      if (!delivered) return;
      if (!current) {
        await tx.insert(signatures).values({
          id, environment, signatureHash: hash, sampleMessage: message,
          samplePath: path, firstSeenAt: now, lastSeenAt: now,
          occurrenceCount: 1n, recentWindowAt: now, recentWindowCount: 1,
          alertedAt: now, dayKey, dayOccurrences: 1,
        });
        if (accountHash) await tx.insert(accounts).values({
          signatureId: id, accountKeyHash: accountHash, firstSeenAt: now,
        }).onConflictDoNothing();
      } else if (decision === "REGRESSION") {
        await tx.update(signatures).set({ fixStatus: "OPEN", regressedAt: now })
          .where(eq(signatures.id, id));
      } else {
        await tx.update(signatures).set({ lastSpikeAlertAt: now })
          .where(eq(signatures.id, id));
      }
      await tx.update(states).set({
        burstMinuteAt: minute, burstCount: spent + 1,
      }).where(eq(states.stateKey, key));
    });
  } catch {
    await emergencySend(hash, summary);
  }
}
