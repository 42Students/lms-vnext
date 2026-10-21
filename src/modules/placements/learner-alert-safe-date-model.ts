/** A broken saved alert instant must not erase other personal notifications. */
export function learnerAlertSafeDate(value:Date):{iso:string|null;label:string}{
 if(!Number.isFinite(value.getTime()))return {iso:null,label:"Date unavailable"};
 return {iso:value.toISOString(),label:new Intl.DateTimeFormat("en-IN",{
  dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata",
 }).format(value)+" IST"};
}

/** Legacy placement updates use calendar-day words in India, not elapsed
 * 24-hour buckets. Keep the actual timestamp on the <time> element. */
export function learnerAlertRelativeDay(value:Date,now:Date=new Date()):string{
 if(!Number.isFinite(value.getTime())||!Number.isFinite(now.getTime()))
  return "Date unavailable";
 const day=(date:Date)=>{
  const parts=new Intl.DateTimeFormat("en-GB",{
   timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit",
  }).formatToParts(date);
  const valueFor=(type:"year"|"month"|"day")=>Number(parts.find(part=>part.type===type)?.value);
  return Date.UTC(valueFor("year"),valueFor("month")-1,valueFor("day"));
 };
 const days=Math.round((day(value)-day(now))/86_400_000);
 if(days===0)return "Today";
 if(days===1)return "Tomorrow";
 if(days===-1)return "Yesterday";
 if(days>1)return days<7?"In "+days+" days":value.toLocaleDateString("en-IN",{timeZone:"Asia/Kolkata",day:"numeric",month:"short"});
 return -days+" days ago";
}
