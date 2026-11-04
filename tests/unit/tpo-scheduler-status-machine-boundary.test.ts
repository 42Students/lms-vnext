import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const health = vi.hoisted(() => ({ read: vi.fn() }));
vi.mock("@/modules/operations/tpo-scheduled-job-health", () => ({
  getTpoScheduledJobLeaseHealth: health.read,
}));
import { GET } from "@/app/api/internal/placements/tpo/scheduler-status/route";

const previous = process.env["TPO_NOTICE_SCHEDULER_SECRET"];
const secret = "trusted-tpo-scheduler-health-secret-32-bytes";

function request(options: { key?: string; origin?: string; query?: string } = {}) {
  const headers = new Headers();
  if (options.key !== undefined) headers.set("x-tpo-scheduler-key", options.key);
  if (options.origin !== undefined) headers.set("origin", options.origin);
  return new Request("https://lms.example/api/internal/placements/tpo/scheduler-status" +
    (options.query ?? ""), { method: "GET", headers });
}

describe("TPO scheduler diagnostics machine-only access", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env["TPO_NOTICE_SCHEDULER_SECRET"] = secret;
    health.read.mockResolvedValue([{ name: "tpo.deliverDueNotices", healthy: true }]);
  });
  afterEach(() => {
    if (previous === undefined) delete process.env["TPO_NOTICE_SCHEDULER_SECRET"];
    else process.env["TPO_NOTICE_SCHEDULER_SECRET"] = previous;
  });

  it("denies unauthenticated and incorrect keys without reading any job state", async () => {
    for (const key of [undefined, "", "wrong", secret + "-other"]) {
      const response = await GET(request({ key }));
      expect(response.status).toBe(403);
      expect(response.headers.get("cache-control")).toBe("no-store");
    }
    expect(health.read).not.toHaveBeenCalled();
  });

  it("denies an exact but weak configured key", async () => {
    process.env["TPO_NOTICE_SCHEDULER_SECRET"] = "weak";
    expect((await GET(request({ key: "weak" }))).status).toBe(403);
    expect(health.read).not.toHaveBeenCalled();
  });

  it("denies browser Origin even when the worker key is correct", async () => {
    expect((await GET(request({ key: secret, origin: "https://lms.example" }))).status).toBe(403);
    expect(health.read).not.toHaveBeenCalled();
  });

  it("denies arbitrary diagnostic filters to avoid future selector injection", async () => {
    expect((await GET(request({ key: secret, query: "?tenant=other" }))).status).toBe(400);
    expect(health.read).not.toHaveBeenCalled();
  });

  it("returns only the intended diagnostics for a valid machine request", async () => {
    const response = await GET(request({ key: secret }));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({
      jobs: [{ name: "tpo.deliverDueNotices", healthy: true }],
      outcomesTracked: false,
    });
    expect(health.read).toHaveBeenCalledTimes(1);
  });

  it("does not leak query failures or fabricated healthy status", async () => {
    health.read.mockRejectedValueOnce(new Error("private database connection"));
    const response = await GET(request({ key: secret }));
    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ error: "JOB_HEALTH_UNAVAILABLE" });
  });
});
