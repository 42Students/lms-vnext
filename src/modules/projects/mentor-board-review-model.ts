import {z} from "zod";
export const mentorBoardReviewQuerySchema=z.object({
  projectId:z.string().uuid(),
  status:z.enum(["ALL","TODO","IN_PROGRESS","BLOCKED","IN_REVIEW","DONE"]).default("ALL"),
  search:z.string().trim().max(100).default(""),
  page:z.coerce.number().int().min(1).max(10000).default(1),
}).strict();
export type MentorBoardReviewQuery=z.infer<typeof mentorBoardReviewQuerySchema>;
type Task={id:string;sprintId:string;title:string;priority:string;status:string;sequence:number};
type Sprint={id:string;title:string;sequence:number};
export function mentorBoardReview(tasks:readonly Task[],sprints:readonly Sprint[],
  query:MentorBoardReviewQuery){
  const categories=["TODO","IN_PROGRESS","BLOCKED","IN_REVIEW","DONE"] as const;
  const totals=Object.fromEntries(categories.map(status=>[
    status,tasks.filter(task=>task.status===status).length,
  ])) as Record<(typeof categories)[number],number>;
  const nameBySprint=new Map(sprints.map(row=>[row.id,row.title]));
  const positionBySprint=new Map(sprints.map(row=>[row.id,row.sequence]));
  const term=query.search.toLowerCase();
  const matching=tasks.filter(task=>
    (query.status==="ALL"||task.status===query.status)&&
    (!term||task.title.toLowerCase().includes(term)||
      (nameBySprint.get(task.sprintId)??"").toLowerCase().includes(term)))
    .sort((a,b)=>(positionBySprint.get(a.sprintId)??Number.MAX_SAFE_INTEGER)-
      (positionBySprint.get(b.sprintId)??Number.MAX_SAFE_INTEGER)||
      a.sequence-b.sequence||a.id.localeCompare(b.id));
  const total=matching.length,pageSize=20,totalPages=Math.max(1,Math.ceil(total/pageSize));
  const page=Math.min(query.page,totalPages);
  return {
    count:tasks.length,totals,
    completedPercent:tasks.length>0?Math.round(totals.DONE/tasks.length*100):null,
    total,page,pageSize,totalPages,
    items:matching.slice((page-1)*pageSize,page*pageSize).map(task=>({
      id:task.id,title:task.title,priority:task.priority,status:task.status,
      sprintTitle:nameBySprint.get(task.sprintId)??"Sprint unavailable",
    })),
  };
}
export function mentorBoardReviewHref(query:MentorBoardReviewQuery){
  const params=new URLSearchParams();
  if(query.status!=="ALL")params.set("status",query.status);
  if(query.search)params.set("search",query.search);
  if(query.page>1)params.set("page",String(query.page));
  const suffix=params.toString();
  return "/mentor/projects/"+encodeURIComponent(query.projectId)+
    "/board-review"+(suffix?"?"+suffix:"");
}
