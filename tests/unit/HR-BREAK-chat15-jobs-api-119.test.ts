import {beforeEach,describe,expect,it,vi} from "vitest";
const m=vi.hoisted(()=>({ctx:vi.fn(),jobs:vi.fn(),error:vi.fn()}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:m.ctx}));
vi.mock("@/modules/placements/recruiter-service",()=>({
 listOwnRecruiterPlacementJobs:m.jobs,
}));
vi.mock("@/lib/api-error",()=>({apiErrorResponse:m.error}));
import {GET} from "@/app/api/placements/recruiter/jobs/route";

const actor={user:{id:"recruiter",platformStatus:"ACTIVE",systemRoles:[]},
 recruiter:{userId:"recruiter",status:"ACTIVE",companyId:"company",grants:[]}};
describe("HR-JOBS-API-119 read-only recruiter job portfolio",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();m.ctx.mockResolvedValue(actor);m.jobs.mockResolvedValue([]);
  m.error.mockImplementation(()=>Response.json({error:"NOT_AVAILABLE"},{status:503}));
 });
 it("authorized empty portfolio has no fabricated drives and uses own caller identity",async()=>{
  const response=await GET();
  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(await response.json()).toEqual({jobs:[]});
  expect(m.jobs).toHaveBeenCalledWith(actor);
 });
 it("the returned portfolio is only what the centralized authorized service supplied",async()=>{
  const allowed=[{collegeId:"college-a",companyId:"company",
   job:{id:"own-job",title:"Engineer",status:"PUBLISHED"}}];
  m.jobs.mockResolvedValue(allowed);
  const response=await GET();
  expect(await response.json()).toEqual({jobs:allowed});
  expect(m.jobs).toHaveBeenCalledTimes(1);
 });
 it("a revoked recruiter grant does not fall back to a global job listing",async()=>{
  m.jobs.mockRejectedValue(new Error("recruiter grant revoked"));
  const response=await GET();
  expect(response.status).toBe(503);
  expect((await response.text())).not.toContain("recruiter grant revoked");
  expect(m.error).toHaveBeenCalledTimes(1);
 });
 it("authentication dependency failure cannot be mistaken for an empty company",async()=>{
  m.ctx.mockRejectedValue(new Error("identity backend timeout"));
  const response=await GET();
  expect(response.status).toBe(503);
  expect(m.jobs).not.toHaveBeenCalled();
 });
});