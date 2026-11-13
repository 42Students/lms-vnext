import { notFound } from "next/navigation";
import { acknowledgedTelegramMessageText } from "@/modules/log-alerts/telegram-webhook";
import { limitTelegramAlert, sanitizeTelegramLine } from "@/modules/log-alerts/telegram-notifier";

import { env } from "@/config/env";
export const dynamic="force-dynamic";

/** UX witness only: never reads provider credentials, persists data or sends a message. */
export default function TelegramAlertCopyPreview() {
  if(process.env.NODE_ENV!=="development"||env.UX_G176_TELEGRAM_FIXTURE!=="1")notFound();
  const incidentId="11111111-1111-4111-8111-111111111111";
  const raw=[
    "Time: 2099-01-01T01:02:03.000Z",
    "Request ID: af02b19c",
    "Deploy: aabbccddee",
    "Details: alice@example.com",
    "Escalate with the logged request reference.",
  ].join("\n");
  const outgoing=limitTelegramAlert(raw.split("\n").map(sanitizeTelegramLine).filter(Boolean).join("\n"));
  const acknowledged=acknowledgedTelegramMessageText(outgoing);
  return <main className="mx-auto min-w-0 max-w-xl space-y-5 px-4 py-8">
    <h1 className="text-xl font-semibold">Telegram incident copy acceptance</h1>
    <p role="note" className="text-sm text-body">Development-only view of production message formatting; no bot requests are sent.</p>
    <section aria-label="Alert before acknowledgement" className="min-w-0 rounded-xl border border-border bg-surface p-4">
      <h2 className="mb-3 text-base font-semibold">Incident notification</h2>
      <pre data-testid="outbound-alert-copy" className="max-w-full whitespace-pre-wrap break-words font-sans text-sm">{outgoing}</pre>
      <div className="mt-4 rounded-lg border border-border px-3 py-2 text-center text-sm font-semibold" data-testid="acknowledge-label">✅ Acknowledge</div>
      <p className="mt-2 text-xs text-body" data-testid="callback-target">ack:{incidentId}</p>
    </section>
    <section aria-label="Alert after acknowledgement" className="min-w-0 rounded-xl border border-border bg-surface p-4">
      <h2 className="mb-3 text-base font-semibold">Acknowledged incident</h2>
      <pre data-testid="acknowledged-alert-copy" className="max-w-full whitespace-pre-wrap break-words font-sans text-sm">{acknowledged}</pre>
    </section>
  </main>;
}
