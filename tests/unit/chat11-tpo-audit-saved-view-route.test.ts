import {beforeEach,describe,expect,it,vi} from "vitest";
import {NextResponse} from "next/server";

const mocks=vi.hoisted(()=>({origin:vi.fn(),actor:vi.fn(),list:vi.fn(),change:vi.fn(),error:vi.fn()}));
vi.mock("@/auth/origin",()=>({isSameOriginRequest:mocks.origin}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:mocks.actor}));
vi.mock("@/lib/api-error",()=>({apiErrorResponse:mocks.error}));
vi.mock("@/modules/placements/tpo-audit-saved-view-service",()=>{
 class TpoAuditSavedViewError extends Error{
  constructor(readonly code:"STORAGE_PENDING"|"VIEW_NOT_FOUND"|"VIEW_LIMIT"|"PIN_LIMIT"|"DUPLICATE_NAME"|"VIEW_STALE"){super(code);}
 }
 return {TpoAuditSavedViewError,listTpoAuditSavedViews:mocks.list,changeTpoAuditSavedView:mocks.change};
});
import {GET,POST} from "@/app/api/placements/tpo/audit/saved-views/route";
import {TpoAuditSavedViewError} from "@/modules/placements/tpo-audit-saved-view-service";
const actor={user:{id:"11111111-1111-4111-8111-111111111111"},membership:null};
const endpoint="https://college.example/api/placements/tpo/audit/saved-views";
function request(body:string,type="application/json"){
 return new Request(endpoint,{method:"POST",headers:{"content-type":type},body});
}
const command={action:"CREATE",name:"Audit",filters:{kind:"ALL",from:"",to:"",q:"",who:""}};
beforeEach(()=>{
 for(const fn of Object.values(mocks))fn.mockReset();
 mocks.origin.mockReturnValue(true);
 mocks.actor.mockResolvedValue(actor);
 mocks.list.mockResolvedValue({ready:true,views:[]});
 mocks.change.mockResolvedValue({id:"22222222-2222-4222-8222-222222222222"});
 mocks.error.mockImplementation(()=>NextResponse.json({error:"ACCESS_DENIED"},{status:403}));
});
describe("TPO-settings-audit-R04 private saved audit view HTTP surface",()=>{
 it("GET rejects forged college/user filters before actor access and never caches",async()=>{
  for(const url of [endpoint+"?collegeId=foreign",endpoint+"?userId=other",endpoint+"?scope=RECRUITER",endpoint+"?page=2"]){
   const response=await GET(new Request(url));
   expect(response.status,url).toBe(400);
   expect(await response.json()).toEqual({error:"INVALID_REQUEST"});
   expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  }
  expect(mocks.list).not.toHaveBeenCalled();
  expect(mocks.actor).not.toHaveBeenCalled();
 });
 it("GET loads only signed-in owner scoped saved views",async()=>{
  const response=await GET(new Request(endpoint));
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ready:true,views:[]});
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
  expect(mocks.list).toHaveBeenCalledWith(actor);
 });
 it("POST rejects cross-origin before loading identity or body",async()=>{
  mocks.origin.mockReturnValueOnce(false);
  const response=await POST(request(JSON.stringify(command)));
  expect(response.status).toBe(403);
  expect((await response.json()).error).toBe("INVALID_ORIGIN");
  expect(mocks.actor).not.toHaveBeenCalled();
  expect(mocks.change).not.toHaveBeenCalled();
 });
 it("POST has bounded strict JSON and rejects wrong content type",async()=>{
  for(const [body,type,status] of [
   ["{bad","application/json",400],
   ["x".repeat(9000),"application/json",413],
   ["{}","text/plain",400],
  ] as const){
   const response=await POST(request(body,type));
   expect(response.status).toBe(status);
   expect((await response.json()).error).toBe("INVALID_REQUEST");
  }
  expect(mocks.change).not.toHaveBeenCalled();
 });
 it("POST delegates unmodified command to the authenticated service with no client-selected owner",async()=>{
  const response=await POST(request(JSON.stringify(command)));
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({id:"22222222-2222-4222-8222-222222222222"});
  expect(mocks.change).toHaveBeenCalledWith(actor,command);
  expect(mocks.change).toHaveBeenCalledTimes(1);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
 });
 it("maps stale, cap, missing and storage conditions without provider text",async()=>{
  for(const [code,status] of [
   ["VIEW_STALE",409],["VIEW_LIMIT",409],["PIN_LIMIT",409],
   ["VIEW_NOT_FOUND",404],["STORAGE_PENDING",503],["DUPLICATE_NAME",409],
  ] as const){
   mocks.change.mockRejectedValueOnce(new TpoAuditSavedViewError(code));
   const response=await POST(request(JSON.stringify(command)));
   expect(response.status).toBe(status);
   expect(await response.json()).toEqual({error:code});
  }
 });
 it("returns safe central denial and does not mutate a revoked session",async()=>{
  mocks.actor.mockRejectedValueOnce(Error("secret DB connection string"));
  const response=await POST(request(JSON.stringify(command)));
  expect(response.status).toBe(403);
  expect(await response.json()).toEqual({error:"ACCESS_DENIED"});
  expect(mocks.change).not.toHaveBeenCalled();
 });
});
