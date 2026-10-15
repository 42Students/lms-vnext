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
  offeringStatus: z.enum(["ALL", "ACTIVE", "ARCHIVED"]).default("ALL"),
  courseCode: z.string().trim().min(1).max(64).optional(),
  programCode: z.string().trim().min(1).max(64).optional(),
  cohortCode: z.string().trim().min(1).max(64).optional(),
  periodCode: z.string().trim().min(1).max(64).optional(),
  pathStatus: z.enum(["ALL",...LEARNING_PATH_STATUSES]).default("ALL"),
  offeringType: z.enum(["ALL","CORE","ELECTIVE"]).optional(),
});
export type CollegeLessonQuery = z.infer<typeof collegeLessonQuerySchema>;
export const collegeProgressQuerySchema=collegeLearningQuerySchema.extend({
  courseCode:z.string().trim().min(1).max(64).optional(),
  programCode:z.string().trim().min(1).max(64).optional(),
  periodCode:z.string().trim().min(1).max(64).optional(),
  cohortCode:z.string().trim().min(1).max(64).optional(),
});
export type CollegeProgressQuery=z.infer<typeof collegeProgressQuerySchema>;

export function collegeLearningHref(kind: CollegeLearningKind, query: CollegeLearningQuery | CollegeLessonQuery | CollegeProgressQuery) {
  const base = kind === "LESSONS" ? "/college/lessons" : "/college/course-progress";
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.status !== "ACTIVE") params.set("status", query.status);
  if ("courseCode" in query && query.courseCode) params.set("courseCode",query.courseCode);
  if ("programCode" in query && query.programCode) params.set("programCode",query.programCode);
  if ("periodCode" in query && query.periodCode) params.set("periodCode",query.periodCode);
  if ("cohortCode" in query && query.cohortCode) params.set("cohortCode",query.cohortCode);
  if (kind === "LESSONS" && "offeringType" in query && query.offeringType && query.offeringType!=="ALL") params.set("offeringType",query.offeringType);
  if (kind === "LESSONS" && "pathStatus" in query && query.pathStatus !== "ALL") params.set("pathStatus",query.pathStatus);
  if (kind === "LESSONS" && "offeringStatus" in query && query.offeringStatus !== "ALL")
    params.set("offeringStatus", query.offeringStatus);
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
