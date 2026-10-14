import {z} from "zod";
import type {MentorProjectAttention} from "./mentor-attention";

export const mentorReportsQuerySchema=z.object({
  status:z.enum(["ALL","PLANNED","ACTIVE","COMPLETED","ARCHIVED"]).default("ALL"),
  attention:z.enum(["ALL","REVIEW","STALLED","REQUESTED","MEETING_SOON"]).default("ALL"),
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
    (query.status==="ALL"||p.status===query.status)&&
    (query.attention==="ALL"||kinds.get(p.id)?.has(query.attention))&&
    (!term||p.title.toLocaleLowerCase("en-IN").includes(term)))
    .sort((a,b)=>b.updatedAt.getTime()-a.updatedAt.getTime()||
      a.title.localeCompare(b.title)||a.id.localeCompare(b.id));
  const total=filtered.length,pageSize=20,totalPages=Math.max(1,Math.ceil(total/pageSize));
  const page=Math.min(query.page,totalPages);
  return {projectCount:projects.length,primaryMentorCount:projects.filter(p=>p.isPrimaryMentor).length,
    statusCounts,attentionCounts,total,page,pageSize,totalPages,
    items:filtered.slice((page-1)*pageSize,page*pageSize).map(p=>({
      id:p.id,title:p.title,status:p.status,isPrimaryMentor:p.isPrimaryMentor,
      updatedAt:p.updatedAt,attention:[...(kinds.get(p.id)??[])].sort(),
    }))};
}
export function mentorReportsHref(query:MentorReportsQuery){
  const params=new URLSearchParams();
  if(query.status!=="ALL")params.set("status",query.status);
  if(query.attention!=="ALL")params.set("attention",query.attention);
  if(query.search)params.set("search",query.search);
  if(query.page>1)params.set("page",String(query.page));
  return "/mentor/reports"+(params.size?"?"+params.toString():"");
}
