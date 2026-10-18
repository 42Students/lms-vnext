/** India-local timestamp display for persisted and legacy placement settings.
 * Invalid historical date payloads must render a recovery value, not crash
 * the entire private drive workspace. */
export function driveSettingsIstDate(value:unknown):string {
 if(!(value instanceof Date)&&typeof value!=="string")return "Not configured";
 const instant=value instanceof Date?value:new Date(value);
 if(!Number.isFinite(instant.getTime()))return "Not configured";
 return new Intl.DateTimeFormat("en-IN",{
   dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata",
 }).format(instant);
}
