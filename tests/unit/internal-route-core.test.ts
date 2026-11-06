import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { createInternalRoute, credentialMatches } from "@/security/internal-route-core";

const SECRET = "s".repeat(40);
function setup(over: Record<string, unknown> = {}) {
  const denied: unknown[] = [];
  const deps = {
    readSecret: vi.fn((n: string) => (n === "SECRET_ENV" ? SECRET : undefined)),
    readJson: vi.fn(async () => ({ kind: "OK" as const, value: { job: "x" } })),
    onError: vi.fn(() => Response.json({ error: "E" }, { status: 500 })),
    newRequestId: () => "rid",
    onDenied: (e: unknown) => denied.push(e),
    ...over,
  };
  return { deps, denied, internalRoute: createInternalRoute(deps as never) };
}
const cfg = { name: "internal.test", credential: { kind: "header" as const, header: "x-key", secretEnv: "SECRET_ENV" } };
const call = (headers: Record<string, string>, url = "https://a.test/api/internal/x") =>
  new Request(url, { method: "POST", headers });

describe("internal route pipeline", () => {
  it("accepts the right credential and returns no-store with a request id", async () => {
    const { internalRoute } = setup();
    const res = await internalRoute(cfg, async () => Response.json({ ok: true }))(call({ "x-key": SECRET }));
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(res.headers.get("x-request-id")).toBe("rid");
  });

  it("rejects any browser Origin even with a valid credential", async () => {
    const { internalRoute, denied } = setup();
    const handler = vi.fn(async () => Response.json({}));
    const res = await internalRoute(cfg, handler)(call({ "x-key": SECRET, origin: "https://evil.test" }));
    expect(res.status).toBe(403);
    expect(handler).not.toHaveBeenCalled();
    expect(denied).toEqual([{ route: "internal.test", reason: "ORIGIN", requestId: "rid" }]);
  });

  it("denies a missing or wrong credential without saying which", async () => {
    const { internalRoute } = setup();
    const h = internalRoute(cfg, async () => Response.json({}));
    expect((await h(call({}))).status).toBe(403);
    expect((await h(call({ "x-key": "wrong" }))).status).toBe(403);
    expect((await h(call({ "x-key": SECRET + "x" }))).status).toBe(403);
  });

  it("fails closed when the server secret is unset or shorter than 32 bytes", async () => {
    const short = setup({ readSecret: () => "short" });
    expect((await short.internalRoute(cfg, async () => Response.json({}))(call({ "x-key": "short" }))).status).toBe(403);
    const unset = setup({ readSecret: () => undefined });
    expect((await unset.internalRoute(cfg, async () => Response.json({}))(call({ "x-key": "" }))).status).toBe(403);
  });

  it("supports a bearer credential", async () => {
    const { internalRoute } = setup();
    const h = internalRoute({ ...cfg, credential: { kind: "bearer", secretEnv: "SECRET_ENV" } }, async () => Response.json({}));
    expect((await h(call({ authorization: "Bearer " + SECRET }))).status).toBe(200);
    expect((await h(call({ authorization: SECRET }))).status).toBe(403);
  });

  it("rejects a query string unless allowed", async () => {
    const { internalRoute } = setup();
    expect((await internalRoute(cfg, async () => Response.json({}))(call({ "x-key": SECRET }, "https://a.test/x?job=1"))).status).toBe(400);
    expect((await internalRoute({ ...cfg, allowQuery: true }, async () => Response.json({}))(call({ "x-key": SECRET }, "https://a.test/x?job=1"))).status).toBe(200);
  });

  it("keeps a route's existing denial body", async () => {
    const { internalRoute } = setup();
    const res = await internalRoute({ ...cfg, denied: { status: 401, body: { error: "UNAUTHORIZED" } } }, async () => Response.json({}))(call({}));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "UNAUTHORIZED" });
  });

  it("reads the body only after the credential passes", async () => {
    const { internalRoute, deps } = setup();
    const h = internalRoute({ ...cfg, body: { schema: z.object({ job: z.string() }).strict(), maxBytes: 100 } }, async ({ body }) => Response.json(body));
    await h(call({}));
    expect(deps.readJson).not.toHaveBeenCalled();
    const ok = await h(call({ "x-key": SECRET }));
    expect(await ok.json()).toEqual({ job: "x" });
  });

  it("maps oversize and invalid bodies, and schema violations to errors", async () => {
    const big = setup({ readJson: async () => ({ kind: "TOO_LARGE" }) });
    expect((await big.internalRoute({ ...cfg, body: { schema: z.unknown(), maxBytes: 1 } }, async () => Response.json({}))(call({ "x-key": SECRET }))).status).toBe(413);
    const bad = setup({ readJson: async () => ({ kind: "INVALID" }) });
    expect((await bad.internalRoute({ ...cfg, body: { schema: z.unknown(), maxBytes: 1 } }, async () => Response.json({}))(call({ "x-key": SECRET }))).status).toBe(400);
    const strict = setup({ readJson: async () => ({ kind: "OK", value: { job: "x", extra: 1 } }) });
    const res = await strict.internalRoute({ ...cfg, body: { schema: z.object({ job: z.string() }).strict(), maxBytes: 100 } }, async () => Response.json({}))(call({ "x-key": SECRET }));
    expect(res.status).toBe(500); // ZodError goes to onError (apiErrorResponse maps it to 400)
    expect(strict.deps.onError).toHaveBeenCalled();
  });

  it("credentialMatches is constant-shape and length-safe", () => {
    expect(credentialMatches(SECRET, SECRET)).toBe(true);
    expect(credentialMatches(null, SECRET)).toBe(false);
    expect(credentialMatches(SECRET, undefined)).toBe(false);
    expect(credentialMatches("a", SECRET)).toBe(false);
  });
});
