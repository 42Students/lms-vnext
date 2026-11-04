import { afterEach, describe, expect, it, vi } from "vitest";
import { getDb } from "@/db/client";
import { handleTelegramCallback } from "@/modules/log-alerts/telegram-webhook";

vi.mock("@/db/client", () => ({
  getDb: vi.fn(() => { throw new Error("UNAUTHORIZED_DB_USE"); }),
}));
const keys = ["APP_ENV", "DB10_LOG_ALERTS_READY", "TELEGRAM_ALERT_CHAT_ID", "TELEGRAM_ALERT_OPERATOR_IDS"] as const;
const before = Object.fromEntries(keys.map(key => [key, process.env[key]]));
const callback = (id?: number) => ({ callback_query: {
  id: "test-id", data: "ack:11111111-1111-4111-8111-111111111111",
  ...(id === undefined ? {} : { from: { id } }),
  message: { chat: { id: -1001234567890 }, message_id: 123, text: "redacted alert" },
}});
function setup(operators?: string) {
  process.env.APP_ENV = "production";
  process.env.DB10_LOG_ALERTS_READY = "DB10_VERIFIED";
  process.env.TELEGRAM_ALERT_CHAT_ID = "-1001234567890";
  if (operators === undefined) delete process.env.TELEGRAM_ALERT_OPERATOR_IDS;
  else process.env.TELEGRAM_ALERT_OPERATOR_IDS = operators;
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("UNAUTHORIZED_NETWORK_USE"); }));
}
afterEach(() => {
  for (const key of keys) {
    if (before[key] === undefined) delete process.env[key];
    else process.env[key] = before[key];
  }
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});
describe("Telegram alert operator authorization", () => {
  it.each([
    { label: "unlisted user", allow: "1234567", sender: 9999999 },
    { label: "missing allowlist", allow: undefined, sender: 1234567 },
    { label: "missing callback identity", allow: "1234567", sender: undefined },
  ])("$label denies before DB and provider side effects", async ({ allow, sender }) => {
    setup(allow);
    await expect(handleTelegramCallback(callback(sender))).resolves.toBe(false);
    expect(getDb).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });
  it("malformed callback ID is rejected before SQL", async () => {
    setup("1234567");
    const fixture = callback(1234567);
    fixture.callback_query.data = "ack:------------------------------------";
    await expect(handleTelegramCallback(fixture)).resolves.toBe(false);
    expect(getDb).not.toHaveBeenCalled();
  });
  it("missing Telegram source message ID is rejected before SQL and network calls", async () => {
    setup("1234567");
    const payload = {
      callback_query: {
        id: "test-id",
        from: { id: 1234567 },
        data: "ack:11111111-1111-4111-8111-111111111111",
        message: {
          chat: { id: -1001234567890 },
          text: "redacted alert",
        },
      },
    };
    await expect(handleTelegramCallback(payload)).resolves.toBe(false);
    expect(getDb).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });
  it("allows listed actor to proceed to separately protected DB path", async () => {
    setup("1234567");
    await expect(handleTelegramCallback(callback(1234567))).rejects.toThrow("UNAUTHORIZED_DB_USE");
    expect(getDb).toHaveBeenCalledTimes(1);
    expect(fetch).not.toHaveBeenCalled();
  });
});
