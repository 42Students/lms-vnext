import { DEFAULT_TIME_ZONE } from "@/config/locale";
/** Super Admin bulk-import history is an audit record, not a reason to crash
 * the entire student register when a legacy event contains an invalid date.
 */
export function formatSuperAdminImportWhen(value:Date):string {
  if(!Number.isFinite(value.getTime()))return "Date unavailable";
  return new Intl.DateTimeFormat("en-IN",{
    timeZone:DEFAULT_TIME_ZONE,dateStyle:"medium",timeStyle:"short",
  }).format(value);
}
