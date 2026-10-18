import {beforeEach,describe,expect,it,vi} from "vitest";
const mocks=vi.hoisted(()=>({
 origin:vi.fn(),context:vi.fn(),read:vi.fn(),create:vi.fn(),update:vi.fn(),list:vi.fn(),
}));
vi.mock("@/auth/origin",()=>({isSameOriginRequest:mocks.origin}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:mocks.context}));
vi.mock("@/modules/placements/recruiter-json-request",()=>({
 readRecruiterJsonBody:mocks.read,
 RecruiterJsonBodyError:class RecruiterJsonBodyError extends Error{
  constructor(readonly kind:"INVALID_JSON"|"TOO_LARGE"){super(kind);}
 },
}));
vi.mock("@/modules/placements/recruiter-drive-request-service",()=>({
 createOwnRecruiterDriveRequest:mocks.create,
 updateOwnRecruiterDriveRequest:mocks.update,
 listOwnRecruiterDriveRequests:mocks.list,
 RecruiterDriveRequestError:class RecruiterDriveRequestError extends Error{
  constructor(readonly code:string){super(code);}
 },
}));
import {GET,POST,PATCH} from "@/app/api/placements/recruiter/drives/requests/route";
import {RecruiterDriveRequestError} from "@/modules/placements/recruiter-drive-request-service";
import {RecruiterJsonBodyError} from "@/modules/placements/recruiter-json-request";

const college="123e4567-e89b-42d3-a456-426614174001";
const base="https://lms.example.org/api/placements/recruiter/drives/requests";
const actor={user:{id:"recruiter-a",platformStatus:"ACTIVE"}};
const request=(method:"GET"|"POST"|"PATCH",search="")=>
 new Request(base+search,{method,...(method!=="GET"?{
  headers:{"Content-Type":"application/json",Origin:"https://lms.example.org"},
  body:JSON.stringify({draft:"held by body decoder"}),
 }: {})});

describe("HR-REQUEST-ROUTE-23 live HTTP response, CSRF and replay handling",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();
  mocks.origin.mockReturnValue(true);
  mocks.context.mockResolvedValue(actor);
  mocks.read.mockResolvedValue({safe:true});
  mocks.list.mockResolvedValue([{id:"scoped-request"}]);
  mocks.create.mockResolvedValue({id:"created",replayed:false});
  mocks.update.mockResolvedValue({id:"updated"});
 });
 it.each(["POST","PATCH"] as const)(
  "denies %s cross-origin before loading user or any body/service side effect",async method=>{
   mocks.origin.mockReturnValue(false);
   const response=await (method==="POST"?POST(request(method)):PATCH(request(method)));
   expect(response.status).toBe(403);
   expect(await response.json()).toEqual({error:"INVALID_ORIGIN"});
   expect(mocks.context).not.toHaveBeenCalled();
   expect(mocks.read).not.toHaveBeenCalled();
   expect(mocks.create).not.toHaveBeenCalled();
   expect(mocks.update).not.toHaveBeenCalled();
  });
 it("GET requires a valid college UUID before resolving the session",async()=>{
  const bad=await GET(request("GET","?collegeId=../../another-college"));
  expect(bad.status).toBe(400);
  expect(mocks.context).not.toHaveBeenCalled();
  expect(mocks.list).not.toHaveBeenCalled();
  const good=await GET(request("GET","?collegeId="+college));
  expect(good.status).toBe(200);
  expect(await good.json()).toEqual({requests:[{id:"scoped-request"}]});
  expect(mocks.list).toHaveBeenCalledWith(actor,college);
 });
 it("POST creates exactly once with 201 and distinguishes an idempotent 200 retry",async()=>{
  const created=await POST(request("POST"));
  expect(created.status).toBe(201);
  expect(await created.json()).toEqual({id:"created",replayed:false});
  expect(mocks.create).toHaveBeenCalledWith(actor,{safe:true});
  mocks.create.mockResolvedValue({id:"created",replayed:true});
  const replay=await POST(request("POST"));
  expect(replay.status).toBe(200);
  expect(await replay.json()).toEqual({id:"created",replayed:true});
  expect(mocks.create).toHaveBeenCalledTimes(2);
 });
 it("PATCH returns a typed request response and never creates another request",async()=>{
  const response=await PATCH(request("PATCH"));
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({request:{id:"updated"}});
  expect(mocks.update).toHaveBeenCalledWith(actor,{safe:true});
  expect(mocks.create).not.toHaveBeenCalled();
 });
 it("rejects oversized streamed JSON as 413 without a recruiter mutation",async()=>{
  mocks.read.mockRejectedValue(new RecruiterJsonBodyError("TOO_LARGE"));
  const response=await PATCH(request("PATCH"));
  expect(response.status).toBe(413);
  expect(await response.json()).toEqual({error:"INVALID_REQUEST"});
  expect(mocks.update).not.toHaveBeenCalled();
 });
 it("returns a generic 400 for malformed JSON without leaking request details",async()=>{
  mocks.read.mockRejectedValue(new RecruiterJsonBodyError("INVALID_JSON"));
  const response=await POST(request("POST"));
  expect(response.status).toBe(400);
  expect(await response.json()).toEqual({error:"INVALID_REQUEST"});
  expect(mocks.create).not.toHaveBeenCalled();
 });
 it.each([["FORBIDDEN",403],["NOT_FOUND",404],["STALE",409],["IDEMPOTENCY_CONFLICT",409]] as const)(
  "maps %s service failure to HTTP %d without exposing internal SQL",async (code,status)=>{
   mocks.update.mockRejectedValue(new RecruiterDriveRequestError(code));
   const response=await PATCH(request("PATCH"));
   expect(response.status).toBe(status);
   expect(await response.json()).toEqual({error:code});
  });
});
