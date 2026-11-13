import { notFound } from "next/navigation";
import { sendTelegramAlert } from "@/modules/log-alerts/telegram-notifier";
import { acknowledgedTelegramMessageText } from "@/modules/log-alerts/telegram-webhook";

import { env } from "@/config/env";
/**
 * Development-only, deterministic outbound-message witness.
 * The injected transport prevents all provider network calls. The browser
 * sees ONLY the safe payload, never a token, chat ID or live alert.
 */
export default async function TelegramAlertPreviewPage() {
  if (process.env.NODE_ENV !== "development" ||
      env.UX_G176_TELEGRAM_FIXTURE !== "1") notFound();

  let sentText = "";
  const transport: typeof fetch = async (_request, init) => {
    const payload = JSON.parse(String(init?.body ?? "{}")) as { text?: string };
    sentText = payload.text ?? "";
    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { "content-type": "application/json" },
    });
  };

  const sent = await sendTelegramAlert(
    "vNext daily error digest (2026-11-08, IST)\n" +
    "Request ID: 1234abcd\n" +
    "Time: 2026-11-08T00:00:00.000Z\n" +
    "Deploy: a1b2c3d4\n" +
    "Contact: person@example.com\n" +
    "Incident requires review.",
    { transport },
  );
  const acknowledged = acknowledgedTelegramMessageText(sentText);

  return <main className="mx-auto w-full max-w-3xl min-w-0 space-y-6 p-4 sm:p-6">
    <h1 className="text-2xl font-semibold">Telegram alert preview</h1>
    <p className="text-sm text-muted-foreground">
      Example operator message. No live Telegram request was sent.
    </p>
    <section aria-label="Simulated Telegram delivery"
      className="min-w-0 space-y-3 rounded-lg border border-border p-4">
      <h2 className="text-lg font-semibold">Delivered alert</h2>
      <p role="status">{sent ? "Provider accepted simulated alert" : "Delivery unconfirmed"}</p>
      <pre data-testid="telegram-alert-body"
        className="max-w-full whitespace-pre-wrap wrap-anywhere text-sm">{sentText}</pre>
    </section>
    <section aria-label="Acknowledged Telegram message"
      className="min-w-0 space-y-3 rounded-lg border border-border p-4">
      <h2 className="text-lg font-semibold">After acknowledgement</h2>
      <pre data-testid="telegram-ack-body"
        className="max-w-full whitespace-pre-wrap wrap-anywhere text-sm">{acknowledged}</pre>
    </section>
  </main>;
}
