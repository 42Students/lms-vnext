import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  readContext: vi.fn(),
  sameOrigin: vi.fn(),
  logError: vi.fn(),
}));
vi.mock("@/auth/request-context", () => ({
  getCurrentRequestContext: mocks.readContext,
}));
vi.mock("@/auth/origin", () => ({
  isSameOriginRequest: mocks.sameOrigin,
}));
vi.mock("@/observability/logger", () => ({
  logError: mocks.logError,
}));

import { POST } from "@/app/api/client-errors/route";
import { resetClientErrorRateForTests } from "@/modules/log-alerts/client-report";

const url = "https://lms.example.test/api/client-errors";
function makeRequest(body: string, headers: Record<string, string> = {}) {
  return new Request(url, {
    method: "POST",
    headers: {
      host: "lms.example.test",
      origin: "https://lms.example.test",
      "content-type": "application/json",
      ...headers,
    },
    body,
  });
}

describe("browser diagnostic ingestion HTTP security", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    resetClientErrorRateForTests();
    mocks.sameOrigin.mockReturnValue(true);
    mocks.readContext.mockResolvedValue({
      user: { id: "11111111-1111-4111-8111-111111111111" },
      membership: { collegeId: "22222222-2222-4222-8222-222222222222", roles: ["LEARNER"] },
      recruiter: null,
    });
  });

  it("denies a forged cross-origin request before resolving session or logging", async () => {
    mocks.sameOrigin.mockReturnValue(false);
    const result = await POST(makeRequest(JSON.stringify({ kind: "render" })));
    expect(result.status).toBe(403);
    expect(mocks.readContext).not.toHaveBeenCalled();
    expect(mocks.logError).not.toHaveBeenCalled();
  });

  it("does not accept unauthenticated reports or log their payload", async () => {
    mocks.readContext.mockRejectedValue(new Error("AUTH_REQUIRED"));
    const result = await POST(makeRequest(JSON.stringify({ kind: "render", message: "private" })));
    expect(result.status).toBe(401);
    expect(mocks.logError).not.toHaveBeenCalled();
  });

  it("rejects injected user/tenant fields without any security event side effect", async () => {
    const body = JSON.stringify({ kind: "render", userId: "admin", collegeId: "other" });
    const result = await POST(makeRequest(body));
    expect(result.status).toBe(400);
    expect(mocks.logError).not.toHaveBeenCalled();
  });

  it("rejects oversized request bodies before session lookup", async () => {
    const result = await POST(makeRequest(JSON.stringify({ message: "x".repeat(5_000) })));
    expect(result.status).toBe(413);
    expect(mocks.readContext).not.toHaveBeenCalled();
    expect(mocks.logError).not.toHaveBeenCalled();
  });

  it("redacts short prefixed credentials and paths before operator logging", async () => {
    const result = await POST(makeRequest(JSON.stringify({
      kind: "render",
      message: "Provider failure GOOGLE_CLIENT_SECRET=shortpass",
      path: "/api/users/other-tenant-user?access_token=private",
      component: "untrusted-personal-name",
    })));
    expect(result.status).toBe(202);
    expect(mocks.logError).toHaveBeenCalledTimes(1);
    const call = mocks.logError.mock.calls[0]!;
    expect(call[1]).toBeInstanceOf(Error);
    expect((call[1] as Error).message).not.toContain("shortpass");
    expect(call[2]).toMatchObject({
      roleCategory: "LEARNER",
      path: "/api/users/[id]",
      component: "browser",
      status: 500,
    });
  });

  it("keeps the authenticated per-user quota even when client IP headers rotate", async () => {
    const body = JSON.stringify({ kind: "render", message: "Safe browser failure" });
    for (let n = 0; n < 10; n++) {
      const result = await POST(makeRequest(body, {
        "x-real-ip": `203.0.113.${n + 1}`,
        "x-forwarded-for": `198.51.100.${n + 1}, 130.211.0.1`,
      }));
      expect(result.status).toBe(202);
    }
    expect((await POST(makeRequest(body, {
      "x-real-ip": "8.8.8.8",
      "x-forwarded-for": "9.9.9.9, 130.211.0.1",
    }))).status).toBe(429);
    expect(mocks.logError).toHaveBeenCalledTimes(10);
  });
});
