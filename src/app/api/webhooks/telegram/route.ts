import { NextResponse } from "next/server";
import { handleTelegramCallback, validTelegramWebhookSecret } from "@/modules/log-alerts/telegram-webhook";

export const runtime = "nodejs";

/** Telegram is a third-party webhook: secret-token verification replaces browser Origin. */
export async function POST(request: Request) {
  if (process.env.APP_ENV !== "production") {
    return NextResponse.json({ message: "Not available." }, { status: 404 });
  }
  if (!validTelegramWebhookSecret(request.headers.get("x-telegram-bot-api-secret-token"))) {
    return NextResponse.json({ message: "Not authorized." }, { status: 403 });
  }
  let payload: unknown;
  try { payload = await request.json(); }
  catch { return NextResponse.json({ message: "Invalid request." }, { status: 400 }); }
  try {
    const acknowledged = await handleTelegramCallback(payload);
    return NextResponse.json({ ok: true, acknowledged });
  } catch {
    return NextResponse.json({ message: "Could not acknowledge this alert." }, { status: 503 });
  }
}
