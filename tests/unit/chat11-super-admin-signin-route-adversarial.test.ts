import {beforeEach,describe,expect,it,vi} from "vitest";
import {NextResponse} from "next/server";
import {readAdminSignInRequestBody} from "@/modules/colleges/admin-signin-request-body";
const mocks=vi.hoisted(()=>({origin:vi.fn(),context:vi.fn(),save:vi.fn(),error:vi.fn()}));
vi.mock("@/auth/origin",()=>({isSameOriginRequest:mocks.origin}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:mocks.context}));
vi.mock("@/lib/api-error",()=>({apiErrorResponse:mocks.error}));
vi.mock("@/modules/colleges/admin-signin-policy-service",()=>{
 class CollegeSignInPolicyError extends Error{
  constructor(readonly code:string){super(code);}
 }
 return {CollegeSignInPolicyError,saveAdminCollegeSignInPolicy:mocks.save};
});
import {PUT} from "@/app/api/admin/colleges/[collegeId]/signin/route";
import {CollegeSignInPolicyError} from "@/modules/colleges/admin-signin-policy-service";
const id="11111111-1111-4111-8111-111111111111";
const other="22222222-2222-4222-8222-222222222222";
const actor={user:{id:"super-admin"},membership:null};
const payload={collegeId:id,method:"EMAIL_AND_PHONE",expectedVersion:2};
const req=(body:string,type="application/json")=>
 new Request("https://college.example/api/admin/colleges/"+id+"/signin",{
  method:"PUT",headers:{"content-type":type},body,
 });
const params={params:Promise.resolve({collegeId:id})};
beforeEach(()=>{
 for(const mock of Object.values(mocks))mock.mockReset();
 mocks.origin.mockReturnValue(true);
 mocks.context.mockResolvedValue(actor);
 mocks.save.mockResolvedValue({method:"EMAIL_AND_PHONE",version:3});
 mocks.error.mockImplementation(()=>NextResponse.json({error:"DENIED"},{status:403}));
});

describe("SA-tenants-modules-LOGIN-02 Super Admin college sign-in route",()=>{
 it("rejects forged origins before identity lookup or policy access",async()=>{
  mocks.origin.mockReturnValueOnce(false);
  const response=await PUT(req(JSON.stringify(payload)),params);
  expect(response.status).toBe(403);
  expect(await response.json()).toEqual({error:"INVALID_ORIGIN"});
  expect(mocks.context).not.toHaveBeenCalled();
  expect(mocks.save).not.toHaveBeenCalled();
 });
 it("does not read malformed JSON before checking for an active session",async()=>{
  mocks.context.mockRejectedValueOnce(Error("expired session"));
  const response=await PUT(req("{bad"),params);
  expect(response.status).toBe(403);
  expect(await response.json()).toEqual({error:"DENIED"});
  expect(mocks.save).not.toHaveBeenCalled();
 });
 it("rejects an absent or foreign URL/body tenant match",async()=>{
  for(const bad of [{...payload,collegeId:other},
   {method:payload.method,expectedVersion:1},[],null]){
   const response=await PUT(req(JSON.stringify(bad)),params);
   expect(response.status).toBe(400);
   expect(await response.json()).toEqual({error:"INVALID_REQUEST"});
  }
  expect(mocks.save).not.toHaveBeenCalled();
 });
 it("passes the signed-in actor and never returns forged user IDs",async()=>{
  const body={...payload,userId:"forged"};
  const response=await PUT(req(JSON.stringify(body)),params);
  expect(response.status).toBe(200);
  expect(mocks.save).toHaveBeenCalledWith(actor,body);
  expect(mocks.save).toHaveBeenCalledTimes(1);
  expect(await response.json()).toEqual({policy:{method:"EMAIL_AND_PHONE",version:3}});
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
 });
 it("bounds JSON streams and rejects malformed/wrong-media-type payloads",async()=>{
  for(const [body,type,status] of [
   ["{invalid","application/json",400],
   ["x".repeat(2200),"application/json",413],
   ["{}","text/plain",400],
  ] as const){
   const response=await PUT(req(body,type),params);
   expect(response.status).toBe(status);
   expect(await response.json()).toEqual({error:"INVALID_REQUEST"});
  }
  expect(mocks.save).not.toHaveBeenCalled();
  await expect(readAdminSignInRequestBody(req('{"collegeId":"ok"}')))
   .resolves.toEqual({collegeId:"ok"});
 });
 it("maps stale policy CAS and absent storage without exposing underlying errors",async()=>{
  for(const [code,status] of [
   ["SIGNIN_POLICY_STALE",409],["SIGNIN_STORAGE_PENDING",503],
  ] as const){
   mocks.save.mockRejectedValueOnce(new CollegeSignInPolicyError(code));
   const response=await PUT(req(JSON.stringify(payload)),params);
   expect(response.status).toBe(status);
   expect((await response.json()).error).toBe(code);
  }
 });
});
