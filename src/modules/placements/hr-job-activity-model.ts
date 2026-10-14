import {z} from "zod";
export const hrActivityQuerySchema=z.strictObject({
  collegeId:z.string().uuid().optional(),
  limit:z.coerce.number().int().min(1).max(100).default(40),
  kind:z.enum(["ALL","PUBLISHED","CLOSED"]).default("ALL"),
  page:z.coerce.number().int().min(1).max(10000).default(1),
  q:z.string().trim().max(120).default(""),
});
export const HR_JOB_EVENT_TYPES=["placements.job.published","placements.job.closed"] as const;
export type HrJobEvent={id:string;subjectId:string;eventType:string;occurredAt:Date};
export function projectHrJobActivity(
 events:readonly HrJobEvent[],jobs:readonly {id:string;title:string}[]
) {
 const names=new Map(jobs.map(job=>[job.id,job.title]));
 return events.filter(e=>names.has(e.subjectId)&&
  HR_JOB_EVENT_TYPES.some(type=>type===e.eventType)).map(e=>({
  id:e.id,jobId:e.subjectId,title:names.get(e.subjectId)!,
  status:e.eventType===HR_JOB_EVENT_TYPES[0]?"Published":"Closed",occurredAt:e.occurredAt,
 })).sort((a,b)=>b.occurredAt.getTime()-a.occurredAt.getTime()||b.id.localeCompare(a.id));
}

export function hrActivityEventFilter(kind:"ALL"|"PUBLISHED"|"CLOSED") {
 return kind==="PUBLISHED"?["placements.job.published"] as const:
  kind==="CLOSED"?["placements.job.closed"] as const:HR_JOB_EVENT_TYPES;
}

export function hrActivityHasNext(fetched:number,limit:number){return fetched>limit;}

export function searchHrActivityJobs<T extends {title:string}>(jobs:readonly T[],q:string):T[]{
 const needle=q.trim().toLocaleLowerCase();
 return needle?jobs.filter(job=>job.title.toLocaleLowerCase().includes(needle)):[...jobs];
}
