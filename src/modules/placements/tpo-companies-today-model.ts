export type TpoCompaniesTodayRow={
 id:string;leadId:string;leadName:string;companyName:string|null;
 dueAt:string;note:string|null;phoneNorm:string|null;canContact:boolean;overdue:boolean;
};
/** Latest persisted CRM tasks only. Never invent email replies or imply a
 * truncated source page is the whole outreach list. */
export function rankTpoCompaniesToday(
 due:readonly TpoCompaniesTodayRow[],next:readonly TpoCompaniesTodayRow[],
):TpoCompaniesTodayRow[]{
 const seen=new Set<string>();
 return [...due,...next].filter(row=>{
  if(seen.has(row.id))return false;seen.add(row.id);return true;
 }).sort((a,b)=>new Date(a.dueAt).getTime()-new Date(b.dueAt).getTime()||
  a.id.localeCompare(b.id)).slice(0,50);
}
export function istDateKey(value:Date){
 return new Intl.DateTimeFormat("sv-SE",{
  timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit",
 }).format(value);
}
export function nextTpoFollowupTomorrow(now:Date):string{
 const tomorrow=new Date(now.getTime()+86400000);
 return istDateKey(tomorrow)+"T10:00:00+05:30";
}

export type TpoTodayNextPlan="NONE"|"TOMORROW"|"WEEK"|"CUSTOM";
/** The old Companies/Today date choices are all interpreted at 10 AM IST
 * unless the operator provides a validated exact local datetime. */
export function nextTpoTodayFollowupAt(
 plan:TpoTodayNextPlan,now:Date,customLocal:string,
):string|null{
 if(plan==="NONE")return null;
 if(plan==="TOMORROW")return nextTpoFollowupTomorrow(now);
 if(plan==="WEEK")
  return istDateKey(new Date(now.getTime()+7*86400000))+"T10:00:00+05:30";
 if(!/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d$/.test(customLocal))return null;
 const iso=customLocal+":00+05:30";
 const value=new Date(iso);
 if(!Number.isFinite(value.getTime()))return null;
 const roundTrip=new Intl.DateTimeFormat("sv-SE",{
   timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit",
   hour:"2-digit",minute:"2-digit",hourCycle:"h23",
 }).format(value);
 if(roundTrip.replace(" ","T")!==customLocal)return null;
 if(value.getTime()<=now.getTime()||value.getTime()>now.getTime()+2*365*86400000)return null;
 return iso;
}

/** Old TPO Today defaults to the signed-in placement worker. An explicit
 * Everyone selection changes query scope, not data ownership permissions. */
export function tpoCompaniesTodayScope(raw:unknown):"MINE"|"TEAM"|null{
 if(raw===undefined||raw===null||raw==="MINE")return "MINE";
 if(raw==="TEAM")return "TEAM";
 return null;
}
