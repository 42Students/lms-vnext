import { z } from "zod";
import {LEARNING_PATH_STATUSES} from "@/modules/courses/constants";

export const COLLEGE_LEARNING_PAGE_SIZE = 25;
export const collegeLearningKindSchema = z.enum(["LESSONS", "PROGRESS"]);
export type CollegeLearningKind = z.infer<typeof collegeLearningKindSchema>;

export const collegeLearningQuerySchema = z.object({
  q: z.string().trim().max(100).default(""),
  status: z.enum(["ALL", "ACTIVE", "ARCHIVED"]).default("ACTIVE"),
  page: z.coerce.number().int().min(1).max(1000).default(1),
}).strict();
export type CollegeLearningQuery = z.infer<typeof collegeLearningQuerySchema>;
export const collegeLessonQuerySchema = collegeLearningQuerySchema.extend({
  programStatus: z.enum(["ALL","ACTIVE","ARCHIVED"]).default("ALL"),
  cohortStatus: z.enum(["ALL","PLANNED","ACTIVE","COMPLETED","ARCHIVED"]).default("ALL"),
  periodStatus: z.enum(["ALL","PLANNED","ACTIVE","CLOSED"]).default("ALL"),
  courseStatus: z.enum(["ALL","ACTIVE","ARCHIVED"]).default("ALL"),
  departmentCode: z.string().trim().min(1).max(64).optional(),
  offeringStatus: z.enum(["ALL", "ACTIVE", "ARCHIVED"]).default("ALL"),
  courseCode: z.string().trim().min(1).max(64).optional(),
  programCode: z.string().trim().min(1).max(64).optional(),
  cohortCode: z.string().trim().min(1).max(64).optional(),
  periodCode: z.string().trim().min(1).max(64).optional(),
  pathStatus: z.enum(["ALL",...LEARNING_PATH_STATUSES]).default("ALL"),
  offeringType: z.enum(["ALL","CORE","ELECTIVE"]).optional(),
  departmentName: z.string().trim().min(1).max(255).optional(),
  contentPresence: z.enum(["ALL","HAS_CONTENT","EMPTY"]).optional(),
  publishedContent: z.enum(["ALL","HAS_PUBLISHED","NONE_PUBLISHED"]).default("ALL"),
  flaggedVisibility:z.enum(["ALL","HAS_FLAGGED","NONE_FLAGGED"]).default("ALL"),
  assignmentPresence:z.enum(["ALL","HAS_ASSIGNMENTS","NO_ASSIGNMENTS"]).default("ALL"),
  quizPresence:z.enum(["ALL","HAS_QUIZZES","NO_QUIZZES"]).default("ALL"),
});
export type CollegeLessonQuery = z.infer<typeof collegeLessonQuerySchema>;
export const collegeProgressQuerySchema=collegeLearningQuerySchema.extend({
  courseCode:z.string().trim().min(1).max(64).optional(),
  programCode:z.string().trim().min(1).max(64).optional(),
  periodCode:z.string().trim().min(1).max(64).optional(),
  cohortCode:z.string().trim().min(1).max(64).optional(),
  departmentName:z.string().trim().min(1).max(255).optional(),
  activityState:z.enum(["ALL","RECORDED","UNRECORDED"]).default("ALL"),
  completionEvidence:z.enum(["ALL","COMPLETED_CONTENT","NO_COMPLETED_CONTENT"]).default("ALL"),
  learningPathPresence:z.enum(["ALL","HAS_PATH","NO_PATH"]).default("ALL"),
  publishedPathPresence:z.enum(["ALL","HAS_PUBLISHED_PATH","NO_PUBLISHED_PATH"]).default("ALL"),
  offeringType:z.enum(["ALL","CORE","ELECTIVE"]).optional(),
});
export type CollegeProgressQuery=z.infer<typeof collegeProgressQuerySchema>;

