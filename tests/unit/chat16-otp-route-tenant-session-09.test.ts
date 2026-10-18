import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { guardLoginRequest, auditLogin, ipTag, loginErrorResponse } from "@/modules/auth/http";
import {
  startLoginWithRuntime, sendEmailFallbackWithRuntime, verifyLoginWithRuntime,
} from "@/modules/auth/runtime";
import { resetAuthConfigForTests } from "@/modules/auth/config";
import { POST as startOtp } from "@/app/api/auth/login/start/route";
import { POST as verifyOtp } from "@/app/api/auth/login/verify/route";
import { POST as fallbackOtp } from "@/app/api/auth/login/email/route";

vi.mock("@/modules/auth/http", () => ({
  guardLoginRequest: vi.fn(), auditLogin: vi.fn(), ipTag: vi.fn(),
  loginErrorResponse: vi.fn(),
}));
vi.mock("@/modules/auth/runtime", () => ({
  startLoginWithRuntime: vi.fn(), sendEmailFallbackWithRuntime: vi.fn(),
  verifyLoginWithRuntime: vi.fn(),
}));

const attemptId = "11111111-1111-4111-8111-111111111111";
const membershipId = "22222222-2222-4222-8222-222222222222";
const collegeId = "33333333-3333-4333-8333-333333333333";
const request = (route: "start" | "verify" | "email", cookie = "") =>
  new Request("https://lms.example.org/api/auth/login/" + route, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie, "user-agent": "Unit Browser" },
    body: JSON.stringify({ attemptId, code: "123456" }),
  });
const admit = (body: Record<string, unknown>, tenantCollegeId: string | null = collegeId) => {
  vi.mocked(guardLoginRequest).mockResolvedValue({
    ok: true, body, tenantCollegeId, ip: "203.0.113.42",
  } as never);
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("AUTH_SECRET", "unit-test-secret-unit-test-secret-unit-test");
  resetAuthConfigForTests();
  vi.mocked(ipTag).mockReturnValue("opaque-ip-tag");
  vi.mocked(loginErrorResponse).mockImplementation(() =>
    new Response(JSON.stringify({ error: "OTP_EXPIRED" }), {
      status: 401, headers: { "Content-Type": "application/json" },
    }) as never);
});
afterEach(() => {
  vi.unstubAllEnvs();
  resetAuthConfigForTests();
});

