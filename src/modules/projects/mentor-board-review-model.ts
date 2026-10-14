import { z } from "zod";

export const mentorBoardReviewQuerySchema=z.object({
  projectId:z.string().uuid(),
  status:z.enum(["ALL","TODO","IN_PROGRESS","BLOCKED","IN_REVIEW","DONE"]).default("ALL"),
  priority:z.enum(["ALL","LOW","MEDIUM","HIGH","CRITICAL"]).optional(),
  sprintId:z.union([z.literal("ALL"),z.string().uuid()]).optional(),
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
    (!query.priority||query.priority==="ALL"||task.priority===query.priority)&&
    (!query.sprintId||query.sprintId==="ALL"||task.sprintId===query.sprintId)&&
    (!term||task.title.toLowerCase().includes(term)||
      (nameBySprint.get(task.sprintId)??"").toLowerCase().includes(term)))
    .sort((a,b)=>(positionBySprint.get(a.sprintId)??Number.MAX_SAFE_INTEGER)-
      (positionBySprint.get(b.sprintId)??Number.MAX_SAFE_INTEGER)||
      a.sequence-b.sequence||a.id.localeCompare(b.id));
  const total=matching.length,pageSize=20,totalPages=Math.max(1,Math.ceil(total/pageSize));
  const page=Math.min(query.page,totalPages);
  const projectRow=(task:Task)=>({
    id:task.id,title:task.title,priority:task.priority,status:task.status,
    sprintTitle:nameBySprint.get(task.sprintId)??"Sprint unavailable",
  });
  return {
    count:tasks.length,totals,
    completedPercent:tasks.length>0?Math.round(totals.DONE/tasks.length*100):null,
    total,page,pageSize,totalPages,
    sprints:sprints.map(s=>({id:s.id,title:s.title})),
    items:matching.slice((page-1)*pageSize,page*pageSize).map(projectRow),
    exportItems:matching.slice(0,500).map(projectRow),
    exportOmitted:Math.max(0,total-500),
  };
}
export function mentorBoardReviewHref(query:MentorBoardReviewQuery){
  const params=new URLSearchParams();
  if(query.status!=="ALL")params.set("status",query.status);
  if(query.priority&&query.priority!=="ALL")params.set("priority",query.priority);
  if(query.sprintId&&query.sprintId!=="ALL")params.set("sprintId",query.sprintId);
  if(query.search)params.set("search",query.search);
  if(query.page>1)params.set("page",String(query.page));
  const suffix=params.toString();
  return "/mentor/projects/"+encodeURIComponent(query.projectId)+
    "/board-review"+(suffix?"?"+suffix:"");
}
export function csvSafeCell(value:string|number|null){
  const text=String(value??"");
  const safe=/^[\s]*[=+@\-\t\r]/.test(text)?"'"+text:text;
  return '"'+safe.replaceAll('"','""')+'"';
}
export function mentorBoardExportCsv(
  rows:readonly {id:string;title:string;status:string;priority:string;sprintTitle:string}[],
  omitted:number,
){
  const lines=["Task ID,Title,Status,Priority,Sprint"];
  for(const row of rows)lines.push(
    [row.id,row.title,row.status,row.priority,row.sprintTitle].map(csvSafeCell).join(","));
  if(omitted>0)lines.push(["","Export truncated",omitted+" additional matching tasks","",""]
    .map(csvSafeCell).join(","));
  return "\uFEFF"+lines.join("\r\n")+"\r\n";
}
