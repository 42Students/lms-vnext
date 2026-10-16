/** REC-calendar-messages-profile-05: exact legacy recruiter calendar copy. */
export const HR_RECRUITER_CALENDAR_EMPTY_TITLE="Nothing scheduled this week";
export const HR_RECRUITER_CALENDAR_EMPTY_HELP=
 "Rounds, slots and deadlines appear here as soon as they are dated.";
export function hrRecruiterLegacyWeekRange(from:string,to:string):string{
 const fmt=(date:string,withYear:boolean)=>new Intl.DateTimeFormat("en-GB",{
  timeZone:"UTC",day:"numeric",month:"short",...(withYear?{year:"numeric" as const}:{}),
 }).format(new Date(date+"T12:00:00.000Z"));
 return fmt(from,false)+" to "+fmt(to,true);
}
