import { DEFAULT_TIME_ZONE } from "@/config/locale";
/** Platform tenant creation dates follow the LMS-wide IST display rule. */
export function organizationCreatedIstDate(value:Date|null|undefined):string {
 if(!(value instanceof Date)||!Number.isFinite(value.getTime()))return "—";
 return new Intl.DateTimeFormat("en-IN",{
  timeZone:DEFAULT_TIME_ZONE,day:"2-digit",month:"short",year:"numeric",
 }).format(value);
}
