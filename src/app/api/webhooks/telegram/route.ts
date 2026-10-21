import { NextResponse } from "next/server";
import { logInfo } from "@/observability/logger";
import { handleTelegramCallback, validTelegramWebhookSecret } from "@/modules/log-alerts/telegram-webhook";

export const runtime = "nodejs";
const MAX_WEBHOOK_BYTES = 8192;

/** Telegram is a third-party webhook: secret-token verification replaces browser Origin. */
export async function POST(request: Request) {
  if (process.env.APP_ENV !== "production") {
    logInfo("telegram.webhook.unavailable_outside_production");
    return NextResponse.json({ message: "Not available." }, { status: 404 });
  }
  if (!validTelegramWebhookSecret(request.headers.get("x-telegram-bot-api-secret-token"))) {
    return NextResponse.json({ message: "Not authorized." }, { status: 403 });
  }
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (!Number.isFinite(declaredLength) || declaredLength > MAX_WEBHOOK_BYTES) {
    return NextResponse.json({ message: "This request is too large." }, { status: 413 });
  }
  let payload: unknown;
  try {
    const reader = request.body?.getReader();
    if (!reader) return NextResponse.json({ ok:true,acknowledged:false });
    let length = 0;
    const parts: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_WEBHOOK_BYTES) {
        await reader.cancel().catch(() => undefined);
        return NextResponse.json({ message: "This request is too large." }, { status: 413 });
      }
      parts.push(value);
    }
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const part of parts) {
      bytes.set(part, offset);
      offset += part.length;
    }
    if(length===0)return NextResponse.json({ok:true,acknowledged:false});
    payload = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }
  try {
    const acknowledged = await handleTelegramCallback(payload);
    return NextResponse.json({ ok: true, acknowledged });
  } catch {
    return NextResponse.json({ message: "Could not acknowledge this alert." }, { status: 503 });
  }
}
