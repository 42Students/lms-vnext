import { z } from "zod";

export const facultySubmissionFilterSchema=z.enum(["ALL","GRADED","UNGRADED","LATE"]);
export type FacultySubmissionFilter=z.infer<typeof facultySubmissionFilterSchema>;

export const facultySubmissionListQuerySchema=z.object({
  assignmentId:z.string().uuid(),
  deliveryId:z.string().uuid(),
  filter:facultySubmissionFilterSchema.default("ALL"),
  page:z.coerce.number().int().min(1).max(10000).default(1),
}).strict();
/** Standalone report selectors are strict; the review drawer keeps its API contract. */
export const facultySubmissionReportPageQuerySchema=facultySubmissionListQuerySchema.extend({
 order:z.enum(["NEWEST","OLDEST"]).default("NEWEST"),
 q:z.string().trim().max(120).default(""),
 page:z.union([z.number().int(),z.string().regex(/^[1-9]\d{0,3}$|^10000$/).transform(Number)])
   .pipe(z.number().int().min(1).max(10000)).default(1),
}).strict();
export const facultySubmissionReportSearchSchema=facultySubmissionReportPageQuerySchema.omit({assignmentId:true});
export type FacultySubmissionListQuery=z.infer<typeof facultySubmissionListQuerySchema>;

export function selectFacultyAssignmentSubmissions<T extends {
  id?:string;gradingStatus:string;submittedAt:Date;
}>(rows:readonly T[],filter:FacultySubmissionFilter,dueAt:Date|null) {
  return rows.filter(row=>
    filter==="ALL" ||
    (filter==="GRADED" && row.gradingStatus==="GRADED") ||
    (filter==="UNGRADED" && row.gradingStatus!=="GRADED") ||
    (filter==="LATE" && dueAt!==null && row.submittedAt.getTime()>dueAt.getTime()),
  ).slice().sort((a,b)=>b.submittedAt.getTime()-a.submittedAt.getTime() || (a.id??"").localeCompare(b.id??""));
}

export function facultySubmissionListPage<T>(rows:readonly T[],requested:number) {
  const total=rows.length,pageSize=20;
  const totalPages=Math.max(1,Math.ceil(total/pageSize));
  const page=Math.min(requested,totalPages);
  return {total,pageSize,totalPages,page,items:rows.slice((page-1)*pageSize,page*pageSize)};
}

export function facultySubmissionListHref(query:FacultySubmissionListQuery & {order?:"NEWEST"|"OLDEST";q?:string}) {
  const params=new URLSearchParams({deliveryId:query.deliveryId});
  if(query.filter!=="ALL")params.set("filter",query.filter);
  if(query.page>1)params.set("page",String(query.page));
  if(query.order==="OLDEST")params.set("order","OLDEST");
  if(query.q?.trim())params.set("q",query.q.trim());
  return "/teacher/report/assignment/"+encodeURIComponent(query.assignmentId)+
    "/submissions?"+params.toString();
}

/** Reject duplicate or injected selectors instead of dropping them via get(). */
export function parseFacultySubmissionReviewUrl(url: string, deliveryId: string) {
  const params = new URL(url).searchParams;
  const allowed = new Set(["assignmentId","filter","page"]);
  if (params.getAll("assignmentId").length !== 1 ||
      [...params.keys()].some(key => !allowed.has(key) || params.getAll(key).length !== 1)) {
    return facultySubmissionListQuerySchema.parse({assignmentId:null,deliveryId});
  }
  return facultySubmissionListQuerySchema.parse({
    assignmentId:params.get("assignmentId"),deliveryId,
    filter:params.get("filter") ?? undefined,page:params.get("page") ?? undefined,
  });
}
export function facultySubmissionReviewApiHref(raw: unknown) {
  const query = facultySubmissionListQuerySchema.parse(raw);
  const params = new URLSearchParams({assignmentId:query.assignmentId});
  if (query.filter !== "ALL") params.set("filter",query.filter);
  if (query.page > 1) params.set("page",String(query.page));
  return "/api/courses/faculty/assignments/"+encodeURIComponent(query.deliveryId)+"/submissions?"+params.toString();
}

/** Presentation ordering applies after the authorized review filter. */
export function facultySortSubmissionReportRows<T extends {id:string;submittedAt:Date}>(
 rows:readonly T[],order:"NEWEST"|"OLDEST",
):T[]{
 return [...rows].sort((a,b)=>{
   const x=a.submittedAt.getTime(),y=b.submittedAt.getTime();
   const diff=Number.isFinite(x)&&Number.isFinite(y)?(order==="NEWEST"?y-x:x-y):0;
   return diff||a.id.localeCompare(b.id);
 });
}

/** Search the already-authorized rows; contact details are not exported. */
export function facultySearchSubmissionReportRows<T extends {learnerDisplayName:string|null}>(
 rows:readonly T[],q:string,
):T[]{
 const term=q.trim().toLocaleLowerCase();
 return term?rows.filter(row=>row.learnerDisplayName?.toLocaleLowerCase().includes(term)):[...rows];
}
