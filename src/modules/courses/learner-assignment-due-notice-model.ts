export type LearnerDueSource={
 id:string;title:string;deliveryId:string;dueAt:Date|null;submissionId:string|null;
};
export type LearnerDueNotice={key:string;title:string;body:string;href:string;dueAt:string};
/** Live reminder projection: never equate a saved assignment due date with a
 * delivered push/email. Exclude submitted, missing-deadline and expired rows. */
export function learnerDueSoonNotices(rows:readonly LearnerDueSource[],now:Date,hours=48):LearnerDueNotice[]{
 const begin=now.getTime(),end=begin+hours*3600000;
 if(!Number.isFinite(begin)||!Number.isFinite(end)||hours<=0)return [];
 const seen=new Set<string>();
 return rows.filter(row=>!row.submissionId&&row.dueAt&&
    Number.isFinite(row.dueAt.getTime())&&row.dueAt.getTime()>begin&&
    row.dueAt.getTime()<=end).map(row=>({
   key:row.id+":"+row.deliveryId,
   title:"Assignment due soon",
   body:row.title+" · Due "+new Intl.DateTimeFormat("en-IN",{
    timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"
   }).format(row.dueAt!),
   href:"/learn/allAssignments/"+encodeURIComponent(row.id)+"?deliveryId="+encodeURIComponent(row.deliveryId),
   dueAt:row.dueAt!.toISOString(),
 })).sort((a,b)=>a.dueAt.localeCompare(b.dueAt)||a.key.localeCompare(b.key))
  .filter(notice=>{
   if(seen.has(notice.key))return false;
   seen.add(notice.key);
   return true;
  });
}

/** Legacy reminders are independent of the on-demand 48-hour due widget above.
 * The scheduler must call this at 09:00/19:00 Asia/Kolkata, and persist each
 * notice.key as a delivery idempotency key before contacting a provider. */
export type LearnerInterviewReminderSource = {
 id:string;title:string;startsAt:Date|null;status:string;href:string;
};
function istClock(now:Date){
 const parts=new Intl.DateTimeFormat("en-GB",{
  timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit",
  hour:"2-digit",minute:"2-digit",hourCycle:"h23",
 }).formatToParts(now);
 const get=(type:string)=>parts.find(part=>part.type===type)?.value??"";
 return {day:[get("year"),get("month"),get("day")].join("-"),
  hour:get("hour"),minute:get("minute")};
}
function nextIstDay(day:string){
 const [year,month,date]=day.split("-").map(Number);
 const value=new Date(Date.UTC(year,month-1,date+1));
 return value.toISOString().slice(0,10);
}
/** Exactly tomorrow by IST calendar day, not a floating 24/48-hour interval. */
export function interviewTomorrowReminders(
 rows:readonly LearnerInterviewReminderSource[],now:Date,
):LearnerDueNotice[]{
 const tomorrow=nextIstDay(istClock(now).day);
 const seen=new Set<string>();
 return rows.filter(row=>row.startsAt && Number.isFinite(row.startsAt.getTime()) &&
  !["CANCELLED","CANCELED","COMPLETED"].includes(row.status.toUpperCase()) &&
  istClock(row.startsAt).day===tomorrow).map(row=>({
   key:"interview:"+row.id+":"+tomorrow,
   title:"Interview reminder",body:row.title+" · Tomorrow at "+
    new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",timeStyle:"short"}).format(row.startsAt!),
   href:row.href,dueAt:row.startsAt!.toISOString(),
 })).sort((a,b)=>a.dueAt.localeCompare(b.dueAt)||a.key.localeCompare(b.key))
  .filter(notice=>{if(seen.has(notice.key))return false;seen.add(notice.key);return true});
}
/** Quiz reminders share the 09:00 IST daily run but never leak answers or
 * count an already-submitted attempt as pending. */
export type LearnerQuizReminderSource = {
 id:string;title:string;deliveryId:string;dueAt:Date|null;submittedAt:Date|null;
};
export function quizDueSoonReminders(
 rows:readonly LearnerQuizReminderSource[],now:Date,hours=24,
):LearnerDueNotice[]{
 const begin=now.getTime(),end=begin+hours*3600000;
 if(!Number.isFinite(begin)||!Number.isFinite(end)||hours<=0)return [];
 const seen=new Set<string>();
 return rows.filter(row=>!row.submittedAt&&row.dueAt&&
  Number.isFinite(row.dueAt.getTime())&&row.dueAt.getTime()>begin&&
  row.dueAt.getTime()<=end).map(row=>({
   key:"quiz:"+row.id+":"+row.deliveryId,
   title:"Quiz due soon",
   body:row.title+" · Due "+new Intl.DateTimeFormat("en-IN",{
    timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short",
   }).format(row.dueAt!),
   href:"/learn/allQuizzes?deliveryId="+encodeURIComponent(row.deliveryId),
   dueAt:row.dueAt!.toISOString(),
 })).sort((a,b)=>a.dueAt.localeCompare(b.dueAt)||a.key.localeCompare(b.key))
 .filter(notice=>{if(seen.has(notice.key))return false;seen.add(notice.key);return true});
}

/** Callback is the authenticated, durable delivery adapter. Never send from
 * a page render; retry safety depends on the supplied idempotent dispatch. */
export async function dispatchDailyLearnerReminders(args:{
 now:Date;assignments:readonly LearnerDueSource[];
 quizzes?:readonly LearnerQuizReminderSource[];
 interviews:readonly LearnerInterviewReminderSource[];
 dispatch:(notice:LearnerDueNotice)=>Promise<void>;
}):Promise<{kind:"ASSIGNMENT"|"INTERVIEW"|null;count:number}>{
 if(!Number.isFinite(args.now.getTime()))return {kind:null,count:0};
 const clock=istClock(args.now);
 const assignmentRun=clock.hour==="09"&&clock.minute==="00";
 const interviewRun=clock.hour==="19"&&clock.minute==="00";
 if(!assignmentRun&&!interviewRun)return {kind:null,count:0};
 const notices=assignmentRun
  ?[
    ...learnerDueSoonNotices(args.assignments,args.now,24).map(notice=>({
     ...notice,key:"assignment:"+clock.day+":"+notice.key,
    })),
    ...quizDueSoonReminders(args.quizzes??[],args.now,24).map(notice=>({
     ...notice,key:clock.day+":"+notice.key,
    })),
   ]
  :interviewTomorrowReminders(args.interviews,args.now);
 for(const notice of notices)await args.dispatch(notice);
 return {kind:assignmentRun?"ASSIGNMENT":"INTERVIEW",count:notices.length};
}
