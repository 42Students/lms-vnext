import { z } from "zod";

export const facultyResponseFollowUpQuerySchema = z.object({
  kind: z.enum(["ALL", "ASSIGNMENT", "QUIZ"]).default("ALL"),
  search: z.string().trim().max(120).default(""),
  page: z.union([z.number().int().min(1).max(10000), z.string().regex(/^[1-9]\d{0,4}$/).transform(Number).pipe(z.number().max(10000))]).default(1),
  deliveryId:z.string().uuid().optional(),
  sort:z.enum(["RECENT_DUE","OLDEST_DUE","TITLE"]).default("RECENT_DUE"),
  pageSize:z.union([z.literal(5),z.literal(10),z.enum(["5","10"]).transform(Number)]).default(5),
}).strict();
export type FacultyResponseFollowUpQuery = z.infer<typeof facultyResponseFollowUpQuerySchema>;

export type FacultyResponseCandidate = {
  id: string;
  deliveryId: string;
  title: string;
  kind: "ASSIGNMENT" | "QUIZ";
  status: string;
  dueAt: Date | null;
  courseName: string;
  sectionName: string;
};

export function selectPastDueAssessments<T extends FacultyResponseCandidate>(
  candidates: readonly T[],
  query: Pick<FacultyResponseFollowUpQuery, "kind" | "search"> & Partial<Pick<FacultyResponseFollowUpQuery,"deliveryId"|"sort">>,
  now: Date,
): T[] {
  const term = query.search.toLowerCase();
  return candidates.filter(row =>
    row.status === "PUBLISHED" && row.dueAt !== null &&
    row.dueAt.getTime() <= now.getTime() &&
    (query.kind === "ALL" || row.kind === query.kind) &&
    (!query.deliveryId || row.deliveryId===query.deliveryId) &&
    (!term || [row.title, row.courseName, row.sectionName].some(value =>
      value.toLowerCase().includes(term))),
  ).sort((a,b) =>
    (query.sort==="TITLE"?a.title.localeCompare(b.title):
     query.sort==="OLDEST_DUE"?a.dueAt!.getTime()-b.dueAt!.getTime():
     b.dueAt!.getTime()-a.dueAt!.getTime()) ||
    a.kind.localeCompare(b.kind) ||
    a.id.localeCompare(b.id) ||
    a.deliveryId.localeCompare(b.deliveryId),
  );
}

export function facultyResponseFollowUpPage<T>(
  rows: readonly T[], requested: number,pageSize=5,
) {
  if(pageSize!==5&&pageSize!==10)throw new Error("INVALID_FOLLOWUP_PAGE_SIZE");
  if (!Number.isInteger(requested) || requested < 1) throw new Error("INVALID_FOLLOWUP_PAGE");
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requested, totalPages);
  return {
    total, totalPages, page, pageSize,
    items: rows.slice((page - 1) * pageSize, page * pageSize),
  };
}

export function facultyResponseFollowUpHref(query: Pick<FacultyResponseFollowUpQuery,"kind"|"search"|"page"> & Partial<Pick<FacultyResponseFollowUpQuery,"deliveryId"|"sort"|"pageSize">>) {
  const params = new URLSearchParams();
  if (query.kind !== "ALL") params.set("kind", query.kind);
  if (query.search) params.set("search", query.search);
  if(query.deliveryId)params.set("deliveryId",query.deliveryId);
  if(query.sort&&query.sort!=="RECENT_DUE")params.set("sort",query.sort);
  if(query.pageSize&&query.pageSize!==5)params.set("pageSize",String(query.pageSize));
  if (query.page > 1) params.set("page", String(query.page));
  const suffix = params.toString();
  return "/teacher/response-followups" + (suffix ? "?" + suffix : "");
}

export function limitedMissingLearners<T>(
  learners: readonly T[], limit = 12,
) {
  if (!Number.isInteger(limit) || limit < 0 || limit > 12) throw new Error("INVALID_FOLLOWUP_PREVIEW_LIMIT");
  return { total: learners.length, preview: learners.slice(0, limit),
    hiddenCount: Math.max(0, learners.length - limit) };
}

export function parseFacultyFollowUpSearchParams(raw:Record<string,string|string[]|undefined>){
 const allowed=new Set(["kind","search","page","deliveryId","sort","pageSize"]);
 if(Object.entries(raw).some(([key,value])=>!allowed.has(key)||Array.isArray(value)))
  return facultyResponseFollowUpQuerySchema.safeParse({kind:"INVALID"});
 return facultyResponseFollowUpQuerySchema.safeParse({
  kind:raw["kind"]||undefined,search:raw["search"]??undefined,page:raw["page"],
  deliveryId:raw["deliveryId"]||undefined,sort:raw["sort"]||undefined,
  pageSize:raw["page"]Size,
 });
}

/** Absence of overdue work is not the same as a filtered miss. */
export function facultyFollowupEmptyState(query:FacultyResponseFollowUpQuery,sectionCount:number){
 if(sectionCount===0)return {title:"No current teaching Sections",description:"You need an active teaching Section assignment before there can be response follow-ups.",clearFilters:false};
 const filtered=query.kind!=="ALL"||Boolean(query.deliveryId)||Boolean(query.search);
 if(filtered)return {title:"No follow-ups match these filters",description:"Try another teaching Section, assessment type or search term.",clearFilters:true};
 return {title:"No past-due assessments to review",description:"Only published assessments whose recorded due date has passed appear here. Future and undated items are not labeled overdue.",clearFilters:false};
}
