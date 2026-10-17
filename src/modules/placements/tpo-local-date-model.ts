/** Date-only values are always the college's Asia/Kolkata calendar date, not UTC. */
export function tpoIndiaCalendarDay(value:Date):string{
 const parts=new Intl.DateTimeFormat("en-GB",{
  timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit",
 }).formatToParts(value);
 const pick=(key:"year"|"month"|"day")=>parts.find(part=>part.type===key)?.value??"";
 return [pick("year"),pick("month"),pick("day")].join("-");
}
