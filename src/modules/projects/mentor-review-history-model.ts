import { z } from "zod";

export const mentorReviewHistoryQuerySchema = z.object({
  version: z.preprocess(value=>value===""?undefined:value,z.coerce.number().int().min(1).max(100000).optional()),
  projectId: z.preprocess(value => value===""?undefined:value,z.string().uuid().optional()),
  projectState:z.enum(["ALL","PLANNED","ACTIVE","COMPLETED","ARCHIVED"]).default("ALL"),
  window:z.enum(["ALL","LAST_7_DAYS","LAST_30_DAYS"]).default("ALL"),
  order:z.enum(["NEWEST","OLDEST"]).default("NEWEST"),
  decision: z.enum(["ALL", "APPROVED", "CHANGES_REQUESTED"]).default("ALL"),
  search: z.string().trim().max(120).default(""),
  page: z.coerce.number().int().min(1).max(10000).default(1),
}).strict();

export type MentorReviewHistoryQuery = z.infer<typeof mentorReviewHistoryQuerySchema>;

export function mentorReviewHistoryPagination(total: number, requested: number) {
  const pageSize=20;
  const totalPages=Math.max(1,Math.ceil(total/pageSize));
  return {total,pageSize,totalPages,page:Math.min(requested,totalPages)};
}
export function mentorReviewDecisionLabel(value: string) {
  if (value==="APPROVED") return "Approved";
  if (value==="CHANGES_REQUESTED") return "Changes requested";
  return "Recorded review";
}
export function mentorReviewHistoryLiteralSearch(value: string) {
  return value.replaceAll("\\","\\\\").replaceAll("%","\\%").replaceAll("_","\\_");
}
export function mentorReviewHistoryHref(query: Pick<MentorReviewHistoryQuery,"decision"|"page"> &
  {projectState?:MentorReviewHistoryQuery["projectState"];search?:MentorReviewHistoryQuery["search"];projectId?:MentorReviewHistoryQuery["projectId"];version?:MentorReviewHistoryQuery["version"];order?:MentorReviewHistoryQuery["order"];window?:MentorReviewHistoryQuery["window"]}) {
  const params = new URLSearchParams();
  if (query.decision!=="ALL") params.set("decision",query.decision);
  if (query.projectState&&query.projectState!=="ALL") params.set("projectState",query.projectState);
  if (query.search) params.set("search",query.search);
  if (query.projectId) params.set("projectId",query.projectId);
  if (query.version!==undefined) params.set("version",String(query.version));
  if (query.order&&query.order!=="NEWEST") params.set("order",query.order);
  if (query.window&&query.window!=="ALL") params.set("window",query.window);
  if (query.page>1) params.set("page",String(query.page));
  return "/mentor/review-history"+(params.size?"?"+params.toString():"");
}
