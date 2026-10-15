import { z } from "zod";

export const mentorProjectActivityQuerySchema=z.object({
  projectId:z.string().uuid(),
  importance:z.enum(["ALL","LOW","NORMAL","HIGH","CRITICAL"]).default("ALL"),
  view:z.enum(["ALL","PROJECT","REVIEWS","MEETINGS","TASKS","EVALUATIONS","SPRINTS"]).default("ALL"),
  window:z.enum(["ALL","LAST_7_DAYS","LAST_30_DAYS"]).default("ALL"),
  page:z.coerce.number().int().min(1).max(10000).default(1),
}).strict();
export type MentorProjectActivityQuery=z.infer<typeof mentorProjectActivityQuerySchema>;

/** Exact allowlists avoid inferring an event type from unsafe metadata. */
export function mentorProjectActivityEventTypes(view:MentorProjectActivityQuery["view"]){
  if(view==="ALL")return null;
  if(view==="PROJECT")return [
    "projects.project.created","projects.project.archived",
    "projects.project.restored","projects.project.completed",
  ];
  if(view==="SPRINTS")return ["projects.sprint.updated"];
  if(view==="EVALUATIONS")return ["projects.evaluation.recorded"];
  if(view==="REVIEWS")return [
    "projects.task.reviewed","projects.delivery.reviewed",
  ];
  if(view==="MEETINGS")return [
    "projects.meeting.decided","projects.meeting.notes_updated",
    "projects.meeting.rescheduled",
  ];
  return ["projects.task.created","projects.task.details_updated",
    "projects.task.status_changed","projects.task.submitted"];
}
export function mentorProjectActivityPage(total:number,requested:number) {
  const pageSize=20;
  const totalPages=Math.max(1,Math.ceil(total/pageSize));
  const page=Math.min(requested,totalPages);
  return {total,pageSize,totalPages,page};
}

/** Rolling 7x24h / 30x24h window over stored instants, never a local timezone guess. */
export function mentorProjectActivitySince(window:"ALL"|"LAST_7_DAYS"|"LAST_30_DAYS",now:Date){
  if(window==="ALL")return null;
  return new Date(now.getTime()-(window==="LAST_7_DAYS"?7:30)*86400000);
}
export function mentorProjectActivityHref(query:Pick<MentorProjectActivityQuery,"projectId"|"importance"|"view"|"page"> & {window?:MentorProjectActivityQuery["window"]}) {
  const params=new URLSearchParams();
  if(query.importance!=="ALL")params.set("importance",query.importance);
  if(query.view!=="ALL")params.set("view",query.view);
  if(query.window&&query.window!=="ALL")params.set("window",query.window);
  if(query.page>1)params.set("page",String(query.page));
  const suffix=params.toString();
  return "/mentor/projects/"+encodeURIComponent(query.projectId)+"/activity-history"+
    (suffix?"?"+suffix:"");
}
