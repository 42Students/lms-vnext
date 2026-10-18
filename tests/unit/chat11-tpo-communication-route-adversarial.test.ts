import {beforeEach,describe,expect,it,vi} from "vitest";
import {NextResponse} from "next/server";
const mocks=vi.hoisted(()=>({
 origin:vi.fn(),context:vi.fn(),save:vi.fn(),error:vi.fn(),
}));
vi.mock("@/auth/origin",()=>({isSameOriginRequest:mocks.origin}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:mocks.context}));
vi.mock("@/lib/api-error",()=>({apiErrorResponse:mocks.error}));
vi.mock("@/modules/placements/tpo-communication-settings-service",()=>{
 class TpoCommunicationSettingsError extends Error{
  constructor(readonly code:string){super(code);}
 }
 return {TpoCommunicationSettingsError,updateTpoCommunicationSettings:mocks.save};
});
import {PATCH} from "@/app/api/placements/tpo/settings/communication/route";
import {TpoCommunicationSettingsError} from "@/modules/placements/tpo-communication-settings-service";

const actor={user:{id:"signed-in-user"},membership:{id:"current-college-membership"}};
const url="https://college.example/api/placements/tpo/settings/communication";
const settings={section:"SMS_CAP",smsMonthlyCap:500,expectedVersion:null};
const request=(body:string,headers:Record<string,string>={})=>
 new Request(url,{method:"PATCH",headers:{"content-type":"application/json",...headers},body});
beforeEach(()=>{
 for(const stub of Object.values(mocks))stub.mockReset();
 mocks.origin.mockReturnValue(true);
 mocks.context.mockResolvedValue(actor);
 mocks.save.mockResolvedValue({saved:true,version:"2026-10-18T11:00:00.000Z"});
 mocks.error.mockImplementation(()=>NextResponse.json({
  error:"SAFE_DENIED",message:"Sign in again or refresh your session.",
 },{status:403}));
});

describe("TPO-settings-audit-ROUTE-01 communication PATCH adversarial HTTP handler",()=>{
 it("denies forged cross-origin PATCH before actor or input processing",async()=>{
  mocks.origin.mockReturnValueOnce(false);
  const response=await PATCH(request(JSON.stringify(settings)));
  expect(response.status).toBe(403);
  expect(await response.json()).toEqual({error:"INVALID_ORIGIN"});
  expect(mocks.context).not.toHaveBeenCalled();
  expect(mocks.save).not.toHaveBeenCalled();
 });
 it("delegates valid input with resolved actor instead of trusting forged user and college keys",async()=>{
  const submitted={...settings,userId:"evil",collegeId:"foreign"};
  const response=await PATCH(request(JSON.stringify(submitted)));
  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(mocks.save).toHaveBeenCalledTimes(1);
  expect(mocks.save).toHaveBeenCalledWith(actor,submitted);
  const data=await response.json();
  expect(data).toEqual({saved:true,version:"2026-10-18T11:00:00.000Z"});
  expect(JSON.stringify(data)).not.toContain("foreign");
 });
 it("rejects large and malformed request bodies without a service write or an echoed payload",async()=>{
  const cases=[
   {body:"{bad json",status:400},
   {body:"x".repeat(9000),status:413},
  ];
  for(const input of cases){
   const response=await PATCH(request(input.body));
   expect(response.status).toBe(input.status);
   expect(await response.json()).toEqual({error:"INVALID_REQUEST"});
  }
  expect(mocks.save).not.toHaveBeenCalled();
 });
 it("maps stale and absent storage to explicit 409/503 without raw database text",async()=>{
  for(const [code,status] of [["TPO_SETTINGS_STALE",409],["TPO_SETTINGS_PENDING",503]] as const){
   mocks.save.mockRejectedValueOnce(new TpoCommunicationSettingsError(code));
   const response=await PATCH(request(JSON.stringify(settings)));
   expect(response.status).toBe(status);
   expect((await response.json()).error).toBe(code);
  }
 });
 it("maps simulated revoked membership and expired session through the safe error boundary",async()=>{
  mocks.context.mockRejectedValueOnce(new Error("private token and password"));
  const response=await PATCH(request(JSON.stringify(settings)));
  expect(response.status).toBe(403);
  expect(await response.json()).toEqual({
   error:"SAFE_DENIED",message:"Sign in again or refresh your session.",
  });
  expect(mocks.save).not.toHaveBeenCalled();
  expect(mocks.error).toHaveBeenCalledTimes(1);
 });
});
