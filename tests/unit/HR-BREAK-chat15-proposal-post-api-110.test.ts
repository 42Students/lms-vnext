import {beforeEach,describe,expect,it,vi} from "vitest";
import {emptyHrDriveDraft} from "@/modules/placements/hr-drive-draft-model";
const m=vi.hoisted(()=>({origin:vi.fn(),ctx:vi.fn(),read:vi.fn(),send:vi.fn(),error:vi.fn()}));
vi.mock("@/auth/origin",()=>({isSameOriginRequest:m.origin}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:m.ctx}));
vi.mock("@/lib/api-error",()=>({apiErrorResponse:m.error}));
vi.mock("@/modules/placements/recruiter-json-request",()=>({
 readRecruiterJsonBody:m.read,
 RecruiterJsonBodyError:class RecruiterJsonBodyError extends Error{kind="INVALID";},
}));
vi.mock("@/modules/placements/tpo-messaging-service",()=>({
 sendRecruiterDriveProposal:m.send,
 TpoMessagingError:class TpoMessagingError extends Error{
  code:string;constructor(code:string){super(code);this.code=code;}
 },
}));
import {POST} from "@/app/api/placements/recruiter/drives/proposal/route";
const collegeId="123e4567-e89b-42d3-a456-426614174001";
const submissionId="123e4567-e89b-42d3-a456-426614174002";
const actor={user:{id:"recruiter",platformStatus:"ACTIVE",systemRoles:[]},
 recruiter:{userId:"recruiter",status:"ACTIVE",companyId:"firm",grants:[]}};
const draft={...emptyHrDriveDraft(),title:"Graduate engineer",location:"Hyderabad",ctcLpa:"10"};
const payload={collegeId,submissionId,draft};
const request=()=>new Request("https://lms.example/api/placements/recruiter/drives/proposal",{
 method:"POST",body:"{}",
});
describe("HR-PROPOSAL-API-110 real recruiter proposal POST boundary",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();m.origin.mockReturnValue(true);m.ctx.mockResolvedValue(actor);
  m.read.mockResolvedValue(payload);
  m.send.mockResolvedValue({threadId:"thread",messageId:"message",replayed:false});
  m.error.mockImplementation(()=>Response.json({error:"TEMPORARILY_UNAVAILABLE"},{status:503}));
 });
 it("cross-origin submits never read body, identity or service",async()=>{
  m.origin.mockReturnValue(false);
  expect((await POST(request())).status).toBe(403);
  expect(m.read).not.toHaveBeenCalled();
  expect(m.ctx).not.toHaveBeenCalled();
  expect(m.send).not.toHaveBeenCalled();
 });
 it("malformed draft is refused before querying company grants",async()=>{
  m.read.mockResolvedValue({...payload,draft:{...draft,title:""}});
  const r=await POST(request());
  expect(r.status).toBe(400);
  expect(m.ctx).not.toHaveBeenCalled();expect(m.send).not.toHaveBeenCalled();
 });
 it("cached recruiter grant cannot act on a different logged-in principal",async()=>{
  m.ctx.mockResolvedValue({...actor,recruiter:{...actor.recruiter,userId:"other"}});
  expect((await POST(request())).status).toBe(403);
  expect(m.send).not.toHaveBeenCalled();
 });
 it("successful submit is CREATED once and replay has OK status without duplication",async()=>{
  expect((await POST(request())).status).toBe(201);
  m.send.mockResolvedValue({threadId:"thread",messageId:"message",replayed:true});
  expect((await POST(request())).status).toBe(200);
  expect(m.send).toHaveBeenCalledWith(actor,expect.objectContaining({submissionId}));
 });
 it("downstream persistence failures return a safe error response instead of rejecting request",async()=>{
  m.send.mockRejectedValue(new Error("relation secret_table unavailable"));
  const result=await POST(request());
  expect(result.status).toBe(503);
  expect(await result.json()).toMatchObject({error:"TEMPORARILY_UNAVAILABLE"});
  expect(m.error).toHaveBeenCalledTimes(1);
 });
 it("auth context timeout also degrades safely without producing a saved receipt",async()=>{
  m.ctx.mockRejectedValue(new Error("session backend offline"));
  const result=await POST(request());
  expect(result.status).toBe(503);
  expect(m.send).not.toHaveBeenCalled();
 });
});