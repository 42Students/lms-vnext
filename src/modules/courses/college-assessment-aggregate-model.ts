import { z } from "zod";

export const COLLEGE_ASSESSMENT_PAGE_SIZE = 25;
export const collegeAssessmentKindSchema = z.enum(["ASSIGNMENT", "QUIZ"]);
export type CollegeAssessmentKind = z.infer<typeof collegeAssessmentKindSchema>;

export const collegeAssessmentListQuerySchema = z.object({
  q: z.string().trim().max(100).default(""),
  courseCode: z.string().trim().min(1).max(64).optional(),
  periodCode:z.string().trim().min(1).max(64).optional(),
  scope:z.enum(["ALL","SHARED","SECTION"]).default("ALL"),
  results:z.enum(["ALL","PUBLISHED","HIDDEN"]).default("ALL"),
  duePresence:z.enum(["ALL","SCHEDULED","UNSCHEDULED"]).default("ALL"),
  dueWindow:z.enum(["ALL","PAST","FUTURE"]).default("ALL"),
  status: z.enum(["ALL", "DRAFT", "PUBLISHED", "CLOSED", "ARCHIVED"]).default("ALL"),
  page: z.coerce.number().int().min(1).max(1000).default(1),
}).strict();

export type CollegeAssessmentListQuery = z.infer<typeof collegeAssessmentListQuerySchema>;

export function parseCollegeAssessmentQuery(
  kind: CollegeAssessmentKind,
  raw: unknown,
): CollegeAssessmentListQuery {
  const result = collegeAssessmentListQuerySchema.parse(raw);
  if (kind === "ASSIGNMENT" && result.results !== "ALL") throw new Error("Assignment results visibility unsupported");
  if (kind === "ASSIGNMENT" && result.status === "CLOSED") {
    throw new Error("Assignments do not have a CLOSED status");
  }
  return result;
}

export function collegeAssessmentScopeLabel(deliverySpecific:boolean){
  return deliverySpecific?"Section-specific":"Shared offering";
}

export function collegeAssessmentSummary(
  rows: readonly { status: string; activityCount: number }[],
) {
  return {
    displayed: rows.length,
    published: rows.filter((row) => row.status === "PUBLISHED").length,
    activity: rows.reduce((sum, row) => sum + row.activityCount, 0),
  };
}

export function collegeAssessmentHref(
  kind: CollegeAssessmentKind,
  query: CollegeAssessmentListQuery,
): string {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.courseCode) params.set("courseCode",query.courseCode);
  if(query.periodCode)params.set("periodCode",query.periodCode);
  if (query.scope!=="ALL") params.set("scope",query.scope);
  if(kind==="QUIZ"&&query.results!=="ALL")params.set("results",query.results);
  if(query.duePresence!=="ALL")params.set("duePresence",query.duePresence);
  if(query.dueWindow!=="ALL")params.set("dueWindow",query.dueWindow);
  if (query.status !== "ALL") params.set("status", query.status);
  if (query.page > 1) params.set("page", String(query.page));
  const base = kind === "ASSIGNMENT" ? "/college/assignments" : "/college/quizzes";
  return params.size ? base + "?" + params.toString() : base;
}

export type CollegeAssessmentAggregateItem = {
  id: string;
  title: string;
  courseName: string;
  courseCode: string;
  lessonName: string;
  offeringId: string;
  status: string;
  dueAt: Date | null;
  deliverySpecific: boolean;
  points: number;
  activityCount: number;
  resultsPublished: boolean | null;
};
