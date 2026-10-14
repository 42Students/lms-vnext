import {describe,expect,it} from "vitest";
import {applicantDrawerReviewable,type TpoApplicantReviewSnapshot} from "@/modules/placements/tpo-applicant-review-drawer-model";
const app:TpoApplicantReviewSnapshot={id:"a",student:null,role:"Engineer",
 applicationStatus:"SUBMITTED",screeningStatus:"PENDING",screeningUpdatedAt:"2026-10-14T14:00:00Z",
 eligibilityStatus:"ELIGIBLE",channel:"INTERNAL",submittedAt:"2026-10-14T12:00:00Z"};
describe("TPO review drawer availability",()=>{
 it("requires a published drive, submitted pending/held applicant and a persisted token",()=>{
  expect(applicantDrawerReviewable("PUBLISHED",app)).toBe(true);
  expect(applicantDrawerReviewable("PUBLISHED",{...app,screeningStatus:"HOLD"})).toBe(true);
  expect(applicantDrawerReviewable("DRAFT",app)).toBe(false);
  expect(applicantDrawerReviewable("CLOSED",app)).toBe(false);
  expect(applicantDrawerReviewable("PUBLISHED",{...app,applicationStatus:"WITHDRAWN"})).toBe(false);
  expect(applicantDrawerReviewable("PUBLISHED",{...app,screeningUpdatedAt:null})).toBe(false);
  expect(applicantDrawerReviewable("PUBLISHED",{...app,screeningStatus:"REJECTED"})).toBe(false);
 });
});
