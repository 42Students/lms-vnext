import { describe, expect, it, vi } from "vitest";
import { createSecured } from "@/security/secure-handler-core";

function setup(over: Record<string, unknown> = {}) {
  const events: Array<Record<string, unknown>> = [];
  let holderOpen = 0;
  const deps = {
    isSameOrigin: vi.fn(() => true),
    runWithHolder: <T,>(fn: () => T) => {
      holderOpen++;
      return fn();
    },
    currentActor: () => ({ userId: "u1", collegeId: "c1", role: "TPO" }),
    onAudit: (e: Record<string, unknown>) => events.push(e),
    newRequestId: () => "rid",
    ...over,
  };
  return { secured: createSecured(deps as never), events, deps, holders: () => holderOpen };
}
const post = (url = "https://a.test/api/x?token=abc") => new Request(url, { method: "POST", body: "{}" });

describe("secured() shim", () => {
  it("passes arguments and the response through untouched, and adds a request id", async () => {
    const { secured, holders } = setup();
    const handler = vi.fn(async (_r: Request, ctx: { params: Promise<{ id: string }> }) =>
      Response.json({ id: (await ctx.params).id }, { status: 201, headers: { "set-cookie": "a=1" } }),
    );
    const res = (await secured(handler)(post(), { params: Promise.resolve({ id: "7" }) })) as Response;
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ id: "7" });
    expect(res.headers.get("x-request-id")).toBe("rid");
    expect(res.headers.get("set-cookie")).toBe("a=1");
    expect(holders()).toBe(1);
  });

  it("does not overwrite a request id or Cache-Control the handler set", async () => {
    const { secured } = setup();
    const res = (await secured(async (_r: Request) =>
      Response.json({}, { headers: { "x-request-id": "mine", "cache-control": "public, max-age=60" } }),
    )(post())) as Response;
    expect(res.headers.get("x-request-id")).toBe("mine");
    expect(res.headers.get("cache-control")).toBe("public, max-age=60");
  });

  it("does not enforce origin by default (the handler owns it)", async () => {
    const { secured, deps } = setup({ isSameOrigin: vi.fn(() => false) });
    const handler = vi.fn(async (_r: Request) => Response.json({}));
    await secured(handler)(post());
    expect(handler).toHaveBeenCalled();
    expect(deps.isSameOrigin).not.toHaveBeenCalled();
  });

  it('with csrf: "enforce" rejects a cross-origin write before the handler and still audits it', async () => {
    const { secured, events } = setup({ isSameOrigin: vi.fn(() => false) });
    const handler = vi.fn(async (_r: Request) => Response.json({}));
    const res = (await secured(handler, { csrf: "enforce" })(post())) as Response;
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "INVALID_ORIGIN" });
    expect(handler).not.toHaveBeenCalled();
    expect(events).toEqual([expect.objectContaining({ status: 403, method: "POST" })]);
  });

  it("does not check origin for reads", async () => {
    const { secured } = setup({ isSameOrigin: vi.fn(() => false) });
    const res = (await secured(async (_r: Request) => Response.json({}), { csrf: "enforce" })(
      new Request("https://a.test/x"),
    )) as Response;
    expect(res.status).toBe(200);
  });

  it("audits writes and denials with identifiers only, never query values", async () => {
    const { secured, events } = setup();
    await secured(async (_r: Request) => Response.json({}))(post());
    await secured(async (_r: Request) => Response.json({}))(new Request("https://a.test/x"));
    await secured(async (_r: Request) => Response.json({}, { status: 403 }))(new Request("https://a.test/x"));
    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({ path: "/api/x", status: 200, actor: { userId: "u1", collegeId: "c1", role: "TPO" } });
    expect(JSON.stringify(events)).not.toContain("abc");
  });

  it("audits and rethrows a handler exception", async () => {
    const { secured, events } = setup();
    await expect(
      secured(async (_r: Request): Promise<Response> => {
        throw new Error("boom");
      })(post()),
    ).rejects.toThrow("boom");
    expect(events[0]).toMatchObject({ status: 500 });
  });

  it("a failing audit hook never changes the outcome", async () => {
    const { secured } = setup({
      onAudit: () => {
        throw new Error("x");
      },
    });
    const res = (await secured(async (_r: Request) => Response.json({ ok: 1 }))(post())) as Response;
    expect(res.status).toBe(200);
  });
});

describe("secured() with unusual invocations", () => {
  it("tolerates a handler called with no Request argument", async () => {
    const { secured, events } = setup();
    const res = (await secured(async () => Response.json({ ok: true }))()) as Response;
    expect(res.status).toBe(200);
    expect(events).toHaveLength(0);
  });

  it("tolerates a duck-typed request with an unparsable url", async () => {
    const { secured, events } = setup();
    const fake = { method: "POST", url: "not a url", headers: new Headers() };
    await secured(async () => Response.json({}))(fake as never);
    expect(events[0]).toMatchObject({ path: "" });
  });
});

