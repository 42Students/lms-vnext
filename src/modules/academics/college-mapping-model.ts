import { z } from "zod";
import { COURSE_OFFERING_TYPES, COURSE_TEACHING_ROLES } from "@/modules/courses/constants";

export const COLLEGE_MAPPING_PAGE_SIZE = 25;

export const semesterCourseQuerySchema = z.object({
  type: z.enum(["ALL", ...COURSE_OFFERING_TYPES]).default("ALL"),
  q: z.string().trim().max(100).default(""),
  programId: z.string().uuid().optional(),
  periodId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).max(1000).default(1),
}).strict();

export const facultyAssignmentQuerySchema = z.object({
  role: z.enum(["ALL", ...COURSE_TEACHING_ROLES]).default("ALL"),
  q: z.string().trim().max(100).default(""),
  status: z.enum(["ALL", "ACTIVE", "ENDED"]).default("ACTIVE"),
  page: z.coerce.number().int().min(1).max(1000).default(1),
}).strict();

export type SemesterCourseQuery = z.infer<typeof semesterCourseQuerySchema>;
export type FacultyAssignmentQuery = z.infer<typeof facultyAssignmentQuerySchema>;

export function facultyAssignmentState(
  teachingEndedAt: Date | null,
  deliveryEndedAt: Date | null,
): "ACTIVE" | "ENDED" {
  return teachingEndedAt === null && deliveryEndedAt === null
    ? "ACTIVE" : "ENDED";
}

export function mappingPageCount(total: number, pageSize = COLLEGE_MAPPING_PAGE_SIZE) {
  return Math.max(1, Math.ceil(total / pageSize));
}

export function collegeMappingHref(
  kind: "SEMESTER_COURSES" | "FACULTY_ASSIGNMENTS",
  query: SemesterCourseQuery | FacultyAssignmentQuery,
) {
  const base = kind === "SEMESTER_COURSES"
    ? "/college/semester-courses" : "/college/faculty-assignment";
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if ("programId" in query && query.programId) params.set("programId", query.programId);
  if ("periodId" in query && query.periodId) params.set("periodId", query.periodId);
  if ("type" in query && query.type !== "ALL") params.set("type", query.type);
  if ("status" in query && query.status !== "ACTIVE") params.set("status", query.status);
  if ("role" in query && query.role !== "ALL") params.set("role", query.role);
  if (query.page !== 1) params.set("page", String(query.page));
  const encoded = params.toString();
  return encoded ? base + "?" + encoded : base;
}