describe("chat-16 real OTP route handlers: tenant binding, stale tabs and session cookies", () => {
  it("AUTH-ROUTE-OTP-01 refuses origin/shape/rate-limit guard rejection without invoking delivery", async () => {
    const denied = new Response(JSON.stringify({ error: "INVALID_ORIGIN" }), { status: 403 });
    vi.mocked(guardLoginRequest).mockResolvedValue({ ok: false, response: denied } as never);
    const response = await startOtp(request("start"));
    expect(response.status).toBe(403);
    expect(startLoginWithRuntime).not.toHaveBeenCalled();
    expect(auditLogin).not.toHaveBeenCalled();
    expect(guardLoginRequest).toHaveBeenCalledWith(
      expect.any(Request), expect.anything(), "login-start", 10,
    );
  });

  it("AUTH-ROUTE-OTP-02 start uses server-derived tenant and opaque IP tag, not caller-supplied college", async () => {
    admit({ channel: "EMAIL", contact: "learner@example.org", collegeId: "forged" });
    vi.mocked(startLoginWithRuntime).mockResolvedValue({
      attemptId, channel: "EMAIL", maskedContact: "l***@example.org",
      requiresSecondFactor: false,
    } as never);
    const result = await startOtp(request("start"));
    expect(result.status).toBe(200);
    expect(startLoginWithRuntime).toHaveBeenCalledWith({
      channel: "EMAIL", contact: "learner@example.org", tenantCollegeId: collegeId,
      ipTag: "opaque-ip-tag",
    });
    expect(await result.json()).toMatchObject({ attemptId, channel: "EMAIL" });
    expect(auditLogin).toHaveBeenCalledWith(
      "auth.login_started", expect.objectContaining({ route: "login-start" }),
      expect.objectContaining({ channel: "EMAIL" }),
    );
  });

  it("AUTH-ROUTE-OTP-03 failed OTP/expired attempt cannot mint cookies or report sign-in", async () => {
    admit({ attemptId, code: "000000" });
    vi.mocked(verifyLoginWithRuntime).mockRejectedValue(new Error("private invalid OTP context"));
    const response = await verifyOtp(request("verify", "lms_session=old-token"));
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "OTP_EXPIRED" });
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(auditLogin).not.toHaveBeenCalledWith(
      "auth.login_succeeded", expect.anything(), expect.anything(),
    );
  });

  it("AUTH-ROUTE-OTP-04 successful single-college login rotates cookie, clears prior admin scope", async () => {
    admit({ attemptId, code: "123456" });
    vi.mocked(verifyLoginWithRuntime).mockResolvedValue({
      user: { id: "learner-1" }, isSuperAdmin: false,
      memberships: [{ id: membershipId, status: "ACTIVE" }],
      tenantMembershipId: membershipId,
      session: { token: "new-session-token", maxAgeSeconds: 300 },
    } as never);
    const response = await verifyOtp(request("verify",
      "lms_session=old-session-token; lms_membership=old-college; lms_admin_scope=old-scope"));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      ok: true, next: "/dashboard", selectedMembership: true,
    });
    expect(verifyLoginWithRuntime).toHaveBeenCalledWith(expect.objectContaining({
      tenantCollegeId: collegeId,
      session: expect.objectContaining({ previousToken: "old-session-token" }),
    }));
    expect(response.cookies.get("lms_session")?.value).toBe("new-session-token");
    expect(response.cookies.get("lms_membership")?.value).toBe(membershipId);
    expect(response.cookies.get("lms_admin_scope")?.value).toBe("");
    expect(auditLogin).toHaveBeenCalledWith(
      "auth.login_succeeded", expect.anything(),
      expect.objectContaining({ userId: "learner-1" }),
    );
  });

  it("AUTH-ROUTE-OTP-05 multi-college sign-in requires explicit selection", async () => {
    admit({ attemptId, code: "123456" }, null);
    vi.mocked(verifyLoginWithRuntime).mockResolvedValue({
      user: { id: "recruiter-1" }, isSuperAdmin: false,
      memberships: [
        { id: membershipId, status: "ACTIVE" },
        { id: "44444444-4444-4444-8444-444444444444", status: "ACTIVE" },
      ],
      tenantMembershipId: null,
      session: { token: "selected-later", maxAgeSeconds: 300 },
    } as never);
    const response = await verifyOtp(request("verify"));
    expect((await response.json()).selectedMembership).toBe(false);
    expect(response.cookies.get("lms_membership")?.value).toBe("");
  });

  it("AUTH-ROUTE-OTP-06 resend uses the tenant-bound attempt and rejects invalid request first", async () => {
    vi.mocked(guardLoginRequest).mockResolvedValueOnce({
      ok: false, response: new Response(null, { status: 429 }),
    } as never);
    expect((await fallbackOtp(request("email"))).status).toBe(429);
    expect(sendEmailFallbackWithRuntime).not.toHaveBeenCalled();

    admit({ attemptId });
    vi.mocked(sendEmailFallbackWithRuntime).mockResolvedValue({
      maskedEmail: "r***@example.org",
    } as never);
    const response = await fallbackOtp(request("email"));
    expect(response.status).toBe(200);
    expect(sendEmailFallbackWithRuntime).toHaveBeenCalledWith({
      attemptId, tenantCollegeId: collegeId,
    });
    expect(guardLoginRequest).toHaveBeenLastCalledWith(
      expect.any(Request), expect.anything(), "login-email", 6,
    );
  });
});
