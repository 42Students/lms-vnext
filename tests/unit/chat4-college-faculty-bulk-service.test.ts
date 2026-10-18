import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RequestContext } from "@/modules/identity/context";

const mocks=vi.hoisted(()=>({scope:vi.fn(),onboard:vi.fn()}));
vi.mock("@/modules/permissions/acting-college",()=>({
 resolveActingCollege:mocks.scope,
}));
vi.mock("@/modules/people/runtime",()=>({
 onboardPersonWithRuntime:mocks.onboard,
}));
import { importFacultyCsv } from "@/modules/people/faculty-bulk-import-service";

const collegeId="11111111-1111-4111-8111-111111111111";
const org="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const actor:RequestContext={
 user:{id:"admin",identityUid:"admin",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"member",collegeId,organizationId:org,status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
};
const csv=(...rows:string[])=>"First Name,Last Name,Mobile Number,Email\n"+rows.join("\n");
beforeEach(()=>{
 mocks.scope.mockReset();mocks.onboard.mockReset();
 mocks.scope.mockResolvedValue({collegeId,organizationId:org});
 mocks.onboard.mockResolvedValue({membership:{id:"created"}});
});
describe("COL-people-faculty-bulk-01 confirmed, tenant-scoped batch imports",()=>{
 it("rejects absent explicit consent, unknown fields and malformed CSV before onboarding",async()=>{
  for(const raw of [
   {collegeId,csv:csv("Jane,Smith,9876543210,jane@example.edu")},
   {collegeId,csv:csv("Jane,Smith,9876543210,jane@example.edu"),confirmed:false},
   {collegeId,csv:csv("Jane,Smith,9876543210,jane@example.edu"),confirmed:true,role:"SUPER_ADMIN"},
   {collegeId,csv:"not enough columns",confirmed:true},
  ]){
   await expect(importFacultyCsv(actor,raw)).rejects.toBeDefined();
  }
  expect(mocks.onboard).not.toHaveBeenCalled();
 });
 it("forbids a forged request college before parsing or persisting foreign membership rows",async()=>{
  const other="22222222-2222-4222-8222-222222222222";
  await expect(importFacultyCsv(actor,{collegeId:other,confirmed:true,
   csv:csv("Jane,Smith,9876543210,jane@example.edu")})).rejects.toThrow("COLLEGE_SCOPE_MISMATCH");
  expect(mocks.onboard).not.toHaveBeenCalled();
 });
 it("normalizes Indian phone numbers, creates only faculty roles and skips duplicate mobiles",async()=>{
  const result=await importFacultyCsv(actor,{collegeId,confirmed:true,csv:csv(
   "Jane,Smith,9876543210,jane@example.edu",
   "Jane,Smith,+919876543210,jane@example.edu",
   "Ravi,Patel,9876543211,ravi@example.edu",
  )});
  expect(result).toMatchObject({total:3,created:2,skipped:1,failed:0});
  expect(result.results.map(row=>row.status)).toEqual(["CREATED","SKIPPED","CREATED"]);
  expect(result.results[1]?.message).toContain("Duplicate mobile");
  expect(mocks.onboard).toHaveBeenCalledTimes(2);
  expect(mocks.onboard).toHaveBeenNthCalledWith(1,actor,{
   collegeId,displayName:"Jane Smith",phoneE164:"+919876543210",
   email:"jane@example.edu",roles:["FACULTY"],
  });
  expect(mocks.onboard).toHaveBeenNthCalledWith(2,actor,{
   collegeId,displayName:"Ravi Patel",phoneE164:"+919876543211",
   email:"ravi@example.edu",roles:["FACULTY"],
  });
 });
 it("reports per-row identity collisions safely and continues later rows without leaking SQL",async()=>{
  mocks.onboard.mockRejectedValueOnce(Object.assign(new Error("internal"),{code:"IDENTITY_COLLISION"}))
   .mockRejectedValueOnce(new Error("private sql state 23505"))
   .mockResolvedValueOnce({membership:{id:"created"}});
  const result=await importFacultyCsv(actor,{collegeId,confirmed:true,csv:csv(
   "First,Student,9876543210,first@example.edu",
   "Second,Student,9876543211,second@example.edu",
   "Third,Student,9876543212,third@example.edu",
  )});
  expect(result).toMatchObject({total:3,created:1,skipped:0,failed:2});
  expect(result.results[0]?.message).toContain("already belongs to another identity");
  expect(result.results[1]?.message).toContain("Check the identity and college permissions");
  expect(JSON.stringify(result)).not.toContain("private sql state");
 });
});
