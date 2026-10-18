import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";

const fakes = vi.hoisted(() => ({
  guard: vi.fn(),
  verify: vi.fn(),
  audit: vi.fn(),
  error: vi.fn(),
}));
vi.mock("@/modules/auth/http", () => ({
  guardLoginRequest: fakes.guard,
  auditLogin: fakes.audit,
  loginErrorResponse: fakes.error,
}));
vi.mock("@/modules/auth/runtime", () => ({ verifyLoginWithRuntime: fakes.verify }));
vi.mock("@/modules/auth/config", () => ({
  getAuthConfig: () => ({sessionMaxAgeSeconds:432000}),
}));
vi.mock("@/modules/auth/private-response", () => ({
  privateAuthResponse: (response: NextResponse) => response,
}));
vi.mock("@/auth/session", () => ({
  MEMBERSHIP_COOKIE_NAME: "active_membership",
  SESSION_COOKIE_NAME: "lms_session",
}));
vi.mock("@/auth/admin-scope", () => ({ADMIN_SCOPE_COOKIE_NAME:"admin_scope"}));
import { POST } from "@/app/api/auth/login/verify/route";

const memberA = {id:"member-a",collegeId:"college-a",status:"ACTIVE" as const};
const memberB = {id:"member-b",collegeId:"college-b",status:"ACTIVE" as const};

function permitted(overrides: Record<string, unknown> = {}) {
  return {ok:true, body:{
    attemptId:"11111111-1111-4111-8111-111111111111", code:"123456",
    ...overrides,
  },ip:"192.0.2.5",tenantCollegeId:null};
}
function verified(overrides: Record<string, unknown> = {}) {
  return {
    user:{id:"user-a"},memberships:[memberA],isSuperAdmin:false,
    tenantMembershipId:null,session:{token:"new-opaque-session",maxAgeSeconds:432000},
    ...overrides,
  };
}
function request(cookie = "") {
  return new Request("https://platform.example.edu/api/auth/login/verify", {
    method:"POST",headers:cookie?{cookie}:undefined,
  });
}
beforeEach(()=>{
  vi.resetAllMocks();
  fakes.guard.mockResolvedValue(permitted());
  fakes.verify.mockResolvedValue(verified());
  fakes.error.mockImplementation(()=>NextResponse.json({error:"AUTH_FAILED"},{status:401}));
});

describe("OTP verify boundary: MFA, old-session rotation and membership safety",()=>{
  it("AUTH-VERIFY-ROUTE-01 refuses a failed origin/tenant/shape guard before OTP verification",async()=>{
    fakes.guard.mockResolvedValueOnce({ok:false,response:NextResponse.json({error:"INVALID_ORIGIN"},{status:403})});
    const response=await POST(request());
    expect(response.status).toBe(403);
    expect(fakes.verify).not.toHaveBeenCalled();
    expect(fakes.audit).not.toHaveBeenCalled();
  });

  it("AUTH-VERIFY-ROUTE-02 forwards both privileged factors and rotates the previous opaque session",async()=>{
    fakes.guard.mockResolvedValueOnce(permitted({secondCode:"654321"}));
    fakes.verify.mockResolvedValueOnce(verified({isSuperAdmin:true,memberships:[]}));
    const response=await POST(request("foo=bar; lms_session=previous-secret; active_membership=foreign"));
    expect(response.status).toBe(200);
    expect(fakes.verify).toHaveBeenCalledWith(expect.objectContaining({
      code:"123456",secondCode:"654321",
      session:expect.objectContaining({
        previousToken:"previous-secret",ipAddress:"192.0.2.5",maxAgeSeconds:432000,
      }),
    }));
    const body=await response.json();
    expect(body).toMatchObject({ok:true,selectedMembership:false});
    const auth=response.cookies.get("lms_session");
    expect(auth?.value).toBe("new-opaque-session");
    expect(auth?.httpOnly).toBe(true);
    expect(auth?.sameSite).toBe("lax");
    expect(response.cookies.get("admin_scope")?.maxAge).toBe(0);
    expect(response.cookies.get("active_membership")?.maxAge).toBe(0);
    expect(response.headers.get("Cache-Control")).toBeNull();
  });

  it("AUTH-VERIFY-ROUTE-03 selects one active college but never carries a prior person's scope",async()=>{
    const response=await POST(request("admin_scope=other; active_membership=other"));
    expect((await response.json()).selectedMembership).toBe(true);
    expect(response.cookies.get("active_membership")?.value).toBe("member-a");
    expect(response.cookies.get("admin_scope")?.maxAge).toBe(0);
    expect(fakes.verify).toHaveBeenCalledWith(expect.objectContaining({
      session:expect.objectContaining({previousToken:null}),
    }));
  });

  it("AUTH-VERIFY-ROUTE-04 requires explicit selection for multiple live colleges and respects a fixed tenant",async()=>{
    fakes.verify.mockResolvedValueOnce(verified({memberships:[memberA,memberB]}));
    const ambiguous=await POST(request());
    expect((await ambiguous.json()).selectedMembership).toBe(false);
    expect(ambiguous.cookies.get("active_membership")?.maxAge).toBe(0);
    fakes.verify.mockResolvedValueOnce(verified({memberships:[memberA,memberB],tenantMembershipId:"member-b"}));
    const fixed=await POST(request());
    expect((await fixed.json()).selectedMembership).toBe(true);
    expect(fixed.cookies.get("active_membership")?.value).toBe("member-b");
  });

  it("AUTH-VERIFY-ROUTE-05 never issues session cookies or emits success after a failed verification",async()=>{
    fakes.verify.mockRejectedValueOnce(new Error("invalid or expired code"));
    const response=await POST(request());
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({error:"AUTH_FAILED"});
    expect(response.cookies.get("lms_session")).toBeUndefined();
    expect(fakes.audit).not.toHaveBeenCalled();
  });
});
