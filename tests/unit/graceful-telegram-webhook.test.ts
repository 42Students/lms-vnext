import { afterEach, describe, expect, it } from "vitest";
import { validTelegramCallbackChat, validTelegramWebhookSecret } from "@/modules/log-alerts/telegram-webhook";
import { knownErrorMutationSchema } from "@/modules/log-alerts/validation";

const app = process.env.APP_ENV;
const secret = process.env.TELEGRAM_ALERT_WEBHOOK_SECRET;
const chat = process.env.TELEGRAM_ALERT_CHAT_ID;
afterEach(() => {
  if (app === undefined) delete process.env.APP_ENV;
  else process.env.APP_ENV = app;
  if (secret === undefined) delete process.env.TELEGRAM_ALERT_WEBHOOK_SECRET;
  else process.env.TELEGRAM_ALERT_WEBHOOK_SECRET = secret;
  if (chat === undefined) delete process.env.TELEGRAM_ALERT_CHAT_ID;
  else process.env.TELEGRAM_ALERT_CHAT_ID = chat;
});

describe("Telegram acknowledgement", () => {
  it("GR-122 rejects dev webhook and incorrect/missing production secret", () => {
    process.env.APP_ENV = "development";
    process.env.TELEGRAM_ALERT_WEBHOOK_SECRET = "fixture-secret";
    expect(validTelegramWebhookSecret("fixture-secret")).toBe(false);
    process.env.APP_ENV = "production";
    expect(validTelegramWebhookSecret(null)).toBe(false);
    expect(validTelegramWebhookSecret("wrong")).toBe(false);
    expect(validTelegramWebhookSecret("fixture-secret")).toBe(true);
  });
  it("GR-122 rejects callbacks from any Telegram chat other than the configured alert chat", () => {
    process.env.TELEGRAM_ALERT_CHAT_ID = "-1001234567890";
    expect(validTelegramCallbackChat(-1001234567890)).toBe(true);
    expect(validTelegramCallbackChat("-1001234567890")).toBe(true);
    expect(validTelegramCallbackChat("9999999")).toBe(false);
    delete process.env.TELEGRAM_ALERT_CHAT_ID;
    expect(validTelegramCallbackChat(-1001234567890)).toBe(false);
  });
  it("GR-123 Logs admin action accepts acknowledgement without exposing identities", () => {
    expect(knownErrorMutationSchema.safeParse({ action: "ACKNOWLEDGE" }).success).toBe(true);
    expect(knownErrorMutationSchema.safeParse({ action: "ACKNOWLEDGE", accountId: "secret" }).success).toBe(false);
  });
});
