import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RequestContext } from "@/modules/identity/context";

const mocks=vi.hoisted(()=>({onboard:vi.fn(),facultyProfile:vi.fn()}));
vi.mock("@/modules/people/runtime",()=>({
 onboardPersonWithRuntime:mocks.onboard,
 upsertFacultyProfileWithRuntime:mocks.facultyProfile,
}));
import { FACULTY_CSV_COLUMNS,runCollegeFacultyCsv } from "@/modules/people/college-faculty-csv-service";

const collegeId="11111111-1111-4111-8111-111111111111";
const org="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const actor:RequestContext={
 user:{id:"college-admin",identityUid:"college-admin",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"actor-member",collegeId,organizationId:org,status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
};
const csv=(...rows:string[])=>FACULTY_CSV_COLUMNS.join(",")+"\n"+rows.join("\n");
beforeEach(()=>{
 mocks.onboard.mockReset();mocks.facultyProfile.mockReset();
 mocks.onboard.mockResolvedValue({membership:{id:"faculty-member"}});
 mocks.facultyProfile.mockResolvedValue(undefined);
});

describe("COL-people-faculty-csv-01 registered faculty import validation and safe partial outcomes",()=>{
 it("never creates identities during a preview, even with valid faculty rows",async()=>{
  const result=await runCollegeFacultyCsv(actor,{action:"PREVIEW",csv:csv(
   "Jane,Smith,9876543210,jane@example.edu,professor",
   "Ravi,Patel,+919876543211,ravi@example.edu,Associate Professor",
  )});
  expect(result).toMatchObject({preview:true,valid:2,invalid:0,structuralErrors:[]});
  expect(result.results).toHaveLength(2);
  expect(result.results.map(row=>row.status)).toEqual(["VALID","VALID"]);
  expect(mocks.onboard).not.toHaveBeenCalled();
  expect(mocks.facultyProfile).not.toHaveBeenCalled();
 });
 it("denies disabled College Admin or an ordinary learner before importing",async()=>{
  for(const bad of [
   {...actor,user:{...actor.user,platformStatus:"DISABLED" as const}},
   {...actor,membership:{...actor.membership!,roles:["LEARNER" as const]}},
  ]){
   await expect(runCollegeFacultyCsv(bad,{action:"IMPORT",confirm:true,csv:csv(
    "Jane,Smith,9876543210,jane@example.edu,Professor",
   )})).rejects.toBeDefined();
  }
  expect(mocks.onboard).not.toHaveBeenCalled();
 });
 it("refuses unexpected request fields and import without explicit confirmation",async()=>{
  const data=csv("Jane,Smith,9876543210,jane@example.edu,Professor");
  for(const raw of [
   {action:"IMPORT",csv:data},
   {action:"IMPORT",csv:data,confirm:false},
   {action:"PREVIEW",csv:data,collegeId:"foreign"},
  ]){
   await expect(runCollegeFacultyCsv(actor,raw)).rejects.toBeDefined();
  }
  expect(mocks.onboard).not.toHaveBeenCalled();
 });
 it("produces row-specific duplicate and invalid mobile/email/type errors without side effects",async()=>{
  const result=await runCollegeFacultyCsv(actor,{action:"PREVIEW",csv:csv(
   "Jane,Smith,9876543210,Jane@Example.edu,Professor",
   "J,A,9876543210,jane@example.edu,UNKNOWN",
   "Ravi,Patel,invalid,bad-email,Assistant Professor",
  )});
  expect(result).toMatchObject({preview:true,valid:1,invalid:2});
  expect(result.results[1]?.detail).toContain("DUPLICATE_MOBILE_IN_FILE");
  expect(result.results[1]?.detail).toContain("DUPLICATE_EMAIL_IN_FILE");
  expect(result.results[1]?.detail).toContain("FACULTY_TYPE_UNKNOWN");
  expect(result.results[2]?.detail).toContain("MOBILE_INVALID");
  expect(result.results[2]?.detail).toContain("EMAIL_INVALID");
  expect(mocks.onboard).not.toHaveBeenCalled();
 });
 it("caps import previews at 500 rows before any identity creation",async()=>{
  const rows=Array.from({length:501},(_,i)=>
   "Jane,Smith,"+String(1000000000+i)+",,Professor");
  const result=await runCollegeFacultyCsv(actor,{action:"PREVIEW",csv:csv(...rows)});
  expect(result).toMatchObject({preview:true,structuralErrors:["ROW_LIMIT_EXCEEDED"]});
  expect(mocks.onboard).not.toHaveBeenCalled();
 });
 it("imports normalized one-college faculty role and legacy employment type exactly once",async()=>{
  const result=await runCollegeFacultyCsv(actor,{action:"IMPORT",confirm:true,csv:csv(
   "Jane,Smith,9876543210,jane@example.edu,professor",
  )});
  expect(result).toMatchObject({preview:false,valid:1,invalid:0});
  expect(result.results[0]).toMatchObject({
   row:2,status:"IMPORTED",membershipId:"faculty-member",detail:"Faculty registered",
  });
  expect(mocks.onboard).toHaveBeenCalledOnce();
  expect(mocks.onboard).toHaveBeenCalledWith(actor,{
   collegeId,displayName:"Jane Smith",phoneE164:"+919876543210",
   email:"jane@example.edu",roles:["FACULTY"],
  });
  expect(mocks.facultyProfile).toHaveBeenCalledWith(actor,"faculty-member",{
   primaryDepartmentId:null,employmentType:"Professor",academicTitle:null,
  });
 });
 it("does not echo private storage errors after partial faculty profile or identity failure",async()=>{
  mocks.facultyProfile.mockRejectedValueOnce(new Error("private SQL details"));
  mocks.onboard.mockRejectedValueOnce(new Error("internal identity provider secret"))
   .mockResolvedValueOnce({membership:{id:"partial-member"}});
  const result=await runCollegeFacultyCsv(actor,{action:"IMPORT",confirm:true,csv:csv(
   "First,User,9876543210,first@example.edu,Professor",
   "Second,User,9876543211,second@example.edu,Professor",
  )});
  expect(result.results).toHaveLength(2);
  expect(result.results[0]?.status).toBe("FAILED");
  expect(result.results[1]).toMatchObject({status:"PARTIAL",membershipId:"partial-member"});
  expect(JSON.stringify(result)).not.toContain("private SQL details");
  expect(JSON.stringify(result)).not.toContain("internal identity provider secret");
 });
});
