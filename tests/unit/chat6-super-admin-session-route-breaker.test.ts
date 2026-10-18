import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import {
  listCollegeAdminSessions, revokeCollegeAdminSessions,
} from "@/modules/colleges/admin-session-service";
import { GET, POST } from "@/app/api/admin/colleges/[collegeId]/sessions/route";

vi.mock("@/auth/request-context", () => ({ getCurrentRequestContext: vi.fn() }));
vi.mock("@/auth/origin", () => ({ isSameOriginRequest: vi.fn() }));
vi.mock("@/modules/colleges/admin-session-service", () => ({
  listCollegeAdminSessions: vi.fn(), revokeCollegeAdminSessions: vi.fn(),
}));

const collegeId = "11111111-1111-4111-8111-111111111111";
const userId = "22222222-2222-4222-8222-222222222222";
const ctx = {
  user: { id: "33333333-3333-4333-8333-333333333333",
    identityUid: "super-admin-1", platformStatus: "ACTIVE",
    systemRoles: ["SUPER_ADMIN"] },
  membership: null,
  adminScope: { collegeId, organizationId: "44444444-4444-4444-8444-444444444444" },
};
const route = {params:Promise.resolve({collegeId})};
const url = "https://lms.example.test/api/admin/colleges/" + collegeId + "/sessions";

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(isSameOriginRequest).mockReturnValue(true);
  vi.mocked(getCurrentRequestContext).mockResolvedValue(ctx as never);
});

describe("AUTH-sessions-08 admin session route: origin, payload, tenancy and no-cache", () => {
  it("AUTH-sessions-08 forbids cross-site POST before JSON or identity resolution", async () => {
    vi.mocked(isSameOriginRequest).mockReturnValue(false);
    const request = new Request(url, {method:"POST",body:"unparseable"});
    const result = await POST(request, route);
    expect(result.status).toBe(403);
    expect(await result.json()).toEqual({error:"INVALID_ORIGIN"});
    expect(getCurrentRequestContext).not.toHaveBeenCalled();
    expect(revokeCollegeAdminSessions).not.toHaveBeenCalled();
  });

  it.each([
    {userId, confirm:false},
    {userId, confirm:"true"},
    {userId:"foreign-invalid",confirm:true},
    {userId, confirm:true, collegeId:"forged-tenant"},
    {},
  ])("AUTH-sessions-08 refuses malformed/extra body without any mutation: %j", async body => {
    const result=await POST(new Request(url,{
      method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body),
    }),route);
    expect(result.status).toBe(400);
    expect(getCurrentRequestContext).not.toHaveBeenCalled();
    expect(revokeCollegeAdminSessions).not.toHaveBeenCalled();
  });

  it("AUTH-sessions-08 forwards only route-college and validated target to the persisted permission service",async()=>{
    vi.mocked(revokeCollegeAdminSessions).mockResolvedValue({revoked:2} as never);
    const result=await POST(new Request(url,{
      method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId,confirm:true}),
    }),route);
    expect(result.status).toBe(200);
    expect(await result.json()).toEqual({revoked:2});
    expect(result.headers.get("Cache-Control")).toBe("private, no-store");
    expect(revokeCollegeAdminSessions).toHaveBeenCalledOnce();
    expect(revokeCollegeAdminSessions).toHaveBeenCalledWith(ctx,collegeId,userId);
  });

  it("AUTH-sessions-08 no-op retry is truthful and cannot create an artificial revoke count",async()=>{
    vi.mocked(revokeCollegeAdminSessions).mockResolvedValue({revoked:0} as never);
    const result=await POST(new Request(url,{
      method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId,confirm:true}),
    }),route);
    expect(result.status).toBe(200);
    expect((await result.json()).revoked).toBe(0);
  });

  it("AUTH-sessions-08 redacts a failed persistence attempt rather than reporting revocation",async()=>{
    vi.mocked(revokeCollegeAdminSessions).mockRejectedValue(new Error("database-password-secret"));
    const result=await POST(new Request(url,{
      method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId,confirm:true}),
    }),route);
    expect(result.status).toBeGreaterThanOrEqual(500);
    const raw=await result.text();
    expect(raw).not.toContain("database-password-secret");
    expect(raw).not.toContain('"revoked":');
    expect(result.headers.get("x-request-id")).toBeTruthy();
  });

  it("AUTH-sessions-08 GET requires target UUID, returns no-store sessions, never revokes",async()=>{
    vi.mocked(listCollegeAdminSessions).mockResolvedValue({sessions:[],total:0} as never);
    const bad=await GET(new Request(url+"?userId=not-a-uuid"),route);
    expect(bad.status).toBe(400);
    expect(listCollegeAdminSessions).not.toHaveBeenCalled();
    const result=await GET(new Request(url+"?userId="+userId),route);
    expect(result.status).toBe(200);
    expect(result.headers.get("Cache-Control")).toBe("private, no-store");
    expect(listCollegeAdminSessions).toHaveBeenCalledOnce();
    expect(listCollegeAdminSessions).toHaveBeenCalledWith(ctx,collegeId,userId);
    expect(revokeCollegeAdminSessions).not.toHaveBeenCalled();
  });
});