export function collegeLearningHref(kind: CollegeLearningKind, query: CollegeLearningQuery | CollegeLessonQuery | CollegeProgressQuery) {
  const base = kind === "LESSONS" ? "/college/lessons" : "/college/course-progress";
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.status !== "ACTIVE") params.set("status", query.status);
  if (kind === "PROGRESS" && "departmentName" in query && query.departmentName) params.set("departmentName",query.departmentName);
  if(kind==="PROGRESS"&&"activityState" in query&&query.activityState!=="ALL")params.set("activityState",query.activityState);
  if(kind==="PROGRESS"&&"completionEvidence" in query&&query.completionEvidence!=="ALL")params.set("completionEvidence",query.completionEvidence);
  if(kind==="PROGRESS"&&"learningPathPresence" in query&&query.learningPathPresence!=="ALL")params.set("learningPathPresence",query.learningPathPresence);
  if(kind==="PROGRESS"&&"publishedPathPresence" in query&&query.publishedPathPresence!=="ALL")params.set("publishedPathPresence",query.publishedPathPresence);
  if (kind === "PROGRESS" && "offeringType" in query && query.offeringType && query.offeringType !== "ALL") params.set("offeringType",query.offeringType);
  if ("courseCode" in query && query.courseCode) params.set("courseCode",query.courseCode);
  if ("programCode" in query && query.programCode) params.set("programCode",query.programCode);
  if ("periodCode" in query && query.periodCode) params.set("periodCode",query.periodCode);
  if ("cohortCode" in query && query.cohortCode) params.set("cohortCode",query.cohortCode);
  if (kind === "LESSONS" && "quizPresence" in query && query.quizPresence!=="ALL") params.set("quizPresence",query.quizPresence);
  if (kind === "LESSONS" && "assignmentPresence" in query && query.assignmentPresence!=="ALL") params.set("assignmentPresence",query.assignmentPresence);
  if (kind === "LESSONS" && "flaggedVisibility" in query && query.flaggedVisibility!=="ALL") params.set("flaggedVisibility",query.flaggedVisibility);
  if (kind === "LESSONS" && "publishedContent" in query && query.publishedContent!=="ALL") params.set("publishedContent",query.publishedContent);
  if (kind === "LESSONS" && "contentPresence" in query && query.contentPresence && query.contentPresence!=="ALL")params.set("contentPresence",query.contentPresence);
  if (kind === "LESSONS" && "departmentName" in query && query.departmentName) params.set("departmentName",query.departmentName);
  if (kind === "LESSONS" && "offeringType" in query && query.offeringType && query.offeringType!=="ALL") params.set("offeringType",query.offeringType);
  if (kind === "LESSONS" && "pathStatus" in query && query.pathStatus !== "ALL") params.set("pathStatus",query.pathStatus);
  if (kind === "LESSONS" && "offeringStatus" in query && query.offeringStatus !== "ALL")
    params.set("offeringStatus", query.offeringStatus);
  if ("programStatus" in query && query.programStatus !== "ALL") params.set("programStatus",query.programStatus);
  if ("cohortStatus" in query && query.cohortStatus !== "ALL") params.set("cohortStatus",query.cohortStatus);
  if ("periodStatus" in query && query.periodStatus !== "ALL") params.set("periodStatus",query.periodStatus);
  if ("courseStatus" in query && query.courseStatus !== "ALL") params.set("courseStatus",query.courseStatus);
  if ("departmentCode" in query && query.departmentCode) params.set("departmentCode",query.departmentCode);
  if (query.page !== 1) params.set("page", String(query.page));
  return params.size ? base + "?" + params.toString() : base;
}

export function collegeLearningPageCount(total: number) {
  return Math.max(1, Math.ceil(total / COLLEGE_LEARNING_PAGE_SIZE));
}

export type CollegeLessonRecord = {
  id: string;
  name: string;
  sequence: number;
  status: "ACTIVE" | "ARCHIVED";
  pathStatus: string;
  offeringId: string;
  offeringStatus: string;
  courseName: string;
  courseCode: string;
  cohortName: string;
  periodName: string;
  contentCount: number;
  publishedContentCount: number;
  publishedAndVisibleFlagCount: number;
};

export type CollegeCourseProgressRecord = {
  offeringId: string;
  offeringStatus: string;
  courseName: string;
  courseCode: string;
  cohortName: string;
  periodName: string;
  recordedRows: number;
  completedRows: number;
  learnersWithRecords: number;
};

export function collegeProgressDescription(row: Pick<
  CollegeCourseProgressRecord, "recordedRows" | "completedRows" | "learnersWithRecords"
>) {
  return row.recordedRows === 0
    ? "No recorded learner content activity"
    : `${row.completedRows} completed content records of ${row.recordedRows}; ${row.learnersWithRecords} distinct learners with records`;
}
