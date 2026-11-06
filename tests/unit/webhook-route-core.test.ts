import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { createWebhookRoute, signWebhook } from "@/security/webhook-route-core";

const SECRET = "w".repeat(40);
const NOW = 1_800_000_000;
const schema = z.object({ id: z.number() });

function setup(over: Record<string, unknown> = {}) {
  const denied: Array<{ reason: string }> = [];
  const claimed = new Set<string>();
  const deps = {
    readSecret: vi.fn((n: string) => (n === "WH_SECRET" ? SECRET : undefined)),
    readRaw: vi.fn(async (r: Request) => ({ kind: "OK" as const, text: await r.clone().text() })),
    claimDelivery: vi.fn(async (k: string) => (claimed.has(k) ? false : (claimed.add(k), true))),
    releaseDelivery: vi.fn(async (k: string) => void claimed.delete(k)),
    now: () => NOW,
    onError: vi.fn(() => Response.json({ error: "E" }, { status: 500 })),
    newRequestId: () => "rid",
    onDenied: (e: { reason: string }) => denied.push(e),
    ...over,
  };
  return { deps, denied, webhookRoute: createWebhookRoute(deps as never) };
}

const hmacCfg = {
  name: "webhook.test",
  auth: { kind: "hmac" as const, header: "x-sig", prefix: "sha256=", secretEnv: "WH_SECRET" },
  body: { schema, maxBytes: 1024 },
};
const stampedCfg = {
  ...hmacCfg,
  auth: { ...hmacCfg.auth, timestamp: { header: "x-ts", toleranceSeconds: 300 } },
};
const raw = JSON.stringify({ id: 7 });
const post = (headers: Record<string, string>, body = raw) =>
  new Request("https://a.test/api/webhooks/x", { method: "POST", headers, body });
const sig = (signed: string) => "sha256=" + signWebhook(SECRET, signed);
const ok = async () => Response.json({ ok: true });

