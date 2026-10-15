/** Issuance is serialized per job and bounded to deter public-token oversharing. */
export const MAX_ACTIVE_COMPANY_APPLICANT_SHARES=10;
export function canIssueCompanyApplicantShare(activeCount:number){
 return Number.isSafeInteger(activeCount)&&activeCount>=0&&
  activeCount<MAX_ACTIVE_COMPANY_APPLICANT_SHARES;
}
