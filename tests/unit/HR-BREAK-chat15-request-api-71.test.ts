import {beforeEach,describe,expect,it,vi} from "vitest";
import {NextResponse} from "next/server";
const m=vi.hoisted(()=>({
 ctx:vi.fn(),origin:vi.fn(),body:vi.fn(),create:vi.fn(),update:vi.fn(),
 list:vi.fn(),error:vi.fn(),
}));
vi.mock("server-only",()=>({}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:m.ctx}));
vi.mock("@/auth/origin",()=>({isSameOriginRequest:m.origin}));
vi.mock("@/lib/api-error",()=>({apiErrorResponse:m.error}));
vi.mock("@/modules/placements/recruiter-drive-request-service",()=>({
 createOwnRecruiterDriveRequest:m.create,
 updateOwnRecruiterDriveRequest:m.update,
 listOwnRecruiterDriveRequests:m.list,
 RecruiterDriveRequestError:class RecruiterDriveRequestError extends Error{
  code:string;constructor(code:string){super(code);this.code=code;}
 },
}));
vi.mock("@/modules/placements/recruiter-json-request",()=>({
 readRecruiterJsonBody:m.body,
 RecruiterJsonBodyError:class RecruiterJsonBodyError extends Error{kind="INVALID";},
}));
import {GET,POST,PATCH} from "@/app/api/placements/recruiter/drives/requests/route";
const collegeId="123e4567-e89b-42d3-a456-426614174001";
const actor={user:{id:"actor",platformStatus:"ACTIVE"}};
const req=(method:string)=>new Request("https://lms.example/api/placements/recruiter/drives/requests",
 {method,...(method==="GET"?{}:{body:"{}",headers:{"content-type":"application/json"}})});
describe("HR-DRIVE-API-71: recruiter requests preserve idempotence and friendly failures",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();
  m.origin.mockReturnValue(true);m.ctx.mockResolvedValue(actor);
  m.body.mockResolvedValue({});m.error.mockImplementation(()=>
   NextResponse.json({message:"Unable to save. Try again.",requestId:"ABCDEFGH"},{status:503}));
  m.create.mockResolvedValue({id:"request",replayed:false});
  m.update.mockResolvedValue({id:"request",status:"REQUEST"});
  m.list.mockResolvedValue([]);
 });
 it("blocks cross-origin writes before parsing or looking up actor grants",async()=>{
  m.origin.mockReturnValue(false);
  const posted=await POST(req("POST"));
  const patched=await PATCH(req("PATCH"));
  expect(posted.status).toBe(403);expect(patched.status).toBe(403);
  expect(m.body).not.toHaveBeenCalled();
  expect(m.ctx).not.toHaveBeenCalled();
 });
 it("creates once (201) but classifies an idempotent nonce replay as 200",async()=>{
  expect((await POST(req("POST"))).status).toBe(201);
  m.create.mockResolvedValue({id:"request",replayed:true});
  expect((await POST(req("POST"))).status).toBe(200);
  expect(m.create).toHaveBeenCalledWith(actor,{});
 });
 it("malformed GET college never accesses recruiter persistence",async()=>{
  const response=await GET(new Request("https://lms.example/api/placements/recruiter/drives/requests?collegeId=foreign"));
  expect(response.status).toBe(400);
  expect(m.list).not.toHaveBeenCalled();
 });
 it("authorized GET is read-only and preserves the exact college filter",async()=>{
  await GET(new Request("https://lms.example/api/placements/recruiter/drives/requests?collegeId="+collegeId));
  expect(m.list).toHaveBeenCalledWith(actor,collegeId);
  expect(m.create).not.toHaveBeenCalled();
  expect(m.update).not.toHaveBeenCalled();
 });
 it("unanticipated private SQL errors become sanitized JSON without a rejected promise",async()=>{
  m.create.mockRejectedValue(new Error("relation secret_table not found"));
  const response=await POST(req("POST"));
  expect(response.status).toBe(503);
  const output=await response.text();
  expect(output).toContain("Unable to save. Try again.");
  expect(output).not.toContain("secret_table");
  expect(m.error).toHaveBeenCalledTimes(1);
 });
 it("stale PATCH service failures remain visible through friendly mapping",async()=>{
  m.update.mockRejectedValue(new Error("lost database connection"));
  const response=await PATCH(req("PATCH"));
  expect(response.status).toBe(503);
  expect(m.error).toHaveBeenCalledTimes(1);
 });
});
