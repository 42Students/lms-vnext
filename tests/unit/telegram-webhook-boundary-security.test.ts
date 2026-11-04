import { afterEach, describe, expect, it } from "vitest";
import { POST } from "@/app/api/webhooks/telegram/route";

const previousEnv = process.env["APP_ENV"];
const previousSecret = process.env["TELEGRAM_ALERT_WEBHOOK_SECRET"];
const strongSecret = "test-telegram-webhook-secret-32-plus-bytes";

afterEach(() => {
  if (previousEnv === undefined) delete process.env["APP_ENV"];
  else process.env["APP_ENV"] = previousEnv;
  if (previousSecret === undefined) delete process.env["TELEGRAM_ALERT_WEBHOOK_SECRET"];
  else process.env["TELEGRAM_ALERT_WEBHOOK_SECRET"] = previousSecret;
});

function incoming(options: {
  token?: string;
  origin?: string;
  length?: string;
  body?: BodyInit;
} = {}) {
  const headers = new Headers();
  if (options.token !== undefined) headers.set("x-telegram-bot-api-secret-token", options.token);
  if (options.origin !== undefined) headers.set("origin", options.origin);
  if (options.length !== undefined) headers.set("content-length", options.length);
  return new Request("https://lms.example/api/webhooks/telegram", {
    method: "POST",
    headers,
    ...(options.body === undefined ? {} : { body: options.body }),
  });
}

describe("Telegram webhook request boundary", () => {
  it("does not expose the production webhook in development", async () => {
    process.env["APP_ENV"] = "development";
    process.env["TELEGRAM_ALERT_WEBHOOK_SECRET"] = strongSecret;
    const response = await POST(incoming({ token: strongSecret }));
    expect(response.status).toBe(404);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("rejects short configured secrets even when the incoming header matches", async () => {
    process.env["APP_ENV"] = "production";
    process.env["TELEGRAM_ALERT_WEBHOOK_SECRET"] = "weak";
    const response = await POST(incoming({ token: "weak" }));
    expect(response.status).toBe(403);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("rejects missing and incorrect provider tokens", async () => {
    process.env["APP_ENV"] = "production";
    process.env["TELEGRAM_ALERT_WEBHOOK_SECRET"] = strongSecret;
    expect((await POST(incoming())).status).toBe(403);
    expect((await POST(incoming({ token: "not-the-secret" }))).status).toBe(403);
  });

  it("rejects browser-Origin requests even when the token is correct", async () => {
    process.env["APP_ENV"] = "production";
    process.env["TELEGRAM_ALERT_WEBHOOK_SECRET"] = strongSecret;
    const response = await POST(incoming({ token: strongSecret, origin: "https://lms.example" }));
    expect(response.status).toBe(403);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("rejects invalid or negative declared lengths", async () => {
    process.env["APP_ENV"] = "production";
    process.env["TELEGRAM_ALERT_WEBHOOK_SECRET"] = strongSecret;
    for (const length of ["-1", "1.5", "not-a-length", "8193"]) {
      const response = await POST(incoming({ token: strongSecret, length }));
      expect(response.status).toBe(413);
      expect(response.headers.get("cache-control")).toBe("no-store");
    }
  });

  it("enforces the real streamed byte cap even when Content-Length claims zero", async () => {
    process.env["APP_ENV"] = "production";
    process.env["TELEGRAM_ALERT_WEBHOOK_SECRET"] = strongSecret;
    const response = await POST(incoming({
      token: strongSecret,
      length: "0",
      body: "x".repeat(8193),
    }));
    expect(response.status).toBe(413);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("rejects invalid UTF-8 and malformed JSON before callback dispatch", async () => {
    process.env["APP_ENV"] = "production";
    process.env["TELEGRAM_ALERT_WEBHOOK_SECRET"] = strongSecret;
    const malformedUtf8 = new Uint8Array([0xc3, 0x28]).buffer;
    const badEncoding = await POST(incoming({ token: strongSecret, body: malformedUtf8 }));
    expect(badEncoding.status).toBe(400);
    const badJson = await POST(incoming({ token: strongSecret, body: "{not-json" }));
    expect(badJson.status).toBe(400);
  });

  it("treats an authenticated empty webhook as a no-op without touching the database", async () => {
    process.env["APP_ENV"] = "production";
    process.env["TELEGRAM_ALERT_WEBHOOK_SECRET"] = strongSecret;
    const response = await POST(incoming({ token: strongSecret }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, acknowledged: false });
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
});
