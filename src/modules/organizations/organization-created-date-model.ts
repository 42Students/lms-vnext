/** Platform tenant creation dates follow the LMS-wide IST display rule. */
export function organizationCreatedIstDate(value:Date):string {
 if(!Number.isFinite(value.getTime()))return "—";
 return new Intl.DateTimeFormat("en-IN",{
  timeZone:"Asia/Kolkata",day:"2-digit",month:"short",year:"numeric",
 }).format(value);
}
