import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/webhooks/telegram/route";

describe("Telegram webhook containment", () => {
  it("GR-122 does not accept webhook callbacks outside production", async () => {
    const old = process.env.APP_ENV;
    try {
      process.env.APP_ENV = "development";
      const response = await POST(new Request("https://lms.example/api/webhooks/telegram", {
        method: "POST",
        body: JSON.stringify({ callback_query: { id: "fixture", data: "ack:00000000-0000-0000-0000-000000000000" } }),
      }));
      expect(response.status).toBe(404);
    } finally {
      if (old === undefined) delete process.env.APP_ENV;
      else process.env.APP_ENV = old;
    }
  });
  it("GR-122 missing secret is rejected in production before body is parsed", async () => {
    const old = process.env.APP_ENV;
    try {
      process.env.APP_ENV = "production";
      const response = await POST(new Request("https://lms.example/api/webhooks/telegram", {
        method: "POST", body: "invalid-json",
      }));
      expect(response.status).toBe(403);
    } finally {
      if (old === undefined) delete process.env.APP_ENV;
      else process.env.APP_ENV = old;
    }
  });
});
