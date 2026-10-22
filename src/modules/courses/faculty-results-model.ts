import { z } from "zod";

export const facultyResultsQuerySchema = z.object({
  kind: z.enum(["ALL", "ASSIGNMENT", "QUIZ"]).default("ALL"),
  status: z.enum(["ALL", "PUBLISHED"]).default("ALL"),
  deliveryId: z.string().uuid().optional(),
  search: z.string().trim().max(120).default(""),
  page: z.union([z.number().int().min(1).max(10000), z.string().regex(/^[1-9]\d{0,4}$/).transform(Number).pipe(z.number().max(10000))]).default(1),
  sort:z.enum(["DUE_DESC","DUE_ASC","TITLE"]).default("DUE_DESC"),
  pageSize:z.union([z.literal(5),z.literal(10),z.enum(["5","10"]).transform(Number)]).default(5),
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

/** Treat non-finite database date values as unknown rather than giving them false priority. */
export function safeFacultyDueTime(value:Date|null):number|null{
 const millis=value?.getTime();
 return millis===undefined||!Number.isFinite(millis)?null:millis;
}

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
      (query.due==="UNDATED" && safeFacultyDueTime(row.dueAt)===null) ||
      (query.due==="OVERDUE" && row.dueAt!==null && row.dueAt.getTime()<now.getTime() &&
       (row.status==="PUBLISHED"||row.status==="CLOSED")) ||
      (query.due==="UPCOMING" && row.dueAt!==null && row.dueAt.getTime()>=now.getTime())) &&
    (!term || [row.title, row.courseName, row.sectionName,row.courseCode??"",row.sectionCode??""].some(field =>
      field.toLowerCase().includes(term))),
  ).sort((a,b) =>
    (query.sort==="TITLE" ? a.title.localeCompare(b.title) :
      query.sort==="DUE_ASC" ? (safeFacultyDueTime(a.dueAt)??Number.MAX_SAFE_INTEGER)-(safeFacultyDueTime(b.dueAt)??Number.MAX_SAFE_INTEGER) :
      (safeFacultyDueTime(b.dueAt)??Number.NEGATIVE_INFINITY)-(safeFacultyDueTime(a.dueAt)??Number.NEGATIVE_INFINITY)) ||
    a.kind.localeCompare(b.kind) || a.id.localeCompare(b.id) || a.deliveryId.localeCompare(b.deliveryId),
  );
}

export function paginateFacultyResults<T>(
  rows: readonly T[], page: number, pageSize = 5,
) {
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 10) {
    throw new Error("INVALID_FACULTY_RESULTS_PAGE");
  }
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
  kind:raw["kind"]||undefined,status:raw["status"]||undefined,
  deliveryId:raw["deliveryId"]||undefined,search:raw["search"]??undefined,
  page:raw["page"],sort:raw["sort"]||undefined,pageSize:raw["page"]Size,due:raw["due"]||undefined,
 });
}

/** Empty screens distinguish missing current assignments from an active filter. */
export function facultyResultsEmptyState(query:FacultyResultsQuery,sectionCount:number){
 if(sectionCount===0)return {title:"No current teaching Sections",description:"Ask your college administrator to assign an active teaching Section before viewing its assessment results.",clearFilters:false};
 const active=query.kind!=="ALL"||query.status!=="ALL"||Boolean(query.deliveryId)||Boolean(query.search)||query.due!=="ALL";
 return active
  ? {title:"No results match these filters",description:"Try a different teaching Section, assessment type, deadline or search term.",clearFilters:true}
  : {title:"No assessments recorded yet",description:"Assignments and quizzes in your current teaching Sections will appear here when they are authored.",clearFilters:false};
}
