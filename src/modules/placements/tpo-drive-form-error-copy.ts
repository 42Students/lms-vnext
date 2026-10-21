import {FriendlyFetchError} from "@/lib/api-fetch";

const DRIVE_ERRORS: Readonly<Record<string,string>> = {
  PLACEMENT_COMPANY_IDENTITY_CONFLICT: "This company may already be listed. Pick the company from the list before continuing.",
  PLACEMENT_JOB_NOT_PUBLISHABLE: "Review the drive details and fix the missing information before publishing.",
  PLACEMENT_JOB_STALE: "This drive changed while you were working. Refresh and try again.",
  PLACEMENT_JOB_INVALID_CTC_RANGE: "Maximum CTC must be greater than or equal to minimum CTC.",
  PLACEMENT_COMPANY_RELATIONSHIP_NOT_FOUND: "Pick the company from the list before continuing.",
  PLACEMENT_SEASON_REQUIRED: "Start an active placement season before creating a drive.",
  PLACEMENT_SEASON_NOT_ACTIVE: "The placement season is not active.",
  PLACEMENT_JOB_NOT_FOUND: "We could not find this drive. Go back to Drives and open it again.",
  PLACEMENT_JOB_READ_ONLY: "This drive can no longer be edited.",
  PLACEMENT_JOB_NOT_EDITABLE: "This drive can no longer be edited.",
  PLACEMENT_JOB_PREVIEW_STALE: "The drive changed while you were reviewing it. Reload the preview before confirming.",
  PLACEMENT_JOB_INVALID_DEADLINE: "Set a future application deadline before publishing.",
  PLACEMENT_JOB_EXTERNAL_URL_REQUIRED: "Add a valid HTTPS employer application link before publishing.",
  PLACEMENT_ROLE_OPTION_REQUIRED: "Add at least one role before publishing.",
  PLACEMENT_ROLE_OPTION_PRIMARY_REQUIRED: "Save a primary role before continuing.",
  PLACEMENT_ROLE_OPTION_DUPLICATE: "This drive already has a role with that title.",
  PLACEMENT_VERIFIED_MARKS_REQUIRED:"Verified marks only: enter marks verified by your college.",
  PLACEMENT_MARKS_NOT_VERIFIED:"These marks are missing or not verified by your college. Verify them before publishing an eligibility rule that requires verified marks.",
  PLACEMENT_ELIGIBILITY_POLICY_LOCKED: "Eligibility can no longer be changed for this drive.",
  PLACEMENT_ROUND_JOB_READ_ONLY: "Rounds cannot be changed on this drive.",
  PLACEMENT_ROUND_STALE: "A round changed while you were working. Refresh and try again.",
};

const FALLBACK = "We could not save this drive. Check your drafts and try again.";

/** TPO-drives-R05: never echo validation payload text or internal Zod paths. */
const DRIVE_FIELD_LABELS: Readonly<Record<string,string>> = {
  companyRelationshipId:"the company",
  companyName:"the company name",
  title:"the job title",
  description:"the job description",
  openings:"the number of openings",
  minimumAnnualCtcInr:"minimum CTC",
  maximumAnnualCtcInr:"maximum CTC",
  fixedCtcLpa:"fixed CTC",
  variableCtcLpa:"variable CTC",
  stipendPerMonthInr:"monthly stipend",
  applicationDeadline:"the application deadline",
  externalApplicationUrl:"the employer application link",
  minCgpa:"minimum CGPA",
  requireVerifiedEvidence:"Verified marks only",
  verifiedMarksOnly:"Verified marks only",
  minPctThroughout:"percentage throughout",
  allowedPassingYears:"passing years",

};


/** TPO-drives-44: translate known server codes without exposing machine details. */
export function tpoDriveFormErrorMessage(reason:unknown):string{
  if(reason instanceof FriendlyFetchError){
    if(reason.code&&DRIVE_ERRORS[reason.code])return DRIVE_ERRORS[reason.code];
    if(reason.code==="PLACEMENT_ELIGIBILITY_EVIDENCE_MISSING"||reason.code==="PLACEMENT_VERIFIED_MARKS_REQUIRED")
      return "Verified marks only — college-verified academic marks are required before the applicant can be considered eligible.";
    if(reason.code==="INVALID_REQUEST"||reason.status===400){
      const field=Object.keys(reason.fieldErrors).find(key=>Object.hasOwn(DRIVE_FIELD_LABELS,key));
      if(field==="requireVerifiedEvidence"||field==="verifiedMarksOnly")
        return "Check Verified marks only. Unverified or missing academic marks must be verified by the college before applying.";
      if(field)return "Check "+DRIVE_FIELD_LABELS[field]+" and try again.";
    }
    const summary=reason.message.trim();
    return !summary||summary.length>240||/^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+$/.test(summary)
      ?FALLBACK:summary;
  }
  const message=reason instanceof Error?reason.message:"";
  const safe=message.trim();
  if(!safe||safe.length>240||/^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+$/.test(safe))
    return FALLBACK;
  return safe;
}

/** Maps the legacy verifiedMarksOnly switch into a meaningful eligibility
 * validation message without accepting unverified student-supplied marks. */
export const VERIFIED_MARKS_ONLY_HELP={
 label:"Verified marks only",
 helper:"Only verified college marks count. Learners with missing or unverified marks cannot meet this rule until the college verifies them.",
} as const;
