import { timingSafeEqual } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { db10LogAlertSignatures as signatures } from "@/db/schema/db10-log-alerts.draft";
import { logAlertsRuntimeEnabled } from "./readiness";

const callbackSchema = z.object({
  callback_query: z.object({
    id: z.string().min(1).max(120),
    data: z.string().regex(/^ack:[0-9a-f-]{36}$/i),
    message: z.object({
      chat: z.object({
        id: z.union([z.number().int(), z.string().min(1).max(40)]),
      }).passthrough(),
    }).passthrough(),
  }).passthrough(),
}).passthrough();

/** An authentic bot callback from another conversation must never triage alerts. */
export function validTelegramCallbackChat(chatId: string | number): boolean {
  const expected = process.env.TELEGRAM_ALERT_CHAT_ID;
  return Boolean(expected && String(chatId) === expected);
}

export function validTelegramWebhookSecret(header: string | null): boolean {
  if (process.env.APP_ENV !== "production") return false;
  const expected = process.env.TELEGRAM_ALERT_WEBHOOK_SECRET;
  if (!expected || !header) return false;
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function answerTelegramCallback(callbackId: string) {
  const token = process.env.TELEGRAM_ALERT_BOT_TOKEN;
  if (!token) return;
  const abort = new AbortController();
  const timeout = setTimeout(() => abort.abort(), 2_000);
  try {
    await fetch("https://api.telegram.org/bot" + token + "/answerCallbackQuery", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ callback_query_id: callbackId, text: "Acknowledged" }),
      signal: abort.signal,
    });
  } catch {
    // No provider diagnostics: thrown messages can include the bot token.
  } finally {
    clearTimeout(timeout);
  }
}

export async function handleTelegramCallback(payload: unknown): Promise<boolean> {
  if (process.env.APP_ENV !== "production" || !logAlertsRuntimeEnabled()) return false;
  const parsed = callbackSchema.safeParse(payload);
  if (!parsed.success) return false;
  if (!validTelegramCallbackChat(parsed.data.callback_query.message.chat.id)) return false;
  const id = parsed.data.callback_query.data.slice(4);
  const updated = await getDb().update(signatures).set({ acknowledgedAt: new Date() })
    .where(and(eq(signatures.id, id), eq(signatures.environment, "PRODUCTION")))
    .returning({ id: signatures.id });
  if (updated.length) await answerTelegramCallback(parsed.data.callback_query.id);
  return updated.length > 0;
}
