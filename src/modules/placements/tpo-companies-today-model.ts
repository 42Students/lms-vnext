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


/** All Today presentations share the same local-day boundary and authorized
 * follow-up deep link. No role or college selector is accepted from a URL. */
export function splitTpoTodayFollowups(rows:readonly TpoCompaniesTodayRow[],now:Date){
 const today=istDateKey(now);
 return {
  due:rows.filter(row=>istDateKey(new Date(row.dueAt))<=today),
  upcoming:rows.filter(row=>istDateKey(new Date(row.dueAt))>today),
 };
}
export function tpoTodayFocusHref(scope:"MINE"|"TEAM",followupId?:string){
 const search=new URLSearchParams();
 if(scope==="TEAM")search.set("scope","TEAM");
 if(followupId)search.set("lead",followupId);
 const query=search.toString();
 return "/tpo/companies/today"+(query?"?"+query:"");
}

/** Relative-day selection is bounded to the seven-day prototype strip.
 * Invalid or repeated query values must not silently become Today. */
export function tpoTodayAgendaDay(raw:unknown):number|null{
 if(raw===undefined)return 0;
 if(typeof raw!=="string"||!/^[0-6]$/.test(raw))return null;
 return Number(raw);
}
export function tpoTodayAgendaHref(scope:"MINE"|"TEAM",day:number):string{
 const search=new URLSearchParams();
 if(scope==="TEAM")search.set("scope","TEAM");
 search.set("view","agenda");
 if(Number.isInteger(day)&&day>0&&day<7)search.set("day",String(day));
 return "/tpo/companies/today?"+search.toString();
}

/** Derive the prototype's "Not contacted" card from canonical recruiter
 * stages, not from a missing follow-up or the absence of a phone number. */
export function summarizeTpoTodayNotContacted(
 leads:readonly {stage:string;ownerMembershipId:string|null;createdAt:Date|string|null}[],
 scope:"MINE"|"TEAM",actorMembershipId:string,
){
 const eligible=leads.filter(lead=>lead.stage==="NEW"&&
  (scope==="TEAM"||lead.ownerMembershipId===null||lead.ownerMembershipId===actorMembershipId));
 const oldest=eligible.map(lead=>lead.createdAt?new Date(lead.createdAt).getTime():NaN)
  .filter(time=>Number.isFinite(time)).sort((a,b)=>a-b)[0];
 return {count:eligible.length,oldestAddedAt:oldest===undefined?null:new Date(oldest).toISOString()};
}

/** "Not on the week" in the original Agenda and Brief prototypes means
 * genuine open recruiter relationships with no follow-up date or a next date
 * after the seven displayed IST calendar days. Stages and owner fields are
 * read from the authorized CRM list, never inferred from task truncation. */
export function summarizeTpoTodayOutsideWeek(
 leads:readonly {stage:string;ownerMembershipId:string|null;
  nextFollowupAt:string|null;unsubscribedAt:Date|string|null}[],
 scope:"MINE"|"TEAM",actorMembershipId:string,now:Date,
){
 const finalDay=istDateKey(new Date(now.getTime()+6*86400000));
 let withoutDate=0,laterThanWeek=0;
 for(const lead of leads){
  if(["RECRUITED","NOT_NOW"].includes(lead.stage)||lead.unsubscribedAt)continue;
  if(scope==="MINE"&&lead.ownerMembershipId!==null&&lead.ownerMembershipId!==actorMembershipId)continue;
  if(!lead.nextFollowupAt){withoutDate++;continue;}
  const at=new Date(lead.nextFollowupAt);
  if(Number.isFinite(at.getTime())&&istDateKey(at)>finalDay)laterThanWeek++;
 }
 return {withoutDate,laterThanWeek};
}

/** "Overdue" on Today means a previous IST calendar day. A meeting earlier
 * on the same day is due today rather than one day late. */
export function tpoTodayLateDays(dueAt:string,now:Date){
 const due=new Date(dueAt);
 if(!Number.isFinite(due.getTime())||!Number.isFinite(now.getTime()))return 0;
 const diff=Date.parse(istDateKey(now)+"T00:00:00Z")-Date.parse(istDateKey(due)+"T00:00:00Z");
 return Math.max(0,Math.round(diff/86400000));
}
