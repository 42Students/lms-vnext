import { z } from "zod";

export const mentorTaskReviewQuerySchema = z.object({
  search: z.string().trim().max(120).default(""),
  priority: z.enum(["ALL","LOW","MEDIUM","HIGH","CRITICAL"]).default("ALL"),
  version: z.preprocess(v=>v===""?undefined:v,z.coerce.number().int().min(1).max(100000).optional()),
  age: z.enum(["ALL","LAST_7_DAYS","OLDER_THAN_7_DAYS"]).default("ALL"),
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
  priority?: string; order?: string; version?: number; age?: string;
}) {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.priority&&query.priority!=="ALL")params.set("priority",query.priority);
  if (query.version!==undefined)params.set("version",String(query.version));
  if (query.order&&query.order!=="NEWEST")params.set("order",query.order);
  if (query.age&&query.age!=="ALL")params.set("age",query.age);
  if (query.page && query.page > 1) params.set("page", String(query.page));
  if (query.pageSize && query.pageSize !== 20) params.set("pageSize", String(query.pageSize));
  const suffix = params.toString();
  return "/mentor/task-reviews" + (suffix ? "?" + suffix : "");
}

export function mentorTaskReviewSummary(input: {
  total: number; page: number; pageSize: number;
}) {
  const totalPages=Math.max(1,Math.ceil(input.total/input.pageSize));
  const page=Math.min(input.page,totalPages);
  return {total:input.total,page,pageSize:input.pageSize,totalPages,
    first:input.total===0?0:(page-1)*input.pageSize+1,
    last:Math.min(input.total,page*input.pageSize),
  };
}
