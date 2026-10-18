import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { allowRequest, clientIp } from "@/auth/ip-rate-limit";
import { isSameOriginRequest } from "@/auth/origin";
import { resolveRequestTenant } from "@/modules/auth/request-tenant";
import { writeStructuredLog } from "@/observability/logger";
import { auditLogin, guardLoginRequest, ipTag } from "@/modules/auth/http";

vi.mock("@/auth/ip-rate-limit", () => ({ allowRequest: vi.fn(), clientIp: vi.fn() }));
vi.mock("@/auth/origin", () => ({ isSameOriginRequest: vi.fn() }));
vi.mock("@/modules/auth/request-tenant", () => ({ resolveRequestTenant: vi.fn() }));
vi.mock("@/observability/logger", () => ({
  writeStructuredLog: vi.fn(), logError: vi.fn(),
}));

const collegeId = "11111111-1111-4111-8111-111111111111";
const schema = z.strictObject({
  channel: z.enum(["EMAIL", "PHONE"]),
  contact: z.string().min(3).max(254),
});
function request(value: unknown = { channel: "EMAIL", contact: "learner@example.org" }) {
  return new Request("https://college.example.org/api/auth/login/start", {
    method: "POST", headers: {
      Host: "college.example.org", Origin: "https://college.example.org",
      "Content-Type": "application/json",
    },
    body: typeof value === "string" ? value : JSON.stringify(value),
  });
}
async function deny(result: Awaited<ReturnType<typeof guardLoginRequest>>, status: number, error: string) {
  expect(result.ok).toBe(false);
  if (result.ok) throw new Error("Unexpected admission");
  expect(result.response.status).toBe(status);
  expect(await result.response.json()).toMatchObject({ error });
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(isSameOriginRequest).mockReturnValue(true);
  vi.mocked(allowRequest).mockReturnValue(true);
  vi.mocked(clientIp).mockReturnValue("198.51.100.42");
  vi.mocked(resolveRequestTenant).mockResolvedValue({
    kind: "college", collegeId,
  } as never);
});
describe("chat-16 shared OTP admission guard HTTP and tenant isolation", () => {
  it("AUTH-GUARD-01 rejects forged origin before parsing JSON or looking up college", async () => {
    vi.mocked(isSameOriginRequest).mockReturnValue(false);
    await deny(await guardLoginRequest(request("not-json"), schema, "login-start", 10), 403, "INVALID_ORIGIN");
    expect(allowRequest).not.toHaveBeenCalled();
    expect(resolveRequestTenant).not.toHaveBeenCalled();
  });
  it("AUTH-GUARD-02 responds 429 with Retry-After before reading the body", async () => {
    vi.mocked(allowRequest).mockReturnValue(false);
    const denied = await guardLoginRequest(request("not-json"), schema, "login-start", 10);
    await deny(denied, 429, "TOO_MANY_REQUESTS");
    if (!denied.ok) expect(denied.response.headers.get("Retry-After")).toBe("60");
    expect(allowRequest).toHaveBeenCalledWith("login-start:198.51.100.42", 10);
    expect(resolveRequestTenant).not.toHaveBeenCalled();
  });
  it("AUTH-GUARD-03 invalid JSON, extra fields or bad channel never initiate tenant lookup", async () => {
    for (const payload of [
      "{",
      { channel: "EMAIL", contact: "valid@example.org", tenantCollegeId: collegeId },
      { channel: "SMS", contact: "valid@example.org" },
    ]) {
      await deny(await guardLoginRequest(request(payload), schema, "login-start", 10),
        400, "INVALID_REQUEST");
    }
    expect(resolveRequestTenant).not.toHaveBeenCalled();
  });
  it("AUTH-GUARD-04 disabled or unknown college host never falls back to platform login", async () => {
    vi.mocked(resolveRequestTenant).mockResolvedValueOnce({ kind: "unknown" } as never)
      .mockResolvedValueOnce({ kind: "unavailable" } as never);
    await deny(await guardLoginRequest(request(), schema, "login-start", 10),
      404, "UNKNOWN_TENANT_HOST");
    const unavailable = await guardLoginRequest(request(), schema, "login-start", 10);
    await deny(unavailable, 503, "TENANT_LOOKUP_UNAVAILABLE");
    if (!unavailable.ok) {
      expect(unavailable.response.headers.get("Retry-After")).toBe("30");
      expect(unavailable.response.headers.get("Cache-Control")).toBe("no-store");
    }
  });
  it("AUTH-GUARD-05 passes exact college resolved from trusted host, not caller-owned fields", async () => {
    const result = await guardLoginRequest(request(), schema, "login-start", 10);
    expect(result).toMatchObject({
      ok: true, tenantCollegeId: collegeId,
      body: { channel: "EMAIL", contact: "learner@example.org" },
      ip: "198.51.100.42",
    });
    expect(resolveRequestTenant).toHaveBeenCalledWith("college.example.org");
  });
  it("AUTH-GUARD-06 audit records a one-way IP tag without raw IP/OTP/contact", () => {
    auditLogin("auth.login_started", {
      route: "login-start", ip: "198.51.100.42",
    }, { channel: "EMAIL" });
    const log = vi.mocked(writeStructuredLog).mock.calls;
    expect(log).toHaveLength(1);
    expect(log[0][2]).toMatchObject({
      route: "login-start", ipTag: ipTag("198.51.100.42"), channel: "EMAIL",
    });
    expect(JSON.stringify(log)).not.toContain("198.51.100.42");
    expect(JSON.stringify(log)).not.toContain("learner@example.org");
    expect(JSON.stringify(log)).not.toContain("123456");
  });
});
