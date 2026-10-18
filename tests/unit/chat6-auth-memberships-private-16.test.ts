import {beforeEach,describe,expect,it,vi} from "vitest";
import {headers} from "next/headers";
import {getCurrentIdentityUid} from "@/auth/request-context";
import {resolveRequestTenant} from "@/modules/auth/request-tenant";
import {isTenantAccessAllowed} from "@/modules/auth/tenant-access";
import {listMembershipChoices,resolveRequestContext} from "@/modules/identity/context-service";
import {isSameOriginRequest} from "@/auth/origin";
import {GET,POST,DELETE} from "@/app/api/auth/memberships/route";
vi.mock("next/headers",()=>({headers:vi.fn()}));
vi.mock("@/auth/request-context",()=>({getCurrentIdentityUid:vi.fn()}));
vi.mock("@/modules/auth/request-tenant",()=>({resolveRequestTenant:vi.fn()}));
vi.mock("@/modules/auth/tenant-access",()=>({isTenantAccessAllowed:vi.fn()}));
vi.mock("@/auth/origin",()=>({isSameOriginRequest:vi.fn()}));
vi.mock("@/modules/identity/context-service",()=>{
 class ContextResolutionError extends Error{constructor(public code:string){super(code);}}
 return {ContextResolutionError,listMembershipChoices:vi.fn(),resolveRequestContext:vi.fn()};
});
const own="11111111-1111-4111-8111-111111111111";
const other="22222222-2222-4222-8222-222222222222";
const ownMembership="33333333-3333-4333-8333-333333333333";
const foreignMembership="44444444-4444-4444-8444-444444444444";
const request=(method:"POST"|"DELETE",body:unknown={membershipId:ownMembership})=>
 new Request("https://campus.example/api/auth/memberships",{
  method,headers:{"Content-Type":"application/json"},
  body:method==="POST"?JSON.stringify(body):undefined,
 });
beforeEach(()=>{
 vi.resetAllMocks();
 vi.mocked(isSameOriginRequest).mockReturnValue(true);
 vi.mocked(getCurrentIdentityUid).mockResolvedValue("identity-1");
 vi.mocked(headers).mockResolvedValue(new Headers({host:"campus.example"}) as never);
 vi.mocked(isTenantAccessAllowed).mockReturnValue(true);
 vi.mocked(resolveRequestTenant).mockResolvedValue({kind:"college",host:"campus.example",collegeId:own,organizationId:other});
 vi.mocked(listMembershipChoices).mockResolvedValue([
  {id:ownMembership,collegeId:own},{id:foreignMembership,collegeId:other},
 ] as never);
 vi.mocked(resolveRequestContext).mockImplementation(async input=>({
  membership:input.activeMembershipId?{id:input.activeMembershipId,collegeId:own}:null,
 }) as never);
});
describe("AUTH-handoff-16 scoped membership cookies and no-store",()=>{
 it("GET exposes only host-college membership and refuses HTTP caching",async()=>{
  const response=await GET();
  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(await response.json()).toEqual({memberships:[{id:ownMembership,collegeId:own}]});
 });
 it("POST stores only the active persisted college membership with private cache headers",async()=>{
  const response=await POST(request("POST"));
  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(response.cookies.get("lms_membership")?.value).toBe(ownMembership);
  expect(resolveRequestContext).toHaveBeenCalledWith({
   identityUid:"identity-1",activeMembershipId:ownMembership,
  });
 });
 it("AUTH-handoff-18 distinguishes temporary domain outage from invalid or revoked session",async()=>{
  vi.mocked(resolveRequestTenant).mockResolvedValue({kind:"unavailable",host:"campus.example"});
  const response=await GET();
  expect(response.status).toBe(503);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(await response.json()).toEqual({error:"TENANT_LOOKUP_UNAVAILABLE"});
  expect(resolveRequestContext).not.toHaveBeenCalled();
  expect(listMembershipChoices).not.toHaveBeenCalled();
 });
 it("rejects wrong-tenant host and does not serialize private memberships on failure",async()=>{
  vi.mocked(isTenantAccessAllowed).mockReturnValue(false);
  const response=await GET();
  expect(response.status).toBe(401);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect((await response.text())).not.toContain(ownMembership);
  expect(listMembershipChoices).not.toHaveBeenCalled();
 });
 it("rejects forged college and role properties rather than silently ignoring them",async()=>{
  const response=await POST(request("POST",{
   membershipId:ownMembership,collegeId:other,systemRole:"SUPER_ADMIN",
  }));
  expect(response.status).toBe(400);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(response.cookies.get("lms_membership")).toBeUndefined();
  expect(resolveRequestContext).not.toHaveBeenCalledWith({
   identityUid:"identity-1",activeMembershipId:ownMembership,
  });
 });
 it("rejects cross-origin membership switches without touching identity state",async()=>{
  vi.mocked(isSameOriginRequest).mockReturnValue(false);
  const response=await POST(request("POST"));
  expect(response.status).toBe(403);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(getCurrentIdentityUid).not.toHaveBeenCalled();
 });
 it("DELETE clears the handoff selection without retaining a cacheable response",async()=>{
  const response=await DELETE(request("DELETE"));
  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(response.cookies.get("lms_membership")?.value).toBe("");
 });
});
