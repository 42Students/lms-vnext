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
