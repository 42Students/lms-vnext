import {describe,it,expect} from "vitest";
import {recruiterDriveRequestInputSchema,canRecruiterResubmit} from "@/modules/placements/recruiter-drive-request-model";
import {recruiterRequestUpdateSchema} from "@/modules/placements/recruiter-drive-request-service";
import {emptyHrDriveDraft} from "@/modules/placements/hr-drive-draft-model";
describe("REC-home-drives-21 registered formal recruiter request contract",()=>{
 it("accepts a typed request with idempotency token",()=>{
  const draft={...emptyHrDriveDraft(),title:"Graduate Engineer",description:"An engineering job for graduates",location:"Hyderabad"};
  expect(recruiterDriveRequestInputSchema.safeParse({collegeId:"550e8400-e29b-41d4-a716-446655440000",
   submissionId:"550e8400-e29b-41d4-a716-446655440001",draft}).success).toBe(true);
 });
 it("allows resubmit only while pending or sent back",()=>{
  expect(canRecruiterResubmit("REQUEST")).toBe(true);
  expect(canRecruiterResubmit("SENT_BACK")).toBe(true);
  expect(canRecruiterResubmit("REJECTED")).toBe(false);
 });
 it("resubmit requires a typed draft and original identity",()=>{
  expect(recruiterRequestUpdateSchema.safeParse({requestId:"bad",collegeId:"bad",action:"RESUBMIT",
   expectedUpdatedAt:"2026-10-17T12:00:00Z",draft:{}}).success).toBe(false);
 });
});
