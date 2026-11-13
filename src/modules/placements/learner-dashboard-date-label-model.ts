import { DEFAULT_TIME_ZONE } from "@/config/locale";
/** All dashboard times are server authorized instants displayed in IST. */
export function learnerDashboardDateLabel(value:Date):string{
 if(!Number.isFinite(value.getTime()))return "Time not available";
 return new Intl.DateTimeFormat("en-IN",{
  dateStyle:"medium",timeStyle:"short",timeZone:DEFAULT_TIME_ZONE,
 }).format(value);
}
