/** Search should appear when the authorized shared-applicant collection exceeds
 * the legacy eight-row threshold, not only when the current 25-row page does.
 * Keep it accessible while an active query is filtered to eight or fewer.
 * Counts are computed after recruiter grant/tenant scoping by the caller. */
export function shouldShowRecruiterApplicantSearch(sharedCount:number,search:string):boolean {
 return (Number.isSafeInteger(sharedCount)&&sharedCount>8)||search.trim().length>0;
}
