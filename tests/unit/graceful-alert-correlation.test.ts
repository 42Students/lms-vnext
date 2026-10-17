import { describe, expect, it } from "vitest";
import { sendTelegramAlert } from "@/modules/log-alerts/telegram-notifier";
import { formatAlert, observedEventHash } from "@/modules/log-alerts/reporter";

describe("GR-114 request ID correlation and GR-124 config safety", () => {
  it("GR-115 GR-125 hashes only opaque request references for cross-source deduplication", () => {
    const first = observedEventHash("PRODUCTION", "a".repeat(64), "abcd1234");
    expect(first).toMatch(/^[0-9a-f]{64}$/);
    expect(first).toBe(observedEventHash("PRODUCTION", "a".repeat(64), "ABCD1234"));
    expect(first).not.toBe(observedEventHash("UAT", "a".repeat(64), "abcd1234"));
    expect(first).not.toBe(observedEventHash("PRODUCTION", "b".repeat(64), "abcd1234"));
    expect(observedEventHash("PRODUCTION", "a".repeat(64), "jane@example.com")).toBeNull();
    expect(first).not.toContain("abcd1234");
    const providerId = "projects/project/logs/stderr:insertId-123";
    const withoutRequest = observedEventHash("PRODUCTION", "a".repeat(64), undefined, providerId);
    expect(withoutRequest).toMatch(/^[0-9a-f]{64}$/);
    expect(withoutRequest).toBe(observedEventHash("PRODUCTION", "a".repeat(64), undefined, providerId));
    expect(withoutRequest).not.toBe(observedEventHash("PRODUCTION", "a".repeat(64), undefined, providerId + "-other"));
  });
  it("GR-113 GR-114 refuses a non-reference user value in formatted Telegram messages", () => {
    const alert = formatAlert({
      kind: "new error", environment: "DEVELOPMENT",
      time: new Date("2099-07-01T03:30:00Z"), event: "api.unhandled_error",
      path: "/api/jobs", message: "failure", requestId: "AlicePrivateName",
    });
    expect(alert).toContain("Request ID: -");
    expect(alert).not.toContain("AlicePrivateName");
  });
  it("GR-114 retains an opaque request ID and timestamp in Telegram alert payloads", async () => {
    const original = {
      app: process.env.APP_ENV, token: process.env.TELEGRAM_ALERT_BOT_TOKEN,
      chat: process.env.TELEGRAM_ALERT_CHAT_ID,
    };
    try {
      process.env.APP_ENV = "development";
      process.env.TELEGRAM_ALERT_BOT_TOKEN = "test-bot";
      process.env.TELEGRAM_ALERT_CHAT_ID = "test-chat";
      const id = "abcdef12";
      const time = new Date("2099-09-20T10:00:00.000Z");
      const alert = formatAlert({
        kind: "new error", environment: "DEVELOPMENT", time, event: "api.unhandled_error",
        path: "/api/jobs/12345", message: "Error", requestId: id,
      });
      const sent = await sendTelegramAlert(alert, {
        transport: (async (_url, options) => {
          const body = JSON.parse(String(options?.body)) as { text: string };
          expect(body.text).toContain(id);
          expect(body.text).toContain(time.toISOString());
          expect(body.text).not.toContain("/api/jobs/12345");
          return new Response(JSON.stringify({ ok: true }), { status: 200 });
        }) as typeof fetch,
      });
      expect(sent).toBe(true);
    } finally {
      if (original.app === undefined) delete process.env.APP_ENV;
      else process.env.APP_ENV = original.app;
      if (original.token === undefined) delete process.env.TELEGRAM_ALERT_BOT_TOKEN;
      else process.env.TELEGRAM_ALERT_BOT_TOKEN = original.token;
      if (original.chat === undefined) delete process.env.TELEGRAM_ALERT_CHAT_ID;
      else process.env.TELEGRAM_ALERT_CHAT_ID = original.chat;
    }
  });
  it("GR-124 no configuration never sends a network request", async () => {
    const token = process.env.TELEGRAM_ALERT_BOT_TOKEN;
    const chat = process.env.TELEGRAM_ALERT_CHAT_ID;
    try {
      delete process.env.TELEGRAM_ALERT_BOT_TOKEN;
      delete process.env.TELEGRAM_ALERT_CHAT_ID;
      expect(await sendTelegramAlert("Error")).toBe(false);
    } finally {
      if (token === undefined) delete process.env.TELEGRAM_ALERT_BOT_TOKEN;
      else process.env.TELEGRAM_ALERT_BOT_TOKEN = token;
      if (chat === undefined) delete process.env.TELEGRAM_ALERT_CHAT_ID;
      else process.env.TELEGRAM_ALERT_CHAT_ID = chat;
    }
  });
});
