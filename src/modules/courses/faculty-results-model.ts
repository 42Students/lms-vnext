import { z } from "zod";

export const facultyResultsQuerySchema = z.object({
  kind: z.enum(["ALL", "ASSIGNMENT", "QUIZ"]).default("ALL"),
  status: z.enum(["ALL", "PUBLISHED"]).default("ALL"),
  deliveryId: z.string().uuid().optional(),
  search: z.string().trim().max(120).default(""),
  page: z.union([z.number().int().min(1).max(10000), z.string().regex(/^[1-9]\d{0,4}$/).transform(Number).pipe(z.number().max(10000))]).default(1),
  sort:z.enum(["DUE_DESC","DUE_ASC","TITLE"]).default("DUE_DESC"),
  pageSize:z.coerce.number().int().refine(value=>value===5||value===10).default(5),
  due:z.enum(["ALL","OVERDUE","UPCOMING","UNDATED"]).default("ALL"),
}).strict();

export type FacultyResultsQuery = z.infer<typeof facultyResultsQuerySchema>;
export type FacultyResultCandidate = {
  id: string;
  kind: "ASSIGNMENT" | "QUIZ";
  status: string;
  title: string;
  courseName: string;
  sectionName: string;
  courseCode?:string;
  sectionCode?:string;
  deliveryId: string;
  dueAt: Date | null;
};

export function filterFacultyResultCandidates<T extends FacultyResultCandidate>(
  rows: readonly T[], query: Pick<FacultyResultsQuery, "kind" | "status" | "search" | "deliveryId"> & Partial<Pick<FacultyResultsQuery,"sort"|"due">>,
 now:Date=new Date(),
): T[] {
  const term = query.search.toLowerCase();
  return rows.filter(row =>
    (query.kind === "ALL" || row.kind === query.kind) &&
    (query.status === "ALL" || row.status === "PUBLISHED" ||
      (row.kind === "QUIZ" && row.status === "CLOSED")) &&
    (!query.deliveryId || row.deliveryId === query.deliveryId) &&
    (!query.due || query.due==="ALL" ||
      (query.due==="UNDATED" && !row.dueAt) ||
      (query.due==="OVERDUE" && row.dueAt!==null && row.dueAt.getTime()<now.getTime() &&
       (row.status==="PUBLISHED"||row.status==="CLOSED")) ||
      (query.due==="UPCOMING" && row.dueAt!==null && row.dueAt.getTime()>=now.getTime())) &&
    (!term || [row.title, row.courseName, row.sectionName,row.courseCode??"",row.sectionCode??""].some(field =>
      field.toLowerCase().includes(term))),
  ).sort((a,b) =>
    (query.sort==="TITLE" ? a.title.localeCompare(b.title) :
      query.sort==="DUE_ASC" ? (a.dueAt?.getTime()??Number.MAX_SAFE_INTEGER)-(b.dueAt?.getTime()??Number.MAX_SAFE_INTEGER) :
      (b.dueAt?.getTime()??Number.NEGATIVE_INFINITY)-(a.dueAt?.getTime()??Number.NEGATIVE_INFINITY)) ||
    a.kind.localeCompare(b.kind) || a.id.localeCompare(b.id) || a.deliveryId.localeCompare(b.deliveryId),
  );
}

export function paginateFacultyResults<T>(
  rows: readonly T[], page: number, pageSize = 5,
) {
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, totalPages);
  return {
    total, page: current, pageSize, totalPages,
    items: rows.slice((current - 1) * pageSize, current * pageSize),
  };
}

export function facultyResultsHref(query: Pick<FacultyResultsQuery,"kind"|"status"|"deliveryId"|"search"|"page"> & Partial<Pick<FacultyResultsQuery,"sort"|"pageSize"|"due">>): string {
  const params = new URLSearchParams();
  if (query.kind !== "ALL") params.set("kind", query.kind);
  if (query.status !== "ALL") params.set("status", query.status);
  if (query.deliveryId) params.set("deliveryId", query.deliveryId);
  if (query.search) params.set("search", query.search);
  if (query.page > 1) params.set("page", String(query.page));
  if (query.sort&&query.sort!=="DUE_DESC") params.set("sort",query.sort);
  if(query.pageSize&&query.pageSize!==5) params.set("pageSize",String(query.pageSize));
  if(query.due&&query.due!=="ALL")params.set("due",query.due);
  return "/teacher/results" + (params.size ? "?" + params.toString() : "");
}

/** Returns unknown, not a made-up zero, for absent or inconsistent rosters. */
export function facultyRecordedResponseRate(eligible: number, responded: number) {
  if (!Number.isInteger(eligible) || !Number.isInteger(responded) ||
      eligible <= 0 || responded < 0 || responded > eligible) return null;
  return Math.round(responded / eligible * 100);
}

/** Never silently accept duplicate or unknown filtering selectors from Next searchParams. */
export function parseFacultyResultsSearchParams(raw:Record<string,string|string[]|undefined>){
 const allowed=new Set(["kind","status","deliveryId","search","page","sort","pageSize","due"]);
 if(Object.entries(raw).some(([key,value])=>!allowed.has(key)||Array.isArray(value)))
  return facultyResultsQuerySchema.safeParse({kind:"INVALID"});
 return facultyResultsQuerySchema.safeParse({
  kind:raw.kind||undefined,status:raw.status||undefined,
  deliveryId:raw.deliveryId||undefined,search:raw.search??undefined,
  page:raw.page||undefined,sort:raw.sort||undefined,pageSize:raw.pageSize||undefined,due:raw.due||undefined,
 });
}
