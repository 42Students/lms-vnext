import {z} from "zod";
export const mentorTimelineQuerySchema=z.object({
  projectId:z.string().uuid(),
  releaseStatus:z.enum(["ALL","PLANNED","IN_PROGRESS","SHIPPED"]).default("ALL"),
  sprintStatus:z.enum(["ALL","PLANNED","ACTIVE","COMPLETED"]).default("ALL"),
  page:z.coerce.number().int().min(1).max(10000).default(1),
}).strict();
export type MentorTimelineQuery=z.infer<typeof mentorTimelineQuerySchema>;

type Release={id:string;title:string;sequence:number;status:string;};
type Sprint={id:string;releaseId:string;title:string;sequence:number;status:string;startDate?:string|null;dueDate?:string|null;};
type Task={sprintId:string|null;status:string;};
export type LegacySprintProgressStatus="UPCOMING"|"IN_PROGRESS"|"COMPLETED"|"OVERDUE";
/** Legacy sprintStatus was a progress badge independent of sprintState,
 * the separate actionable PLANNED/ACTIVE/COMPLETED lifecycle field. */
export function derivedSprintProgressStatus(input:{
 state:string;completedTasks:number;totalTasks:number;
 startDate?:string|null;dueDate?:string|null;
},today=new Date()):LegacySprintProgressStatus{
 const midnight=new Intl.DateTimeFormat("en-CA",{
  timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit"
 }).format(today);
 if(input.state==="COMPLETED"||
  (input.totalTasks>0&&input.completedTasks===input.totalTasks))return "COMPLETED";
 if(input.dueDate&&input.dueDate<midnight)return "OVERDUE";
 if(input.state==="ACTIVE"||input.completedTasks>0||
   (input.startDate!==undefined&&input.startDate!==null&&input.startDate<=midnight))
  return "IN_PROGRESS";
 return "UPCOMING";
}

export function mentorProjectTimeline(
  releases:readonly Release[],sprints:readonly Sprint[],tasks:readonly Task[],
  query:Pick<MentorTimelineQuery,"projectId"|"releaseStatus"|"page"> &
    {sprintStatus?:MentorTimelineQuery["sprintStatus"]},
){
  const filtered=releases.filter(release=>
    (query.releaseStatus==="ALL"||release.status===query.releaseStatus)&&
    (!query.sprintStatus||query.sprintStatus==="ALL"||
      sprints.some(s=>s.releaseId===release.id&&s.status===query.sprintStatus)))
    .sort((a,b)=>a.sequence-b.sequence||a.id.localeCompare(b.id));
  const total=filtered.length,pageSize=10;
  const totalPages=Math.max(1,Math.ceil(total/pageSize));
  const page=Number.isSafeInteger(query.page)?Math.max(1,Math.min(query.page,totalPages)):1;
  const shown=filtered.slice((page-1)*pageSize,page*pageSize);
  return {
    total,page,pageSize,totalPages,
    items:shown.map(release=>({
      ...release,sprints:sprints.filter(s=>s.releaseId===release.id&&
        (!query.sprintStatus||query.sprintStatus==="ALL"||s.status===query.sprintStatus))
        .sort((a,b)=>a.sequence-b.sequence||a.id.localeCompare(b.id))
        .map(sprint=>{
          const group=tasks.filter(t=>t.sprintId===sprint.id);
          const done=group.filter(t=>t.status==="DONE").length;
          return {
            ...sprint,taskCount:group.length,doneCount:done,
            progressPercent:group.length>0?Math.round(done/group.length*100):null,
            derivedStatus:derivedSprintProgressStatus({state:sprint.status,
              completedTasks:done,totalTasks:group.length,
              startDate:sprint.startDate,dueDate:sprint.dueDate}),
          };
        }),
    })),
  };
}
export function mentorTimelineHref(query:Pick<MentorTimelineQuery,"projectId"|"releaseStatus"|"page"> & {sprintStatus?:MentorTimelineQuery["sprintStatus"]}){
  const params=new URLSearchParams();
  if(query.releaseStatus!=="ALL")params.set("releaseStatus",query.releaseStatus);
  if(query.sprintStatus&&query.sprintStatus!=="ALL")params.set("sprintStatus",query.sprintStatus);
  if(query.page>1)params.set("page",String(query.page));
  const suffix=params.toString();
  return "/mentor/projects/"+encodeURIComponent(query.projectId)+
    "/timeline"+(suffix?"?"+suffix:"");
}
