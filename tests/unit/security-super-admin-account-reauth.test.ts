import {beforeEach,describe,expect,it,vi} from "vitest";
import {NextResponse} from "next/server";

const mocks=vi.hoisted(()=>({
 origin:vi.fn(),context:vi.fn(),recent:vi.fn(),
 create:vi.fn(),update:vi.fn(),platform:vi.fn(),grant:vi.fn(),revoke:vi.fn(),
}));
vi.mock("server-only",()=>({}));
vi.mock("@/auth/origin",()=>({isSameOriginRequest:mocks.origin}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:mocks.context}));
vi.mock("@/auth/recent-device-auth",()=>({requireRecentDeviceAuthentication:mocks.recent}));
vi.mock("@/modules/placements/super-admin-hr-service",()=>({
 createSuperAdminHrAccount:mocks.create,updateSuperAdminHrAccount:mocks.update,
 grantSuperAdminHrCollegeAccess:mocks.grant,revokeSuperAdminHrCollegeAccess:mocks.revoke,
 getSuperAdminHrAccount:vi.fn(),listSuperAdminHrAccounts:vi.fn(),
}));
vi.mock("@/modules/people/super-admin-platform-account-service",()=>({
 changePlatformAccountStatus:mocks.platform,
}));
vi.mock("@/lib/api-error",()=>({
 apiErrorResponse:(error:unknown)=>NextResponse.json({error:error instanceof Error?error.message:"ERROR"},
  {status:error instanceof Error&&error.message==="RECENT_SIGN_IN_REQUIRED"?401:400}),
}));

import {POST as recruiterCreate} from "@/app/api/admin/hr/route";
import {PATCH as recruiterUpdate} from "@/app/api/admin/hr/[userId]/route";
import {PATCH as platformChange} from "@/app/api/admin/people/platform/[userId]/route";
import {POST as grantRecruiter} from "@/app/api/admin/hr/[userId]/grants/route";
import {DELETE as revokeRecruiter} from "@/app/api/admin/hr/[userId]/grants/[grantId]/route";

const ACTOR="11111111-1111-4111-8111-111111111111";
const TARGET="22222222-2222-4222-8222-222222222222";
const COMPANY="33333333-3333-4333-8333-333333333333";
const GRANT="44444444-4444-4444-8444-444444444444";
const createBody={
 displayName:"Recruiter User",phoneE164:"+919876543210",
 companyRelationshipId:COMPANY,
};
const updateBody={displayName:"Updated Recruiter"};
const platformBody={status:"DISABLED",reason:"Confirmed account compromise",confirmed:true};
const make=(method:string,path:string,body:unknown)=>new Request(
 "https://college.example.test"+path,{method,
 headers:{host:"college.example.test",origin:"https://college.example.test",
  "content-type":"application/json"},body:JSON.stringify(body)});
const params={params:Promise.resolve({userId:TARGET})};
const none=()=>{
 expect(mocks.create).not.toHaveBeenCalled();
 expect(mocks.update).not.toHaveBeenCalled();
 expect(mocks.platform).not.toHaveBeenCalled();
 expect(mocks.grant).not.toHaveBeenCalled();
 expect(mocks.revoke).not.toHaveBeenCalled();
};
beforeEach(()=>{
 vi.clearAllMocks();
 mocks.origin.mockReturnValue(true);
 mocks.context.mockResolvedValue({user:{id:ACTOR,platformStatus:"ACTIVE"}});
 mocks.recent.mockResolvedValue({userId:ACTOR});
 mocks.create.mockResolvedValue({userId:TARGET});
 mocks.update.mockResolvedValue({userId:TARGET});
 mocks.platform.mockResolvedValue({userId:TARGET,status:"DISABLED",changed:true});
 mocks.grant.mockResolvedValue({id:GRANT});
 mocks.revoke.mockResolvedValue({id:GRANT,status:"REVOKED"});
});

