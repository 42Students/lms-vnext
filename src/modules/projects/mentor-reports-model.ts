import {z} from "zod";
import {csvSafeCell} from "./mentor-board-review-model";
import type {MentorProjectAttention} from "./mentor-attention";

export const mentorReportsQuerySchema=z.object({
  status:z.enum(["ALL","PLANNED","ACTIVE","COMPLETED","ARCHIVED"]).default("ALL"),
  taskCoverage:z.enum(["ALL","NO_TASKS","OPEN_TASKS","ALL_DONE"]).default("ALL"),
  attention:z.enum(["ALL","REVIEW","STALLED","REQUESTED","MEETING_SOON","NONE"]).default("ALL"),
  assignment:z.enum(["ALL","PRIMARY","SUPPORTING"]).default("ALL"),
  order:z.enum(["UPDATED","TITLE_AZ","TITLE_ZA"]).default("UPDATED"),
  search:z.string().trim().max(120).default(""),
  page:z.coerce.number().int().min(1).max(10000).default(1),
}).strict();
export type MentorReportsQuery=z.infer<typeof mentorReportsQuerySchema>;
export type MentorReportProject={
  id:string;title:string;status:string;isPrimaryMentor:boolean;updatedAt:Date;
};
export function mentorReportsOverview(
  projects:readonly MentorReportProject[],
  alerts:readonly Pick<MentorProjectAttention,"projectId"|"kind">[],
  query:MentorReportsQuery,
  taskCounts:ReadonlyMap<string,{total:number;open:number}>=new Map(),
){
  const statuses=["PLANNED","ACTIVE","COMPLETED","ARCHIVED"] as const;
  const alertKinds=["REVIEW","STALLED","REQUESTED","MEETING_SOON"] as const;
  const statusCounts=Object.fromEntries(statuses.map(status=>[
    status,projects.filter(p=>p.status===status).length,
  ])) as Record<(typeof statuses)[number],number>;
  const allowed=new Set(projects.map(p=>p.id));
  const kinds=new Map<string,Set<string>>();
  for(const alert of alerts){
    if(!allowed.has(alert.projectId))continue;
    const set=kinds.get(alert.projectId)??new Set<string>();
    set.add(alert.kind);
    kinds.set(alert.projectId,set);
  }
  const attentionCounts=Object.fromEntries(alertKinds.map(kind=>[
    kind,projects.filter(p=>kinds.get(p.id)?.has(kind)).length,
  ])) as Record<(typeof alertKinds)[number],number>;
  const term=query.search.toLocaleLowerCase("en-IN");
  const filtered=projects.filter(p=>
    (query.taskCoverage==="ALL"||
      (query.taskCoverage==="NO_TASKS"&&(taskCounts.get(p.id)?.total??0)===0)||
      (query.taskCoverage==="OPEN_TASKS"&&(taskCounts.get(p.id)?.open??0)>0)||
      (query.taskCoverage==="ALL_DONE"&&(taskCounts.get(p.id)?.total??0)>0&&
       (taskCounts.get(p.id)?.open??0)===0))&&
    (query.status==="ALL"||p.status===query.status)&&
    (query.assignment==="ALL"||
     (query.assignment==="PRIMARY")===p.isPrimaryMentor)&&
    (query.attention==="ALL"||
      (query.attention==="NONE"?!kinds.get(p.id)?.size:kinds.get(p.id)?.has(query.attention)))&&
    (!term||p.title.toLocaleLowerCase("en-IN").includes(term)))
    .sort((a,b)=>query.order==="TITLE_AZ"
      ? a.title.localeCompare(b.title)||a.id.localeCompare(b.id)
      : query.order==="TITLE_ZA"
        ? b.title.localeCompare(a.title)||a.id.localeCompare(b.id)
        : b.updatedAt.getTime()-a.updatedAt.getTime()||
          a.title.localeCompare(b.title)||a.id.localeCompare(b.id));
  const total=filtered.length,pageSize=20,totalPages=Math.max(1,Math.ceil(total/pageSize));
  const page=Math.min(query.page,totalPages);
  const projectRow=(p:MentorReportProject)=>({
    id:p.id,title:p.title,status:p.status,isPrimaryMentor:p.isPrimaryMentor,
    updatedAt:p.updatedAt,attention:[...(kinds.get(p.id)??[])].sort(),
  });
  return {projectCount:projects.length,primaryMentorCount:projects.filter(p=>p.isPrimaryMentor).length,
    statusCounts,attentionCounts,total,page,pageSize,totalPages,
    items:filtered.slice((page-1)*pageSize,page*pageSize).map(projectRow),
    exportItems:filtered.slice(0,100).map(projectRow),
    exportOmitted:Math.max(0,total-100),
  };
}
export function mentorReportsHref(query:MentorReportsQuery){
  const params=new URLSearchParams();
  if(query.taskCoverage!=="ALL")params.set("taskCoverage",query.taskCoverage);
  if(query.status!=="ALL")params.set("status",query.status);
  if(query.attention!=="ALL")params.set("attention",query.attention);
  if(query.assignment!=="ALL")params.set("assignment",query.assignment);
  if(query.order!=="UPDATED")params.set("order",query.order);
  if(query.search)params.set("search",query.search);
  if(query.page>1)params.set("page",String(query.page));
  return "/mentor/reports"+(params.size?"?"+params.toString():"");
}

/** Only current scoped status/attention metadata. No raw learners or contact exports. */
export function mentorReportsCsv(rows:readonly {
  id:string;title:string;status:string;isPrimaryMentor:boolean;
  updatedAt:Date;attention:readonly string[];
}[],omitted:number){
  const format=new Intl.DateTimeFormat("en-GB",{
    timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit",
    hour:"2-digit",minute:"2-digit",hourCycle:"h23",
  });
  const lines=["Project ID,Project,Status,Primary Mentor,Recorded attention,Updated (IST)"];
  for(const row of rows)lines.push([
    row.id,row.title,row.status,row.isPrimaryMentor?"Yes":"No",
    row.attention.join("; "),format.format(row.updatedAt)+" IST",
  ].map(csvSafeCell).join(","));
  if(omitted>0)lines.push(["","Truncated",omitted+" additional matching projects","","",""]
    .map(csvSafeCell).join(","));
  return "\uFEFF"+lines.join("\r\n")+"\r\n";
}
