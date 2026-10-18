import {beforeEach,describe,expect,it,vi} from "vitest";
import {NextResponse} from "next/server";

const mocks=vi.hoisted(()=>({origin:vi.fn(),actor:vi.fn(),save:vi.fn(),apiError:vi.fn()}));
vi.mock("@/auth/origin",()=>({isSameOriginRequest:mocks.origin}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:mocks.actor}));
vi.mock("@/lib/api-error",()=>({apiErrorResponse:mocks.apiError}));
vi.mock("@/modules/placements/tpo-my-notification-preferences-write",()=>{
 class TpoPreferenceSaveError extends Error{
  constructor(readonly code:"STALE"|"NOT_READY"){super(code);}
 }
 return {TpoPreferenceSaveError,saveMyTpoNotificationPreferences:mocks.save};
});
import {PUT} from "@/app/api/placements/tpo/my-notification-preferences/route";
import {TpoPreferenceSaveError} from "@/modules/placements/tpo-my-notification-preferences-write";

const actor={user:{id:"11111111-1111-4111-8111-111111111111"},membership:null};
const data={
 morningDigest:true,recruiterMessages:true,requests:false,
 resultsReady:true,followUps:false,expectedVersion:null,
};
const make=(body:string,contentType="application/json")=>
 new Request("https://college.example/api/placements/tpo/my-notification-preferences",{
  method:"PUT",headers:{"content-type":contentType},body,
 });
beforeEach(()=>{
 for(const fn of Object.values(mocks))fn.mockReset();
 mocks.origin.mockReturnValue(true);
 mocks.actor.mockResolvedValue(actor);
 mocks.save.mockResolvedValue({saved:true,version:"2026-10-18T10:00:00.001Z"});
 mocks.apiError.mockImplementation(()=>NextResponse.json({error:"DENIED"},{status:403}));
});
describe("TPO-settings-audit-PREF-HTTP-08 personal preferences HTTP boundary",()=>{
 it("denies cross-site mutation before looking up the actor or reading any data",async()=>{
  mocks.origin.mockReturnValueOnce(false);
  const response=await PUT(make(JSON.stringify(data)));
  expect(response.status).toBe(403);
  expect(await response.json()).toEqual({error:"INVALID_ORIGIN"});
  expect(mocks.actor).not.toHaveBeenCalled();
  expect(mocks.save).not.toHaveBeenCalled();
 });
 it("does not forward invalid JSON, excessive payloads or non-JSON to storage",async()=>{
  for(const [body,contentType,status] of [
   ["{bad","application/json",400],
   ["x".repeat(9000),"application/json",413],
   ["{}","text/plain",400],
  ] as const){
   const response=await PUT(make(body,contentType));
   expect(response.status).toBe(status);
   expect((await response.json()).error).toBe("INVALID_REQUEST");
  }
  expect(mocks.save).not.toHaveBeenCalled();
 });
 it("forwards the exact own-account update to the authorized service and never caches it",async()=>{
  const response=await PUT(make(JSON.stringify(data)));
  expect(response.status).toBe(200);
  expect(mocks.save).toHaveBeenCalledWith(actor,data);
  expect(mocks.save).toHaveBeenCalledTimes(1);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(await response.json()).toEqual({saved:true,version:"2026-10-18T10:00:00.001Z"});
 });
 it("preserves the strict service's rejection of a forged college or user",async()=>{
  const forged={...data,userId:"hijacked",collegeId:"foreign"};
  const response=await PUT(make(JSON.stringify(forged)));
  expect(response.status).toBe(200);
  // The HTTP boundary is intentionally generic JSON. It must preserve the
  // unknown body unchanged so the service's strict schema rejects forged IDs.
  expect(mocks.save).toHaveBeenCalledWith(actor,forged);
 });
 it("uses 409 for stale CAS, 503 for unavailable storage and no internal exception text",async()=>{
  for(const [code,status] of [["STALE",409],["NOT_READY",503]] as const){
   mocks.save.mockRejectedValueOnce(new TpoPreferenceSaveError(code));
   const response=await PUT(make(JSON.stringify(data)));
   expect(response.status).toBe(status);
   expect(await response.json()).toEqual({error:code});
   expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  }
 });
 it("maps identity-revocation denial to standard error response",async()=>{
  mocks.actor.mockRejectedValueOnce(Error("session expired"));
  const response=await PUT(make(JSON.stringify(data)));
  expect(response.status).toBe(403);
  expect(await response.json()).toEqual({error:"DENIED"});
  expect(mocks.save).not.toHaveBeenCalled();
 });
});
