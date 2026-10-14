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
  const registeredBySprint=new Map<string,number>();
  const selectedBySprint=new Map<string,{count:number;done:number;blocked:number;review:number}>();
  for(const task of tasks){
    registeredBySprint.set(task.sprintId,(registeredBySprint.get(task.sprintId)??0)+1);
  }
  for(const task of matching){
    const tally=selectedBySprint.get(task.sprintId)??{count:0,done:0,blocked:0,review:0};
    tally.count++;
    if(task.status==="DONE")tally.done++;
    if(task.status==="BLOCKED")tally.blocked++;
    if(task.status==="IN_REVIEW")tally.review++;
    selectedBySprint.set(task.sprintId,tally);
  }
  const sprintSummaries=sprints
    .filter(s=>!query.sprintId||query.sprintId==="ALL"||s.id===query.sprintId)
    .map(sprint=>{
      const state=selectedBySprint.get(sprint.id)??{count:0,done:0,blocked:0,review:0};
      return {id:sprint.id,title:sprint.title,
        registeredTasks:registeredBySprint.get(sprint.id)??0,
        matchingTasks:state.count,done:state.done,blocked:state.blocked,
        awaitingReview:state.review,
        matchingDonePercent:state.count>0?Math.round(state.done/state.count*100):null};
    });
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
    sprintSummaries,
    sprintSummaryExportItems:sprintSummaries.slice(0,100),
    sprintSummaryExportOmitted:Math.max(0,sprintSummaries.length-100),
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

/** Filter-aware, bounded Sprint summary. Empty selections are Unknown, never 100%. */
export function mentorSprintSummaryCsv(rows:readonly {
  id:string;title:string;registeredTasks:number;matchingTasks:number;
  done:number;blocked:number;awaitingReview:number;matchingDonePercent:number|null;
}[],omitted:number){
  const lines=["Sprint ID,Sprint,Registered tasks,Matching tasks,Done,Blocked,Awaiting review,Matching Done %"];
  for(const row of rows){
    lines.push([row.id,row.title,row.registeredTasks,row.matchingTasks,row.done,
      row.blocked,row.awaitingReview,row.matchingDonePercent??"Unknown"]
      .map(csvSafeCell).join(","));
  }
  if(omitted>0)lines.push(["","Export truncated",omitted+" additional matching Sprints","","","","",""]
    .map(csvSafeCell).join(","));
  return "\uFEFF"+lines.join("\r\n")+"\r\n";
}
