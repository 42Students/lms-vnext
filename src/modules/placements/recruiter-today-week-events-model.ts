import type {PlacementCalendarEvent} from "./placement-calendar-model";
type Due={id:string;jobId:string;jobTitle:string;roundName:string;dueAt:Date};
export function recruiterTodayWeekEvents(input:{
 events:readonly PlacementCalendarEvent[];
 resultsDue:readonly Due[];
 allowedJobs:readonly string[];
 now:Date;
}){
 const allowed=new Set(input.allowedJobs);
 const start=new Date(input.now.getTime());
 const end=start.getTime()+8*86400000;
 const row=input.events.filter(e=>e.jobId!==null&&allowed.has(e.jobId)&&e.startsAt.getTime()>=start.getTime()&&e.startsAt.getTime()<end)
  .map(e=>({
    id:e.id,kind:e.kind==="APPLICATION_DEADLINE"?"DEADLINE":e.kind==="INTERVIEW_SLOT"?"SLOT":"ROUND",
    startsAt:e.startsAt,title:e.title,jobTitle:e.jobTitle??"Hiring drive",
    href:"/recruiter/drives/"+encodeURIComponent(e.jobId!)+(e.kind==="APPLICATION_DEADLINE"?"?tab=overview":"?tab=rounds"+(e.roundId?"&roundId="+encodeURIComponent(e.roundId):"")),
  }));
 const results=input.resultsDue.filter(e=>allowed.has(e.jobId)&&e.dueAt.getTime()>=start.getTime()&&e.dueAt.getTime()<end)
  .map(e=>({id:"results:"+e.id,kind:"RESULTS_DUE",startsAt:e.dueAt,title:"Results due · "+e.roundName,
    jobTitle:e.jobTitle,href:"/recruiter/drives/"+encodeURIComponent(e.jobId)+"?tab=rounds&roundId="+encodeURIComponent(e.id)}));
 return [...row,...results].sort((a,b)=>a.startsAt.getTime()-b.startsAt.getTime()||a.id.localeCompare(b.id)).slice(0,8);
}
