import {beforeEach,describe,expect,it,vi} from "vitest";
import {NextResponse} from "next/server";

const mocks=vi.hoisted(()=>({
 origin:vi.fn(),context:vi.fn(),recent:vi.fn(),permission:vi.fn(),
 add:vi.fn(),remove:vi.fn(),list:vi.fn(),lifecycle:vi.fn(),onboard:vi.fn(),
}));
vi.mock("server-only",()=>({}));
vi.mock("@/auth/origin",()=>({isSameOriginRequest:mocks.origin}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:mocks.context}));
vi.mock("@/auth/recent-device-auth",()=>({requireRecentDeviceAuthentication:mocks.recent}));
vi.mock("@/modules/permissions/policy",()=>({requirePermission:mocks.permission}));
vi.mock("@/modules/people/runtime",()=>({
 addMembershipRoleWithRuntime:mocks.add,
 removeMembershipRoleWithRuntime:mocks.remove,
 listMembershipRolesWithRuntime:mocks.list,
 updateMembershipLifecycleWithRuntime:mocks.lifecycle,
 onboardPersonWithRuntime:mocks.onboard,
}));
vi.mock("@/lib/api-error",()=>({
 apiErrorResponse:(error:unknown)=>NextResponse.json({
   error:error instanceof Error?error.message:"INVALID_REQUEST",
 },{status:error instanceof Error&&error.message==="RECENT_SIGN_IN_REQUIRED"?401:
   error instanceof Error&&error.message==="FORBIDDEN"?403:400}),
}));

import {GET as getRoles,POST as addRole,DELETE as removeRole}
 from "@/app/api/people/[membershipId]/roles/route";
import {PATCH as changeLifecycle}
 from "@/app/api/people/[membershipId]/lifecycle/route";
import {POST as onboard} from "@/app/api/people/onboard/route";

const member="11111111-1111-4111-8111-111111111111";
const college="22222222-2222-4222-8222-222222222222";
const make=(method:string,resource:string,body?:unknown)=>new Request(
 "https://college.example.test/api/people/"+resource,{
   method,headers:{host:"college.example.test",origin:"https://college.example.test",
     "content-type":"application/json"},
   ...(body===undefined?{}:{body:typeof body==="string"?body:JSON.stringify(body)}),
 });
const args={params:Promise.resolve({membershipId:member})};
const stale=()=>mocks.recent.mockRejectedValue(new Error("RECENT_SIGN_IN_REQUIRED"));
const noMutations=()=>{
 expect(mocks.add).not.toHaveBeenCalled();
 expect(mocks.remove).not.toHaveBeenCalled();
 expect(mocks.lifecycle).not.toHaveBeenCalled();
 expect(mocks.onboard).not.toHaveBeenCalled();
};
beforeEach(()=>{
 vi.clearAllMocks();
 mocks.origin.mockReturnValue(true);
 mocks.context.mockResolvedValue({user:{id:"operator",platformStatus:"ACTIVE"}});
 mocks.recent.mockResolvedValue({userId:"operator",sessionId:"device"});
 mocks.permission.mockReturnValue(undefined);
 mocks.add.mockResolvedValue(["FACULTY"]);
 mocks.remove.mockResolvedValue(["LEARNER"]);
 mocks.list.mockResolvedValue(["FACULTY"]);
 mocks.lifecycle.mockResolvedValue({membership:{id:member,status:"SUSPENDED",
  suspendedAt:new Date("2026-11-04T01:00:00.000Z"),suspensionReason:"risk"},user:{id:"target"}});
 mocks.onboard.mockResolvedValue({membership:{id:member}});
});

