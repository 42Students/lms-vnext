import { recruiterTodayHref } from "./hr-today-deeplink-model";

/** Display calendar instants in the application's IST convention, never
 * expose UTC ISO wire timestamps as the employer-facing reply deadline. */
function recruiterDueAtIst(value:Date):string{
 return new Intl.DateTimeFormat("en-IN",{
  timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short",
 }).format(value)+" IST";
}
type Job = {collegeId:string;companyId:string;job:{id:string;title:string;status:string;archivedAt:Date|null;applicationDeadline?:Date|null}};
type Due={id:string;jobId:string;jobTitle:string;roundName:string;dueAt:Date;
 status?:string;roundKind?:string;isOutstanding?:boolean};
type UnreadThread={id:string;href:string;label:string;unread:number};
/** REC-home-drives-01: only verified scoped signals become next-up actions.
 * A recorded result due date is not proof results are still outstanding. */
export function buildRecruiterActionQueue(input:{
 jobs:readonly Job[];collegeId:string;companyId:string;unread:number;now?:Date;
 resultsDue?:readonly Due[];unreadConversations?:readonly UnreadThread[];
 returnedRequests?:readonly {id:string;status:string;draft:unknown}[];
 changeRequests?:readonly {id:string;jobId:string;jobTitle:string;field:string;createdAt:Date;kind?:string;note?:string|null}[];
 roundsNeedingSlots?:readonly {id:string;jobId:string;jobTitle:string;name:string;scheduledAt:Date|null;needsOffer:boolean}[];
 offerActions?:readonly {jobId:string;jobTitle:string;status:string;count:number;respondBy?:Date|null}[];
 sharedApplicantCounts?:readonly {jobId:string;count:number}[];
 preliveReviewInvites?:readonly {id:string;jobId:string;jobTitle:string;invitedAt:Date}[];
}) {
 const authorized=new Set(input.jobs.filter(row=>row.collegeId===input.collegeId&&
  row.companyId===input.companyId&&row.job.archivedAt===null&&
  (row.job.status==="PUBLISHED"||row.job.status==="CLOSED"))
  .map(row=>row.job.id));
 // Old Today groups company-facing ASK / CHANGE requests per drive.
 const grouped=new Map<string,{id:string;jobId:string;jobTitle:string;count:number;asks:number;unknownKinds:number;note:string|null;createdAt:Date}>();
 for(const row of input.changeRequests??[]){
  if(!authorized.has(row.jobId))continue;
  const current=grouped.get(row.jobId)??{id:row.id,jobId:row.jobId,jobTitle:row.jobTitle,count:0,asks:0,unknownKinds:0,note:null,createdAt:row.createdAt};
  current.count++;
  if(row.kind==="ASK")current.asks++;
  if(!row.kind)current.unknownKinds++;
  if(!current.note&&row.note?.trim())current.note=row.note.trim();
  grouped.set(row.jobId,current);
 }
 const changeRequests=[...grouped.values()].map(row=>{
  const allAsks=row.asks===row.count;
  const quantity=row.count+" "+(allAsks?(row.count===1?"detail":"details"):(row.count===1?"change":"changes"));
  // When an upstream signal lacks the ASK/SUGGEST mode, do not pretend
  // to know which action the placement cell requested.
  const label=row.unknownKinds>0
    ?"The placement cell needs answers to "+row.count+" "+(row.count===1?"request":"requests")
    :(allAsks?"The placement cell needs ":"The placement cell suggested ")+quantity;
  return {key:"answer:"+row.jobId,tone:"SOON" as const,at:row.createdAt,
   label,
   description:row.jobTitle+(row.note?" · “"+row.note+"”":""),
   href:"/recruiter/drives/"+encodeURIComponent(row.jobId)+"?tab=requests#change-request-"+encodeURIComponent(row.id)};
 });
 const slots=(input.roundsNeedingSlots??[])
  .filter(row=>authorized.has(row.jobId)&&row.scheduledAt!==null)
  .map(row=>({key:"slots:"+row.id,tone:"SOON" as const,at:row.scheduledAt,
   label:(row.needsOffer?"Offer time to college · ":"Add slots · ")+row.name,
   description:row.needsOffer?"You have an unsent time block for "+row.jobTitle+". Offer it to the placement cell.":
    "Propose an interviewer time for "+row.jobTitle+"; the placement cell confirms the schedule.",
   href:"/recruiter/drives/"+encodeURIComponent(row.jobId)+"/interview-slots"}));
 const offers=(input.offerActions??[]).filter(row=>authorized.has(row.jobId)&&row.count>0)
  .map(row=>{
   const awaitingReply=row.status==="RELEASED"||row.status==="ISSUED";
   const respondBy=row.respondBy instanceof Date&&Number.isFinite(row.respondBy.getTime())?row.respondBy:null;
   const dueSoon=respondBy!==null&&input.now!==undefined&&
    respondBy.getTime()<input.now.getTime()+2*86400000;
   return {key:"offers:"+row.jobId+":"+row.status,
    tone:(awaitingReply&&dueSoon?"SOON":"FINE") as "SOON"|"FINE",
    at:awaitingReply?respondBy:null,
    label:awaitingReply?row.count+" "+(row.count===1?"offer":"offers")+" waiting on a reply":
      row.status==="ACCEPTED"?"Follow up joining · "+row.jobTitle:
      row.status==="DECLINED"?"Review declined offers · "+row.jobTitle:
      row.status==="PENDING_VERIFICATION"?"Await selection verification · "+row.jobTitle:
      row.status==="SELECTED"?"Selection recorded · "+row.jobTitle:"Review offers · "+row.jobTitle,
    description:row.jobTitle+(awaitingReply&&respondBy?
      " · Reply by "+recruiterDueAtIst(respondBy):" · "+row.count+" "+row.status.toLowerCase()+" offers recorded for college-shared applicants."),
    // Old Today had no button while waiting for someone else's decision.
    // Only an accepted/declined offer creates follow-up work for the HR team.
    href:row.status==="ACCEPTED"||row.status==="DECLINED"
      ?"/recruiter/drives/"+encodeURIComponent(row.jobId)+"?tab=offers":null};
  });
 const conversations=(input.unreadConversations??[]).filter(item=>item.unread>0)
  .map(item=>({key:"thread:"+item.id, tone:"SOON" as const, at:null as Date|null,
    label:"Open messages · "+item.label,
    description:item.unread+" unread placement-cell messages in this authorized conversation.",
    href:item.href}));
 const returned=(input.returnedRequests??[])
  .filter(row=>row.status==="SENT_BACK")
  .map(row=>({key:"fix:"+row.id,tone:"URGENT" as const,at:null as Date|null,
    label:"Fix and resend · "+(row.draft&&typeof row.draft==="object"&&"title" in row.draft&&typeof row.draft.title==="string"?row.draft.title:"Drive request"),
    description:"The placement cell sent this request back for changes.",
    href:"/recruiter/drives/new?collegeId="+encodeURIComponent(input.collegeId)+
      "&fix="+encodeURIComponent(row.id)}));
 const due=(input.resultsDue??[]).filter(item=>authorized.has(item.jobId)&&
   // TALK rounds have no assessment result. A due date from the calendar is
   // informational unless a separate results ledger confirms outstanding work.
   // Completed assessment rounds can still have results awaiting publication.
   item.roundKind!=="TALK" &&
   (item.status==="SCHEDULED"||item.status==="COMPLETED") &&
   Number.isFinite(item.dueAt.getTime()) &&
   (!input.now || (item.dueAt.getTime()>=input.now.getTime()-14*86400000 &&
                   item.dueAt.getTime()<=input.now.getTime()+2*86400000)))
  .sort((a,b)=>a.dueAt.getTime()-b.dueAt.getTime()||a.id.localeCompare(b.id))
  .filter(item=>item.isOutstanding!==false)
  .map(item=>{
   const confirmed=item.isOutstanding===true;
   const overdue=confirmed&&Boolean(input.now)&&item.dueAt.getTime()<input.now!.getTime();
   return {key:"due:"+item.id,
    tone:(confirmed?(overdue?"URGENT":"SOON"):"FINE") as "URGENT"|"SOON"|"FINE",
    at:item.dueAt,
    label:(confirmed?"Results overdue · ":"Verify results due · ")+item.roundName,
    description:item.jobTitle+" · "+recruiterDueAtIst(item.dueAt)+
     (confirmed?" · Results are recorded as outstanding.":" · Check the results ledger; the deadline alone does not prove that results are outstanding."),
    href:"/recruiter/drives/"+encodeURIComponent(item.jobId)+"?tab=rounds&roundId="+encodeURIComponent(item.id)};
  });
 const live=input.jobs.filter(row=>row.collegeId===input.collegeId&&row.companyId===input.companyId&&
   row.job.status==="PUBLISHED"&&row.job.archivedAt===null);
 const deadlines = input.now ? live
  .filter(row=>row.job.applicationDeadline instanceof Date &&
    Number.isFinite(row.job.applicationDeadline.getTime()))
  .filter(row=>row.job.applicationDeadline!.getTime()>=input.now!.getTime()-7*86400000)
  .sort((a,b)=>a.job.applicationDeadline!.getTime()-b.job.applicationDeadline!.getTime())
  
  .map(row=>({
    key:"deadline:"+row.job.id,
    tone:(row.job.applicationDeadline!.getTime()<input.now!.getTime()?"URGENT":"SOON") as "URGENT"|"SOON",
    at:row.job.applicationDeadline!,
    label:"Application deadline · "+row.job.title,
    description:"Published deadline information; verify applications before acting.",
    href:"/recruiter/drives/"+encodeURIComponent(row.job.id)+"?tab=overview",
  })) : [];
 const sharedCounts=new Map<string,number>((input.sharedApplicantCounts??[])
   .filter(row=>row.count>0).map(row=>[row.jobId,row.count] as const));
 const reviews=live.filter(row=>(sharedCounts.get(row.job.id)??0)>0)
  .map(row=>({key:"review:"+row.job.id, tone:"FINE" as const, at:null as Date|null,
   label:"Review shared applicants · "+row.job.title,
   description:(sharedCounts.get(row.job.id)??0)+" college-shared applications available for recruiter review. New resume changes are not inferred from totals.",
   href:recruiterTodayHref({kind:"REVIEW_APPLICANTS",jobId:row.job.id})}));
 // A prelive review is actionable only when an invitation was persisted.
 const preliveIds=new Set(input.jobs.filter(row=>row.collegeId===input.collegeId&&
   row.companyId===input.companyId&&row.job.archivedAt===null&&row.job.status==="DRAFT")
   .map(row=>row.job.id));
 const invited=(input.preliveReviewInvites??[])
   .filter(item=>preliveIds.has(item.jobId))
   .map(item=>({key:"invited:"+item.id,tone:"SOON" as const,at:item.invitedAt,
    label:"Review it · "+item.jobTitle,
    description:"The placement cell invited your review before publication.",
    href:"/recruiter/drives/"+encodeURIComponent(item.jobId)+"?tab=messages"}));
 const notices=input.unread>0?[{key:"notifications", tone:"SOON" as const, at:null as Date|null,
   label:"Read "+input.unread+" unread notifications",
   description:"Open your college-scoped drive notification inbox.",
   href:"/hr/notifications?collegeId="+encodeURIComponent(input.collegeId)+"&unreadOnly=true"}]:[];
 const actions=[...changeRequests,...returned,...slots,...offers,...conversations,...due,...deadlines,...reviews,...invited,...notices];
 const priority={URGENT:0,SOON:1,FINE:2};
 // Legacy preserves insertion order within each urgency tier (stable sort).
 return actions.sort((a,b)=>priority[a.tone]-priority[b.tone]);
}
