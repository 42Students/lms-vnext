import { z } from "zod";
import { collegeAssessmentSummary, type CollegeAssessmentAggregateItem } from "./college-assessment-aggregate-model";
export const adminAssessmentQuerySchema = z.strictObject({
  q: z.string().trim().max(100).default(""),
  status: z.enum(["ALL", "DRAFT", "PUBLISHED", "CLOSED", "ARCHIVED"]).default("ALL"),
  courseCode:z.string().trim().min(1).max(64).optional(),
  scope:z.enum(["ALL","SHARED","SECTION"]).default("ALL"),
  results:z.enum(["ALL","PUBLISHED","HIDDEN"]).default("ALL"),
  page: z.coerce.number().int().min(1).max(1000).default(1),
});
export type AdminAssessmentKind = "ASSIGNMENT" | "QUIZ";
export function adminAssessmentHref(kind: AdminAssessmentKind, query: z.infer<typeof adminAssessmentQuerySchema>) {
  const base = kind === "ASSIGNMENT" ? "/admin/assignments" : "/admin/quizzes";
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.status !== "ALL") params.set("status", query.status);
  if (query.courseCode) params.set("courseCode",query.courseCode);
  if (query.scope!=="ALL") params.set("scope",query.scope);
  if (kind==="QUIZ"&&query.results!=="ALL") params.set("results",query.results);
  if (query.page > 1) params.set("page", String(query.page));
  return params.size ? base + "?" + params : base;
}
export function adminAssessmentStats(items: readonly Pick<CollegeAssessmentAggregateItem, "status" | "activityCount">[]) {
  return collegeAssessmentSummary(items);
}
