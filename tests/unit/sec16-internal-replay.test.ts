import { describe, expect, it, vi } from "vitest";
import { createInternalRoute, REPLAY_WINDOW_SECONDS } from "@/security/internal-route-core";

const SECRET = "s".repeat(40);
const NOW = Date.UTC(2026, 10, 8, 12, 0, 0);

function build(replay: boolean, seen = new Set<string>()) {
  const denied: string[] = [];
  const internalRoute = createInternalRoute({
    readSecret: (name) => (name === "TEST_SECRET" ? SECRET : undefined),
    readJson: async () => ({ kind: "OK", value: {} }),
    readEmpty: async () => true,
    onError: () => new Response("error", { status: 500 }),
    newRequestId: () => "req-1",
    onDenied: (event) => denied.push(event.reason),
    replayRequired: () => replay,
    claimNonce: async (key) => (seen.has(key) ? false : (seen.add(key), true)),
    now: () => NOW,
  });
  const handler = vi.fn(async () => Response.json({ ok: true }));
  const route = internalRoute({ name: "test.job", credential: { kind: "header", header: "x-job-secret", secretEnv: "TEST_SECRET" }, emptyBody: true }, handler);
  return { route, handler, denied };
}

const call = (route: (r: Request) => Promise<Response>, headers: Record<string, string>) =>
  route(new Request("https://app.test/api/internal/test", { method: "POST", headers: { "x-job-secret": SECRET, ...headers } }));
const fresh = (nonce = "n".repeat(20), offset = 0) => ({ "x-lms-timestamp": String(Math.floor(NOW / 1000) + offset), "x-lms-nonce": nonce });

describe("SEC-16-010 internal route replay protection", () => {
  it("changes nothing while the switch is off", async () => {
    const { route, handler } = build(false);
    expect((await call(route, {})).status).toBe(200);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("requires a timestamp and a nonce when on", async () => {
    const { route, handler, denied } = build(true);
    expect((await call(route, {})).status).toBe(403);
    expect((await call(route, { "x-lms-timestamp": String(Math.floor(NOW / 1000)) })).status).toBe(403);
    expect(denied).toEqual(["TIMESTAMP", "TIMESTAMP"]);
    expect(handler).not.toHaveBeenCalled();
  });

  it("accepts a fresh call once and refuses the same nonce again", async () => {
    const { route, handler, denied } = build(true);
    expect((await call(route, fresh())).status).toBe(200);
    expect((await call(route, fresh())).status).toBe(403);
    expect(denied).toEqual(["REPLAY"]);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("refuses a timestamp outside the window in either direction", async () => {
    const { route, denied } = build(true);
    expect((await call(route, fresh("a".repeat(20), -(REPLAY_WINDOW_SECONDS + 5)))).status).toBe(403);
    expect((await call(route, fresh("b".repeat(20), REPLAY_WINDOW_SECONDS + 5))).status).toBe(403);
    expect((await call(route, fresh("c".repeat(20), REPLAY_WINDOW_SECONDS - 5))).status).toBe(200);
    expect(denied).toEqual(["TIMESTAMP", "TIMESTAMP"]);
  });

  it("never claims a nonce for a caller that failed the credential check", async () => {
    const seen = new Set<string>();
    const { route } = build(true, seen);
    const response = await route(new Request("https://app.test/api/internal/test", { method: "POST", headers: { "x-job-secret": "wrong".repeat(10), ...fresh("z".repeat(20)) } }));
    expect(response.status).toBe(403);
    expect(seen.size).toBe(0);
  });

  it("rejects malformed nonces", async () => {
    const { route } = build(true);
    expect((await call(route, fresh("short"))).status).toBe(403);
    expect((await call(route, fresh("has spaces and !!! chars"))).status).toBe(403);
  });
});
