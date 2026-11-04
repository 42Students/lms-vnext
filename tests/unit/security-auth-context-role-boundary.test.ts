import {beforeEach,describe,expect,it,vi} from "vitest";
import {cookies,headers} from "next/headers";
import {getCurrentRequestContext} from "@/auth/request-context";
import {verifyIdentitySessionCookie} from "@/auth/session";
import {resolveRequestContext} from "@/modules/identity/context-service";
import {resolveRequestTenant} from "@/modules/auth/request-tenant";
import {isTenantAccessAllowed} from "@/modules/auth/tenant-access";
import type {RequestContext} from "@/modules/identity/context";

vi.mock("next/headers",()=>({cookies:vi.fn(),headers:vi.fn()}));
vi.mock("@/auth/session",()=>{
 class SessionAuthenticationError extends Error {
  constructor(public readonly code:string){super(code);this.name="SessionAuthenticationError";}
 }
 return {
  SessionAuthenticationError,
  SESSION_COOKIE_NAME:"lms_session",
  MEMBERSHIP_COOKIE_NAME:"lms_membership",
  ROLE_COOKIE_NAME:"lms_role",
  verifyIdentitySessionCookie:vi.fn(),
 };
});
vi.mock("@/auth/e2e-identity",()=>({
 E2E_IDENTITY_COOKIE_NAME:"lms_e2e_identity",
 E2E_SECRET_COOKIE_NAME:"lms_e2e_secret",
 resolveE2eIdentityUid:vi.fn(()=>null),
}));
vi.mock("@/modules/identity/context-service",()=>({resolveRequestContext:vi.fn()}));
vi.mock("@/modules/auth/request-tenant",()=>({resolveRequestTenant:vi.fn()}));
vi.mock("@/modules/auth/tenant-access",()=>({isTenantAccessAllowed:vi.fn()}));

const user="11111111-1111-4111-8111-111111111111";
const member="22222222-2222-4222-8222-222222222222";
const college="33333333-3333-4333-8333-333333333333";
const org="44444444-4444-4444-8444-444444444444";
const requestContext=(roles:NonNullable<RequestContext["membership"]>["roles"]):RequestContext=>({
 user:{id:user,identityUid:"verified-uid",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:member,collegeId:college,organizationId:org,status:"ACTIVE",roles},
 adminScope:null,recruiter:null,
});
beforeEach(()=>{
 vi.resetAllMocks();
 vi.mocked(cookies).mockResolvedValue({
  get:(name:string)=>({
   lms_session:{value:"opaque-session"},
   lms_membership:{value:member},
   lms_role:{value:"COLLEGE_ADMIN"},
  } as Record<string,{value:string}>)[name],
 } as never);
 vi.mocked(headers).mockResolvedValue(new Headers({host:"college.example"}) as never);
 vi.mocked(verifyIdentitySessionCookie).mockResolvedValue({
  uid:"verified-uid",sessionId:"55555555-5555-4555-8555-555555555555",
 });
 vi.mocked(resolveRequestTenant).mockResolvedValue({
  kind:"college",host:"college.example",collegeId:college,organizationId:org,
 });
 vi.mocked(isTenantAccessAllowed).mockReturnValue(true);
});
describe("authenticated request context never grants an ambiguous membership",()=>{
 it("rejects a revoked selected role before tenant routing or any domain handler",async()=>{
  vi.mocked(resolveRequestContext).mockResolvedValue(requestContext([]));
  await expect(getCurrentRequestContext()).rejects.toMatchObject({
   name:"SessionAuthenticationError",code:"SESSION_INVALID",
  });
  expect(resolveRequestTenant).not.toHaveBeenCalled();
  expect(isTenantAccessAllowed).not.toHaveBeenCalled();
 });
 it("rejects a multi-role context that accidentally contains combined privileges",async()=>{
  vi.mocked(resolveRequestContext).mockResolvedValue(requestContext(["LEARNER","COLLEGE_ADMIN"]));
  await expect(getCurrentRequestContext()).rejects.toMatchObject({code:"SESSION_INVALID"});
  expect(isTenantAccessAllowed).not.toHaveBeenCalled();
 });
 it("preserves exactly one explicitly selected, live membership role",async()=>{
  const selected=requestContext(["COLLEGE_ADMIN"]);
  vi.mocked(resolveRequestContext).mockResolvedValue(selected);
  expect(await getCurrentRequestContext()).toEqual(selected);
  expect(isTenantAccessAllowed).toHaveBeenCalledOnce();
 });
 it("does not block a separately authorized platform workspace without a college membership",async()=>{
  const platform={...requestContext(["COLLEGE_ADMIN"]),membership:null,
   user:{...requestContext(["COLLEGE_ADMIN"]).user,systemRoles:["SUPER_ADMIN"] as const}};
  vi.mocked(resolveRequestContext).mockResolvedValue(platform);
  expect(await getCurrentRequestContext()).toEqual(platform);
 });
});
