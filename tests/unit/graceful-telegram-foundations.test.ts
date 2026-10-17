import { afterEach, describe, expect, it, vi } from "vitest";
import { redactAlertText, safeAlertPath } from "@/modules/log-alerts/redaction";
import { errorSignatureHash, normaliseErrorForSignature } from "@/modules/log-alerts/signature";
import { sendTelegramAlert, limitTelegramAlert } from "@/modules/log-alerts/telegram-notifier";

const oldEnv = {
  bot: process.env.TELEGRAM_ALERT_BOT_TOKEN,
  chat: process.env.TELEGRAM_ALERT_CHAT_ID,
  app: process.env.APP_ENV,
};
afterEach(() => {
  if (oldEnv.bot === undefined) delete process.env.TELEGRAM_ALERT_BOT_TOKEN;
  else process.env.TELEGRAM_ALERT_BOT_TOKEN = oldEnv.bot;
  if (oldEnv.chat === undefined) delete process.env.TELEGRAM_ALERT_CHAT_ID;
  else process.env.TELEGRAM_ALERT_CHAT_ID = oldEnv.chat;
  if (oldEnv.app === undefined) delete process.env.APP_ENV;
  else process.env.APP_ENV = oldEnv.app;
  vi.restoreAllMocks();
});

describe("Telegram alert fundamentals", () => {
  it("GR-112 normalises volatile error identifiers before per-environment hashing", () => {
    const a = { environment: "PRODUCTION", path: "/api/jobs/1234", message: "Job 456 failed at 2026-10-17T01:00:00Z for abc@example.com" };
    const b = { environment: "PRODUCTION", path: "/api/jobs/9876", message: "Job 789 failed at 2026-10-18T02:30:00Z for def@example.com" };
    expect(errorSignatureHash(a)).toEqual(errorSignatureHash(b));
    expect(errorSignatureHash({ ...b, environment: "DEVELOPMENT" })).not.toEqual(errorSignatureHash(a));
    expect(normaliseErrorForSignature("Quota 34 exceeded")).toEqual(normaliseErrorForSignature("Quota 99 exceeded"));
  });

  it("GR-113 removes credentials, personal data, SQL parameters, stack frames and route identifiers", () => {
    const raw = "Error for jane@example.com +91 9876543210 bearer ABcd1112 at postgres://admin:password@internal/db params=[42, 'secret']\n at node_modules/secret";
    const safe = redactAlertText(raw);
    for (const secret of ["jane@example.com", "9876543210", "ABcd1112", "postgres://", "params=", "node_modules"]) {
      expect(safe).not.toContain(secret);
    }
    expect(safeAlertPath("/api/users/12345?token=secret")).toEqual("/api/users/[id]");
    expect(safeAlertPath("/api/users/jane.smith%40example.com")).toEqual("/api/users/[id]");
    expect(safeAlertPath("/tracker/logs/sensitive-person-name")).toEqual("/tracker/logs/[id]");
  });

  it("GR-114 preserves the shared eight-character request ID after notification sanitization", async () => {
    process.env.APP_ENV = "development";
    process.env.TELEGRAM_ALERT_BOT_TOKEN = "fixture";
    process.env.TELEGRAM_ALERT_CHAT_ID = "fixture";
    const requestId = "af02b19c";
    expect(await sendTelegramAlert("Time: 2099-01-01T01:02:03.000Z\nRequest ID: " + requestId, {
      transport: (async (_url, init) => {
        const payload = JSON.parse(String(init?.body)) as { text: string };
        expect(payload.text).toContain("Request ID: " + requestId);
        expect(payload.text).toContain("2099-01-01T01:02:03.000Z");
        return new Response(JSON.stringify({ ok: true }));
      }) as typeof fetch,
    })).toBe(true);
  });
  it("GR-111 never throws when unconfigured and sends no request", async () => {
    delete process.env.TELEGRAM_ALERT_BOT_TOKEN;
    delete process.env.TELEGRAM_ALERT_CHAT_ID;
    const transport = vi.fn();
    expect(await sendTelegramAlert("Failure", { transport })).toBe(false);
    expect(transport).not.toHaveBeenCalled();
  });

  it("GR-111 sends plain text, caps the payload and strips buttons outside production", async () => {
    process.env.APP_ENV = "development";
    process.env.TELEGRAM_ALERT_BOT_TOKEN = "fake-token-do-not-log";
    process.env.TELEGRAM_ALERT_CHAT_ID = "123";
    const transport = vi.fn(async (_url: string, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
      expect(body).not.toHaveProperty("parse_mode");
      expect(body).not.toHaveProperty("reply_markup");
      expect(String(body.text).startsWith("[vnext dev] ")).toBe(true);
      expect(Array.from(String(body.text)).length).toBeLessThanOrEqual(3500);
      expect(String(body.text)).not.toContain("person@example.com");
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });
    expect(await sendTelegramAlert("Failure person@example.com " + "x".repeat(4000), {
      transport: transport as unknown as typeof fetch,
      acknowledgeSignatureId: "12345678-1234-1234-1234-123456789012",
    })).toBe(true);
    expect(limitTelegramAlert("a".repeat(4000))).toHaveLength(3500);
  });

  it("GR-113 GR-125 does not print provider failures or the configured bot token", async () => {
    process.env.APP_ENV = "development";
    process.env.TELEGRAM_ALERT_BOT_TOKEN = "synthetic-test-placeholder";
    process.env.TELEGRAM_ALERT_CHAT_ID = "synthetic-chat";
    const stderr = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    const accepted = await sendTelegramAlert("Error person@example.com", {
      transport: (async () => {
        throw new Error("request failed at private provider endpoint");
      }) as typeof fetch,
    });
    expect(accepted).toBe(false);
    expect(stderr.mock.calls.flat().join(" ")).not.toContain("synthetic-test-placeholder");
  });
  it("GR-111 returns false for provider errors and enables Acknowledge only in production", async () => {
    process.env.APP_ENV = "production";
    process.env.TELEGRAM_ALERT_BOT_TOKEN = "fake";
    process.env.TELEGRAM_ALERT_CHAT_ID = "123";
    const transport = vi.fn(async (_url: string, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as { text: string; reply_markup: unknown };
      expect(body.text).not.toContain("[vnext dev]");
      expect(body.reply_markup).toBeDefined();
      return new Response(JSON.stringify({ ok: false }), { status: 200 });
    });
    expect(await sendTelegramAlert("Exception", {
      transport: transport as unknown as typeof fetch,
      acknowledgeSignatureId: "12345678-1234-1234-1234-123456789012",
    })).toBe(false);
    expect(await sendTelegramAlert("Exception", {
      transport: (async () => { throw new Error("token leaked"); }) as typeof fetch,
    })).toBe(false);
  });
});
