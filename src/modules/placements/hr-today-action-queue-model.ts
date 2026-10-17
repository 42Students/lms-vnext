import { recruiterTodayHref } from "./hr-today-deeplink-model";
type Job = {collegeId:string;companyId:string;job:{id:string;title:string;status:string;archivedAt:Date|null}};
type Due={id:string;jobId:string;jobTitle:string;roundName:string;dueAt:Date};
type UnreadThread={id:string;href:string;label:string;unread:number};
/** REC-home-drives-01: only verified scoped signals become next-up actions.
 * A recorded result due date is not proof results are still outstanding. */
export function buildRecruiterActionQueue(input:{
 jobs:readonly Job[];collegeId:string;companyId:string;unread:number;
 resultsDue?:readonly Due[];unreadConversations?:readonly UnreadThread[];
}) {
 const authorized=new Set(input.jobs.filter(row=>row.collegeId===input.collegeId&&
  row.companyId===input.companyId&&row.job.archivedAt===null&&
  (row.job.status==="PUBLISHED"||row.job.status==="CLOSED"))
  .map(row=>row.job.id));
 const conversations=(input.unreadConversations??[]).filter(item=>item.unread>0)
  .slice(0,5).map(item=>({key:"thread:"+item.id, tone:"SOON" as const, at:null as Date|null,
    label:"Open messages · "+item.label,
    description:item.unread+" unread placement-cell messages in this authorized conversation.",
    href:item.href}));
 const due=(input.resultsDue??[]).filter(item=>authorized.has(item.jobId)&&
   Number.isFinite(item.dueAt.getTime()))
  .sort((a,b)=>a.dueAt.getTime()-b.dueAt.getTime()||a.id.localeCompare(b.id))
  .slice(0,5).map(item=>({key:"due:"+item.id, tone:"SOON" as const, at:item.dueAt,
    label:"Check results deadline · "+item.roundName,
    description:"Recorded deadline for "+item.jobTitle+"; this does not establish whether results are outstanding.",
    href:"/recruiter/drives/"+encodeURIComponent(item.jobId)+"?tab=rounds&roundId="+encodeURIComponent(item.id)}));
 const live=input.jobs.filter(row=>row.collegeId===input.collegeId&&row.companyId===input.companyId&&
   row.job.status==="PUBLISHED"&&row.job.archivedAt===null).slice(0,3);
 const reviews=live.map(row=>({key:"review:"+row.job.id, tone:"FINE" as const, at:null as Date|null,
   label:"Review shared applicants · "+row.job.title,
   description:"Open the employer-visible shortlist and notes. No unshared applications are included.",
   href:recruiterTodayHref({kind:"REVIEW_APPLICANTS",jobId:row.job.id})}));
 const notices=input.unread>0?[{key:"notifications", tone:"SOON" as const, at:null as Date|null,
   label:"Read "+input.unread+" unread notifications",
   description:"Open your college-scoped drive notification inbox.",
   href:recruiterTodayHref({kind:"MESSAGES"})+"?collegeId="+encodeURIComponent(input.collegeId)+"&unreadOnly=true"}]:[];
 return [...conversations,...due,...reviews,...notices];
}