describe("webhook route pipeline", () => {
  it("accepts a correctly signed delivery, no-store, with a request id", async () => {
    const { webhookRoute } = setup();
    const res = await webhookRoute(hmacCfg, ok)(post({ "x-sig": sig(raw) }));
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(res.headers.get("x-request-id")).toBe("rid");
  });

  it("rejects a bad or missing signature before parsing anything", async () => {
    const { webhookRoute, denied } = setup();
    const handler = vi.fn(ok);
    for (const headers of [{}, { "x-sig": "sha256=" + "0".repeat(64) }, { "x-sig": "nope" }, { "x-sig": sig(raw + " ") }]) {
      const res = await webhookRoute(hmacCfg, handler)(post(headers as Record<string, string>));
      expect(res.status).toBe(401);
    }
    expect(handler).not.toHaveBeenCalled();
    expect(denied.every((d) => d.reason === "SIGNATURE")).toBe(true);
  });

  it("denies everything when the server secret is missing or short", async () => {
    for (const secret of [undefined, "short"]) {
      const { webhookRoute } = setup({ readSecret: () => secret });
      const res = await webhookRoute(hmacCfg, ok)(post({ "x-sig": sig(raw) }));
      expect(res.status).toBe(401);
    }
  });

  it("rejects a browser Origin even with a valid signature", async () => {
    const { webhookRoute, denied } = setup();
    const res = await webhookRoute(hmacCfg, ok)(post({ "x-sig": sig(raw), origin: "https://evil.test" }));
    expect(res.status).toBe(401);
    expect(denied[0]?.reason).toBe("ORIGIN");
  });

  it("rejects a replayed delivery with 409 and runs the handler once", async () => {
    const { webhookRoute, denied } = setup();
    const handler = vi.fn(ok);
    const route = webhookRoute(hmacCfg, handler);
    expect((await route(post({ "x-sig": sig(raw) }))).status).toBe(200);
    const second = await route(post({ "x-sig": sig(raw) }));
    expect(second.status).toBe(409);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(denied.at(-1)?.reason).toBe("REPLAY");
  });

  it("keys the replay claim on the signature, so an unsigned header cannot create a fresh key", async () => {
    const { webhookRoute, deps } = setup();
    const route = webhookRoute(hmacCfg, ok);
    expect((await route(post({ "x-sig": sig(raw), "x-delivery-id": "a" }))).status).toBe(200);
    expect((await route(post({ "x-sig": sig(raw), "x-delivery-id": "b" }))).status).toBe(409);
    expect(deps.claimDelivery).toHaveBeenCalledWith("webhook.test:" + signWebhook(SECRET, raw), 86_400);
  });

  it("treats an upper-case copy of the same signature as the same delivery", async () => {
    const { webhookRoute } = setup();
    const route = webhookRoute(hmacCfg, ok);
    expect((await route(post({ "x-sig": sig(raw) }))).status).toBe(200);
    expect((await route(post({ "x-sig": "sha256=" + signWebhook(SECRET, raw).toUpperCase() }))).status).toBe(409);
  });

  it("token providers are deduplicated on a hash of the body", async () => {
    const { webhookRoute } = setup();
    const cfg = { name: "webhook.token", auth: { kind: "token" as const, header: "x-secret", secretEnv: "WH_SECRET" }, body: { schema, maxBytes: 1024 } };
    const route = webhookRoute(cfg, ok);
    expect((await route(post({ "x-secret": SECRET }))).status).toBe(200);
    expect((await route(post({ "x-secret": SECRET }))).status).toBe(409);
    expect((await route(post({ "x-secret": SECRET }, JSON.stringify({ id: 8 })))).status).toBe(200);
  });

  it("does not consume the claim for a body that fails the schema", async () => {
    const { webhookRoute, deps } = setup();
    const bad = JSON.stringify({ id: "x" });
    expect((await webhookRoute(hmacCfg, ok)(post({ "x-sig": sig(bad) }, bad))).status).toBe(400);
    expect(deps.claimDelivery).not.toHaveBeenCalled();
  });

  it("releases the claim when the handler throws or answers 5xx, so the provider's retry is accepted", async () => {
    const { webhookRoute, deps } = setup();
    let attempt = 0;
    const route = webhookRoute(hmacCfg, async () => {
      attempt += 1;
      if (attempt === 1) throw new Error("boom");
      if (attempt === 2) return Response.json({}, { status: 503 });
      return Response.json({ ok: 1 });
    });
    expect((await route(post({ "x-sig": sig(raw) }))).status).toBe(500);
    expect((await route(post({ "x-sig": sig(raw) }))).status).toBe(503);
    expect((await route(post({ "x-sig": sig(raw) }))).status).toBe(200);
    expect(deps.releaseDelivery).toHaveBeenCalledTimes(2);
    expect((await route(post({ "x-sig": sig(raw) }))).status).toBe(409);
  });

  it("checks the signed timestamp and rejects stale deliveries", async () => {
    const { webhookRoute, denied } = setup();
    const route = webhookRoute(stampedCfg, ok);
    const fresh = String(NOW - 10);
    expect((await route(post({ "x-ts": fresh, "x-sig": sig(`${fresh}.${raw}`) }))).status).toBe(200);
    const old = String(NOW - 1000);
    const res = await route(post({ "x-ts": old, "x-sig": sig(`${old}.${raw}`) }));
    expect(res.status).toBe(401);
    expect(denied.at(-1)?.reason).toBe("STALE");
  });

  it("does not accept a signature computed without the timestamp when one is required", async () => {
    const { webhookRoute } = setup();
    const res = await webhookRoute(stampedCfg, ok)(post({ "x-ts": String(NOW), "x-sig": sig(raw) }));
    expect(res.status).toBe(401);
  });

  it("supports shared-token providers in constant time", async () => {
    const { webhookRoute } = setup();
    const cfg = { name: "webhook.token", auth: { kind: "token" as const, header: "x-secret", secretEnv: "WH_SECRET" }, body: { schema, maxBytes: 1024 } };
    expect((await webhookRoute(cfg, ok)(post({ "x-secret": SECRET }))).status).toBe(200);
    expect((await webhookRoute(cfg, ok)(post({ "x-secret": "x".repeat(40) }))).status).toBe(401);
  });

  it("authenticates before schema validation and maps oversize to 413", async () => {
    const { webhookRoute } = setup();
    const bad = JSON.stringify({ id: "not-a-number" });
    expect((await webhookRoute(hmacCfg, ok)(post({ "x-sig": sig(bad) }, bad))).status).toBe(400);
    const big = setup({ readRaw: async () => ({ kind: "TOO_LARGE" as const }) });
    expect((await big.webhookRoute(hmacCfg, ok)(post({ "x-sig": sig(raw) }))).status).toBe(413);
  });

  it("maps handler errors through onError", async () => {
    const { webhookRoute } = setup();
    const res = await webhookRoute(hmacCfg, async () => {
      throw new Error("boom");
    })(post({ "x-sig": sig(raw) }));
    expect(res.status).toBe(500);
  });
});
