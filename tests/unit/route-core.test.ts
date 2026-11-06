import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { createRoute } from "@/security/route-core";

function setup(over: Record<string, unknown> = {}) {
  const calls: string[] = [];
  const deps = {
    getContext: vi.fn(async () => { calls.push("auth"); return { uid: "u1" }; }),
    requirePermission: vi.fn(() => { calls.push("perm"); }),
    isSameOrigin: vi.fn(() => { calls.push("origin"); return true; }),
    readJson: vi.fn(async () => { calls.push("body"); return { kind: "OK" as const, value: { name: "a" } }; }),
    onError: vi.fn((e: unknown) => Response.json({ error: "X", m: String(e) }, { status: 500 })),
    newRequestId: () => "rid-1",
    ...over,
  };
  return { calls, deps, route: createRoute<{ uid: string }, string>(deps as never) };
}
const post = () => new Request("https://a.test/api/x", { method: "POST", body: "{}" });
const schema = z.object({ name: z.string() }).strict();

describe("central route pipeline", () => {
  it("runs origin -> auth -> permission -> body -> handler in order", async () => {
    const { calls, route } = setup();
    const h = route({ auth: "user", permission: "p.read", body: { schema, maxBytes: 100 } },
      async ({ body }) => { calls.push("handler"); return Response.json(body); });
    const res = await h(post());
    expect(res.status).toBe(200);
    expect(calls).toEqual(["origin", "auth", "perm", "body", "handler"]);
    expect(res.headers.get("x-request-id")).toBe("rid-1");
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
  });

  it("rejects a cross-origin write before authentication", async () => {
    const { deps, route } = setup({ isSameOrigin: vi.fn(() => false) });
    const h = route({ auth: "user", permission: "service-enforced" }, async () => Response.json({}));
    const res = await h(post());
    expect(res.status).toBe(403);
    expect(deps.getContext).not.toHaveBeenCalled();
  });

  it("does not read the body when permission is denied", async () => {
    const { deps, route } = setup({ requirePermission: vi.fn(() => { throw new Error("denied"); }) });
    const h = route({ auth: "user", permission: "p.write", body: { schema, maxBytes: 100 } }, async () => Response.json({}));
    const res = await h(post());
    expect(res.status).toBe(500);
    expect(deps.readJson).not.toHaveBeenCalled();
    expect(deps.onError).toHaveBeenCalled();
  });

  it("skips the permission call only for service-enforced", async () => {
    const { deps, route } = setup();
    await route({ auth: "user", permission: "service-enforced" }, async () => Response.json({}))(new Request("https://a.test/x"));
    expect(deps.requirePermission).not.toHaveBeenCalled();
  });

  it("maps unknown fields, invalid json and oversize bodies to client errors", async () => {
    const bad = setup({ readJson: vi.fn(async () => ({ kind: "OK", value: { name: "a", extra: 1 } })) });
    const h1 = bad.route({ auth: "user", permission: "service-enforced", body: { schema, maxBytes: 10 } }, async () => Response.json({}));
    expect((await h1(post())).status).toBe(500); // zod error goes to onError (apiErrorResponse maps to 400)
    expect(bad.deps.onError).toHaveBeenCalled();

    const inv = setup({ readJson: vi.fn(async () => ({ kind: "INVALID" })) });
    expect((await inv.route({ auth: "user", permission: "service-enforced", body: { schema, maxBytes: 10 } }, async () => Response.json({}))(post())).status).toBe(400);

    const big = setup({ readJson: vi.fn(async () => ({ kind: "TOO_LARGE" })) });
    expect((await big.route({ auth: "user", permission: "service-enforced", body: { schema, maxBytes: 10 } }, async () => Response.json({}))(post())).status).toBe(413);
  });

  it("rejects duplicate query keys", async () => {
    const { route } = setup();
    const h = route({ auth: "user", permission: "service-enforced" }, async () => Response.json({}));
    expect((await h(new Request("https://a.test/x?a=1&a=2"))).status).toBe(400);
  });

  it("public routes skip auth and require a reason", async () => {
    const { deps, route } = setup();
    const h = route({ auth: "public", publicReason: "sign-in" }, async ({ context }) => Response.json({ c: context }));
    expect((await h(new Request("https://a.test/x"))).status).toBe(200);
    expect(deps.getContext).not.toHaveBeenCalled();
    expect(() => route({ auth: "public", publicReason: " " }, async () => Response.json({}))).toThrow();
    expect(() => route({ auth: "public", publicReason: "r", csrf: false, csrfExemptReason: "" }, async () => Response.json({}))).toThrow();
  });

  it("resolves async params", async () => {
    const { route } = setup();
    const h = route({ auth: "user", permission: "service-enforced" }, async ({ params }) => Response.json(params));
    const res = await h(new Request("https://a.test/x"), { params: Promise.resolve({ id: "7" }) });
    expect(await res.json()).toEqual({ id: "7" });
  });
});

