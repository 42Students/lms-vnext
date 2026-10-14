import {describe,it,expect} from "vitest";
import {tpoApplicantReviewSchema,canReviewApplicant,candidateScreeningPayload} from "@/modules/placements/tpo-applicant-review-model";
describe("TPO applicant review",()=>{
 it("permits submitted pending or hold only",()=>{
  expect(canReviewApplicant("SUBMITTED","PENDING")).toBe(true);
  expect(canReviewApplicant("SUBMITTED","HOLD")).toBe(true);
  expect(canReviewApplicant("WITHDRAWN","PENDING")).toBe(false);
  expect(canReviewApplicant("SUBMITTED","SHORTLISTED")).toBe(false);
 });
 it("separates private shortlist notes from candidate-visible rejection",()=>{
  const valid={confirmed:true as const,expectedUpdatedAt:"2026-10-14T14:00:00.123Z",
    decision:"SHORTLISTED" as const,note:"Meets the minimum requirements"};
  expect(candidateScreeningPayload(valid)).toMatchObject({candidateMessage:null,internalReason:valid.note});
  expect(candidateScreeningPayload({...valid,decision:"REJECTED"}))
    .toMatchObject({candidateMessage:valid.note,internalReason:null});
  expect(tpoApplicantReviewSchema.safeParse({...valid,confirmed:false}).success).toBe(false);
  expect(tpoApplicantReviewSchema.safeParse({...valid,collegeId:"forged"}).success).toBe(false);
  expect(tpoApplicantReviewSchema.parse({...valid,expectedUpdatedAt:"2026-10-14T19:30:00.123+05:30"})
   .expectedUpdatedAt).toBe(valid.expectedUpdatedAt);
 });
});
