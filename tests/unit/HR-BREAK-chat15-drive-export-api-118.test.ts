import {beforeEach,describe,expect,it,vi} from "vitest";
const m=vi.hoisted(()=>({ctx:vi.fn(),search:vi.fn(),error:vi.fn()}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:m.ctx}));
vi.mock("@/modules/placements/recruiter-drive-search-service",()=>({
 searchOwnRecruiterDrives:m.search,
}));
vi.mock("@/lib/api-error",()=>({apiErrorResponse:m.error}));
import {GET} from "@/app/api/placements/recruiter/drives/export/route";
const college="123e4567-e89b-42d3-a456-426614174001";
const actor={user:{id:"recruiter",platformStatus:"ACTIVE",systemRoles:[]},
 recruiter:{userId:"recruiter",status:"ACTIVE",companyId:"firm",
  grants:[{collegeId:college,companyRelationshipId:"relationship"}]}};
const req=(query:string)=>new Request("https://lms.example/api/placements/recruiter/drives/export?"+query);
describe("HR-DRIVES-EXPORT-118 authorized job CSV query boundary",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();m.ctx.mockResolvedValue(actor);m.search.mockResolvedValue({rows:[],total:0});
  m.error.mockImplementation(()=>Response.json({error:"TEMP_UNAVAILABLE"},{status:503}));
 });
 it("duplicate college and conflicting view terms are denied before actor scope",async()=>{
  for(const q of ["collegeId="+college+"&collegeId="+college,"view=OPEN&view=CLOSED",
   "collegeId="+college+"&includePrivate=true"]){
   const response=await GET(req(q));
   expect(response.status).toBe(400);
  }
  expect(m.ctx).not.toHaveBeenCalled();expect(m.search).not.toHaveBeenCalled();
 });
 it("a swapped recruiter identity is forbidden before an employer job export is searched",async()=>{
  m.ctx.mockResolvedValue({...actor,recruiter:{...actor.recruiter,userId:"different"}});
  const result=await GET(req("collegeId="+college));
  expect(result.status).toBe(404);
  expect(m.search).not.toHaveBeenCalled();
 });
 it("an ungranted college link never reaches the job search",async()=>{
  const response=await GET(req("collegeId=223e4567-e89b-42d3-a456-426614174002"));
  expect(response.status).toBe(404);
  expect(m.search).not.toHaveBeenCalled();
 });
 it("exact-grant empty result emits a private no-store CSV through the bounded job search",async()=>{
  const result=await GET(req("collegeId="+college+"&q=Engineer"));
  expect(result.status).toBe(200);
  expect(result.headers.get("Cache-Control")).toBe("private, no-store");
  expect(result.headers.get("X-Export-Capped")).toBe("false");
  expect(m.search).toHaveBeenCalledWith(actor,college,expect.objectContaining({
   collegeId:college,q:"Engineer",
  }),expect.any(Date),expect.objectContaining({pageSize:expect.any(Number)}));
 });
 it("SQL outages map to safe JSON rather than an unhandled download response",async()=>{
  m.search.mockRejectedValue(new Error("private table failed"));
  const result=await GET(req("collegeId="+college));
  expect(result.status).toBe(503);
  expect((await result.text())).not.toContain("private table");
 });
});