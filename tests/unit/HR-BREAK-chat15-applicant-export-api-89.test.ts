import {beforeEach,describe,expect,it,vi} from "vitest";
import {GET} from "@/app/api/placements/recruiter/jobs/[jobId]/applicants/export/route";
const m=vi.hoisted(()=>({ctx:vi.fn(),read:vi.fn(),error:vi.fn()}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:m.ctx}));
vi.mock("@/modules/placements/hr-job-read-service",()=>({getHrJobRead:m.read}));
vi.mock("@/lib/api-error",()=>({apiErrorResponse:m.error}));

const job="123e4567-e89b-42d3-a456-426614174001";
const actor={user:{id:"recruiter",platformStatus:"ACTIVE"}};
const base={id:"application",name:"Private learner",role:"Engineer",status:"SUBMITTED",
 screening:"SHORTLISTED",submittedAt:new Date("2099-01-01T00:00:00Z"),
 email:"student@example.test",phone:"+911234567890"};
const responseFor=(rows:typeof base[],total:number,pages=1)=>({
 stageCounts:{ALL:total,APPLIED:total,WITHDRAWN:0},
 applicants:{rows},applicantsPage:{pageSize:25,pages},
});
const view=(stage="ALL")=>GET(new Request(
 "https://lms.example/api/placements/recruiter/jobs/"+job+"/applicants/export?stage="+stage),{
 params:Promise.resolve({jobId:job}),
});
describe("HR-APPLICANTS-API-89 recruiter CSV reads only authorized, bounded shortlisted pages",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();m.ctx.mockResolvedValue(actor);
  m.error.mockImplementation(()=>Response.json({error:"INVALID_REQUEST"},{status:400}));
  m.read.mockResolvedValue(responseFor([base],1));
 });
 it("an authorized export masks contacts and prevents cache persistence",async()=>{
  const response=await view();
  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  const csv=await response.text();
  expect(csv).toContain("Private learner");
  expect(csv).toContain("Masked");
  expect(csv).not.toContain("student@example.test");
  expect(csv).not.toContain("+911234567890");
  expect(m.read).toHaveBeenCalledWith(actor,job,expect.objectContaining({
   tab:"applicants",stage:"ALL",page:1,
  }));
 });
 it("invalid stage cannot trigger employer or candidate data reads",async()=>{
  const result=await view("INTERNAL_PRIVATE");
  expect(result.status).toBe(400);
  expect(m.ctx).not.toHaveBeenCalled();
  expect(m.read).not.toHaveBeenCalled();
 });
 it("a 201-applicant export stops after 200 rows and tells recruiter one is omitted",async()=>{
  m.read.mockImplementation(async(_ctx:unknown,_job:unknown,filters:{page?:number})=>{
   const page=filters.page??1;
   const rows=Array.from({length:25},(_,i)=>({
    ...base,id:"application-"+((page-1)*25+i),
   }));
   return responseFor(rows,201,9);
  });
  const output=await view();
  expect(output.status).toBe(200);
  expect(output.headers.get("X-Export-Omitted")).toBe("1");
  expect((await output.text())).toContain("1 additional authorized applicants");
  expect(m.read).toHaveBeenCalledTimes(8);
 });
 it("revocation between pages returns an error rather than a partial private CSV",async()=>{
  m.read.mockResolvedValueOnce(responseFor([base],30,2))
   .mockRejectedValueOnce(new Error("grant revoked mid export"));
  const output=await view();
  expect(output.status).toBe(400);
  expect(output.headers.get("Content-Type")).not.toContain("text/csv");
  expect(m.error).toHaveBeenCalledTimes(1);
 });
});