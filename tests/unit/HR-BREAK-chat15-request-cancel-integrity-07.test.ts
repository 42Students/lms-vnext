import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {recruiterRequestUpdateSchema}
 from "@/modules/placements/recruiter-drive-request-model";
import {emptyHrDriveDraft} from "@/modules/placements/hr-drive-draft-model";

const requestId="123e4567-e89b-42d3-a456-426614174001";
const collegeId="123e4567-e89b-42d3-a456-426614174002";
const token="2099-01-01T10:00:00.123+05:30";
const draft={...emptyHrDriveDraft(),title:"Graduate engineer",ctcLpa:"8"};
const command={requestId,collegeId,expectedUpdatedAt:token};
describe("HR-REQUEST-CANCEL-INTEGRITY-07 preserve immutable submitted request terms",()=>{
 it("accepts cancel only with identity/version; never a hidden draft rewrite",()=>{
  expect(recruiterRequestUpdateSchema.safeParse({
   ...command,action:"CANCEL",
  }).success).toBe(true);
  for(const candidate of [
   {...command,action:"CANCEL",draft},
   {...command,action:"CANCEL",draft:{...draft,title:"Another role"}},
   {...command,action:"CANCEL",draft:emptyHrDriveDraft()},
   {...command,action:"CANCEL",sourceJobId:requestId},
  ])expect(recruiterRequestUpdateSchema.safeParse(candidate).success).toBe(false);
 });
 it("requires complete validated details for edit and returned-to-recruiter resubmission",()=>{
  for(const action of ["EDIT","RESUBMIT"] as const){
   expect(recruiterRequestUpdateSchema.safeParse({
    ...command,action,draft,
   }).success).toBe(true);
   expect(recruiterRequestUpdateSchema.safeParse({...command,action}).success).toBe(false);
   expect(recruiterRequestUpdateSchema.safeParse({
    ...command,action,draft:emptyHrDriveDraft(),
   }).success).toBe(false);
  }
 });
 it("rejects stale, tenant-forged and unrecognized request action data",()=>{
  for(const mutation of [
   {...command,action:"CANCEL",expectedUpdatedAt:"not-iso"},
   {...command,action:"CANCEL",collegeId:"another-college"},
   {...command,action:"PUBLISH"},
   {...command,action:"CANCEL",overrideStatus:"APPROVED"},
  ])expect(recruiterRequestUpdateSchema.safeParse(mutation).success).toBe(false);
 });
 it("service parses the strict action schema before opening a transaction",()=>{
  const service=readFileSync(join(process.cwd(),
   "src/modules/placements/recruiter-drive-request-service.ts"),"utf8");
  const method=service.slice(service.indexOf("export async function updateOwnRecruiterDriveRequest"));
  const validation=method.indexOf("recruiterRequestUpdateSchema.parse(raw)");
  const transaction=method.indexOf("getDb().transaction");
  expect(validation).toBeGreaterThan(-1);
  expect(transaction).toBeGreaterThan(validation);
  expect(method).toContain('if(input.action==="CANCEL" && !["REQUEST","SENT_BACK"].includes(original.status))');
  expect(method).toContain('updatedAt:sql`greatest(clock_timestamp(),');
 });
});
