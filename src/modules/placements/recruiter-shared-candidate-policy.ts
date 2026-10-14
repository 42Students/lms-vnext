/**
 * Defense-in-depth employer data disclosure policy. Scope authorization must
 * already have passed before any candidate read, and this policy additionally
 * prevents contact from inactive/private/unshortlisted learner records.
 */
export type RecruiterCandidateDisclosure = {
 companyId:string|null;
 jobCompanyId:string;
 jobCollegeId:string;
 membershipCollegeId:string;
 applicationStatus:string;
 screeningStatus:string;
 membershipStatus:string;
 userPlatformStatus:string;
};
export function isRecruiterSharedCandidateAllowed(input:RecruiterCandidateDisclosure) {
 return input.companyId!==null &&
   input.companyId===input.jobCompanyId &&
   input.jobCollegeId===input.membershipCollegeId &&
   input.applicationStatus==="SUBMITTED" &&
   input.screeningStatus==="SHORTLISTED" &&
   input.membershipStatus==="ACTIVE" &&
   input.userPlatformStatus==="ACTIVE";
}