describe("sensitive membership and onboarding writes",()=>{
 it.each(["LEARNER","FACULTY","MENTOR"])("requires real fresh sign-in for %s grant even if not a privileged admin",async role=>{
  stale();
  const response=await addRole(make("POST",member+"/roles",{role}),args);
  expect(response.status).toBe(401);
  expect((await response.json()).error).toBe("RECENT_SIGN_IN_REQUIRED");
  expect(mocks.recent).toHaveBeenCalledTimes(1);
  noMutations();
 });
 it.each(["LEARNER","FACULTY","MENTOR"])("requires real fresh sign-in for %s revocation",async role=>{
  stale();
  const response=await removeRole(make("DELETE",member+"/roles",{role}),args);
  expect(response.status).toBe(401);
  expect(mocks.recent).toHaveBeenCalledTimes(1);
  noMutations();
 });
 it.each(["COLLEGE_ADMIN","TPO"])("keeps Super Admin permission check for protected %s mutations",async role=>{
  mocks.permission.mockImplementation(()=>{throw new Error("FORBIDDEN")});
  const denied=await addRole(make("POST",member+"/roles",{role}),args);
  expect(denied.status).toBe(403);
  expect(mocks.permission).toHaveBeenCalledWith(expect.anything(),"admin-scope.select");
  expect(mocks.recent).not.toHaveBeenCalled();
  noMutations();
 });
 it("does not weaken the normal authorized role mutation path",async()=>{
  const added=await addRole(make("POST",member+"/roles",{role:"FACULTY"}),args);
  expect(added.status).toBe(200);
  expect(mocks.add).toHaveBeenCalledOnce();
  expect(mocks.add).toHaveBeenCalledWith(expect.anything(),member,{role:"FACULTY"});
  const removed=await removeRole(make("DELETE",member+"/roles",{role:"FACULTY"}),args);
  expect(removed.status).toBe(200);
  expect(mocks.remove).toHaveBeenCalledOnce();
  expect(mocks.recent).toHaveBeenCalledTimes(2);
 });
 it.each(["SUSPEND","REACTIVATE","END"])("rejects stale sign-in for %s",async action=>{
  stale();
  const body=action==="SUSPEND"?{action,reason:"Security review"}:{action};
  const response=await changeLifecycle(make("PATCH",member+"/lifecycle",body),args);
  expect(response.status).toBe(401);
  expect(mocks.recent).toHaveBeenCalledTimes(1);
  noMutations();
 });
 it("preserves authorized college-membership lifecycle changes",async()=>{
  const response=await changeLifecycle(make("PATCH",member+"/lifecycle",
    {action:"SUSPEND",reason:"Security review"}),args);
  expect(response.status).toBe(200);
  expect(mocks.recent).toHaveBeenCalledOnce();
  expect(mocks.lifecycle).toHaveBeenCalledWith(expect.anything(),member,
    {action:"SUSPEND",reason:"Security review"});
 });
 it.each(["LEARNER","FACULTY","MENTOR"])("rejects stale sign-in on %s onboarding",async role=>{
  stale();
  const response=await onboard(make("POST","onboard",{
   collegeId:college,phoneE164:"+919876543210",displayName:"Test Person",roles:[role],
  }));
  expect(response.status).toBe(401);
  expect(mocks.recent).toHaveBeenCalledOnce();
  noMutations();
 });
 it("preserves protected onboarding permission and live recent session check",async()=>{
  const body={collegeId:college,phoneE164:"+919876543210",
   displayName:"Admin Person",roles:["COLLEGE_ADMIN"]};
  const response=await onboard(make("POST","onboard",body));
  expect(response.status).toBe(200);
  expect(mocks.permission).toHaveBeenCalledWith(expect.anything(),"admin-scope.select");
  expect(mocks.recent).toHaveBeenCalledOnce();
  expect(mocks.onboard).toHaveBeenCalledWith(expect.anything(),body,undefined);
 });
 it("rejects cross-site writes before any session, attestation or mutation",async()=>{
  mocks.origin.mockReturnValue(false);
  expect((await addRole(make("POST",member+"/roles",{role:"FACULTY"}),args)).status).toBe(403);
  expect((await removeRole(make("DELETE",member+"/roles",{role:"FACULTY"}),args)).status).toBe(403);
  expect((await changeLifecycle(make("PATCH",member+"/lifecycle",{action:"END"}),args)).status).toBe(403);
  expect((await onboard(make("POST","onboard",{}))).status).toBe(403);
  expect(mocks.context).not.toHaveBeenCalled();
  expect(mocks.recent).not.toHaveBeenCalled();
  noMutations();
 });
 it("rejects unknown role and lifecycle actions before touching the protected writer",async()=>{
  expect((await addRole(make("POST",member+"/roles",{role:"SUPER_ADMIN"}),args)).status).toBe(400);
  expect((await changeLifecycle(make("PATCH",member+"/lifecycle",{action:"DELETE_USER"}),args)).status).toBe(400);
  expect(mocks.recent).not.toHaveBeenCalled();
  noMutations();
 });
 it("rejects oversized role and lifecycle payloads with 413 before memory amplification",async()=>{
  const oversized=JSON.stringify({role:"FACULTY",padding:"x".repeat(3_000)});
  expect((await addRole(make("POST",member+"/roles",oversized),args)).status).toBe(413);
  expect((await removeRole(make("DELETE",member+"/roles",oversized),args)).status).toBe(413);
  const bigLifecycle=JSON.stringify({action:"END",padding:"x".repeat(3_000)});
  expect((await changeLifecycle(make("PATCH",member+"/lifecycle",bigLifecycle),args)).status).toBe(413);
  // route() authenticates each request once before the body is read (401 precedes 413); no service work follows.
  expect(mocks.context).toHaveBeenCalledTimes(3);
  noMutations();
 });
 it("rejects oversized onboarding profiles even with a forged small Content-Length",async()=>{
  const big=JSON.stringify({collegeId:college,roles:["FACULTY"],
    displayName:"Test",phoneE164:"+919876543210",padding:"x".repeat(9_000)});
  const request=make("POST","onboard",big);
  // Streaming byte bound is enforced even when callers omit Content-Length.
  const response=await onboard(request);
  expect(response.status).toBe(413);
  expect(mocks.recent).not.toHaveBeenCalled();
  noMutations();
 });
 it("role listing is read-only and never requires an extra sign-in",async()=>{
  const response=await getRoles(make("GET",member+"/roles"),args);
  expect(response.status).toBe(200);
  expect((await response.json()).roles).toEqual(["FACULTY"]);
  expect(mocks.recent).not.toHaveBeenCalled();
 });
});
