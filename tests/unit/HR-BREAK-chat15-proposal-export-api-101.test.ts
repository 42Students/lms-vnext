import {beforeEach,describe,expect,it,vi} from "vitest";
const m=vi.hoisted(()=>({ctx:vi.fn(),list:vi.fn(),error:vi.fn()}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:m.ctx}));
vi.mock("@/lib/api-error",()=>({apiErrorResponse:m.error}));
vi.mock("@/modules/placements/hr-drive-proposal-history-service",()=>({
 listHrDriveProposals:m.list,
}));
import {GET} from "@/app/api/placements/recruiter/drives/proposals/export/route";
const college="123e4567-e89b-42d3-a456-426614174001";
const actor={user:{id:"recruiter",platformStatus:"ACTIVE",systemRoles:[]},
 recruiter:{userId:"recruiter",status:"ACTIVE",companyId:"company",grants:[]}};
const url=(query:string)=>new Request("https://lms.example/api/placements/recruiter/drives/proposals/export?"+query);
describe("HR-PROPOSAL-API-101 employer discussion export",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();m.ctx.mockResolvedValue(actor);
  m.error.mockImplementation(()=>Response.json({error:"UNAVAILABLE"},{status:503}));
  m.list.mockResolvedValue({status:"READY",items:[],collegeId:college,page:1,pages:1,total:0});
 });
 it("forbids expired and identity-swapped recruiter grants before reading private history",async()=>{
  for(const ctx of [
   {...actor,user:{...actor.user,platformStatus:"DISABLED"}},
   {...actor,recruiter:{...actor.recruiter,userId:"swapped"}},
  ]){
   m.ctx.mockResolvedValueOnce(ctx);
   const response=await GET(url("collegeId="+college));
   expect(response.status).toBe(403);
  }
  expect(m.list).not.toHaveBeenCalled();
 });
 it("rejects unexpected or duplicate GET filters with no history query",async()=>{
  for(const query of ["collegeId="+college+"&collegeId="+college,
   "collegeId="+college+"&private=1","collegeId="+college+"&page=0"]){
   const response=await GET(url(query));
   expect(response.status).toBe(400);
  }
  expect(m.list).not.toHaveBeenCalled();
 });
 it("exports only the authorized current page with no-store and discussion-only metadata",async()=>{
  m.list.mockResolvedValue({status:"READY",collegeId:college,page:2,pages:2,
   items:[{referenceId:"proposal",title:"Software Engineer",
    createdAt:new Date("2099-05-01T00:00:00Z")}],total:21});
  const response=await GET(url("collegeId="+college+"&page=2"));
  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(response.headers.get("X-Export-Scope")).toBe("CURRENT_PAGE");
  expect(response.headers.get("X-Export-Page")).toBe("2");
  const csv=await response.text();
  expect(csv).toContain("DISCUSSION_ONLY");
  expect(csv).not.toContain("Applicant phone");
  expect(m.list).toHaveBeenCalledWith(actor,expect.objectContaining({collegeId:college,page:2}));
 });
 it("grant revocation during service lookup never returns private CSV",async()=>{
  m.list.mockResolvedValue({status:"NO_ACCESS",items:[],collegeId:null});
  const response=await GET(url("collegeId="+college));
  expect(response.status).toBe(403);
  expect(response.headers.get("Content-Type")??"").not.toContain("text/csv");
 });
 it("provider outage maps to sanitized error JSON instead of leaking a rejected promise",async()=>{
  m.list.mockRejectedValue(new Error("relation private_table timed out"));
  const response=await GET(url("collegeId="+college));
  expect(response.status).toBe(503);
  expect(await response.json()).toEqual({error:"UNAVAILABLE"});
  expect(m.error).toHaveBeenCalledTimes(1);
 });
});