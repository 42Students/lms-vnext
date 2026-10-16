/** Legacy TPO settings fallbacks when the college has not saved a row. */
export const LEGACY_RECRUITER_ACCESS_MONTHS = 6;
export function recruiterAccessMonthsOrDefault(months:number|null|undefined){
  const result=months??LEGACY_RECRUITER_ACCESS_MONTHS;
  if(!Number.isSafeInteger(result)||result<1||result>60)throw new Error("INVALID_RECRUITER_ACCESS_MONTHS");
  return result;
}
