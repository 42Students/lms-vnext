import {z} from "zod";
export const mentorTimelineQuerySchema=z.object({
  projectId:z.string().uuid(),
  releaseStatus:z.enum(["ALL","PLANNED","IN_PROGRESS","SHIPPED"]).default("ALL"),
  page:z.coerce.number().int().min(1).max(10000).default(1),
}).strict();
export type MentorTimelineQuery=z.infer<typeof mentorTimelineQuerySchema>;

type Release={id:string;title:string;sequence:number;status:string;};
type Sprint={id:string;releaseId:string;title:string;sequence:number;status:string;};
type Task={sprintId:string;status:string;};
export function mentorProjectTimeline(
  releases:readonly Release[],sprints:readonly Sprint[],tasks:readonly Task[],
  query:MentorTimelineQuery,
){
  const filtered=releases.filter(release=>
    query.releaseStatus==="ALL"||release.status===query.releaseStatus)
    .sort((a,b)=>a.sequence-b.sequence||a.id.localeCompare(b.id));
  const total=filtered.length,pageSize=10;
  const totalPages=Math.max(1,Math.ceil(total/pageSize));
  const page=Math.min(query.page,totalPages);
  const shown=filtered.slice((page-1)*pageSize,page*pageSize);
  return {
    total,page,pageSize,totalPages,
    items:shown.map(release=>({
      ...release,sprints:sprints.filter(s=>s.releaseId===release.id)
        .sort((a,b)=>a.sequence-b.sequence||a.id.localeCompare(b.id))
        .map(sprint=>{
          const group=tasks.filter(t=>t.sprintId===sprint.id);
          const done=group.filter(t=>t.status==="DONE").length;
          return {
            ...sprint,taskCount:group.length,doneCount:done,
            progressPercent:group.length>0?Math.round(done/group.length*100):null,
          };
        }),
    })),
  };
}
export function mentorTimelineHref(query:MentorTimelineQuery){
  const params=new URLSearchParams();
  if(query.releaseStatus!=="ALL")params.set("releaseStatus",query.releaseStatus);
  if(query.page>1)params.set("page",String(query.page));
  const suffix=params.toString();
  return "/mentor/projects/"+encodeURIComponent(query.projectId)+
    "/timeline"+(suffix?"?"+suffix:"");
}
