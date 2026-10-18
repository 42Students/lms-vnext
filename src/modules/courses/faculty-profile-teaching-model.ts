import { z } from "zod";

export const facultyProfileTeachingQuerySchema = z.object({
  search: z.string().trim().max(120).default(""),
  page: z.union([
    z.number().int(),
    z.string().regex(/^[1-9]\d{0,4}$/).transform(Number),
  ]).pipe(z.number().int().min(1).max(10000)).default(1),
}).strict();

export type FacultyProfileTeachingQuery = z.infer<typeof facultyProfileTeachingQuerySchema>;
export type FacultyTeachingRecord = {
  deliveryId: string;
  courseCode: string;
  courseName: string;
  sectionName: string;
  academicPeriodName: string;
  academicPeriodStatus: string;
  teachingRole: string;
};

export function pageOwnFacultyTeaching<T extends FacultyTeachingRecord>(
  rows: readonly T[], query: FacultyProfileTeachingQuery,
) {
  const term = query.search.toLocaleLowerCase();
  const filtered = rows.filter(row => !term ||
    [row.courseCode,row.courseName,row.sectionName,row.academicPeriodName]
      .some(s => s.toLocaleLowerCase().includes(term)));
  const total = filtered.length;
  const pageSize = 20;
  const totalPages = Math.max(1,Math.ceil(total/pageSize));
  const page = Math.min(query.page,totalPages);
  return {
    total,page,pageSize,totalPages,
    items:filtered.slice((page-1)*pageSize,page*pageSize),
  };
}

export function ownFacultyTeachingHref(query: FacultyProfileTeachingQuery) {
  const params = new URLSearchParams();
  if (query.search) params.set("search",query.search);
  if (query.page>1) params.set("page",String(query.page));
  const suffix=params.toString();
  return "/teacher/profile/teaching"+(suffix?"?"+suffix:"");
}
