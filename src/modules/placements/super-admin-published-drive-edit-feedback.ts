/** Translate typed placement conflicts into actionable, safe form feedback. */
const messages:Readonly<Record<string,string>>={
  PLACEMENT_JOB_STALE:"Drive changed. Reload the current details before saving.",
  PLACEMENT_JOB_READ_ONLY:"Only published drives can be edited here.",
  PLACEMENT_JOB_NOT_FOUND:"This drive is no longer available in the selected college.",
  PLACEMENT_JOB_INVALID_DEADLINE:"Application deadline must be in the future. Assessment deadline must be after application deadline.",
  PLACEMENT_SEASON_NOT_ACTIVE:"An inactive season cannot be edited.",
  PLACEMENT_ROLE_OPTION_PRIMARY_REQUIRED:"A primary job role is required.",
  PLACEMENT_ROLE_OPTION_DUPLICATE:"Another active role already uses this title.",
};
export function superAdminPublishedDriveEditFeedback(
  code:string|null|undefined,
  safeFallback:string,
):string{
  return code&&Object.prototype.hasOwnProperty.call(messages,code)
    ? messages[code]!
    : safeFallback;
}
