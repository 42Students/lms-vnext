import {describe,it,expect} from "vitest";
import {tpoApplicationFilterError} from "@/modules/placements/tpo-applications-url-guard";
const jobId="022a400d-47d5-4574-8b79-c98cba999000";
describe("TPO applicant filters reject invalid values before protected SQL",()=>{
 it("accepts defaults and a fully-typed valid selection",()=>{
  expect(tpoApplicationFilterError({},jobId)).toBeNull();
  expect(tpoApplicationFilterError({stage:"HOLD",page:"2",columns:"student,role",sort:"OLDEST",channel:"INTERNAL"},jobId)).toBeNull();
 });
 it("rejects unsupported stages, bad paging and large search without echoing them",()=>{
  for(const input of [{stage:"FORGED"},{page:"not-a-page"},{submittedWithin:"YEAR"},{search:"x".repeat(101)}]){
   const error=tpoApplicationFilterError(input,jobId);
   expect(error).toMatch(/Invalid/);expect(error).not.toContain("x".repeat(101));
  }
 });
 it("rejects repeated and tenant-forging query keys",()=>{
  expect(tpoApplicationFilterError({stage:["HOLD","REJECTED"]},jobId)).toMatch(/Repeated/);
  expect(tpoApplicationFilterError({collegeId:jobId},jobId)).toMatch(/Unsupported/);
 });
});
