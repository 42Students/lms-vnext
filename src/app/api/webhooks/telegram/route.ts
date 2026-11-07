import { NextResponse } from "next/server";
import { logInfo } from "@/observability/logger";
import { handleTelegramCallback, validTelegramWebhookSecret } from "@/modules/log-alerts/telegram-webhook";
import { route } from "@/security/route";

export const runtime = "nodejs";
const MAX_WEBHOOK_BYTES = 8192;
const noStore = { "Cache-Control": "no-store" } as const;

/** Telegram is a third-party webhook: secret-token verification replaces browser Origin. */
async function handlePOST(request: Request) {
  if (process.env["APP_ENV"] !== "production") {
    logInfo("telegram.webhook.unavailable_outside_production");
    return NextResponse.json({ message: "Not available." }, { status: 404, headers: noStore });
  }
  // A Telegram server callback never carries browser Origin; fail closed if supplied.
  if (request.headers.has("origin")) {
    return NextResponse.json({ message: "Not authorized." }, { status: 403, headers: noStore });
  }
  if (!validTelegramWebhookSecret(request.headers.get("x-telegram-bot-api-secret-token"))) {
    return NextResponse.json({ message: "Not authorized." }, { status: 403, headers: noStore });
  }
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (!Number.isSafeInteger(declaredLength) || declaredLength < 0 || declaredLength > MAX_WEBHOOK_BYTES) {
    return NextResponse.json({ message: "This request is too large." }, { status: 413, headers: noStore });
  }
  let payload: unknown;
  try {
    const reader = request.body?.getReader();
    if (!reader) return NextResponse.json({ ok:true,acknowledged:false }, { headers: noStore });
    let length = 0;
    const parts: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_WEBHOOK_BYTES) {
        await reader.cancel().catch(() => undefined);
        return NextResponse.json({ message: "This request is too large." }, { status: 413, headers: noStore });
      }
      parts.push(value);
    }
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const part of parts) {
      bytes.set(part, offset);
      offset += part.length;
    }
    if(length===0)return NextResponse.json({ok:true,acknowledged:false}, { headers: noStore });
    payload = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    return NextResponse.json({ message: "Invalid request." }, { status: 400, headers: noStore });
  }
  try {
    const acknowledged = await handleTelegramCallback(payload);
    return NextResponse.json({ ok: true, acknowledged }, { headers: noStore });
  } catch {
    return NextResponse.json({ message: "Could not acknowledge this alert." }, { status: 503, headers: noStore });
  }
}
export const POST = route(
  { auth: "public", publicReason: "Machine-to-machine endpoint: the handler authenticates the caller with its own shared secret or signature.", csrf: false, csrfExemptReason: "Callers are servers or schedulers and send no browser Origin; the handler checks its credential instead.", rateLimit: { limit: 3000, windowMs: 60_000 } },
  ({ request }) => handlePOST(request as Parameters<typeof handlePOST>[0]),
);
