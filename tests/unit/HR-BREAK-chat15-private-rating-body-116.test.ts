import {beforeEach,describe,expect,it,vi} from "vitest";
const m=vi.hoisted(()=>({ctx:vi.fn(),origin:vi.fn(),table:vi.fn(),write:vi.fn(),read:vi.fn(),
 body:vi.fn(),error:vi.fn()}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:m.ctx}));
vi.mock("@/auth/origin",()=>({isSameOriginRequest:m.origin}));
vi.mock("@/modules/placements/staged-tables",()=>({placementTableExists:m.table}));
vi.mock("@/modules/placements/recruiter-json-request",()=>({
 readRecruiterJsonBody:m.body,
 RecruiterJsonBodyError:class RecruiterJsonBodyError extends Error{
  kind:"INVALID_JSON"|"TOO_LARGE";constructor(kind:"INVALID_JSON"|"TOO_LARGE"){
   super(kind);this.kind=kind;
  }
 },
}));
vi.mock("@/modules/placements/recruiter-private-rating-service",()=>({
 readRecruiterPrivateReview:m.read,writeRecruiterPrivateReview:m.write,
 RecruiterPrivateReviewConflict:class RecruiterPrivateReviewConflict extends Error {},
}));
vi.mock("@/lib/api-error",()=>({apiErrorResponse:m.error}));
import {PATCH} from "@/app/api/placements/recruiter/jobs/[jobId]/applicants/[applicationId]/private-rating/route";
import {RecruiterJsonBodyError} from "@/modules/placements/recruiter-json-request";
const job="123e4567-e89b-42d3-a456-426614174001";
const app="123e4567-e89b-42d3-a456-426614174002";
const actor={user:{id:"recruiter",platformStatus:"ACTIVE",systemRoles:[]},
 recruiter:{userId:"recruiter",status:"ACTIVE",companyId:"company",grants:[]}};
const post=()=>PATCH(new Request("https://lms.example/api/placements/recruiter/jobs/"+job+
 "/applicants/"+app+"/private-rating",{method:"PATCH",body:"{}"}),{
 params:Promise.resolve({jobId:job,applicationId:app}),
});
describe("HR-APPLICANT-REVIEW-116 bounded private rating writes",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();m.ctx.mockResolvedValue(actor);m.origin.mockReturnValue(true);
  m.table.mockResolvedValue(true);m.body.mockResolvedValue({
   rating:4,note:"Strong candidate",expectedUpdatedAt:null,
  });m.write.mockResolvedValue({rating:4});
  m.error.mockImplementation(()=>Response.json({error:"UNAVAILABLE"},{status:503}));
 });
 it("valid write uses capped parser and exact candidate scope",async()=>{
  const response=await post();
  expect(response.status).toBe(200);
  expect(m.body).toHaveBeenCalledWith(expect.any(Request),16*1024);
  expect(m.write).toHaveBeenCalledWith(actor,job,app,expect.objectContaining({rating:4}));
 });
 it("oversized chunked request returns 413, not a provider error or a write",async()=>{
  m.body.mockRejectedValue(new RecruiterJsonBodyError("TOO_LARGE"));
  const response=await post();
  expect(response.status).toBe(413);
  expect(await response.json()).toMatchObject({error:"INVALID_REQUEST"});
  expect(m.write).not.toHaveBeenCalled();
 });
 it("malformed JSON returns 400 with no private data mutation",async()=>{
  m.body.mockRejectedValue(new RecruiterJsonBodyError("INVALID_JSON"));
  const response=await post();
  expect(response.status).toBe(400);
  expect(m.write).not.toHaveBeenCalled();
 });
 it("origin denial takes precedence over private body parsing",async()=>{
  m.origin.mockReturnValue(false);
  expect((await post()).status).toBe(403);
  expect(m.body).not.toHaveBeenCalled();
  expect(m.table).not.toHaveBeenCalled();
 });
 it("stale swapped actor refuses before parsing private body or reading table readiness",async()=>{
  m.ctx.mockResolvedValue({...actor,recruiter:{...actor.recruiter,userId:"imposter"}});
  expect((await post()).status).toBe(404);
  expect(m.table).not.toHaveBeenCalled();
  expect(m.body).not.toHaveBeenCalled();
 });
});