describe("repeatable query keys", () => {
  it("allows only the declared keys to repeat", async () => {
    const { route } = setup();
    const h = route({ auth: "user", permission: "service-enforced", repeatableQuery: ["tag"] }, async () => Response.json({}));
    expect((await h(new Request("https://a.test/x?tag=1&tag=2"))).status).toBe(200);
    expect((await h(new Request("https://a.test/x?a=1&a=2"))).status).toBe(400);
  });
});

describe("database scope", () => {
  it("runs the handler inside the actor scope, and only for authenticated routes", async () => {
    const seen: unknown[] = [];
    const { route } = setup({ runInScope: (ctx: unknown, fn: () => unknown) => { seen.push(ctx); return fn(); } });
    await route({ auth: "user", permission: "service-enforced" }, async () => Response.json({}))(new Request("https://a.test/x"));
    await route({ auth: "public", publicReason: "x" }, async () => Response.json({}))(new Request("https://a.test/x"));
    expect(seen).toEqual([{ uid: "u1" }]);
  });
});

describe("audit hook", () => {
  const events: Array<Record<string, unknown>> = [];
  const make = () => setup({ onAudit: (e: Record<string, unknown>) => events.push(e) });

  it("records state-changing requests with identifiers only", async () => {
    events.length = 0;
    const { route } = make();
    await route({ auth: "user", permission: "service-enforced" }, async () => Response.json({}))(
      new Request("https://a.test/api/x?secret=1", { method: "POST", body: "{}" }),
    );
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ method: "POST", path: "/api/x", status: 200, context: { uid: "u1" }, requestId: "rid-1" });
    expect(JSON.stringify(events[0])).not.toContain("secret");
  });

  it("records denials but not successful reads, and skips public routes", async () => {
    events.length = 0;
    const { route } = make();
    await route({ auth: "user", permission: "service-enforced" }, async () => Response.json({}))(new Request("https://a.test/x"));
    expect(events).toHaveLength(0);
    await route({ auth: "user", permission: "service-enforced" }, async () => Response.json({}, { status: 403 }))(new Request("https://a.test/x"));
    expect(events).toHaveLength(1);
    await route({ auth: "public", publicReason: "r" }, async () => Response.json({}))(new Request("https://a.test/x", { method: "POST" }));
    expect(events).toHaveLength(1);
  });

  it("never lets a failing audit hook change the response", async () => {
    const { route } = setup({ onAudit: () => { throw new Error("boom"); } });
    const res = await route({ auth: "user", permission: "service-enforced" }, async () => Response.json({ ok: 1 }))(
      new Request("https://a.test/x", { method: "POST", body: "{}" }),
    );
    expect(res.status).toBe(200);
  });
});

