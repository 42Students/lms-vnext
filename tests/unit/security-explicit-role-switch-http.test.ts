import {beforeEach,describe,expect,it,vi} from "vitest";
import {cookies,headers} from "next/headers";
import {getCurrentIdentityUid} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {resolveRequestTenant} from "@/modules/auth/request-tenant";
import {isTenantAccessAllowed} from "@/modules/auth/tenant-access";
import {listMembershipChoices,resolveRequestContext}
 from "@/modules/identity/context-service";
import {GET,POST} from "@/app/api/auth/memberships/route";
import type {RequestContext} from "@/modules/identity/context";

vi.mock("next/headers",()=>({headers:vi.fn(),cookies:vi.fn()}));
vi.mock("@/auth/request-context",()=>({getCurrentIdentityUid:vi.fn()}));
vi.mock("@/auth/origin",()=>({isSameOriginRequest:vi.fn()}));
vi.mock("@/modules/auth/request-tenant",()=>({resolveRequestTenant:vi.fn()}));
vi.mock("@/modules/auth/tenant-access",()=>({isTenantAccessAllowed:vi.fn()}));
vi.mock("@/modules/identity/context-service",()=>{
 class ContextResolutionError extends Error {
  constructor(public readonly code:string){super(code);}
 }
 return {ContextResolutionError,listMembershipChoices:vi.fn(),resolveRequestContext:vi.fn()};
});

const user="11111111-1111-4111-8111-111111111111";
const membership="22222222-2222-4222-8222-222222222222";
const college="33333333-3333-4333-8333-333333333333";
const organization="44444444-4444-4444-8444-444444444444";
const identity="test-identity";
const principal:RequestContext["user"]={
 id:user,identityUid:identity,platformStatus:"ACTIVE",systemRoles:[],
};
const request=(body:unknown)=>new Request("https://campus.example/api/auth/memberships",{
 method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body),
});
beforeEach(()=>{
 vi.resetAllMocks();
 vi.mocked(isSameOriginRequest).mockReturnValue(true);
 vi.mocked(getCurrentIdentityUid).mockResolvedValue(identity);
 vi.mocked(headers).mockResolvedValue(new Headers({host:"campus.example"}) as never);
 vi.mocked(cookies).mockResolvedValue({get:(name:string)=>
  name==="lms_membership"?{value:membership}:undefined} as never);
 vi.mocked(resolveRequestTenant).mockResolvedValue({
  kind:"college",host:"campus.example",collegeId:college,organizationId:organization,
 });
 vi.mocked(isTenantAccessAllowed).mockReturnValue(true);
 vi.mocked(listMembershipChoices).mockResolvedValue([{
  id:membership,collegeId:college,organizationId:organization,
  collegeName:"College A",organizationName:"Organization",collegeCode:"A",
  status:"ACTIVE",roles:["LEARNER","COLLEGE_ADMIN"],
 }] as never);
 vi.mocked(resolveRequestContext).mockImplementation(async ({activeMembershipId,activeRole})=>({
  user:principal,
  membership:activeMembershipId?{
   id:membership,collegeId:college,organizationId:organization,status:"ACTIVE",
   roles:activeRole==="LEARNER"?["LEARNER"]:
     activeRole==="COLLEGE_ADMIN"?["COLLEGE_ADMIN"]:[],
  }:null,
  adminScope:null,recruiter:null,
 }) as RequestContext);
});

describe("ambiguous multirole membership switch cannot mint authorization cookies",()=>{
 it("GET reports a required selection without inventing a privileged active role",async()=>{
  const response=await GET();
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({
   currentMembershipKey:membership,currentRole:null,
   roleSelectionRequired:true,membershipSelectionRequired:true,
  });
 });
 it("rejects switch without role and writes no membership or role cookies",async()=>{
  const response=await POST(request({membershipId:membership}));
  expect(response.status).toBe(400);
  expect(await response.json()).toMatchObject({error:"ROLE_SELECTION_REQUIRED"});
  expect(response.cookies.get("lms_membership")).toBeUndefined();
  expect(response.cookies.get("lms_role")).toBeUndefined();
 });
 it("rejects an explicitly named but no-longer-granted role",async()=>{
  vi.mocked(resolveRequestContext).mockImplementation(async ({activeMembershipId})=>({
   user:principal,
   membership:activeMembershipId?{
    id:membership,collegeId:college,organizationId:organization,status:"ACTIVE",roles:[],
   }:null,adminScope:null,recruiter:null,
  }) as RequestContext);
  const response=await POST(request({membershipId:membership,role:"COLLEGE_ADMIN"}));
  expect(response.status).toBe(403);
  expect(await response.json()).toMatchObject({error:"ROLE_NOT_GRANTED"});
  expect(response.cookies.get("lms_role")).toBeUndefined();
 });
 it("still permits explicitly selected and live Learner role",async()=>{
  const response=await POST(request({membershipId:membership,role:"LEARNER"}));
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({selectedRole:"LEARNER"});
  expect(response.cookies.get("lms_membership")?.value).toBe(membership);
  expect(response.cookies.get("lms_role")?.value).toBe("LEARNER");
 });
 it("still permits explicitly selected and live College Admin role",async()=>{
  const response=await POST(request({membershipId:membership,role:"COLLEGE_ADMIN"}));
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({selectedRole:"COLLEGE_ADMIN"});
  expect(response.cookies.get("lms_role")?.value).toBe("COLLEGE_ADMIN");
 });
});
