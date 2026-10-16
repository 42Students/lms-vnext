import { z } from "zod";
import {CoursesServiceError} from "./errors";
import { COURSE_TEACHING_ROLES } from "./constants";

export const facultyCourseListQuerySchema = z.object({
  q: z.string().trim().max(120).default(""),
  period: z.union([z.string().uuid(), z.literal("")]).default(""),
  section: z.union([z.string().uuid(), z.literal("")]).default(""),
  role: z.union([z.enum(COURSE_TEACHING_ROLES), z.literal("")]).default(""),
  // URL values are decimal strings; do not coerce arrays, booleans or 1e3.
  page: z.union([
    z.number().int(),
    z.string().regex(/^[1-9]\d{0,4}$/).transform(Number),
  ]).pipe(z.number().int().min(1).max(10000)).default(1),
}).strict();
export type FacultyCourseListQuery = z.infer<typeof facultyCourseListQuerySchema>;
export const FACULTY_COURSE_LIST_PAGE_SIZE = 48;

/** Filter only the actor's persisted, authorized teaching deliveries. */
export function pageFacultyCourseList<T extends {
  courseName: string; courseCode: string; sectionName: string; sectionCode: string;
  academicPeriodId: string; academicPeriodName: string; teachingRole: string;
  sectionId:string;
}>(rows: readonly T[], query: FacultyCourseListQuery) {
  const term = query.q.toLocaleLowerCase();
  const filtered = rows.filter(row =>
    (!query.period || row.academicPeriodId === query.period) &&
    (!query.role || row.teachingRole === query.role) &&
    (!query.section || row.sectionId === query.section) &&
    (!term || [row.courseName, row.courseCode, row.sectionName, row.sectionCode,
      row.academicPeriodName].some(field => field.toLocaleLowerCase().includes(term))),
  );
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / FACULTY_COURSE_LIST_PAGE_SIZE));
  const page = Math.min(query.page, totalPages);
  return {total, totalPages, page, pageSize:FACULTY_COURSE_LIST_PAGE_SIZE,
    items:filtered.slice((page - 1) * FACULTY_COURSE_LIST_PAGE_SIZE, page * FACULTY_COURSE_LIST_PAGE_SIZE)};
}
export function facultyCourseListHref(raw: unknown) {
  const query = facultyCourseListQuerySchema.parse(raw);
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.period) params.set("period", query.period);
  if (query.section) params.set("section",query.section);
  if (query.role) params.set("role", query.role);
  if (query.page > 1) params.set("page", String(query.page));
  return "/teacher/courses" + (params.size ? "?" + params.toString() : "");
}

/** Only vanished/revoked teaching scopes may be omitted after a concurrent update. */
export function facultyCourseWorkspaceRevokedError(error:unknown){
 return error instanceof CoursesServiceError && [
  "FACULTY_TEACHING_SCOPE_REQUIRED","SECTION_DELIVERY_NOT_FOUND",
  "OFFERING_NOT_FOUND","LEARNING_ACCESS_DENIED",
 ].includes(error.code);
}

/** UI URL boundary: invalid selectors must not silently widen teaching scope. */
export function parseFacultyCourseListLocation(raw:unknown):FacultyCourseListQuery|null {
 const result=facultyCourseListQuerySchema.safeParse(raw);
 return result.success?result.data:null;
}
