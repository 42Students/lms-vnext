import {beforeEach,describe,expect,it,vi} from "vitest";
import {headers,cookies} from "next/headers";
import {getCurrentIdentityUid} from "@/auth/request-context";
import {resolveRequestTenant} from "@/modules/auth/request-tenant";
import {isTenantAccessAllowed} from "@/modules/auth/tenant-access";
import {resolveRequestContext} from "@/modules/identity/context-service";
import {isSameOriginRequest} from "@/auth/origin";
import {recordSecurityEvent} from "@/security/audit-store";
import {POST} from "@/app/api/auth/memberships/route";
vi.mock("next/headers",()=>({headers:vi.fn(),cookies:vi.fn()}));
vi.mock("@/auth/request-context",()=>({getCurrentIdentityUid:vi.fn(),getCurrentRequestContext:vi.fn()}));
vi.mock("@/modules/auth/request-tenant",()=>({resolveRequestTenant:vi.fn()}));
vi.mock("@/modules/auth/tenant-access",()=>({isTenantAccessAllowed:vi.fn()}));
vi.mock("@/auth/origin",()=>({isSameOriginRequest:vi.fn()}));
vi.mock("@/security/audit-store",()=>({recordSecurityEvent:vi.fn()}));
vi.mock("@/modules/identity/context-service",()=>{
 class ContextResolutionError extends Error{constructor(public code:string){super(code);}}
 return {ContextResolutionError,listMembershipChoices:vi.fn(),resolveRequestContext:vi.fn()};
});
const college="11111111-1111-4111-8111-111111111111";
const membershipId="33333333-3333-4333-8333-333333333333";
const post=(body:unknown)=>POST(new Request("https://campus.example/api/auth/memberships",{
 method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)}) as never,{} as never);
beforeEach(()=>{
 vi.resetAllMocks();
 vi.mocked(isSameOriginRequest).mockReturnValue(true);
 vi.mocked(getCurrentIdentityUid).mockResolvedValue("identity-1");
 vi.mocked(headers).mockResolvedValue(new Headers({host:"campus.example"}) as never);
 vi.mocked(cookies).mockResolvedValue({get:()=>undefined} as never);
 vi.mocked(isTenantAccessAllowed).mockReturnValue(true);
 vi.mocked(resolveRequestTenant).mockResolvedValue({kind:"college",host:"campus.example",collegeId:college,organizationId:college} as never);
});
describe("workspace switch audit",()=>{
 it("records a successful switch with user, college and role",async()=>{
  vi.mocked(resolveRequestContext).mockResolvedValue({user:{id:"u1"},membership:{id:membershipId,collegeId:college,roles:["FACULTY"]}} as never);
  const response=await post({membershipId,role:"FACULTY"});
  expect(response.status).toBe(200);
  expect(recordSecurityEvent).toHaveBeenCalledWith(expect.objectContaining({event:"auth.workspace_switched",outcome:"ok",userId:"u1",collegeId:college,detail:{role:"FACULTY"}}));
 });
 it("records a denied switch without echoing request content",async()=>{
  vi.mocked(resolveRequestContext).mockResolvedValue({user:{id:"u1"},membership:{id:membershipId,collegeId:college,roles:["FACULTY","MENTOR"]}} as never);
  const response=await post({membershipId});
  expect(response.status).toBe(400);
  const events=vi.mocked(recordSecurityEvent).mock.calls.map(call=>call[0].event);
  expect(events).not.toContain("auth.workspace_switched");
 });
});
