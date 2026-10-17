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
  PLACEMENT_ELIGIBILITY_POLICY_LOCKED: "Eligibility can no longer be changed for this drive.",
  PLACEMENT_ROUND_JOB_READ_ONLY: "Rounds cannot be changed on this drive.",
  PLACEMENT_ROUND_STALE: "A round changed while you were working. Refresh and try again.",
};

const FALLBACK = "We could not save this drive. Check your drafts and try again.";

/** TPO-drives-44: translate known server codes without exposing machine details. */
export function tpoDriveFormErrorMessage(reason:unknown):string{
  if(reason instanceof FriendlyFetchError){
    return (reason.code&&DRIVE_ERRORS[reason.code])||reason.message;
  }
  const message=reason instanceof Error?reason.message:"";
  const safe=message.trim();
  if(!safe||safe.length>240||/^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+$/.test(safe))
    return FALLBACK;
  return safe;
}
