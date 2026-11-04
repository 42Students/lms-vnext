import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const worker = vi.hoisted(() => ({ release: vi.fn() }));
vi.mock("@/modules/activity/notification-service", () => ({
  releaseDueStaffNotifications: worker.release,
}));
import { POST } from "@/app/api/internal/notifications/release/route";

const original = process.env["NOTIFICATION_RELEASE_TOKEN"];
const secret = "notification-release-worker-only-secret-32bytes";
function request(options: {
  token?: string; origin?: string; url?: string; body?: string; length?: string;
} = {}) {
  const headers = new Headers();
  if (options.token !== undefined) headers.set("authorization", "Bearer " + options.token);
  if (options.origin !== undefined) headers.set("origin", options.origin);
  if (options.length !== undefined) headers.set("content-length", options.length);
  return new Request(options.url ?? "https://lms.example/api/internal/notifications/release", {
    method: "POST", headers,
    ...(options.body === undefined ? {} : { body: options.body }),
  });
}
describe("internal staff notification release authorization", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env["NOTIFICATION_RELEASE_TOKEN"] = secret;
    worker.release.mockResolvedValue({ released: 3 });
  });
  afterEach(() => {
    if (original === undefined) delete process.env["NOTIFICATION_RELEASE_TOKEN"];
    else process.env["NOTIFICATION_RELEASE_TOKEN"] = original;
  });
  it("rejects missing, mismatched and multi-byte credentials before worker execution", async () => {
    for (const token of [undefined, "", "wrong", secret + "-extra", "é".repeat(secret.length)]) {
      const response = await POST(request({ token }));
      expect(response.status).toBe(401);
      expect(response.headers.get("cache-control")).toBe("no-store");
    }
    expect(worker.release).not.toHaveBeenCalled();
  });
  it("rejects a matching weak deployment secret", async () => {
    process.env["NOTIFICATION_RELEASE_TOKEN"] = "short";
    expect((await POST(request({ token: "short" }))).status).toBe(401);
    expect(worker.release).not.toHaveBeenCalled();
  });
  it("rejects an unconfigured deployment secret", async () => {
    delete process.env["NOTIFICATION_RELEASE_TOKEN"];
    expect((await POST(request({ token: secret }))).status).toBe(401);
    expect(worker.release).not.toHaveBeenCalled();
  });
  it("rejects browser-originated requests carrying the correct token", async () => {
    expect((await POST(request({ token: secret, origin: "https://lms.example" }))).status).toBe(401);
    expect(worker.release).not.toHaveBeenCalled();
  });
  it("rejects query-string job options", async () => {
    expect((await POST(request({
      token: secret, url: "https://lms.example/api/internal/notifications/release?all=true",
    }))).status).toBe(400);
    expect(worker.release).not.toHaveBeenCalled();
  });
  it("rejects a body even when Content-Length claims zero", async () => {
    expect((await POST(request({ token: secret, body: '{"force":true}', length: "0" }))).status).toBe(400);
    expect(worker.release).not.toHaveBeenCalled();
  });
  it("executes exactly once with no browser origin, body or job parameters", async () => {
    const response = await POST(request({ token: secret }));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ released: 3 });
    expect(worker.release).toHaveBeenCalledTimes(1);
  });
  it("does not disclose database or provider errors", async () => {
    worker.release.mockRejectedValueOnce(new Error("private database credentials"));
    const response = await POST(request({ token: secret }));
    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ error: "NOTIFICATION_RELEASE_UNAVAILABLE" });
  });
});
