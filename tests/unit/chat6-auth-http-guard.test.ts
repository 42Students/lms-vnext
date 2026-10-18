import { beforeEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import { z } from "zod";

const fakes = vi.hoisted(() => ({
  isSameOrigin: vi.fn(),
  allow: vi.fn(),
  ip: vi.fn(),
  resolve: vi.fn(),
  structured: vi.fn(),
  error: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/auth/origin", () => ({ isSameOriginRequest: fakes.isSameOrigin }));
vi.mock("@/auth/ip-rate-limit", () => ({ allowRequest: fakes.allow, clientIp: fakes.ip }));
vi.mock("@/modules/auth/request-tenant", () => ({ resolveRequestTenant: fakes.resolve }));
vi.mock("@/observability/logger", () => ({
  writeStructuredLog: fakes.structured,
  logError: fakes.error,
}));
vi.mock("@/modules/auth/private-response", () => ({
  privateAuthJson: (body: unknown, init?: ResponseInit) => Response.json(body, init),
}));

import { auditLogin, guardLoginRequest, ipTag, loginErrorResponse } from "@/modules/auth/http";
import { LoginError } from "@/modules/auth/login-service";
import { AuthConfigError } from "@/modules/auth/config";

const shape = z.strictObject({ contact: z.string().min(1) });

function loginRequest(body: string | null = '{"contact":"123"}', headers: Record<string, string> = {}) {
  return new Request("https://tenant.example.edu/api/auth/start", {
    method: "POST",
    headers: { host: "tenant.example.edu", ...headers },
    ...(body === null ? {} : { body }),
  });
}

async function failure(request: Request) {
  const result = await guardLoginRequest(request, shape, "auth.start", 10);
  if (result.ok) throw new Error("Expected the login guard to refuse the request");
  return result.response;
}

beforeEach(() => {
  vi.clearAllMocks();
  fakes.isSameOrigin.mockReturnValue(true);
  fakes.allow.mockReturnValue(true);
  fakes.ip.mockReturnValue("198.51.100.40");
  fakes.resolve.mockResolvedValue({ kind: "college", host: "tenant.example.edu", collegeId: "college-a", organizationId: "org-a" });
});

describe("authentication guard: hostile requests and audit integrity", () => {
  it("AUTH-HTTP-01 denies a foreign origin before the limiter, parser or tenant resolver", async () => {
    fakes.isSameOrigin.mockReturnValue(false);
    const response = await failure(loginRequest());
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "INVALID_ORIGIN" });
    expect(fakes.allow).not.toHaveBeenCalled();
    expect(fakes.resolve).not.toHaveBeenCalled();
  });

  it("AUTH-HTTP-02 enforces the per-route/IP rate limit with an explicit retry interval", async () => {
    fakes.allow.mockReturnValue(false);
    const response = await failure(loginRequest());
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("60");
    expect(await response.json()).toEqual({ error: "TOO_MANY_REQUESTS", retryAfterSeconds: 60 });
    expect(fakes.allow).toHaveBeenCalledWith("auth.start:198.51.100.40", 10);
    expect(fakes.resolve).not.toHaveBeenCalled();
  });

  it("AUTH-HTTP-03 bounds streamed payload bytes, absent bodies, invalid JSON and invalid schemas", async () => {
    const huge = await failure(loginRequest("x".repeat(8_200)));
    expect(huge.status).toBe(413);
    expect(await huge.json()).toEqual({ error: "REQUEST_TOO_LARGE" });
    expect((await failure(loginRequest(null))).status).toBe(400);
    expect((await failure(loginRequest("{bad json"))).status).toBe(400);
    expect((await failure(loginRequest('{"contact":""}'))).status).toBe(400);
    expect((await failure(loginRequest('{"contact":"123","role":"SUPER_ADMIN"}'))).status).toBe(400);
    expect(fakes.resolve).not.toHaveBeenCalled();
  });

  it("AUTH-HTTP-04 never falls back to a platform login on an unknown or unavailable tenant host", async () => {
    fakes.resolve.mockResolvedValueOnce({ kind: "unknown", host: "fake.edu" });
    const unknown = await failure(loginRequest());
    expect(unknown.status).toBe(404);
    expect(await unknown.json()).toEqual({ error: "UNKNOWN_TENANT_HOST" });
    fakes.resolve.mockResolvedValueOnce({ kind: "unavailable", host: "tenant.example.edu" });
    const down = await failure(loginRequest());
    expect(down.status).toBe(503);
    expect(down.headers.get("Cache-Control")).toBe("no-store");
    expect(down.headers.get("Retry-After")).toBe("30");
    expect(await down.json()).toEqual({ error: "TENANT_LOOKUP_UNAVAILABLE" });
  });

  it("AUTH-HTTP-05 preserves the host-selected college and validated fields on a permitted request", async () => {
    const result = await guardLoginRequest(loginRequest('{"contact":"123"}'), shape, "auth.start", 10);
    expect(result).toMatchObject({
      ok: true, body: { contact: "123" }, tenantCollegeId: "college-a", ip: "198.51.100.40",
    });
    fakes.resolve.mockResolvedValueOnce({ kind: "platform", host: "platform.example.edu" });
    const platform = await guardLoginRequest(loginRequest(), shape, "auth.start", 10);
    expect(platform).toMatchObject({ ok: true, tenantCollegeId: null });
  });

  it("AUTH-HTTP-06 cannot spoof immutable route, component or IP audit tags through event fields", () => {
    const ip = "192.0.2.5";
    const tag = createHash("sha256").update(ip).digest("hex").slice(0, 12);
    expect(ipTag(ip)).toBe(tag);
    auditLogin("auth.start", { route: "/api/auth/start", ip }, {
      component: "spoofed", route: "/api/other", ipTag: "raw-ip", requests: 2,
    });
    expect(fakes.structured).toHaveBeenCalledWith("INFO", "auth.start", {
      requests: 2, component: "auth-audit", route: "/api/auth/start", ipTag: tag,
    });
    expect(JSON.stringify(fakes.structured.mock.calls)).not.toContain(ip);
  });

  it("AUTH-HTTP-07 maps known login and configuration failures without exposing internal errors", async () => {
    const limited = loginErrorResponse(new LoginError("TOO_MANY_REQUESTS", 37), {
      route: "/api/auth/verify", ip: "192.0.2.1",
    });
    expect(limited.status).toBe(429);
    expect(limited.headers.get("Retry-After")).toBe("37");
    expect(await limited.json()).toEqual({ error: "TOO_MANY_REQUESTS", retryAfterSeconds: 37 });
    const configuration = loginErrorResponse(new AuthConfigError("secret missing"));
    expect(configuration.status).toBe(503);
    expect(await configuration.json()).toEqual({ error: "AUTH_NOT_CONFIGURED" });
    const internal = loginErrorResponse(new Error("database password exposed"));
    expect(internal.status).toBe(500);
    expect(await internal.json()).toEqual({ error: "INTERNAL_ERROR" });
    expect(fakes.error).toHaveBeenCalledTimes(2);
  });
});
