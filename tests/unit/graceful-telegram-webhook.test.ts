import { afterEach, describe, expect, it } from "vitest";
import { validTelegramCallbackChat, validTelegramCallbackOperator, validTelegramAcknowledgementId, validTelegramWebhookSecret } from "@/modules/log-alerts/telegram-webhook";
import { knownErrorMutationSchema } from "@/modules/log-alerts/validation";

const app = process.env.APP_ENV;
const secret = process.env.TELEGRAM_ALERT_WEBHOOK_SECRET;
const chat = process.env.TELEGRAM_ALERT_CHAT_ID;
const operators = process.env.TELEGRAM_ALERT_OPERATOR_IDS;
afterEach(() => {
  if (app === undefined) delete process.env.APP_ENV;
  else process.env.APP_ENV = app;
  if (secret === undefined) delete process.env.TELEGRAM_ALERT_WEBHOOK_SECRET;
  else process.env.TELEGRAM_ALERT_WEBHOOK_SECRET = secret;
  if (chat === undefined) delete process.env.TELEGRAM_ALERT_CHAT_ID;
  else process.env.TELEGRAM_ALERT_CHAT_ID = chat;
  if (operators === undefined) delete process.env.TELEGRAM_ALERT_OPERATOR_IDS;
  else process.env.TELEGRAM_ALERT_OPERATOR_IDS = operators;
});

describe("Telegram acknowledgement", () => {
  it("GR-122 rejects dev webhook and incorrect/missing production secret", () => {
    process.env.APP_ENV = "development";
    const strongSecret = "fixture-independent-telegram-secret-32bytes";
    process.env.TELEGRAM_ALERT_WEBHOOK_SECRET = strongSecret;
    expect(validTelegramWebhookSecret(strongSecret)).toBe(false);
    process.env.APP_ENV = "production";
    expect(validTelegramWebhookSecret(null)).toBe(false);
    expect(validTelegramWebhookSecret("wrong")).toBe(false);
    expect(validTelegramWebhookSecret(strongSecret)).toBe(true);
    process.env.TELEGRAM_ALERT_WEBHOOK_SECRET = "fixture-secret";
    expect(validTelegramWebhookSecret("fixture-secret")).toBe(false);
  });
  it("GR-122 rejects callbacks from any Telegram chat other than the configured alert chat", () => {
    process.env.TELEGRAM_ALERT_CHAT_ID = "-1001234567890";
    expect(validTelegramCallbackChat(-1001234567890)).toBe(true);
    expect(validTelegramCallbackChat("-1001234567890")).toBe(true);
    expect(validTelegramCallbackChat("9999999")).toBe(false);
    delete process.env.TELEGRAM_ALERT_CHAT_ID;
    expect(validTelegramCallbackChat(-1001234567890)).toBe(false);
  });
  it("denies Telegram alert acknowledgements by non-allowlisted group members", () => {
    delete process.env.TELEGRAM_ALERT_OPERATOR_IDS;
    expect(validTelegramCallbackOperator(111223344)).toBe(false);
    process.env.TELEGRAM_ALERT_OPERATOR_IDS = "111223344, 555667788";
    expect(validTelegramCallbackOperator(111223344)).toBe(true);
    expect(validTelegramCallbackOperator(555667788)).toBe(true);
    expect(validTelegramCallbackOperator(999999999)).toBe(false);
    expect(validTelegramCallbackOperator(0)).toBe(false);
    expect(validTelegramCallbackOperator(Number.MAX_SAFE_INTEGER + 1)).toBe(false);
    process.env.TELEGRAM_ALERT_OPERATOR_IDS = "invalid, -1, 111223344x";
    expect(validTelegramCallbackOperator(111223344)).toBe(false);
    process.env.TELEGRAM_ALERT_OPERATOR_IDS = "111223344";
    expect(validTelegramCallbackOperator(111223344)).toBe(true);
  });
  it("rejects malformed, ambiguous and noncanonical Telegram callback targets", () => {
    expect(validTelegramAcknowledgementId("ack:11111111-1111-4111-8111-111111111111"))
      .toBe("11111111-1111-4111-8111-111111111111");
    expect(validTelegramAcknowledgementId("ack:AAAAAAAA-AAAA-4AAA-8AAA-AAAAAAAAAAAA"))
      .toBe("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
    for (const raw of [
      "ack:------------------------------------",
      "ack:not-an-incident",
      "ack:11111111111141118111111111111111",
      "ack:11111111-1111-0111-8111-111111111111",
      "ack:11111111-1111-4111-0111-111111111111",
      "ack:11111111-1111-4111-8111-111111111111%00",
      "ack:11111111-1111-4111-8111-111111111111;DROP",
      "ack:11111111-1111-4111-8111-111111111111 ",
    ]) {
      expect(validTelegramAcknowledgementId(raw)).toBeNull();
    }
  });
  it("GR-123 Logs admin action accepts acknowledgement without exposing identities", () => {
    expect(knownErrorMutationSchema.safeParse({ action: "ACKNOWLEDGE" }).success).toBe(true);
    expect(knownErrorMutationSchema.safeParse({ action: "ACKNOWLEDGE", accountId: "secret" }).success).toBe(false);
  });
});
