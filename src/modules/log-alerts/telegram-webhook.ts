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
  }).passthrough(),
}).passthrough();

export function validTelegramWebhookSecret(header: string | null): boolean {
  if (process.env.APP_ENV !== "production") return false;
  const expected = process.env.TELEGRAM_ALERT_WEBHOOK_SECRET;
  if (!expected || !header) return false;
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function handleTelegramCallback(payload: unknown): Promise<boolean> {
  if (process.env.APP_ENV !== "production" || !logAlertsRuntimeEnabled()) return false;
  const parsed = callbackSchema.safeParse(payload);
  if (!parsed.success) return false;
  const id = parsed.data.callback_query.data.slice(4);
  const updated = await getDb().update(signatures).set({ acknowledgedAt: new Date() })
    .where(and(eq(signatures.id, id), eq(signatures.environment, "PRODUCTION")))
    .returning({ id: signatures.id });
  return updated.length > 0;
}
