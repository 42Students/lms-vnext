import { redactAlertText } from "./redaction";

export type TelegramAlertOptions = {
  acknowledgeSignatureId?: string;
  /** Inject a transport in tests. Production always defaults to the Bot API. */
  transport?: typeof fetch;
  botApiUrl?: string;
};

/** Keep only tightly validated diagnostic labels that are not personal data. */
export function sanitizeTelegramLine(line: string): string {
  // The phone scrubber correctly removes unknown numerical strings, but
  // ISO date metadata, short signature digests and commit hashes are generated
  // by our code and must remain legible to operators.
  if (/^Request ID: (?:[0-9a-f]{8}|[0-9a-f]{8}-[0-9a-f-]{27,})$/i.test(line)) return line;
  if (/^Time: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(line)) return line;
  if (/^vNext daily error digest \(\d{4}-\d{2}-\d{2}, IST\)$/.test(line)) return line;
  if (/^Deploy: [0-9a-f]{7,64}$/i.test(line)) return line;
  if (/^[0-9a-f]{12}: \d{1,16} occurrences$/i.test(line)) return line;
  return redactAlertText(line);
}

let notedAbsentConfiguration = false;

export function telegramAlertsConfigured(): boolean {
  const configured = Boolean(process.env.TELEGRAM_ALERT_BOT_TOKEN && process.env.TELEGRAM_ALERT_CHAT_ID);
  if (!configured && !notedAbsentConfiguration) {
    notedAbsentConfiguration = true;
    process.stderr.write("[log-alerts] Telegram alerts are not configured\n");
  }
  return configured;
}

export function limitTelegramAlert(text: string): string {
  const characters = Array.from(text);
  return characters.length <= 3500
    ? text
    : characters.slice(0, 3497).join("") + "...";
}

/** Never throw, including DNS, timeouts, non-2xx, Telegram ok:false and malformed JSON. */
export async function sendTelegramAlert(
  text: string,
  options: TelegramAlertOptions = {},
): Promise<boolean> {
  const token = process.env.TELEGRAM_ALERT_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ALERT_CHAT_ID;
  if (!token || !chatId) {
    if (!notedAbsentConfiguration) {
      notedAbsentConfiguration = true;
      process.stderr.write("[log-alerts] Telegram alerts are not configured\n");
    }
    return false;
  }
  const production = process.env.APP_ENV === "production";
  const tag = production ? "" : "[vnext dev] ";
  // Never send a raw stack or untrusted text. Lines are individually redacted.
  const safe = text.split(/\r?\n/).map(sanitizeTelegramLine).filter(Boolean).join("\n");
  const message = limitTelegramAlert(tag + safe);
  const payload: {
    chat_id: string;
    text: string;
    reply_markup?: { inline_keyboard: { text: string; callback_data: string }[][] };
  } = { chat_id: chatId, text: message };
  if (production && options.acknowledgeSignatureId &&
      /^[0-9a-f-]{36}$/i.test(options.acknowledgeSignatureId)) {
    payload.reply_markup = {
      inline_keyboard: [[{
        text: "✅ Acknowledge",
        callback_data: "ack:" + options.acknowledgeSignatureId,
      }]],
    };
  }

  // Do not route this non-idempotent provider call through outboundFetch:
  // that helper logs provider failures with logError, which invokes this notifier
  // recursively during an alerting outage. A single bounded attempt is safer.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);
  try {
    const response = await (options.transport ?? fetch)(
      (options.botApiUrl ?? "https://api.telegram.org") + "/bot" + token + "/sendMessage",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      },
    );
    if (!response.ok) return false;
    const result: unknown = await response.json();
    return typeof result === "object" && result !== null &&
      "ok" in result && result.ok === true;
  } catch {
    // Provider errors can include the secret-containing Bot API URL. Do not log them.
    return false;
  } finally {
    clearTimeout(timeout);
  }
}
