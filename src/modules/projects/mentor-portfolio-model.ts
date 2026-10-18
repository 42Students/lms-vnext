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
  age: z.enum(["ALL","LAST_7_DAYS","LAST_30_DAYS","OLDER_THAN_7_DAYS","OLDER_THAN_30_DAYS"]).default("ALL"),
  ...paging,
}).strict();
export const mentorActivityQuerySchema = z.object({
  assignment:z.enum(["ALL","PRIMARY","SUPPORTING"]).default("ALL"),
  projectId:z.preprocess(v=>v===""?undefined:v,z.string().uuid().optional()),
  projectStatus:z.enum(["ALL","PLANNED","ACTIVE","COMPLETED","ARCHIVED"]).default("ALL"),
  search:z.string().trim().max(120).default(""),
  order:z.enum(["NEWEST","OLDEST"]).default("NEWEST"),
  window: z.enum(["ALL","PAST_7_DAYS","PAST_30_DAYS","PAST_90_DAYS","OLDER_THAN_30_DAYS"]).default("ALL"),
  importance: z.enum(["ALL","LOW","NORMAL","HIGH","CRITICAL"]).default("ALL"),
  view: z.enum(["ALL","PROJECT","REVIEWS","MEETINGS","TASKS","EVALUATIONS","SPRINTS","ASSIGNMENTS","RESOURCES","TEAM","DELIVERIES"]).default("ALL"),
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
  age: "ALL"|"LAST_7_DAYS"|"LAST_30_DAYS"|"OLDER_THAN_7_DAYS"|"OLDER_THAN_30_DAYS" = "ALL", now: Date = new Date(),
) {
  const term = search.trim().toLowerCase();
  return alerts.filter(a => a.kind === "REVIEW")
    .filter(a => { if(age==="ALL")return true;
      const elapsed=now.getTime()-new Date(a.occurredAt).getTime();
      if(!Number.isFinite(elapsed)||elapsed<0)return false;
      if(age==="OLDER_THAN_7_DAYS" || age==="OLDER_THAN_30_DAYS")
        return elapsed>(age==="OLDER_THAN_30_DAYS"?30:7)*86400000;
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
    case "projects.project.completed": return "Project completed";
    case "projects.project.deleted": return "Project deleted";
    case "projects.mentor.reassigned": return "Mentor reassigned";
    case "projects.readiness.overridden": return "Readiness decision updated";
    case "projects.sprint.updated": return "Sprint details updated";
    case "projects.team_member.added": return "Project team member added";
    case "projects.team_member.updated": return "Project team member updated";
    case "projects.team_member.ended": return "Project team membership ended";
    case "projects.resource.created": return "Project resource added";
    case "projects.resource.updated": return "Project resource updated";
    case "projects.resource.archived": return "Project resource archived";
    case "projects.task.created": return "Project task created";
    case "projects.task.details_updated": return "Task details updated";
    case "projects.task.submitted": return "Task submission";
    case "projects.task.reviewed": return "Task review decision recorded";
    case "projects.delivery.draft_created": return "Final delivery draft created";
    case "projects.delivery.draft_updated": return "Final delivery draft updated";
    case "projects.delivery.submitted": return "Final delivery submitted";
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
export const mentorActivityFormLayout = "grid w-full min-w-0 max-w-full grid-cols-1 gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2 xl:grid-cols-4 [&_label]:w-full [&_label]:min-w-0 [&_label]:max-w-full [&_input]:w-full [&_input]:min-w-0 [&_input]:max-w-full [&_select]:w-full [&_select]:min-w-0 [&_select]:max-w-full [&_select]:truncate [&_button]:min-w-0 [&_a]:min-w-0";

/** Shared instant ensures one cutoff across every page of an activity export. */
export function mentorPortfolioActivityCutoff(
 window:"ALL"|"PAST_7_DAYS"|"PAST_30_DAYS"|"PAST_90_DAYS"|"OLDER_THAN_30_DAYS",
 now:Date,
):Date|null {
 if(window==="ALL")return null;
 const days=window==="PAST_7_DAYS"?7:window==="PAST_90_DAYS"?90:30;
 return new Date(now.getTime()-days*86400000);
}
export function mentorActivityPagination(total:number, requested:number, pageSize:number){
 // The service normally passes schema-validated page numbers, but this
 // exported presentation boundary must never emit NaN/Infinity into links
 // when a caller receives malformed pagination metadata.
 const safeTotal=Number.isSafeInteger(total)&&total>=0?total:0;
 const safePageSize=Number.isSafeInteger(pageSize)&&pageSize>=1&&pageSize<=50?pageSize:20;
 const totalPages=Math.max(1,Math.ceil(safeTotal/safePageSize));
 const page=Number.isSafeInteger(requested)&&requested>=1?Math.min(requested,totalPages):1;
 return {page,pageSize:safePageSize,total:safeTotal,totalPages};
}

/** Search only project titles from the live, persisted assigned-Mentor roster. */
export function mentorActivityProjectTitleMatch(title:string,search:string){
 return title.toLocaleLowerCase("en-IN").includes(search.trim().toLocaleLowerCase("en-IN"));
}

/** Registered event severity, never private audit metadata. */
export function mentorActivityImportanceLabel(importance:string){
 switch(importance){
  case "LOW":return "Low importance";
  case "NORMAL":return "Normal importance";
  case "HIGH":return "High importance";
  case "CRITICAL":return "Critical importance";
  default:return "Importance not classified";
 }
}

export type MentorActivityQuery = z.infer<typeof mentorActivityQuerySchema>;

/** Responsive queue filters do not impose large minimum grid widths. */
export const mentorDeliveryReviewMobileForm =
  "flex min-w-0 max-w-full flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4 [&_label]:min-w-0 [&_label]:max-w-full [&_input]:min-w-0 [&_input]:max-w-full [&_select]:min-w-0 [&_select]:max-w-full";
