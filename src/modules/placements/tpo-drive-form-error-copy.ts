import {FriendlyFetchError} from "@/lib/api-fetch";

const DRIVE_ERRORS: Readonly<Record<string,string>> = {
  PLACEMENT_COMPANY_IDENTITY_CONFLICT: "This company may already be listed. Pick the company from the list before continuing.",
  PLACEMENT_JOB_NOT_PUBLISHABLE: "Review the drive details and fix the missing information before publishing.",
  PLACEMENT_JOB_STALE: "This drive changed while you were working. Refresh and try again.",
  PLACEMENT_JOB_INVALID_CTC_RANGE: "Maximum CTC must be greater than or equal to minimum CTC.",
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
