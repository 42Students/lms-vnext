import { z } from "zod";

export const mentorTaskHistoryQuerySchema = z.object({
  decision:z.enum(["ALL","APPROVED","CHANGES_REQUESTED"]).default("ALL"),
  priority:z.enum(["ALL","LOW","MEDIUM","HIGH","CRITICAL"]).default("ALL"),
  search:z.string().trim().max(120).default(""),
  page:z.coerce.number().int().min(1).max(10000).default(1),
}).strict();
export type MentorTaskHistoryQuery = z.infer<typeof mentorTaskHistoryQuerySchema>;

export function mentorTaskHistoryPage(total:number,requested:number) {
  const pageSize=20;
  const totalPages=Math.max(1,Math.ceil(total/pageSize));
  return {total,pageSize,totalPages,page:Math.min(requested,totalPages)};
}

export function mentorTaskHistoryHref(query:Pick<MentorTaskHistoryQuery,"decision"|"search"|"page"> & {priority?:MentorTaskHistoryQuery["priority"]}) {
  const params=new URLSearchParams();
  if (query.decision!=="ALL") params.set("decision",query.decision);
  if (query.priority&&query.priority!=="ALL") params.set("priority",query.priority);
  if (query.search) params.set("search",query.search);
  if (query.page>1) params.set("page",String(query.page));
  const suffix=params.toString();
  return "/mentor/task-review-history"+(suffix?"?"+suffix:"");
}

export function taskReviewDecisionLabel(status:string) {
  return status==="APPROVED" ? "Approved" :
    status==="CHANGES_REQUESTED" ? "Changes requested" : "Recorded review";
}
