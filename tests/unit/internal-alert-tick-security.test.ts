import { afterEach, describe, expect, it } from "vitest";
import { POST, isValidTickSecret } from "@/app/api/internal/alerts/tick/route";

const previousSecret = process.env["INTERNAL_ALERT_TICK_SECRET"];
const previousReadiness = process.env["DB10_LOG_ALERTS_READY"];
const strongSecret = "test-alert-tick-secret-32-plus-characters";

afterEach(() => {
  if (previousSecret === undefined) delete process.env["INTERNAL_ALERT_TICK_SECRET"];
  else process.env["INTERNAL_ALERT_TICK_SECRET"] = previousSecret;
  if (previousReadiness === undefined) delete process.env["DB10_LOG_ALERTS_READY"];
  else process.env["DB10_LOG_ALERTS_READY"] = previousReadiness;
});

function tickRequest(options: {
  url?: string;
  token?: string;
  origin?: string;
  body?: string;
  contentLength?: string;
} = {}) {
  const headers = new Headers();
  if (options.token !== undefined) headers.set("x-internal-alerts-key", options.token);
  if (options.origin !== undefined) headers.set("origin", options.origin);
  if (options.contentLength !== undefined) headers.set("content-length", options.contentLength);
  return new Request(
    options.url ?? "https://lms.example/api/internal/alerts/tick",
    { method: "POST", headers, ...(options.body === undefined ? {} : { body: options.body }) },
  );
}

describe("internal alert scheduler machine authentication", () => {
  it("rejects absent, weak, and mismatched credentials before the timing-safe comparison", () => {
    expect(isValidTickSecret(null, strongSecret)).toBe(false);
    expect(isValidTickSecret(strongSecret, undefined)).toBe(false);
    expect(isValidTickSecret("a".repeat(31), "a".repeat(31))).toBe(false);
    expect(isValidTickSecret("short", "short")).toBe(false);
    expect(isValidTickSecret(strongSecret + "x", strongSecret)).toBe(false);
    expect(isValidTickSecret(strongSecret, strongSecret + "x")).toBe(false);
    expect(isValidTickSecret(strongSecret, strongSecret)).toBe(true);
  });

  it("denies a matching but short configured secret and suppresses caching", async () => {
    process.env["INTERNAL_ALERT_TICK_SECRET"] = "weak";
    const response = await POST(tickRequest({ token: "weak" }));
    expect(response.status).toBe(403);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("rejects browser-Origin requests even if they know the machine secret", async () => {
    process.env["INTERNAL_ALERT_TICK_SECRET"] = strongSecret;
    const response = await POST(tickRequest({
      token: strongSecret,
      origin: "https://lms.example",
    }));
    expect(response.status).toBe(403);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("rejects unauthorized calls before inspecting request parameters", async () => {
    process.env["INTERNAL_ALERT_TICK_SECRET"] = strongSecret;
    const response = await POST(tickRequest({
      url: "https://lms.example/api/internal/alerts/tick?force=true",
      token: "incorrect",
    }));
    expect(response.status).toBe(403);
  });

  it("refuses any query parameters, including parameters with empty values", async () => {
    process.env["INTERNAL_ALERT_TICK_SECRET"] = strongSecret;
    const response = await POST(tickRequest({
      token: strongSecret,
      url: "https://lms.example/api/internal/alerts/tick?anything=",
    }));
    expect(response.status).toBe(400);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("refuses a nonempty request body despite a forged Content-Length: 0", async () => {
    process.env["INTERNAL_ALERT_TICK_SECRET"] = strongSecret;
    const response = await POST(tickRequest({
      token: strongSecret,
      body: '{"job":"run"}',
      contentLength: "0",
    }));
    expect(response.status).toBe(400);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("accepts the empty machine request boundary but cannot run without DB readiness", async () => {
    process.env["INTERNAL_ALERT_TICK_SECRET"] = strongSecret;
    delete process.env["DB10_LOG_ALERTS_READY"];
    const response = await POST(tickRequest({ token: strongSecret }));
    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
});
