import { z } from "zod";
import type { CollegeLessonRecord } from "./college-learning-directory-model";
/** The legacy Lessons selector used 10/25/50/100 rows. Preferences from
 * localStorage are never trusted as a query without this whitelist. */
export const ADMIN_LESSON_PAGE_SIZES = [10, 25, 50, 100] as const;
export function normalizeAdminLessonPageSize(value: unknown): number {
  const numeric = typeof value === "number" ? value :
    typeof value === "string" && /^\d+$/.test(value) ? Number(value) : NaN;
  return (ADMIN_LESSON_PAGE_SIZES as readonly number[]).includes(numeric) ? numeric : 25;
}
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
/** totalActiveLessons must be counted by an authorized, unpaginated
 * college-scoped aggregate. Page-local content sums are not a global count. */
export function adminLessonStats(rows: readonly CollegeLessonRecord[], totalActiveLessons?: number) {
  return {
    lessons: rows.length,
    ...(totalActiveLessons === undefined ? {} : { totalLessons: totalActiveLessons }),
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
