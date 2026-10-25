import {describe,expect,it} from "vitest";
import {recruiterJoiningReportSchema,recruiterJoiningReportMessage}
 from "@/modules/placements/recruiter-joining-report-model";
describe("Joining outcome report for placement-cell verification",()=>{
 it("validates calendar dates including leap days",()=>{
  const draft={status:"JOINED" as const,reportedDate:"2028-02-29",reason:""};
  expect(recruiterJoiningReportSchema.safeParse(draft).success).toBe(true);
  expect(recruiterJoiningReportSchema.safeParse({...draft,reportedDate:"2027-02-29"}).success).toBe(false);
  expect(recruiterJoiningReportSchema.safeParse({...draft,reportedDate:""}).success).toBe(false);
 });
 it("requires a reason for did not join",()=>{
  expect(recruiterJoiningReportSchema.safeParse({
   status:"DID_NOT_JOIN",reason:"",reportedDate:"",
  }).success).toBe(false);
  expect(recruiterJoiningReportSchema.safeParse({
   status:"DID_NOT_JOIN",reason:"Candidate declined",reportedDate:"",
  }).success).toBe(true);
 });
 it("makes no claim that a recruiter report is an applied outcome",()=>{
  const message=recruiterJoiningReportMessage({
   offerId:"11111111-1111-4111-8111-111111111111",candidate:"Learner",
   drive:"Engineer",status:"JOINED",reportedDate:"2026-10-26",reason:"",
  });
  expect(message).toContain("for placement-cell verification");
  expect(message).toContain("not an applied outcome");
  expect(message).toContain("Offer reference:");
  expect(message).toContain("2026-10-26");
 });
});
