import {describe,expect,it} from "vitest";
import {isRecruiterSharedCandidateAllowed} from "@/modules/placements/recruiter-shared-candidate-policy";
const eligible={
 companyId:"company-a",jobCompanyId:"company-a",jobCollegeId:"college-a",membershipCollegeId:"college-a",
 applicationStatus:"SUBMITTED",screeningStatus:"SHORTLISTED",membershipStatus:"ACTIVE",userPlatformStatus:"ACTIVE",
};
describe("recruiter shortlisted learner privacy gate",()=>{
 it("allows only exact company and college shortlisted active applicants",()=>{
  expect(isRecruiterSharedCandidateAllowed(eligible)).toBe(true);
  expect(isRecruiterSharedCandidateAllowed({...eligible,companyId:"company-b"})).toBe(false);
  expect(isRecruiterSharedCandidateAllowed({...eligible,membershipCollegeId:"college-b"})).toBe(false);
  expect(isRecruiterSharedCandidateAllowed({...eligible,screeningStatus:"PENDING"})).toBe(false);
  expect(isRecruiterSharedCandidateAllowed({...eligible,screeningStatus:"REJECTED"})).toBe(false);
  expect(isRecruiterSharedCandidateAllowed({...eligible,applicationStatus:"WITHDRAWN"})).toBe(false);
  expect(isRecruiterSharedCandidateAllowed({...eligible,membershipStatus:"SUSPENDED"})).toBe(false);
  expect(isRecruiterSharedCandidateAllowed({...eligible,userPlatformStatus:"DISABLED"})).toBe(false);
  expect(isRecruiterSharedCandidateAllowed({...eligible,companyId:null})).toBe(false);
 });
});
