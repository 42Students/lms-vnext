import {describe,it,expect} from "vitest";
import {recruiterSelectionListInputSchema,recruiterSelectionRangeWarning}
 from "@/modules/placements/recruiter-selection-list-model";
const uuid="550e8400-e29b-41d4-a716-446655440000";
describe("REC-home-drives-51 staged recruiter selection list",()=>{
 it("requires a unique applicant picker, idempotency nonce, offer kind and consent",()=>{
  const input={jobId:uuid,collegeId:uuid,submissionId:uuid,kind:"OFFER",
   ctcLpa:"8.5",applicationIds:[uuid]};
  expect(recruiterSelectionListInputSchema.safeParse(input).success).toBe(true);
  expect(recruiterSelectionListInputSchema.safeParse({...input,applicationIds:[uuid,uuid]}).success).toBe(false);
  expect(recruiterSelectionListInputSchema.safeParse({...input,applicationIds:[]}).success).toBe(false);
  expect(recruiterSelectionListInputSchema.safeParse({...input,kind:"CANCELLED"}).success).toBe(false);
 });
 it("warns when CTC differs from the published annual range",()=>{
  expect(recruiterSelectionRangeWarning("6",700000,1200000)).toContain("outside");
  expect(recruiterSelectionRangeWarning("9",700000,1200000)).toBe(null);
 });
});
