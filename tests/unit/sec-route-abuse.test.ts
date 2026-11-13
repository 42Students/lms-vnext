import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { route } from "@/security/route";
import { resetIpRateLimitForTests } from "@/auth/ip-rate-limit";

/**
 * The production wrapper, not a fake: the real origin check, real bounded body reader, real error mapper and the real per-address
 * budget, exercised through a public route (no database needed). Abuse cases a hostile client would try.
 */
const HOST = "app.example.test";
const URL_BASE = `https://${HOST}/api/abuse-probe`;
const schema = z.strictObject({ name: z.string().max(40) });

function endpoint(handler: () => Response | Promise<Response> = () => Response.json({ ok: true })) {
  const spy = vi.fn(handler);
  const POST = route(
    { auth: "public", publicReason: "abuse probe", body: { schema, maxBytes: 1024 } },
    async () => spy(),
  );
  const GET = route({ auth: "public", publicReason: "abuse probe" }, async () => spy());
  return { POST, GET, spy };
}

const post = (body: string, headers: Record<string, string> = {}) =>
  new Request(URL_BASE, {
    method: "POST",
    body,
    headers: { host: HOST, origin: `https://${HOST}`, "content-type": "application/json", "x-forwarded-for": "198.51.100.7, 10.0.0.1", ...headers },
  });

