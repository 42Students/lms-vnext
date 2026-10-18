import {beforeEach,describe,expect,it,vi} from "vitest";
import {PUT as saveSignIn} from "@/app/api/admin/colleges/[collegeId]/signin/route";
import {GET as listSessions,POST as revokeSessions} from "@/app/api/admin/colleges/[collegeId]/sessions/route";
import {GET as exportTenants} from "@/app/api/admin/tenants/export/route";

const mock=vi.hoisted(()=>({
 origin:vi.fn(),context:vi.fn(),save:vi.fn(),list:vi.fn(),revoke:vi.fn(),export:vi.fn(),
}));
vi.mock("@/auth/origin",()=>({isSameOriginRequest:mock.origin}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:mock.context}));
vi.mock("@/modules/colleges/admin-signin-policy-service",()=>({
 CollegeSignInPolicyError:class CollegeSignInPolicyError extends Error {
  constructor(readonly code:string){super(code);}
 },
 saveAdminCollegeSignInPolicy:mock.save,
}));
vi.mock("@/modules/colleges/admin-session-service",()=>({
 listCollegeAdminSessions:mock.list,revokeCollegeAdminSessions:mock.revoke,
}));
vi.mock("@/modules/colleges/admin-tenant-lifecycle-service",()=>({
 exportSuperAdminTenantDirectory:mock.export,
}));

const college="11111111-1111-4111-8111-111111111111";
const foreign="22222222-2222-4222-8222-222222222222";
const adminUser="33333333-3333-4333-8333-333333333333";
const actor={user:{id:"admin"}};
const route={params:Promise.resolve({collegeId:college})};
const json=(url:string,method:string,body:unknown)=>new Request(url,{
 method,headers:{"Content-Type":"application/json"},body:JSON.stringify(body),
});

beforeEach(()=>{
 for(const fn of Object.values(mock))fn.mockReset();
 mock.origin.mockReturnValue(true);
 mock.context.mockResolvedValue(actor);
});

describe("Super Admin tenant API authenticated routes, origin and validation",()=>{
 it("SA-colleges-signin-API-01 denies forged origins and path-body mismatch before calling the write service",async()=>{
  mock.origin.mockReturnValueOnce(false);
  const body={collegeId:college,method:"EMAIL_ONLY",expectedVersion:1};
  const crossOrigin=await saveSignIn(json("http://local/api/admin/colleges/"+college+"/signin","PUT",body),route);
  expect(crossOrigin.status).toBe(403);
  expect(mock.save).not.toHaveBeenCalled();
  const forged=await saveSignIn(json("http://local/api/admin/colleges/"+college+"/signin","PUT",
   {...body,collegeId:foreign}),route);
  expect(forged.status).toBe(400);
  expect(mock.save).not.toHaveBeenCalled();
  mock.save.mockResolvedValue({method:"EMAIL_ONLY",version:2});
  const ok=await saveSignIn(json("http://local/api/admin/colleges/"+college+"/signin","PUT",body),route);
  expect(ok.status).toBe(200);
  expect((await ok.json()).policy).toEqual({method:"EMAIL_ONLY",version:2});
  expect(mock.save).toHaveBeenCalledWith(actor,body);
  expect(ok.headers.get("Cache-Control")).toBe("private, no-store");
 });
 it("SA-colleges-sessions-API-01 revoked or replayed session commands require same-origin and explicit confirmation",async()=>{
  const url="http://local/api/admin/colleges/"+college+"/sessions";
  mock.origin.mockReturnValueOnce(false);
  const denied=await revokeSessions(json(url,"POST",{userId:adminUser,confirm:true}),route);
  expect(denied.status).toBe(403);
  expect(mock.revoke).not.toHaveBeenCalled();
  for(const payload of [
   {userId:adminUser,confirm:false},
   {userId:adminUser},
   {userId:"foreign",confirm:true},
   {userId:adminUser,confirm:true,otherCollege:foreign},
  ]){
   const result=await revokeSessions(json(url,"POST",payload),route);
   expect(result.status).toBe(400);
   expect(mock.revoke).not.toHaveBeenCalled();
  }
  mock.revoke.mockResolvedValue({revoked:3});
  const result=await revokeSessions(json(url,"POST",{userId:adminUser,confirm:true}),route);
  expect(result.status).toBe(200);
  expect(await result.json()).toEqual({revoked:3});
  expect(mock.revoke).toHaveBeenCalledWith(actor,college,adminUser);
 });
 it("SA-colleges-sessions-API-02 GET lists exactly a validated user target and never calls mutation",async()=>{
  const base="http://local/api/admin/colleges/"+college+"/sessions";
  const invalid=await listSessions(new Request(base+"?userId=bad"),route);
  expect(invalid.status).toBe(400);
  expect(mock.list).not.toHaveBeenCalled();
  mock.list.mockResolvedValue({devices:[],target:{userId:adminUser}});
  const ok=await listSessions(new Request(base+"?userId="+adminUser),route);
  expect(ok.status).toBe(200);
  expect((await ok.json()).devices).toEqual([]);
  expect(mock.list).toHaveBeenCalledWith(actor,college,adminUser);
  expect(mock.revoke).not.toHaveBeenCalled();
 });
 it("SA-tenants-export-API-01 repeated/unknown filters never enumerate tenants and returned CSV is private and bounded",async()=>{
  const base="http://local/api/admin/tenants/export";
  for(const qs of ["?status=ACTIVE&status=ARCHIVED","?injectedCollege="+foreign,"?organizationId=not-uuid"]){
   const invalid=await exportTenants(new Request(base+qs));
   expect(invalid.status).toBe(400);
  }
  expect(mock.export).not.toHaveBeenCalled();
  mock.export.mockResolvedValue({csv:"test,csv\r\n",truncated:false,cap:1000});
  const ok=await exportTenants(new Request(base+"?status=ACTIVE"));
  expect(ok.status).toBe(200);
  expect(ok.headers.get("X-Content-Type-Options")).toBe("nosniff");
  expect(ok.headers.get("Cache-Control")).toBe("private, no-store");
  expect(ok.headers.get("X-Export-Row-Cap")).toBe("1000");
  expect(await ok.text()).toBe("test,csv\r\n");
  expect(mock.export).toHaveBeenCalledOnce();
  expect(mock.revoke).not.toHaveBeenCalled();
 });
});