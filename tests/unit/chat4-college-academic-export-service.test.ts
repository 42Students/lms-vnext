import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RequestContext } from "@/modules/identity/context";

const mocks=vi.hoisted(()=>({semesters:vi.fn(),batches:vi.fn()}));
vi.mock("@/modules/academics/college-academic-directory-service",()=>({
 listCollegeSemesters:mocks.semesters,
 listCollegeBatches:mocks.batches,
}));

import { exportCollegeAcademicDirectory } from "@/modules/academics/college-academic-export-service";
import { COLLEGE_ACADEMIC_PAGE_SIZE } from "@/modules/academics/college-academic-directory-model";

const actor:RequestContext={
 user:{id:"admin",identityUid:"admin",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"member",collegeId:"11111111-1111-4111-8111-111111111111",
  organizationId:"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
};

const semester=(name:string)=>({
 name,termNumber:4,programName:"Computing",programCode:"CSE",
 totalCredits:24,isActive:true,mappedCourses:6,
});
const batch=(name:string)=>({
 name,code:"CSE-2099",status:"ACTIVE",programName:"Computing",programCode:"CSE",
 currentTermNumber:4,currentAcademicYearStart:2098,
 activeSections:2,activeEnrolledLearners:120,
});

beforeEach(()=>{
 mocks.semesters.mockReset();
 mocks.batches.mockReset();
});

describe("COL-academic-export-service-01 academic CSV export boundaries",()=>{
 it("rejects forbidden semester filters before any private read (credit bounds and forged page)",async()=>{
  for(const query of [
   {minimumCredits:30,maximumCredits:10},
   {creditState:"UNSET",minimumCredits:1},
   {page:2},
   {programId:"other-college"},
   {status:"SUSPENDED"},
   {yearStart:2098},
  ]){
   await expect(exportCollegeAcademicDirectory(actor,"SEMESTERS",query)).rejects.toBeDefined();
  }
  expect(mocks.semesters).not.toHaveBeenCalled();
  expect(mocks.batches).not.toHaveBeenCalled();
 });
 it("rejects impossible batch date/progression filters without a DB read",async()=>{
  for(const query of [
   {startOnOrAfter:"2099-12-31",startOnOrBefore:"2099-01-01"},
   {progression:"MISSING",currentTerm:3},
   {progression:"MISSING",yearStart:2098},
   {academicYearState:"UNRECORDED",yearStart:2098},
   {page:2},
   {termNumber:2},
  ]){
   await expect(exportCollegeAcademicDirectory(actor,"BATCHES",query)).rejects.toBeDefined();
  }
  expect(mocks.batches).not.toHaveBeenCalled();
 });
 it("paginates semesters under the same actor and normalized filter, with no query reset",async()=>{
  mocks.semesters
   .mockResolvedValueOnce({items:[semester("Semester 4")],total:2,totalPages:2})
   .mockResolvedValueOnce({items:[semester("\u2067=4+4")],total:2,totalPages:2});
  const result=await exportCollegeAcademicDirectory(actor,"SEMESTERS",{
   q:"  capstone  ",termNumber:"4",status:"ACTIVE",
  });
  expect(COLLEGE_ACADEMIC_PAGE_SIZE).toBe(25);
  expect(result.rows).toHaveLength(2);
  expect(result.truncated).toBe(false);
  expect(result.csv.startsWith("\uFEFF")).toBe(true);
  expect(result.csv).toContain("Semester 4");
  expect(result.csv).toContain('"' + "'" + "\u2067=4+4" + '"');
  expect(mocks.semesters).toHaveBeenCalledTimes(2);
  expect(mocks.semesters).toHaveBeenNthCalledWith(1,actor,expect.objectContaining({
   q:"capstone",termNumber:4,status:"ACTIVE",page:1,
  }));
  expect(mocks.semesters).toHaveBeenNthCalledWith(2,actor,expect.objectContaining({
   q:"capstone",termNumber:4,status:"ACTIVE",page:2,
  }));
  expect(mocks.batches).not.toHaveBeenCalled();
 });
 it("caps batch CSV at 1000 rows, stops before page 41 and discloses truncation",async()=>{
  mocks.batches.mockImplementation(async (_context:RequestContext,query:{page:number})=>({
   items:Array.from({length:25},(_,i)=>batch("Batch "+(query.page*25+i))),
   total:1250,totalPages:50,
  }));
  const result=await exportCollegeAcademicDirectory(actor,"BATCHES",{
   progression:"RECORDED",yearStart:"2098",status:"ACTIVE",
  });
  expect(result.cap).toBe(1000);
  expect(result.rows).toHaveLength(1000);
  expect(result.truncated).toBe(true);
  expect(result.csv).toContain("EXPORT TRUNCATED");
  expect(result.csv).toContain("Only the first 1000 matching records");
  expect(mocks.batches).toHaveBeenCalledTimes(40);
  expect(mocks.batches).toHaveBeenLastCalledWith(actor,expect.objectContaining({
   page:40,progression:"RECORDED",yearStart:2098,status:"ACTIVE",
  }));
  expect(mocks.semesters).not.toHaveBeenCalled();
 });
 it("propagates a scoped directory rejection rather than returning an unrelated tenant",async()=>{
  mocks.semesters.mockRejectedValueOnce(new Error("FORBIDDEN"));
  await expect(exportCollegeAcademicDirectory(actor,"SEMESTERS",{}))
   .rejects.toThrow("FORBIDDEN");
  expect(mocks.semesters).toHaveBeenCalledTimes(1);
  expect(mocks.batches).not.toHaveBeenCalled();
 });
});
