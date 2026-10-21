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
 const day=(date:Date)=>date.toLocaleDateString("en-CA",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit"});
 const [year,month,date]=day(value).split("-").map(Number);
 const [nowYear,nowMonth,nowDate]=day(now).split("-").map(Number);
 const days=Math.round((Date.UTC(year!,month!-1,date!)-Date.UTC(nowYear!,nowMonth!-1,nowDate!))/86_400_000);
 if(days===0)return "Today";
 if(days===1)return "Tomorrow";
 if(days===-1)return "Yesterday";
 if(days>1)return days<7?"In "+days+" days":value.toLocaleDateString("en-IN",{timeZone:"Asia/Kolkata",day:"numeric",month:"short"});
 return -days+" days ago";
}
