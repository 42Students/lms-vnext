import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/client-errors/route";

describe("GR-117 browser reporting endpoint security", () => {
  it("GR-117 rejects cross-origin browser reports before any DB access", async () => {
    const response = await POST(new Request("https://lms.test/api/client-errors", {
      method: "POST",
      headers: { host: "lms.test", origin: "https://outside.test" },
      body: JSON.stringify({ message: "failure" }),
    }));
    expect(response.status).toBe(403);
  });
  it("GR-117 enforces streaming byte cap without trusting Content-Length", async () => {
    const response = await POST(new Request("https://lms.test/api/client-errors", {
      method: "POST",
      headers: { host: "lms.test", origin: "https://lms.test" },
      body: "x".repeat(5000),
    }));
    expect(response.status).toBe(413);
  });
  it("GR-117 accepts the exact chat-14 root boundary payload schema", async () => {
    const { browserErrorSchema } = await import("@/modules/log-alerts/client-report");
    const rootPayload = { requestId: "0123abcd", kind: "render" };
    expect(browserErrorSchema.safeParse(rootPayload).success).toBe(true);
    expect(browserErrorSchema.safeParse({ ...rootPayload, error: "raw stack" }).success).toBe(false);
  });
  it("GR-117 responds gently to invalid JSON before authentication", async () => {
    const response = await POST(new Request("https://lms.test/api/client-errors", {
      method: "POST",
      headers: { host: "lms.test", origin: "https://lms.test" },
      body: "not json",
    }));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ message: "Please check this report." });
  });
});
