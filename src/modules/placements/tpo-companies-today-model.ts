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
