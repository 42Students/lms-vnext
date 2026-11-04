import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const worker = vi.hoisted(() => ({ run: vi.fn() }));
vi.mock("@/modules/operations/tpo-offer-expiry-worker", () => ({
  runTpoOfferExpiryTick: worker.run,
}));
import { POST } from "@/app/api/internal/placements/tpo/offer-expiry/run/route";

const previous = process.env["TPO_NOTICE_SCHEDULER_SECRET"];
const secret = "independent-tpo-machine-scheduler-secret-32bytes";
function request(options: {
  key?: string; origin?: string; body?: string; query?: string;
} = {}) {
  const headers = new Headers();
  if (options.key !== undefined) headers.set("x-tpo-scheduler-key", options.key);
  if (options.origin !== undefined) headers.set("origin", options.origin);
  return new Request("https://lms.example/api/internal/placements/tpo/offer-expiry/run" +
    (options.query ?? ""), {
    method: "POST", headers,
    ...(options.body === undefined ? {} : { body: options.body }),
  });
}

describe("TPO offer expiry scheduler machine-only trigger", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env["TPO_NOTICE_SCHEDULER_SECRET"] = secret;
    worker.run.mockResolvedValue({ status: "CHECKED", affected: 2 });
  });
  afterEach(() => {
    if (previous === undefined) delete process.env["TPO_NOTICE_SCHEDULER_SECRET"];
    else process.env["TPO_NOTICE_SCHEDULER_SECRET"] = previous;
  });

  it("denies absent and incorrect tokens before running the worker", async () => {
    for (const key of [undefined, "", "wrong", secret + "x"]) {
      const response = await POST(request({ key }));
      expect(response.status).toBe(403);
      expect(response.headers.get("cache-control")).toBe("no-store");
    }
    expect(worker.run).not.toHaveBeenCalled();
  });
  it("denies a matching short token", async () => {
    process.env["TPO_NOTICE_SCHEDULER_SECRET"] = "short";
    expect((await POST(request({ key: "short" }))).status).toBe(403);
    expect(worker.run).not.toHaveBeenCalled();
  });
  it("denies browser calls even when same-origin and authenticated", async () => {
    expect((await POST(request({ key: secret, origin: "https://lms.example" }))).status).toBe(403);
    expect(worker.run).not.toHaveBeenCalled();
  });
  it("denies foreign browser origins", async () => {
    expect((await POST(request({ key: secret, origin: "https://evil.example" }))).status).toBe(403);
    expect(worker.run).not.toHaveBeenCalled();
  });
  it("denies query-selected tenant or job parameters", async () => {
    expect((await POST(request({ key: secret, query: "?tenant=other" }))).status).toBe(400);
    expect(worker.run).not.toHaveBeenCalled();
  });
  it("denies caller-supplied request bodies", async () => {
    expect((await POST(request({ key: secret, body: '{"force":true}' }))).status).toBe(400);
    expect(worker.run).not.toHaveBeenCalled();
  });
  it("runs exactly once and preserves the no-store response", async () => {
    const response = await POST(request({ key: secret }));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(worker.run).toHaveBeenCalledTimes(1);
  });
  it("does not reveal provider or database exception text", async () => {
    worker.run.mockRejectedValueOnce(new Error("private provider token"));
    const response = await POST(request({ key: secret }));
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "SCHEDULED_JOB_UNAVAILABLE" });
  });
});