describe("secured(): downloads are hardened and audited centrally", () => {
  const make = () => {
    const events: Array<{ download?: boolean; method: string; status: number }> = [];
    const secured = createSecured({
      isSameOrigin: () => true,
      runWithHolder: (fn) => fn(),
      currentActor: () => ({ userId: "u", collegeId: "c", role: "COLLEGE_ADMIN" }),
      onAudit: (e: { download?: boolean; method: string; status: number }) => events.push(e),
      newRequestId: () => "rid",
    } as never);
    return { events, secured };
  };
  const csv = () => new Response("a,b", { headers: { "Content-Type": "text/csv", "Content-Disposition": 'attachment; filename="x.csv"', "Cache-Control": "public, max-age=600" } });

  it("forces no-store and nosniff on an attachment and audits a GET export", async () => {
    const { events, secured } = make();
    const res = (await secured(async (_r: Request) => csv())(new Request("https://a.test/api/x-export"))) as Response;
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(events).toEqual([expect.objectContaining({ method: "GET", status: 200, download: true })]);
  });

  it("does not audit ordinary reads and does not touch non-attachment responses", async () => {
    const { events, secured } = make();
    const res = (await secured(async (_r: Request) => Response.json({ ok: 1 }, { headers: { "Cache-Control": "public" } }))(new Request("https://a.test/api/y"))) as Response;
    expect(res.headers.get("Cache-Control")).toBe("public");
    expect(events).toEqual([]);
  });

  it("does not audit a failed download attempt as an export", async () => {
    const { events, secured } = make();
    await secured(async (_r: Request) => new Response("no", { status: 403, headers: { "Content-Disposition": "attachment" } }))(new Request("https://a.test/api/z"));
    expect(events).toEqual([expect.objectContaining({ status: 403 })]);
    expect(events[0]?.download).toBeUndefined();
  });
});

describe("secured(): central permission", () => {
  const make = (opts: { allow?: boolean } = {}) => {
    const events: Array<{ status: number }> = [];
    const calls: string[] = [];
    const secured = createSecured({
      isSameOrigin: (r: Request) => r.headers.get("origin") === "https://a.test",
      runWithHolder: (fn) => fn(),
      currentActor: () => null,
      onAudit: (e: { status: number }) => events.push(e),
      newRequestId: () => "rid",
      getContext: async () => (calls.push("ctx"), { user: { id: "u" } }),
      requirePermission: (_c: unknown, p: string) => {
        calls.push("perm:" + p);
        if (opts.allow === false) throw new Error("FORBIDDEN");
      },
      onPermitted: () => calls.push("offered"),
      onError: (e: unknown) => Response.json({ error: (e as Error).message }, { status: 403 }),
    } as never);
    return { events, calls, secured };
  };
  const post = (origin = "https://a.test") => new Request("https://a.test/api/x", { method: "POST", headers: { origin } });

  it("checks the permission after the origin and before the handler", async () => {
    const { secured, calls } = make();
    const handler = vi.fn(async () => (calls.push("handler"), Response.json({ ok: 1 })));
    const res = (await secured(handler, { csrf: "enforce", permission: "academics.manage" })(post())) as Response;
    expect(res.status).toBe(200);
    expect(calls).toEqual(["ctx", "perm:academics.manage", "offered", "handler"]);
  });

  it("refuses a cross-origin write before resolving the actor", async () => {
    const { secured, calls } = make();
    const res = (await secured(async () => Response.json({}), { csrf: "enforce", permission: "academics.manage" })(post("https://evil.test"))) as Response;
    expect(res.status).toBe(403);
    expect(calls).toEqual([]);
  });

  it("denies a missing permission without running the handler and audits it", async () => {
    const { secured, events } = make({ allow: false });
    const handler = vi.fn(async () => Response.json({}));
    const res = (await secured(handler, { csrf: "enforce", permission: "academics.manage" })(post())) as Response;
    expect(res.status).toBe(403);
    expect(res.headers.get("x-request-id")).toBe("rid");
    expect(handler).not.toHaveBeenCalled();
    expect(events).toEqual([expect.objectContaining({ status: 403 })]);
  });
});

describe("secured(): step-up authentication", () => {
  const make = (fresh: (c: unknown, max: number) => Promise<void>) => {
    const events: Array<{ status: number }> = [];
    const secured = createSecured({
      isSameOrigin: () => true,
      runWithHolder: (fn) => fn(),
      currentActor: () => null,
      onAudit: (e: { status: number }) => events.push(e),
      newRequestId: () => "rid",
      getContext: async () => ({ user: { id: "u" } }),
      requireFreshAuth: fresh,
      onError: (e: unknown) => Response.json({ error: (e as Error).message }, { status: 401 }),
    } as never);
    return { events, secured };
  };
  const post = () => new Request("https://a.test/api/x", { method: "POST" });

  it("runs the handler only after a fresh sign-in (default 15 minutes)", async () => {
    const seen: number[] = [];
    const { secured } = make(async (_c, max) => void seen.push(max));
    const res = (await secured(async (_r: Request) => Response.json({ ok: 1 }), { csrf: "enforce", stepUp: true })(post())) as Response;
    expect(res.status).toBe(200);
    expect(seen).toEqual([900]);
  });

  it("denies a stale sign-in before the handler and audits it", async () => {
    const { secured, events } = make(async () => {
      throw new Error("RECENT_SIGN_IN_REQUIRED");
    });
    const handler = vi.fn(async (_r: Request) => Response.json({}));
    const res = (await secured(handler, { csrf: "enforce", stepUp: { maxAgeSeconds: 300 } })(post())) as Response;
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "RECENT_SIGN_IN_REQUIRED" });
    expect(handler).not.toHaveBeenCalled();
    expect(events).toEqual([expect.objectContaining({ status: 401 })]);
  });
});
