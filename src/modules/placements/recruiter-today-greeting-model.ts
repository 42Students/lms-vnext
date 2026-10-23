/** REC-home-drives-04: exact legacy time-of-day headline and actionable task copy. */
/** All vNext workspace clocks are IST, irrespective of browser time zone.
 * Preserve the old firstName -> account displayName fallback without making
 * any unverified display attribute an authorization value.
 */
export function recruiterTodayGreeting(
 now:Date,displayName:string|null,_companyName:string,actionCount:number,
 firstName?:string|null,
){
 const hour=Number(new Intl.DateTimeFormat("en-GB",{
  timeZone:"Asia/Kolkata",hour:"numeric",hourCycle:"h23",
 }).format(now));
 const timeOfDay=hour<12?"morning":hour<17?"afternoon":"evening";
 const name=(firstName?.trim()||displayName?.trim().split(/\s+/)[0]||"")
  .replace(/[\r\n]/g," ").slice(0,80);
 const tasks=Number.isFinite(actionCount)?Math.max(0,Math.trunc(actionCount)):0;
 return {
  title:"Good "+timeOfDay+(name?", "+name:""),
  subtitle:tasks>0
   ? tasks+" "+(tasks===1?"thing needs":"things need")+" you today."
   : "0 things need you today.",
 };
}
