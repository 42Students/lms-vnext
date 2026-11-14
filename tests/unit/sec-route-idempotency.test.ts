import { describe, expect, it, vi } from "vitest";
import { createRoute } from "@/security/route-core";

function setup(over: Record<string, unknown> = {}) {
  const claimed = new Set<string>();
  const deps = {
    getContext: vi.fn(async () => ({ uid: "u1" })),
    requirePermission: vi.fn(),
    isSameOrigin: vi.fn(() => true),
    readJson: vi.fn(async () => ({ kind: "OK" as const, value: {} })),
    onError: vi.fn(() => Response.json({ error: "INTERNAL_ERROR" }, { status: 500 })),
    newRequestId: () => "rid",
    actorKey: (c: { uid: string }) => c.uid,
    claimIdempotency: vi.fn(async (key: string) => (claimed.has(key) ? false : (claimed.add(key), true))),
    releaseIdempotency: vi.fn(async (key: string) => void claimed.delete(key)),
    ...over,
  };
  return { deps, claimed, route: createRoute<{ uid: string }, string>(deps as never) };
}
const post = (key?: string, path = "/api/pay") =>
  new Request("https://a.test" + path, { method: "POST", body: "{}", headers: key ? { "Idempotency-Key": key } : {} });

describe("route idempotency option", () => {
  it("runs the first request and refuses a repeat without running the handler again", async () => {
    const { route } = setup();
    const handler = vi.fn(async () => Response.json({ ok: true }));
    const h = route({ auth: "user", permission: "service-enforced", idempotent: true }, handler);
    expect((await h(post("key-12345678"))).status).toBe(200);
    const repeat = await h(post("key-12345678"));
    expect(repeat.status).toBe(409);
    expect(await repeat.json()).toEqual({ error: "DUPLICATE_REQUEST" });
    expect(handler).toHaveBeenCalledTimes(1);
  });
  it("requires a well-formed key", async () => {
    const { route, deps } = setup();
    const h = route({ auth: "user", permission: "service-enforced", idempotent: true }, async () => Response.json({}));
    for (const bad of [undefined, "short", "has space in it!!", "x".repeat(129)]) {
      const res = await h(post(bad));
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ error: "IDEMPOTENCY_KEY_REQUIRED" });
    }
    expect(deps.claimIdempotency).not.toHaveBeenCalled();
  });
  it("keeps keys apart per person, per route and per method", async () => {
    const { route, deps } = setup();
    const h = route({ auth: "user", permission: "service-enforced", idempotent: true }, async () => Response.json({}));
    await h(post("same-key-0001", "/api/a"));
    expect((await h(post("same-key-0001", "/api/b"))).status).toBe(200);
    const keys = deps.claimIdempotency.mock.calls.map((c) => c[0] as string);
    expect(new Set(keys).size).toBe(2);
    expect(keys[0]).toContain("user:u1");
  });
  it("releases the key when the handler fails on our side, so the same request can be retried", async () => {
    const { route, claimed } = setup();
    let fail = true;
    const h = route({ auth: "user", permission: "service-enforced", idempotent: true }, async () => {
      if (fail) throw new Error("boom");
      return Response.json({ ok: true });
    });
    expect((await h(post("retry-key-001"))).status).toBe(500);
    expect(claimed.size).toBe(0);
    fail = false;
    expect((await h(post("retry-key-001"))).status).toBe(200);
  });
  it("keeps the key after a client error (the request was understood and refused)", async () => {
    const { route, claimed } = setup();
    const h = route({ auth: "user", permission: "service-enforced", idempotent: true }, async () => Response.json({ error: "NO" }, { status: 422 }));
    await h(post("client-err-001"));
    expect(claimed.size).toBe(1);
  });
  it("does not apply to reads", async () => {
    const { route, deps } = setup();
    const h = route({ auth: "user", permission: "service-enforced", idempotent: true }, async () => Response.json({}));
    expect((await h(new Request("https://a.test/api/r"))).status).toBe(200);
    expect(deps.claimIdempotency).not.toHaveBeenCalled();
  });
  it("fails closed when the claim store cannot be reached", async () => {
    const { route } = setup({ claimIdempotency: vi.fn(async () => { throw new Error("store down"); }) });
    const h = route({ auth: "user", permission: "service-enforced", idempotent: true }, async () => Response.json({ ok: true }));
    expect((await h(post("store-down-001"))).status).toBe(500);
  });
});
