import { afterEach, describe, expect, it } from "vitest";
import { validTelegramWebhookSecret } from "@/modules/log-alerts/telegram-webhook";
import { knownErrorMutationSchema } from "@/modules/log-alerts/validation";

const app = process.env.APP_ENV;
const secret = process.env.TELEGRAM_ALERT_WEBHOOK_SECRET;
afterEach(() => {
  if (app === undefined) delete process.env.APP_ENV;
  else process.env.APP_ENV = app;
  if (secret === undefined) delete process.env.TELEGRAM_ALERT_WEBHOOK_SECRET;
  else process.env.TELEGRAM_ALERT_WEBHOOK_SECRET = secret;
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
  it("GR-123 Logs admin action accepts acknowledgement without exposing identities", () => {
    expect(knownErrorMutationSchema.safeParse({ action: "ACKNOWLEDGE" }).success).toBe(true);
    expect(knownErrorMutationSchema.safeParse({ action: "ACKNOWLEDGE", accountId: "secret" }).success).toBe(false);
  });
});
