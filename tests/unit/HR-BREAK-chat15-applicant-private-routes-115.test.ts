import {beforeEach,describe,expect,it,vi} from "vitest";
const m=vi.hoisted(()=>({ctx:vi.fn(),origin:vi.fn(),resume:vi.fn(),
 table:vi.fn(),read:vi.fn(),write:vi.fn(),error:vi.fn()}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:m.ctx}));
vi.mock("@/auth/origin",()=>({isSameOriginRequest:m.origin}));
vi.mock("@/modules/placements/staged-tables",()=>({placementTableExists:m.table}));
vi.mock("@/lib/api-error",()=>({apiErrorResponse:m.error}));
vi.mock("@/modules/placements/recruiter-applicant-resume-service",()=>({
 grantRecruiterSharedResume:m.resume,
 RecruiterResumeUnavailable:class RecruiterResumeUnavailable extends Error {},
}));
vi.mock("@/modules/placements/recruiter-private-rating-service",()=>({
 readRecruiterPrivateReview:m.read,writeRecruiterPrivateReview:m.write,
 RecruiterPrivateReviewConflict:class RecruiterPrivateReviewConflict extends Error {},
}));
import {POST as resumePOST} from "@/app/api/placements/recruiter/jobs/[jobId]/applicants/[applicationId]/resume-grant/route";
import {GET as ratingGET,PATCH as ratingPATCH}
 from "@/app/api/placements/recruiter/jobs/[jobId]/applicants/[applicationId]/private-rating/route";
const job="123e4567-e89b-42d3-a456-426614174001";
const app="123e4567-e89b-42d3-a456-426614174002";
const actor={user:{id:"hr",platformStatus:"ACTIVE",systemRoles:[]},
 recruiter:{userId:"hr",status:"ACTIVE",companyId:"company",grants:[]}};
const params={params:Promise.resolve({jobId:job,applicationId:app})};
const url="https://lms.example/api/placements/recruiter/jobs/"+job+"/applicants/"+app;
describe("HR-APPLICANT-PRIVATE-115 resume grants and private rating identity boundary",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();m.ctx.mockResolvedValue(actor);m.origin.mockReturnValue(true);
  m.table.mockResolvedValue(true);m.resume.mockResolvedValue({id:"signed"});
  m.read.mockResolvedValue({rating:3});m.write.mockResolvedValue({rating:4});
  m.error.mockImplementation(()=>Response.json({error:"UNAVAILABLE"},{status:503}));
 });
 it("cross-origin writes deny before actor, schema or persistence",async()=>{
  m.origin.mockReturnValue(false);
  const a=await resumePOST(new Request(url+"/resume-grant",{method:"POST"}),params);
  const b=await ratingPATCH(new Request(url+"/private-rating",{method:"PATCH",body:"{}"}),params);
  expect(a.status).toBe(403);expect(b.status).toBe(403);
  expect(m.ctx).not.toHaveBeenCalled();expect(m.resume).not.toHaveBeenCalled();
  expect(m.write).not.toHaveBeenCalled();
 });
 it("swapped cached recruiter principal cannot obtain a private file grant or rating",async()=>{
  m.ctx.mockResolvedValue({...actor,recruiter:{...actor.recruiter,userId:"imposter"}});
  const a=await resumePOST(new Request(url+"/resume-grant",{method:"POST"}),params);
  const b=await ratingGET(new Request(url+"/private-rating"),params);
  const c=await ratingPATCH(new Request(url+"/private-rating",{method:"PATCH",body:"{}"}),params);
  expect([a.status,b.status,c.status]).toEqual([404,404,404]);
  expect(m.table).not.toHaveBeenCalled();
  expect(m.resume).not.toHaveBeenCalled();expect(m.read).not.toHaveBeenCalled();
  expect(m.write).not.toHaveBeenCalled();
 });
 it("an unavailable auth session is hidden on the resume existence endpoint",async()=>{
  m.ctx.mockRejectedValue(new Error("session backend private record"));
  const response=await resumePOST(new Request(url+"/resume-grant",{method:"POST"}),params);
  expect(response.status).toBe(404);
  expect(await response.json()).toMatchObject({error:"RESUME_NOT_AVAILABLE"});
  expect(m.resume).not.toHaveBeenCalled();
 });
 it("authorized employer grant retains no-store privacy and exact scoped IDs",async()=>{
  const response=await resumePOST(new Request(url+"/resume-grant",{method:"POST"}),params);
  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(m.resume).toHaveBeenCalledWith(actor,job,app);
 });
 it("private rating GET never writes and PATCH passes exact authorized object IDs",async()=>{
  const read=await ratingGET(new Request(url+"/private-rating"),params);
  expect(read.status).toBe(200);
  expect(m.write).not.toHaveBeenCalled();
  const updated=await ratingPATCH(new Request(url+"/private-rating",{
   method:"PATCH",body:JSON.stringify({rating:4}),headers:{"content-type":"application/json"},
  }),params);
  expect(updated.status).toBe(200);
  expect(m.read).toHaveBeenCalledWith(actor,job,app);
  expect(m.write).toHaveBeenCalledWith(actor,job,app,{rating:4});
 });
});