describe("route abuse control (L8)", () => {
  const base = () => {
    const calls: Array<[string, number, number]> = [];
    let allow = true;
    const deps = {
      getContext: async () => ({ user: { id: "u1" } }),
      requirePermission: () => undefined,
      isSameOrigin: () => true,
      readJson: async () => ({ kind: "OK" as const, value: {} }),
      onError: () => Response.json({ error: "E" }, { status: 500 }),
      newRequestId: () => "rid",
      allowRequest: (k: string, l: number, w: number) => (calls.push([k, l, w]), allow),
      actorKey: (c: { user: { id: string } }) => c.user.id,
      clientAddress: () => "9.9.9.9",
      defaultMutationLimit: { limit: 300, windowMs: 60_000 },
    };
    return { calls, setAllow: (v: boolean) => (allow = v), route: createRoute(deps as never) };
  };
  const post = (path = "/api/x") => new Request("https://a.test" + path, { method: "POST" });

  it("applies one central default write budget per user", async () => {
    const { route, calls } = base();
    const res = await route({ auth: "user", permission: "service-enforced" }, async () => Response.json({ ok: 1 }))(post());
    expect(res.status).toBe(200);
    expect(calls).toEqual([["user:u1:writes", 300, 60_000]]);
  });

  it("returns 429 with Retry-After and does not run the handler when over budget", async () => {
    const { route, setAllow } = base();
    setAllow(false);
    const handler = vi.fn(async () => Response.json({}));
    const res = await route({ auth: "user", permission: "service-enforced" }, handler)(post());
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("60");
    expect(await res.json()).toEqual({ error: "RATE_LIMITED" });
    expect(handler).not.toHaveBeenCalled();
  });

  it("a route budget overrides the default and false opts out", async () => {
    const a = base();
    await a.route({ auth: "user", permission: "service-enforced", rateLimit: { limit: 5, windowMs: 1000 } }, async () => Response.json({}))(post());
    expect(a.calls[0]).toEqual(["user:u1:POST:/api/x", 5, 1000]);
    const b = base();
    await b.route({ auth: "user", permission: "service-enforced", rateLimit: false }, async () => Response.json({}))(post());
    expect(b.calls).toEqual([]);
  });

  it("does not throttle plain reads by default", async () => {
    const { route, calls } = base();
    await route({ auth: "user", permission: "service-enforced" }, async () => Response.json({}))(new Request("https://a.test/api/x"));
    expect(calls).toEqual([]);
  });

  it("throttles public routes by caller address before doing any work", async () => {
    const { route, calls, setAllow } = base();
    setAllow(false);
    const handler = vi.fn(async () => Response.json({}));
    const res = await route({ auth: "public", publicReason: "r", rateLimit: { limit: 3 } }, handler)(new Request("https://a.test/api/p"));
    expect(res.status).toBe(429);
    expect(calls).toEqual([["pub:GET:/api/p:9.9.9.9", 3, 60_000]]);
    expect(handler).not.toHaveBeenCalled();
  });
});

describe("route downloads (L6)", () => {
  it("hardens an attachment and audits the export even for a GET", async () => {
    const events: Array<{ download?: boolean; status: number }> = [];
    const route = createRoute({
      getContext: async () => ({ user: { id: "u1" } }),
      requirePermission: () => undefined,
      isSameOrigin: () => true,
      readJson: async () => ({ kind: "OK" as const, value: {} }),
      onError: () => Response.json({}, { status: 500 }),
      newRequestId: () => "rid",
      onAudit: (e: { download?: boolean; status: number }) => events.push(e),
    } as never);
    const res = await route({ auth: "user", permission: "service-enforced" }, async () =>
      new Response("a", { headers: { "Content-Disposition": 'attachment; filename="x.csv"', "Cache-Control": "public" } }),
    )(new Request("https://a.test/api/export"));
    expect(res.headers.get("Cache-Control")).toBe("private, no-store, max-age=0");
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(events).toEqual([expect.objectContaining({ status: 200, download: true })]);
  });
});
