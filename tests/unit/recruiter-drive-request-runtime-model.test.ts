import {describe,it,expect} from "vitest";
import {recruiterDriveRequestInputSchema,canRecruiterResubmit} from "@/modules/placements/recruiter-drive-request-model";
import {recruiterRequestUpdateSchema} from "@/modules/placements/recruiter-drive-request-model";
import {emptyHrDriveDraft} from "@/modules/placements/hr-drive-draft-model";
describe("REC-home-drives-21 registered formal recruiter request contract",()=>{
 it("accepts a typed request with idempotency token",()=>{
  const draft={...emptyHrDriveDraft(),title:"Graduate Engineer",description:"An engineering job for graduates",location:"Hyderabad",ctcLpa:"10"};
  expect(recruiterDriveRequestInputSchema.safeParse({collegeId:"550e8400-e29b-41d4-a716-446655440000",
   submissionId:"550e8400-e29b-41d4-a716-446655440001",draft}).success).toBe(true);
 });
 it("allows resubmit only while pending or sent back",()=>{
  expect(canRecruiterResubmit("REQUEST")).toBe(true);
  expect(canRecruiterResubmit("SENT_BACK")).toBe(true);
  expect(canRecruiterResubmit("REJECTED")).toBe(false);
 });
 it("separates in-review edits and sent-back resubmission",()=>{
  const base={requestId:"550e8400-e29b-41d4-a716-446655440000",
   collegeId:"550e8400-e29b-41d4-a716-446655440001",
   expectedUpdatedAt:"2026-10-17T12:00:00Z"};
  const draft={...emptyHrDriveDraft(),title:"Graduate Engineer",
   description:"An engineering job for graduates",location:"Hyderabad",ctcLpa:"10"};
  expect(recruiterRequestUpdateSchema.safeParse({...base,action:"EDIT",draft}).success).toBe(true);
  expect(recruiterRequestUpdateSchema.safeParse({...base,action:"RESUBMIT",draft}).success).toBe(true);
  // The update service must not interpret a missing draft as a complete edit.
  expect(recruiterRequestUpdateSchema.safeParse({...base,action:"EDIT"}).success).toBe(false);
  expect(recruiterRequestUpdateSchema.safeParse({...base,action:"RESUBMIT"}).success).toBe(false);
  expect(recruiterRequestUpdateSchema.safeParse({...base,action:"CANCEL"}).success).toBe(true);
  expect(recruiterRequestUpdateSchema.safeParse({...base,action:"CANCEL",draft}).success).toBe(false);
 });
 it("resubmit requires a typed draft and original identity",()=>{
  expect(recruiterRequestUpdateSchema.safeParse({requestId:"bad",collegeId:"bad",action:"RESUBMIT",
   expectedUpdatedAt:"2026-10-17T12:00:00Z",draft:{}}).success).toBe(false);
 });
});
