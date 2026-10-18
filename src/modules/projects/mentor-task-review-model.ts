import { z } from "zod";

export const mentorTaskReviewQuerySchema = z.object({
  assignment:z.enum(["ALL","PRIMARY","SUPPORTING"]).default("ALL"),
  search: z.string().trim().max(120).default(""),
  projectId: z.preprocess(v=>v===""?undefined:v,z.string().uuid().optional()),
  priority: z.enum(["ALL","LOW","MEDIUM","HIGH","CRITICAL"]).default("ALL"),
  version: z.preprocess(v=>v===""?undefined:v,z.coerce.number().int().min(1).max(100000).optional()),
  age: z.enum(["ALL","LAST_7_DAYS","OLDER_THAN_7_DAYS","OLDER_THAN_30_DAYS"]).default("ALL"),
  order: z.enum(["NEWEST","OLDEST","PRIORITY"]).default("NEWEST"),
  page: z.coerce.number().int().min(1).max(10000).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
}).strict();

/** Escape LIKE metacharacters; this queue searches literal human text. */
export function mentorTaskReviewLiteralSearch(input:string){
 return input.replaceAll("\\","\\\\").replaceAll("%","\\%").replaceAll("_","\\_");
}
export function mentorTaskReviewTargetHref(projectId:string,taskId:string){
 const project=z.string().uuid().parse(projectId);
 const task=z.string().uuid().parse(taskId);
 return "/mentor/projects/"+encodeURIComponent(project)+
   "?tab=board#mentor-task-"+encodeURIComponent(task);
}
export function mentorTaskReviewHref(query: {
  search?: string; page?: number; pageSize?: number;
  priority?: string; order?: string; version?: number; age?: string; projectId?: string; assignment?:string;
}) {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.projectId)params.set("projectId",query.projectId);
  if (query.assignment && query.assignment!=="ALL")params.set("assignment",query.assignment);
  if (query.priority&&query.priority!=="ALL")params.set("priority",query.priority);
  if (query.version!==undefined)params.set("version",String(query.version));
  if (query.order&&query.order!=="NEWEST")params.set("order",query.order);
  if (query.age&&query.age!=="ALL")params.set("age",query.age);
  if (query.page && query.page > 1) params.set("page", String(query.page));
  if (query.pageSize && query.pageSize !== 20) params.set("pageSize", String(query.pageSize));
  const suffix = params.toString();
  return "/mentor/task-reviews" + (suffix ? "?" + suffix : "");
}

/** All controls fit within a 375px viewport without horizontal document scroll. */
export const mentorTaskReviewMobileLayout="min-w-0 max-w-full space-y-6 overflow-x-clip";
export const mentorTaskReviewMobileFilters=
 "flex min-w-0 max-w-full flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4 [&_label]:min-w-0 [&_label]:max-w-full [&_input]:w-full [&_input]:min-w-0 [&_select]:max-w-full [&_select]:min-w-0";

export function mentorTaskReviewSummary(input: {
  total: number; page: number; pageSize: number;
}) {
  const total=Number.isSafeInteger(input.total)&&input.total>0?input.total:0;
  const pageSize=Number.isSafeInteger(input.pageSize)&&input.pageSize>=1&&input.pageSize<=50?input.pageSize:20;
  const totalPages=Math.max(1,Math.ceil(total/pageSize));
  const page=Number.isSafeInteger(input.page)?Math.max(1,Math.min(input.page,totalPages)):1;
  return {total,page,pageSize,totalPages,
    first:total===0?0:(page-1)*pageSize+1,
    last:Math.min(total,page*pageSize),
  };
}

/** Shared cutoff keeps the SQL queue's persisted submit-age filters testable. */
export function mentorTaskReviewAgeBoundary(
  age:"ALL"|"LAST_7_DAYS"|"OLDER_THAN_7_DAYS"|"OLDER_THAN_30_DAYS",
  now: Date,
){
 if(age==="ALL")return null;
 const days=age==="OLDER_THAN_30_DAYS"?30:7;
 return {cutoff:new Date(now.getTime()-days*86400000),
   older:age==="OLDER_THAN_7_DAYS"||age==="OLDER_THAN_30_DAYS"};
}

/** Export the complete current review scope, never only its visible first filters. */
export function mentorTaskReviewExportHref(query: {
  search?:string;projectId?:string;assignment?:string;priority?:string;
  version?:number;age?:string;order?:string;
}) {
  const listing=mentorTaskReviewHref({...query,page:1,pageSize:20});
  const suffix=listing.includes("?")?listing.slice(listing.indexOf("?")):"";
  return "/api/mentor/task-reviews/export"+suffix;
}
