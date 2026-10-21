import { recruiterTodayHref } from "./hr-today-deeplink-model";
type Job = {collegeId:string;companyId:string;job:{id:string;title:string;status:string;archivedAt:Date|null;applicationDeadline?:Date|null}};
type Due={id:string;jobId:string;jobTitle:string;roundName:string;dueAt:Date;
 status?:string;isOutstanding?:boolean};
type UnreadThread={id:string;href:string;label:string;unread:number};
/** REC-home-drives-01: only verified scoped signals become next-up actions.
 * A recorded result due date is not proof results are still outstanding. */
export function buildRecruiterActionQueue(input:{
 jobs:readonly Job[];collegeId:string;companyId:string;unread:number;now?:Date;
 resultsDue?:readonly Due[];unreadConversations?:readonly UnreadThread[];
 returnedRequests?:readonly {id:string;status:string;draft:unknown}[];
 changeRequests?:readonly {id:string;jobId:string;jobTitle:string;field:string;createdAt:Date}[];
 roundsNeedingSlots?:readonly {id:string;jobId:string;jobTitle:string;name:string;scheduledAt:Date|null;needsOffer:boolean}[];
 offerActions?:readonly {jobId:string;jobTitle:string;status:string;count:number}[];
 sharedApplicantCounts?:readonly {jobId:string;count:number}[];
 preliveReviewInvites?:readonly {id:string;jobId:string;jobTitle:string;invitedAt:Date}[];
}) {
 const authorized=new Set(input.jobs.filter(row=>row.collegeId===input.collegeId&&
  row.companyId===input.companyId&&row.job.archivedAt===null&&
  (row.job.status==="PUBLISHED"||row.job.status==="CLOSED"))
  .map(row=>row.job.id));
 const changeRequests=(input.changeRequests??[]).filter(row=>authorized.has(row.jobId))
  .map(row=>({key:"answer:"+row.id,tone:"URGENT" as const,at:row.createdAt,
   label:"Answer change request · "+row.jobTitle,
   description:"The placement cell asked about "+row.field.toLowerCase().replaceAll("_"," ")+".",
   href:"/recruiter/drives/"+encodeURIComponent(row.jobId)+"?tab=requests"}));
 const slots=(input.roundsNeedingSlots??[])
  .filter(row=>authorized.has(row.jobId)&&row.scheduledAt!==null)
  .map(row=>({key:"slots:"+row.id,tone:"SOON" as const,at:row.scheduledAt,
   label:(row.needsOffer?"Offer time to college · ":"Add slots · ")+row.name,
   description:row.needsOffer?"You have an unsent time block for "+row.jobTitle+". Offer it to the placement cell.":
    "Propose an interviewer time for "+row.jobTitle+"; the placement cell confirms the schedule.",
   href:"/recruiter/drives/"+encodeURIComponent(row.jobId)+"/interview-slots"}));
 const offers=(input.offerActions??[]).filter(row=>authorized.has(row.jobId)&&row.count>0)
  .map(row=>({key:"offers:"+row.jobId+":"+row.status,
    tone:(row.status==="ISSUED"?"SOON":"FINE") as "URGENT"|"SOON"|"FINE",
    at:null as Date|null,
    label:row.status==="ACCEPTED"?"Follow up joining · "+row.jobTitle:
      row.status==="DECLINED"?"Review declined offers · "+row.jobTitle:
      "Review offers · "+row.jobTitle,
    description:row.count+" "+row.status.toLowerCase()+" offers recorded for college-shared applicants.",
    href:"/recruiter/drives/"+encodeURIComponent(row.jobId)+"?tab=offers"}));
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
   // A due date alone is informational; only persisted outstanding evidence
   // can create an action, and completed or talk rounds are excluded.
   item.isOutstanding===true &&
   item.status!=="COMPLETED" && item.status!=="TALK" &&
   Number.isFinite(item.dueAt.getTime()) &&
   (!input.now || (item.dueAt.getTime()>=input.now.getTime()-14*86400000 &&
                   item.dueAt.getTime()<=input.now.getTime()+2*86400000)))
  .sort((a,b)=>a.dueAt.getTime()-b.dueAt.getTime()||a.id.localeCompare(b.id))
  .map(item=>({key:"due:"+item.id, tone:(input.now&&item.status==="SCHEDULED"&&item.dueAt.getTime()<input.now.getTime()?"URGENT":"SOON") as "URGENT"|"SOON", at:item.dueAt,
    label:"Check results deadline · "+item.roundName,
    description:"Recorded deadline for "+item.jobTitle+"; this does not establish whether results are outstanding.",
    href:"/recruiter/drives/"+encodeURIComponent(item.jobId)+"?tab=rounds&roundId="+encodeURIComponent(item.id)}));
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
   description:(sharedCounts.get(row.job.id)??0)+" college-shared applications need recruiter review.",
   href:recruiterTodayHref({kind:"REVIEW_APPLICANTS",jobId:row.job.id})}));
 // A prelive review is actionable only when an invitation was persisted.
 const preliveIds=new Set(input.jobs.filter(row=>row.collegeId===input.collegeId&&
   row.companyId===input.companyId&&row.job.archivedAt===null)
   .map(row=>row.job.id));
 const invited=(input.preliveReviewInvites??[])
   .filter(item=>preliveIds.has(item.jobId))
   .map(item=>({key:"invited:"+item.id,tone:"SOON" as const,at:item.invitedAt,
    label:"Review it · "+item.jobTitle,
    description:"The placement cell invited your review before publication.",
    href:"/recruiter/drives/"+encodeURIComponent(item.jobId)+"?tab=requests"}));
 const notices=input.unread>0?[{key:"notifications", tone:"SOON" as const, at:null as Date|null,
   label:"Read "+input.unread+" unread notifications",
   description:"Open your college-scoped drive notification inbox.",
   href:"/hr/notifications?collegeId="+encodeURIComponent(input.collegeId)+"&unreadOnly=true"}]:[];
 const actions=[...changeRequests,...returned,...slots,...offers,...conversations,...due,...deadlines,...reviews,...invited,...notices];
 const priority={URGENT:0,SOON:1,FINE:2};
 return actions.sort((a,b)=>{
  const rank=priority[a.tone]-priority[b.tone];
  if(rank!==0)return rank;
  const first=a.at?.getTime()??Number.POSITIVE_INFINITY;
  const second=b.at?.getTime()??Number.POSITIVE_INFINITY;
  return first-second||a.key.localeCompare(b.key);
 });
}
