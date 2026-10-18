import {afterEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {bulkImportColleges} from "@/modules/colleges/bulk-import-service";

const {createCollege,existingCodes}=vi.hoisted(()=>({
 createCollege:vi.fn(),
 existingCodes:{current:[] as Array<{code:string}>},
}));
vi.mock("@/modules/colleges/service",()=>({
 createCollege,
 CollegeServiceError:class CollegeServiceError extends Error {
  constructor(public readonly code:string){super(code);this.name="CollegeServiceError";}
 },
}));
vi.mock("@/db/client",()=>({
 getDb:()=>({
  select:()=>({from:()=>({where:async()=>existingCodes.current})}),
 }),
}));

const organizationId="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const otherOrganizationId="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const ctx:RequestContext={
 user:{id:"actor",identityUid:"actor",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
 membership:null,adminScope:{organizationId,collegeId:null},
};
const csv=(...rows:string[])=>"name,code,city,state,country\n"+rows.join("\n");

afterEach(()=>{createCollege.mockReset();existingCodes.current=[];});

describe("Super Admin bulk college import persistence and failure containment",()=>{
 it("SA-colleges-bulk-IMPORT-01 skips current tenant codes and imports only new normalized code",async()=>{
  existingCodes.current=[{code:"EXISTS"}];
  createCollege.mockImplementation(async (_ctx:RequestContext,input:{code:string})=>({code:input.code}));
  const result=await bulkImportColleges(ctx,{organizationId,csv:csv(
   "Existing,exists,City,State,Country",
   "New Tenant,NEW-CODE,Vijayawada,AP,India",
  )});
  expect(result).toMatchObject({created:1,skipped:1,failed:0,results:[
   {line:2,code:"exists",status:"SKIPPED"},
   {line:3,code:"NEW-CODE",status:"CREATED"},
  ]});
  expect(createCollege).toHaveBeenCalledTimes(1);
  expect(createCollege).toHaveBeenCalledWith(ctx,{
   organizationId,name:"New Tenant",code:"NEW-CODE",city:"Vijayawada",state:"AP",country:"India",
  });
 });

 it("SA-colleges-bulk-IMPORT-02 late unique index conflicts are retry-safe skips and unknown errors do not leak SQL details",async()=>{
  // Structural type check derives duplicate code from the same error class
  // the service imports, without relying on a real connection failure.
  const {CollegeServiceError}=await import("@/modules/colleges/service");
  createCollege.mockRejectedValueOnce(new CollegeServiceError("COLLEGE_CODE_CONFLICT"))
   .mockRejectedValueOnce(new Error("sensitive postgres SQLSTATE and phone"));
  const result=await bulkImportColleges(ctx,{organizationId,csv:csv(
   "Raced,RACED,,,","Failed,FAIL,,,"
  )});
  expect(result).toMatchObject({created:0,skipped:1,failed:1});
  expect(result.results[0]).toMatchObject({status:"SKIPPED",message:"College code already exists."});
  expect(result.results[1]).toMatchObject({status:"FAILED",message:"College could not be created."});
  expect(JSON.stringify(result)).not.toContain("sensitive postgres");
 });

 it("SA-colleges-bulk-IMPORT-03 refuses forged org scope, wrong role, disabled root and unknown request fields before any writes",async()=>{
  for(const [context,body] of [
   [ctx,{organizationId:otherOrganizationId,csv:csv("Foreign,NOPE,,,")}],
   [{...ctx,user:{...ctx.user,platformStatus:"DISABLED"}},{organizationId,csv:csv("Disabled,NOPE,,,")}],
   [{...ctx,user:{...ctx.user,systemRoles:[] as []}},{organizationId,csv:csv("No role,NOPE,,,")}],
   [ctx,{organizationId,csv:csv("Unexpected,NOPE,,,"),collegeId:"forged"}],
  ] as const){
   await expect(bulkImportColleges(context as RequestContext,body)).rejects.toBeDefined();
  }
  expect(createCollege).not.toHaveBeenCalled();
 });
});