describe("Super Admin account and recruiter grant changes require actor-bound fresh sign-in",()=>{
 it("denies a stale session before provisioning a recruiter relationship",async()=>{
  mocks.recent.mockRejectedValue(new Error("RECENT_SIGN_IN_REQUIRED"));
  const response=await recruiterCreate(make("POST","/api/admin/hr",createBody));
  expect(response.status).toBe(401);
  expect(mocks.recent).toHaveBeenCalledWith(ACTOR);
  none();
 });
 it("denies a stale session before editing a recruiter identity",async()=>{
  mocks.recent.mockRejectedValue(new Error("RECENT_SIGN_IN_REQUIRED"));
  const response=await recruiterUpdate(make("PATCH","/api/admin/hr/"+TARGET,updateBody),params);
  expect(response.status).toBe(401);
  expect(mocks.recent).toHaveBeenCalledWith(ACTOR);
  none();
 });
 it("denies a stale session before disabling or reactivating platform identity",async()=>{
  mocks.recent.mockRejectedValue(new Error("RECENT_SIGN_IN_REQUIRED"));
  const response=await platformChange(make("PATCH","/api/admin/people/platform/"+TARGET,platformBody),params);
  expect(response.status).toBe(401);
  expect(mocks.recent).toHaveBeenCalledWith(ACTOR);
  none();
 });
 it("denies stale-device cross-college recruiter access grants and revocations",async()=>{
  mocks.recent.mockRejectedValue(new Error("RECENT_SIGN_IN_REQUIRED"));
  const grantBody={companyRelationshipId:COMPANY};
  const created=await grantRecruiter(
   make("POST","/api/admin/hr/"+TARGET+"/grants",grantBody),params);
  expect(created.status).toBe(401);
  const revoked=await revokeRecruiter(
   make("DELETE","/api/admin/hr/"+TARGET+"/grants/"+GRANT,{}),
   {params:Promise.resolve({userId:TARGET,grantId:GRANT})});
  expect(revoked.status).toBe(401);
  expect(mocks.recent).toHaveBeenCalledTimes(2);
  expect(mocks.recent).toHaveBeenNthCalledWith(1,ACTOR);
  expect(mocks.recent).toHaveBeenNthCalledWith(2,ACTOR);
  none();
 });
 it("grants and revokes only after verified fresh actor/device match",async()=>{
  const grantBody={companyRelationshipId:COMPANY};
  const granted=await grantRecruiter(
   make("POST","/api/admin/hr/"+TARGET+"/grants",grantBody),params);
  expect(granted.status).toBe(201);
  expect(granted.headers.get("Cache-Control")).toBe("private, no-store");
  expect(mocks.grant).toHaveBeenCalledWith(expect.anything(),TARGET,grantBody);
  const revoked=await revokeRecruiter(
   make("DELETE","/api/admin/hr/"+TARGET+"/grants/"+GRANT,{}),
   {params:Promise.resolve({userId:TARGET,grantId:GRANT})});
  expect(revoked.status).toBe(200);
  expect(revoked.headers.get("Cache-Control")).toBe("private, no-store");
  expect(mocks.revoke).toHaveBeenCalledWith(expect.anything(),TARGET,GRANT);
 });
 it("keeps the expected successful recruiter provisioning contract",async()=>{
  const response=await recruiterCreate(make("POST","/api/admin/hr",createBody));
  expect(response.status).toBe(201);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(mocks.create).toHaveBeenCalledWith(expect.anything(),createBody);
  expect(mocks.recent).toHaveBeenCalledWith(ACTOR);
 });
 it("keeps an authorized recruiter account update",async()=>{
  const response=await recruiterUpdate(make("PATCH","/api/admin/hr/"+TARGET,updateBody),params);
  expect(response.status).toBe(200);
  expect(mocks.update).toHaveBeenCalledWith(expect.anything(),TARGET,updateBody);
 });
 it("keeps an authorized platform block and revocation workflow",async()=>{
  const response=await platformChange(make("PATCH","/api/admin/people/platform/"+TARGET,platformBody),params);
  expect(response.status).toBe(200);
  expect(mocks.platform).toHaveBeenCalledWith(expect.anything(),TARGET,platformBody);
 });
 it("rejects cross-site account mutations before actor or DB proof",async()=>{
  mocks.origin.mockReturnValue(false);
  expect((await recruiterCreate(make("POST","/api/admin/hr",createBody))).status).toBe(403);
  expect((await recruiterUpdate(make("PATCH","/api/admin/hr/"+TARGET,updateBody),params)).status).toBe(403);
  expect((await platformChange(make("PATCH","/api/admin/people/platform/"+TARGET,platformBody),params)).status).toBe(403);
  expect((await grantRecruiter(make("POST","/api/admin/hr/"+TARGET+"/grants",{companyRelationshipId:COMPANY}),params)).status).toBe(403);
  expect((await revokeRecruiter(make("DELETE","/api/admin/hr/"+TARGET+"/grants/"+GRANT,{}),
   {params:Promise.resolve({userId:TARGET,grantId:GRANT})})).status).toBe(403);
  expect(mocks.context).not.toHaveBeenCalled();
  expect(mocks.recent).not.toHaveBeenCalled();
  none();
 });
 it("rejects invalid grant/identity fields before privilege confirmation",async()=>{
  expect((await recruiterCreate(make("POST","/api/admin/hr",{displayName:"Bad"}))).status).toBe(400);
  expect((await recruiterUpdate(make("PATCH","/api/admin/hr/"+TARGET,{phoneE164:"bad"}),params)).status).toBe(400);
  expect(mocks.recent).not.toHaveBeenCalled();
  none();
 });
 it("rejects malformed platform changes without touching protected writers",async()=>{
  // The service validates this command; route-level freshness still prevents
  // all side effects in case of an expired actor session.
  mocks.recent.mockRejectedValue(new Error("RECENT_SIGN_IN_REQUIRED"));
  const response=await platformChange(make("PATCH","/api/admin/people/platform/"+TARGET,
   {status:"ACTIVE",confirmed:false,reason:"x"}),params);
  expect(response.status).toBe(401);
  none();
 });
});
