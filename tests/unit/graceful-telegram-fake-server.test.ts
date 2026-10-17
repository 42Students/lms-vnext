import { createServer } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { sendTelegramAlert } from "@/modules/log-alerts/telegram-notifier";

const old = {
  token: process.env.TELEGRAM_ALERT_BOT_TOKEN,
  chat: process.env.TELEGRAM_ALERT_CHAT_ID,
  app: process.env.APP_ENV,
};
afterEach(() => {
  if (old.token === undefined) delete process.env.TELEGRAM_ALERT_BOT_TOKEN;
  else process.env.TELEGRAM_ALERT_BOT_TOKEN = old.token;
  if (old.chat === undefined) delete process.env.TELEGRAM_ALERT_CHAT_ID;
  else process.env.TELEGRAM_ALERT_CHAT_ID = old.chat;
  if (old.app === undefined) delete process.env.APP_ENV;
  else process.env.APP_ENV = old.app;
});

describe("GR-125 fake Telegram HTTP endpoint", () => {
  it("GR-125 sends no parse_mode and never includes PII, acknowledges only in production", async () => {
    process.env.TELEGRAM_ALERT_BOT_TOKEN = "test-bot";
    process.env.TELEGRAM_ALERT_CHAT_ID = "test-chat";
    process.env.APP_ENV = "development";
    const received: Record<string, unknown>[] = [];
    const server = createServer((req, res) => {
      const parts: Buffer[] = [];
      req.on("data", (chunk: Buffer) => parts.push(chunk));
      req.on("end", () => {
        received.push(JSON.parse(Buffer.concat(parts).toString("utf8")) as Record<string, unknown>);
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
      });
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    try {
      const address = server.address();
      if (!address || typeof address === "string") throw new Error("No fake server port");
      const sent = await sendTelegramAlert("Failure person@example.com", {
        botApiUrl: "http://127.0.0.1:" + address.port,
        acknowledgeSignatureId: "12345678-1234-1234-1234-123456789012",
      });
      expect(sent).toBe(true);
      expect(received).toHaveLength(1);
      expect(received[0]).not.toHaveProperty("parse_mode");
      expect(received[0]).not.toHaveProperty("reply_markup");
      expect(String(received[0]?.text)).toContain("[vnext dev]");
      expect(String(received[0]?.text)).not.toContain("person@example.com");
    } finally {
      await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    }
  });
  it("GR-111 GR-122 GR-125 confirms production buttons and error replies using a fake HTTP server", async () => {
    process.env.TELEGRAM_ALERT_BOT_TOKEN = "fake-production-bot";
    process.env.TELEGRAM_ALERT_CHAT_ID = "-100123456";
    process.env.APP_ENV = "production";
    const received: Record<string, unknown>[] = [];
    const server = createServer((req, res) => {
      const chunks: Buffer[] = [];
      req.on("data", (chunk: Buffer) => chunks.push(chunk));
      req.on("end", () => {
        received.push(JSON.parse(Buffer.concat(chunks).toString("utf8")) as Record<string, unknown>);
        const attempt = received.length;
        res.writeHead(attempt === 3 ? 429 : 200, { "content-type": "application/json" });
        res.end(attempt === 4 ? "bad json" :
          JSON.stringify({ ok: attempt === 1 }));
      });
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    try {
      const address = server.address();
      if (!address || typeof address === "string") throw new Error("No fake server port");
      const provider = "http://127.0.0.1:" + address.port;
      const options = {
        botApiUrl: provider,
        acknowledgeSignatureId: "12345678-1234-1234-1234-123456789012",
      };
      expect(await sendTelegramAlert("Production error", options)).toBe(true);
      expect(await sendTelegramAlert("Production error", options)).toBe(false);
      expect(await sendTelegramAlert("Production error", options)).toBe(false);
      expect(await sendTelegramAlert("Production error", options)).toBe(false);
      expect(received).toHaveLength(4);
      expect(received[0]).not.toHaveProperty("parse_mode");
      expect(received[0]).toHaveProperty("reply_markup");
      expect(String(received[0]?.text)).not.toContain("[vnext dev]");
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((error) => error ? reject(error) : resolve()));
    }
  });

});
