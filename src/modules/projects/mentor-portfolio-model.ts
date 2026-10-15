import { z } from "zod";
import type { MentorProjectAttention } from "./mentor-attention";

const paging = {
  page: z.coerce.number().int().min(1).max(10000).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
};
export const mentorReviewQuerySchema = z.object({
  assignment:z.enum(["ALL","PRIMARY","SUPPORTING"]).default("ALL"),
  projectId:z.preprocess(v=>v===""?undefined:v,z.string().uuid().optional()),
  projectStatus:z.enum(["ALL","PLANNED","ACTIVE","COMPLETED"]).default("ALL"),
  search: z.string().trim().max(120).default(""),
  order: z.enum(["NEWEST","OLDEST"]).default("NEWEST"),
  age: z.enum(["ALL","LAST_7_DAYS","LAST_30_DAYS","OLDER_THAN_7_DAYS"]).default("ALL"),
  ...paging,
}).strict();
export const mentorActivityQuerySchema = z.object({
  assignment:z.enum(["ALL","PRIMARY","SUPPORTING"]).default("ALL"),
  projectId:z.preprocess(v=>v===""?undefined:v,z.string().uuid().optional()),
  projectStatus:z.enum(["ALL","PLANNED","ACTIVE","COMPLETED","ARCHIVED"]).default("ALL"),
  search:z.string().trim().max(120).default(""),
  order:z.enum(["NEWEST","OLDEST"]).default("NEWEST"),
  window: z.enum(["ALL","PAST_7_DAYS","PAST_30_DAYS","OLDER_THAN_30_DAYS"]).default("ALL"),
  importance: z.enum(["ALL","LOW","NORMAL","HIGH","CRITICAL"]).default("ALL"),
  view: z.enum(["ALL","PROJECT","REVIEWS","MEETINGS","TASKS"]).default("ALL"),
  ...paging,
}).strict();

export function pageMentorPortfolio<T>(
  rows: readonly T[], query: { page: number; pageSize: number },
) {
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / query.pageSize));
  const page = Math.min(query.page, totalPages);
  return {
    total, totalPages, page, pageSize: query.pageSize,
    items: rows.slice((page - 1) * query.pageSize, page * query.pageSize),
  };
}
export function selectMentorReviewQueue(
  alerts: readonly MentorProjectAttention[], search: string,
  order: "NEWEST"|"OLDEST" = "NEWEST",
  age: "ALL"|"LAST_7_DAYS"|"LAST_30_DAYS"|"OLDER_THAN_7_DAYS" = "ALL", now: Date = new Date(),
) {
  const term = search.trim().toLowerCase();
  return alerts.filter(a => a.kind === "REVIEW")
    .filter(a => { if(age==="ALL")return true;
      const elapsed=now.getTime()-new Date(a.occurredAt).getTime();
      if(!Number.isFinite(elapsed)||elapsed<0)return false;
      if(age==="OLDER_THAN_7_DAYS")return elapsed>7*86400000;
      return elapsed<=(age==="LAST_7_DAYS"?7:30)*86400000;
    })
    .filter(a => !term ||
      [a.title, a.description].some(v => v.toLowerCase().includes(term)))
    .sort((a,b) => (order === "OLDEST"
      ? a.occurredAt.localeCompare(b.occurredAt)
      : b.occurredAt.localeCompare(a.occurredAt)) || a.key.localeCompare(b.key));
}
/** Raw activity summaries/metadata may contain personal details; emit fixed labels. */
export function safeMentorProjectEventLabel(eventType: string): string {
  switch (eventType) {
    case "projects.project.created": return "Project created";
    case "projects.project.archived": return "Project archived";
    case "projects.project.restored": return "Project restored";
    case "projects.project.deleted": return "Project deleted";
    case "projects.mentor.reassigned": return "Mentor reassigned";
    case "projects.readiness.overridden": return "Readiness decision updated";
    case "projects.sprint.updated": return "Sprint details updated";
    case "projects.task.created": return "Project task created";
    case "projects.task.details_updated": return "Task details updated";
    case "projects.task.submitted": return "Task submission";
    case "projects.task.reviewed": return "Task review decision recorded";
    case "projects.delivery.reviewed": return "Final delivery review decision recorded";
    case "projects.meeting.decided": return "Meeting decision recorded";
    case "projects.meeting.notes_updated": return "Meeting outcome notes updated";
    case "projects.meeting.rescheduled": return "Meeting rescheduled";
    case "projects.task.status_changed": return "Task status updated";
    case "projects.evaluation.recorded": return "Evaluation recorded";
    default: return "Project activity recorded";
  }
}
export function mentorPortfolioHref(
  area: "reviews" | "activity",
  query: { search?: string; page?: number; pageSize?: number; order?: string; assignment?: string; projectStatus?: string; age?: string; projectId?: string; importance?: string; view?: string; window?: string },
) {
  const params = new URLSearchParams();
  if (area === "reviews" && query.search) params.set("search", query.search);
  if (area === "reviews" && query.assignment && query.assignment !== "ALL") params.set("assignment",query.assignment);
  if (area === "reviews" && query.order && query.order !== "NEWEST") params.set("order", query.order);
  if (area === "reviews" && query.age && query.age !== "ALL") params.set("age",query.age);
  if (area === "reviews" && query.projectStatus && query.projectStatus !== "ALL")params.set("projectStatus",query.projectStatus);
  if (area === "reviews" && query.projectId)params.set("projectId",query.projectId);
  if (area === "activity" && query.search)params.set("search",query.search);
  if (area === "activity" && query.importance && query.importance !== "ALL") params.set("importance",query.importance);
  if (area === "activity" && query.view && query.view !== "ALL") params.set("view",query.view);
  if (area === "activity" && query.window && query.window !== "ALL")params.set("window",query.window);
  if (area === "activity" && query.order && query.order !== "NEWEST")params.set("order",query.order);
  if (area === "activity" && query.projectStatus && query.projectStatus !== "ALL")params.set("projectStatus",query.projectStatus);
  if (area === "activity" && query.projectId)params.set("projectId",query.projectId);
  if (area === "activity" && query.assignment && query.assignment !== "ALL")params.set("assignment",query.assignment);
  if (query.page && query.page > 1) params.set("page", String(query.page));
  if (query.pageSize && query.pageSize !== 20) params.set("pageSize", String(query.pageSize));
  return "/mentor/" + area + (params.size ? "?" + params.toString() : "");
}

/** Zero-min-width grid protects long assigned-project names on mobile. */
export const mentorActivityFormLayout = "grid min-w-0 w-full grid-cols-1 gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2 xl:grid-cols-4 [&_label]:w-full [&_label]:min-w-0 [&_select]:w-full [&_select]:min-w-0 [&_select]:max-w-full";

export function mentorActivityPagination(total:number, requested:number, pageSize:number){
 const totalPages=Math.max(1,Math.ceil(total/pageSize));
 const page=Math.max(1,Math.min(requested,totalPages));
 return {page,pageSize,total,totalPages};
}

/** Search only project titles from the live, persisted assigned-Mentor roster. */
export function mentorActivityProjectTitleMatch(title:string,search:string){
 return title.toLocaleLowerCase("en-IN").includes(search.trim().toLocaleLowerCase("en-IN"));
}
