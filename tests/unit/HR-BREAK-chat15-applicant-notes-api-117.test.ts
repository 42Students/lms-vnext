import {beforeEach,describe,expect,it,vi} from "vitest";
const m=vi.hoisted(()=>({ctx:vi.fn(),origin:vi.fn(),body:vi.fn(),note:vi.fn(),error:vi.fn()}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:m.ctx}));
vi.mock("@/auth/origin",()=>({isSameOriginRequest:m.origin}));
vi.mock("@/lib/api-error",()=>({apiErrorResponse:m.error}));
vi.mock("@/modules/placements/applicant-notes-service",()=>({addRecruiterApplicantNote:m.note}));
vi.mock("@/modules/placements/recruiter-json-request",()=>({
 readRecruiterJsonBody:m.body,
 RecruiterJsonBodyError:class RecruiterJsonBodyError extends Error{
  kind:"TOO_LARGE"|"INVALID_JSON";constructor(kind:"TOO_LARGE"|"INVALID_JSON"){
   super(kind);this.kind=kind;
  }
 },
}));
import {POST} from "@/app/api/placements/recruiter/jobs/[jobId]/applicants/[applicationId]/notes/route";
import {RecruiterJsonBodyError} from "@/modules/placements/recruiter-json-request";
const job="123e4567-e89b-42d3-a456-426614174001";
const app="123e4567-e89b-42d3-a456-426614174002";
const actor={user:{id:"recruiter",platformStatus:"ACTIVE"}};
const post=()=>POST(new Request("https://lms.example/api/placements/recruiter/jobs/"+job+
 "/applicants/"+app+"/notes",{method:"POST",body:"{}"}),{
 params:Promise.resolve({jobId:job,applicationId:app}),
});
describe("HR-APPLICANT-NOTES-117 authenticated private recruiter notes",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();m.ctx.mockResolvedValue(actor);m.origin.mockReturnValue(true);
  m.body.mockResolvedValue({note:"Interviewed"});m.note.mockResolvedValue({id:"note"});
  m.error.mockImplementation(()=>Response.json({error:"UNAVAILABLE"},{status:503}));
 });
 it("refuses a cross-origin note before authentication or private parser",async()=>{
  m.origin.mockReturnValue(false);
  expect((await post()).status).toBe(403);
  expect(m.ctx).not.toHaveBeenCalled();expect(m.body).not.toHaveBeenCalled();
 });
 it("authorized caller delegates exact applicant and bounded 16KiB payload",async()=>{
  const response=await post();
  expect(response.status).toBe(200);
  expect(m.body).toHaveBeenCalledWith(expect.any(Request),16*1024);
  expect(m.note).toHaveBeenCalledWith(actor,job,app,{note:"Interviewed"});
 });
 it("oversize body maps to 413 before persistence",async()=>{
  m.body.mockRejectedValue(new RecruiterJsonBodyError("TOO_LARGE"));
  expect((await post()).status).toBe(413);
  expect(m.note).not.toHaveBeenCalled();
 });
 it("invalid JSON maps to 400 rather than a private SQL exception",async()=>{
  m.body.mockRejectedValue(new RecruiterJsonBodyError("INVALID_JSON"));
  const response=await post();
  expect(response.status).toBe(400);
  expect(await response.json()).toMatchObject({error:"INVALID_REQUEST"});
  expect(m.note).not.toHaveBeenCalled();
 });
 it("a revoked private candidate service denial is sanitized rather than reporting success",async()=>{
  m.note.mockRejectedValue(new Error("applicant no longer shared"));
  const response=await post();
  expect(response.status).toBe(503);
  expect(m.error).toHaveBeenCalledTimes(1);
 });
});