import { recruiterTodayHref } from "./hr-today-deeplink-model";
type Job = {collegeId:string;companyId:string;job:{id:string;title:string;status:string;archivedAt:Date|null}};
export function buildRecruiterActionQueue(input:{
 jobs:readonly Job[];collegeId:string;companyId:string;unread:number;
}) {
 const live=input.jobs.filter(row=>row.collegeId===input.collegeId&&row.companyId===input.companyId&&
   row.job.status==="PUBLISHED"&&row.job.archivedAt===null).slice(0,3);
 const actions=live.map(row=>({
   key:"review:"+row.job.id,label:"Review shared applicants · "+row.job.title,
   description:"Open the employer-visible shortlist and notes. No unshared applications are included.",
   href:recruiterTodayHref({kind:"REVIEW_APPLICANTS",jobId:row.job.id}),
 }));
 if(input.unread>0)actions.push({
   key:"messages",label:"Read "+input.unread+" unread notifications",
   description:"Open your college-scoped messages and notifications.",
   href:recruiterTodayHref({kind:"MESSAGES"})+"?collegeId="+encodeURIComponent(input.collegeId)+"&unreadOnly=true",
 });
 return actions;
}
