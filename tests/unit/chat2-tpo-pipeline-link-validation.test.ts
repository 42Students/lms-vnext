import {describe,it,expect} from "vitest";
import {parseTpoApplicantPipelineLink,tpoApplicantPipelineResetHref} from "../../src/modules/placements/tpo-applicant-pipeline-model";
const jobId="11111111-1111-4111-8111-111111111111";
describe("TPO pipeline URL filters",()=>{
 it("accepts defaults and rejects unknown stage without opening data",()=>{
  expect(parseTpoApplicantPipelineLink({jobId}).success).toBe(true);
  expect(parseTpoApplicantPipelineLink({jobId,stage:"LEAKED"}).success).toBe(false);
  expect(parseTpoApplicantPipelineLink({jobId,page:"-4"}).success).toBe(false);
 });
 it("resets only the selected drive's applicants",()=>{
  expect(tpoApplicantPipelineResetHref(jobId)).toBe("/tpo/placements/jobs/"+jobId+"/applicants-pipeline");
 });
});
