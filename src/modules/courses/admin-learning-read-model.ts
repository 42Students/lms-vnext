import { z } from "zod";
import type { CollegeLessonRecord } from "./college-learning-directory-model";
export const adminLearningQuerySchema = z.strictObject({
  q: z.string().trim().max(100).default(""),
  status: z.enum(["ACTIVE", "ARCHIVED", "ALL"]).default("ACTIVE"),
  page: z.coerce.number().int().min(1).max(1000).default(1),
  courseCode:z.string().trim().max(64).optional(),
  cohortCode:z.string().trim().max(64).optional(),
  offeringId:z.uuid().optional(),
});
export function adminLearningHref(kind: "LESSONS" | "PROGRESS", query: z.infer<typeof adminLearningQuerySchema>) {
  const pathname = kind === "LESSONS" ? "/admin/lessons" : "/admin/course-progress";
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if(query.courseCode)params.set("courseCode",query.courseCode);
  if(query.cohortCode)params.set("cohortCode",query.cohortCode);
  if(query.offeringId)params.set("offeringId",query.offeringId);
  if (query.status !== "ACTIVE") params.set("status", query.status);
  if (query.page > 1) params.set("page", String(query.page));
  return params.size ? pathname + "?" + params : pathname;
}
export function adminLessonStats(rows: readonly CollegeLessonRecord[]) {
  return {
    lessons: rows.length,
    authored: rows.reduce((n, row) => n + row.contentCount, 0),
    published: rows.reduce((n, row) => n + row.publishedContentCount, 0),
  };
}

export function adminProgressStats(rows: readonly {
  recordedRows: number; completedRows: number; learnersWithRecords: number;
}[]) {
  return {
    offerings: rows.length,
    contentRecords: rows.reduce((n, row) => n + row.recordedRows, 0),
    completedContentRecords: rows.reduce((n, row) => n + row.completedRows, 0),
    // These counts cannot be added across offerings: learners may appear in several.
    perOfferingLearnerCounts: rows.map(row => row.learnersWithRecords),
  };
}
