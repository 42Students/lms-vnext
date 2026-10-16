/** REC-home-drives-04: exact legacy time-of-day headline and actionable task copy. */
export function recruiterTodayGreeting(now:Date,displayName:string|null,companyName:string,actionCount:number){
 const hour=Number(new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Kolkata",hour:"numeric",hourCycle:"h23"}).format(now));
 const timeOfDay=hour<12?"morning":hour<17?"afternoon":"evening";
 const name=displayName?.trim().split(/\s+/)[0]||"";
 return {
  title:"Good "+timeOfDay+(name?", "+name:""),
  subtitle:actionCount>0
   ? actionCount+" "+(actionCount===1?"thing needs":"things need")+" you today. Each one takes you straight to where it is done."
   : companyName+" · Nothing is waiting on you.",
 };
}