describe("write requests must come from our own site", () => {
  const good = JSON.stringify({ name: "ok" });

  it("accepts a same-origin write", async () => {
    const { POST, spy } = endpoint();
    expect((await POST(post(good))).status).toBe(200);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("refuses every cross-site spelling and never runs the handler", async () => {
    const { POST, spy } = endpoint();
    const attempts: Array<[string, Record<string, string>]> = [
      ["another site", { origin: "https://evil.example" }],
      ["a look-alike suffix", { origin: `https://${HOST}.evil.example` }],
      ["a look-alike prefix", { origin: `https://evil-${HOST}` }],
      ["a userinfo trick", { origin: `https://${HOST}@evil.example` }],
      ["the literal null origin", { origin: "null" }],
      ["a path on our origin", { origin: `https://${HOST}/x` }],
      ["plain http on our host", { origin: `http://${HOST}` }],
      ["a different port", { origin: `https://${HOST}:8443` }],
      ["a host header with userinfo", { host: `evil@${HOST}` }],
      ["a host header with a path", { host: `${HOST}/x` }],
    ];
    for (const [label, headers] of attempts) {
      expect((await POST(post(good, headers))).status, label).toBe(403);
    }
    // No origin header at all.
    const noOrigin = new Request(URL_BASE, { method: "POST", body: good, headers: { host: HOST, "content-type": "application/json" } });
    expect((await POST(noOrigin)).status, "no origin").toBe(403);
    expect(spy).not.toHaveBeenCalled();
  });

  it("a loopback http origin is not a way in outside local development", async () => {
    const { POST, spy } = endpoint();
    const response = await POST(post(good, { host: "localhost.evil.example", origin: "http://localhost.evil.example" }));
    expect(response.status).toBe(403);
    expect(spy).not.toHaveBeenCalled();
  });

  it("reads need no origin", async () => {
    const { GET, spy } = endpoint();
    const response = await GET(new Request(URL_BASE, { method: "GET", headers: { host: HOST } }));
    expect(response.status).toBe(200);
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

describe("request bodies are bounded and validated before the handler", () => {
  it("rejects an oversize body, invalid JSON, unknown fields and wrong types", async () => {
    const { POST, spy } = endpoint();
    expect((await POST(post(JSON.stringify({ name: "x".repeat(5000) })))).status, "oversize").toBe(413);
    expect((await POST(post("{not json"))).status, "invalid json").toBe(400);
    expect((await POST(post(JSON.stringify({ name: "ok", isAdmin: true })))).status, "unknown field").toBe(400);
    expect((await POST(post(JSON.stringify({ name: 7 })))).status, "wrong type").toBe(400);
    expect((await POST(post("[]"))).status, "array body").toBe(400);
    expect((await POST(post(""))).status, "empty body").toBe(400);
    expect(spy).not.toHaveBeenCalled();
  });

  it("does not echo the submitted value back in a validation error", async () => {
    const { POST } = endpoint();
    const response = await POST(post(JSON.stringify({ name: 7, secret: "hunter2-do-not-echo" })));
    expect(response.status).toBe(400);
    expect(await response.text()).not.toContain("hunter2-do-not-echo");
  });

  it("rejects repeated query parameters (parameter pollution)", async () => {
    const { GET, spy } = endpoint();
    const response = await GET(new Request(URL_BASE + "?a=1&a=2", { method: "GET", headers: { host: HOST } }));
    expect(response.status).toBe(400);
    expect(spy).not.toHaveBeenCalled();
  });
});

describe("failures never leak internals", () => {
  it("an unexpected error becomes a generic answer with no message, stack or path", async () => {
    const { POST } = endpoint(() => {
      throw new Error("connect ECONNREFUSED postgresql://app:hunter2@10.1.2.3:5432/lms at /srv/app/node_modules/pg/lib/client.js");
    });
    const response = await POST(post(JSON.stringify({ name: "ok" })));
    expect(response.status).toBe(500);
    const text = await response.text();
    const body = JSON.parse(text) as Record<string, unknown>;
    expect(body["error"]).toBe("INTERNAL_ERROR");
    // Only the stable code, a fixed friendly sentence and a request reference are allowed in the answer.
    expect(Object.keys(body).every((key) => ["error", "message", "requestId"].includes(key)), Object.keys(body).join(",")).toBe(true);
    for (const leak of ["hunter2", "postgresql", "/srv/app", "node_modules", "ECONNREFUSED", "stack"]) expect(text).not.toContain(leak);
  });

  it("every error answer is uncacheable and carries a request reference", async () => {
    const { POST } = endpoint(() => {
      throw new Error("boom");
    });
    const failure = await POST(post(JSON.stringify({ name: "ok" })));
    const rejected = await POST(post(JSON.stringify({ name: "ok" }), { origin: "https://evil.example" }));
    for (const response of [failure, rejected]) {
      expect(response.headers.get("cache-control")).toMatch(/no-store/);
      expect(response.headers.get("x-request-id")).toBeTruthy();
    }
  });
});

describe("one address cannot flood a public route", () => {
  it("answers 429 with Retry-After once the budget is spent, and other addresses are unaffected", async () => {
    resetIpRateLimitForTests();
    const { POST, spy } = endpoint();
    const body = JSON.stringify({ name: "ok" });
    let limited: Response | null = null;
    for (let i = 0; i < 400 && !limited; i += 1) {
      const response = await POST(post(body, { "x-forwarded-for": "203.0.113.9, 10.0.0.1" }));
      if (response.status === 429) limited = response;
    }
    expect(limited, "the per-address budget must eventually refuse").not.toBeNull();
    expect(limited!.headers.get("retry-after")).toBeTruthy();
    const handled = spy.mock.calls.length;
    expect(handled).toBeLessThan(400);
    const other = await POST(post(body, { "x-forwarded-for": "203.0.113.10, 10.0.0.1" }));
    expect(other.status).toBe(200);
  });

  it("spoofing leading X-Forwarded-For entries does not buy a fresh budget", async () => {
    resetIpRateLimitForTests();
    const { POST } = endpoint();
    const body = JSON.stringify({ name: "ok" });
    let limitedAt = -1;
    for (let i = 0; i < 400; i += 1) {
      // Only the last two entries are added by the trusted edge; the leading ones are attacker-controlled.
      const response = await POST(post(body, { "x-forwarded-for": `198.${(i >> 8) & 255}.${i & 255}.1, 203.0.113.50, 10.0.0.1` /* a different, valid first entry every time */ }));
      if (response.status === 429) {
        limitedAt = i;
        break;
      }
    }
    expect(limitedAt, "rotating the first entries must still hit the same bucket").toBeGreaterThan(0);
  });
});
