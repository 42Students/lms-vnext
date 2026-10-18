import {describe,expect,it} from "vitest";
import {hrApplicantFilterSchema,hrApplicantPageBounds,hrOfferPageBounds,projectSharedApplicants,HR_APPLICANT_PAGE_SIZE,HR_OFFER_PAGE_SIZE} from "@/modules/placements/hr-job-applicants-model";

describe("HR-BREAK-applicants-01: recruiter shared-applicant journey",()=>{
 it("constrains applicant and offer filters before querying any applicant data",()=>{
  for(const input of [{stage:"OTHER"},{tab:"hidden"},{page:"0"},{page:"1.5"},{page:"10001"},
   {offerPage:"-1"},{offerState:"NOT_SHARED"},{roundId:"guess"},{applicant:"guess"},{extra:"other-college"}])
   expect(hrApplicantFilterSchema.safeParse(input).success).toBe(false);
  expect(hrApplicantFilterSchema.parse({tab:"interviews",page:"2",offerPage:"3"}))
   .toMatchObject({tab:"rounds",page:2,offerPage:3});
  expect(hrApplicantFilterSchema.parse({tab:"selections"}).tab).toBe("offers");
 });
 it("never advertises a phantom record on a stale page, and handles exact page boundaries",()=>{
  expect(HR_APPLICANT_PAGE_SIZE).toBe(25);
  expect(HR_OFFER_PAGE_SIZE).toBe(15);
  expect(hrApplicantPageBounds(1,0)).toMatchObject({first:0,last:0,pages:0});
  expect(hrApplicantPageBounds(2,25)).toMatchObject({first:0,last:0,pages:1});
  expect(hrApplicantPageBounds(2,26)).toMatchObject({first:26,last:26,pages:2});
  expect(hrOfferPageBounds(2,15)).toMatchObject({first:0,last:0,pages:1});
  expect(hrOfferPageBounds(2,16)).toMatchObject({first:16,last:16,pages:2});
 });
 it("shows withdrawn versus currently submitted rows without mutating incoming roster",()=>{
  const applied={id:"a",name:"A",role:"SDE",status:"SUBMITTED",screening:"SHORTLISTED",submittedAt:new Date("2026-10-01"),email:null};
  const withdrawn={...applied,id:"b",status:"WITHDRAWN"};
  const source=[applied,withdrawn];
  expect(projectSharedApplicants(source,"ALL").rows).toEqual(source);
  expect(projectSharedApplicants(source,"APPLIED").rows).toEqual([applied]);
  expect(projectSharedApplicants(source,"WITHDRAWN").rows).toEqual([withdrawn]);
  expect(projectSharedApplicants(source,"SHORTLISTED").counts).toMatchObject({all:2,withdrawn:1});
  expect(source).toHaveLength(2);
 });
});