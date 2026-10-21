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
 publication:z.enum(["ALL","PUBLISHED","PRIVATE"]).default("ALL"),
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

/** Legacy AssignmentController expects both 0-based page and size or
 * neither. A missing pair returns at most 50 rows; an explicit pair is
 * bounded to 100. The vNext report uses 1-based 20-row UI pagination.
 * The authenticated resolver must map lessonContentId to a scoped
 * assignmentId and deliveryId before calling this helper.
 */
export const facultyLegacySubmissionPagingSchema=z.strictObject({
 page:z.coerce.number().int().min(0).max(9999).optional(),
 size:z.coerce.number().int().min(1).max(100).optional(),
}).superRefine((value,ctx)=>{
 if((value.page===undefined)!==(value.size===undefined))
  ctx.addIssue({code:"custom",path:["page"],message:"Provide both page and size"});
});
export function facultyLegacySubmissionPageWindow(raw:unknown,total:number){
 const parsed=facultyLegacySubmissionPagingSchema.parse(raw);
 if(!Number.isSafeInteger(total)||total<0)throw new Error("Invalid submission count");
 if(parsed.page===undefined||parsed.size===undefined)
  return {page:0,size:Math.min(50,total),total,offset:0,unpaged:true as const};
 const offset=parsed.page*parsed.size;
 return {page:parsed.page,size:parsed.size,total,offset,unpaged:false as const};
}
export function facultySubmissionStudentPosition<T extends {id:string}>(
 rows:readonly T[],selectedId:string|null,
){
 const index=Math.max(0,rows.findIndex(row=>row.id===selectedId));
 return {index,display:rows.length?index+1:0,count:rows.length,
  previous:rows.length&&index>0?rows[index-1]!.id:null,
  next:rows.length&&index<rows.length-1?rows[index+1]!.id:null};
}
/** SQL pagination contract for large, scoped assignment-submission reports.
 * The service must filter under the faculty's delivery/assignment permission,
 * run a matching COUNT query, then apply LIMIT/OFFSET before materializing
 * submission/profile rows. Legacy unpaged max=50, explicit max=100; the vNext
 * review UI uses 20 to keep a stable panel layout. */
export const FACULTY_SUBMISSION_SQL_PAGE_SIZE=20;
export const FACULTY_SUBMISSION_LEGACY_UNPAGED_MAX=50;
export const FACULTY_SUBMISSION_LEGACY_EXPLICIT_MAX=100;
export function facultySubmissionSqlPageWindow(requested:number,total:number){
 if(!Number.isSafeInteger(total)||total<0)throw new Error("Invalid submission count");
 const totalPages=Math.max(1,Math.ceil(total/FACULTY_SUBMISSION_SQL_PAGE_SIZE));
 const page=Math.min(Math.max(1,Math.trunc(Number.isFinite(requested)?requested:1)),totalPages);
 return {page,total,totalPages,limit:FACULTY_SUBMISSION_SQL_PAGE_SIZE,
  offset:(page-1)*FACULTY_SUBMISSION_SQL_PAGE_SIZE};
}

export function facultySubmissionListPage<T>(rows:readonly T[],requested:number) {
  const total=rows.length,pageSize=FACULTY_SUBMISSION_SQL_PAGE_SIZE;
  const totalPages=Math.max(1,Math.ceil(total/pageSize));
  const page=Math.max(1,Math.min(Number.isSafeInteger(requested)?requested:1,totalPages));
  return {total,pageSize,totalPages,page,items:rows.slice((page-1)*pageSize,page*pageSize)};
}

export function facultySubmissionListHref(query:FacultySubmissionListQuery & {order?:"NEWEST"|"OLDEST";q?:string;publication?:"ALL"|"PUBLISHED"|"PRIVATE"}) {
  const params=new URLSearchParams({deliveryId:query.deliveryId});
  if(query.filter!=="ALL")params.set("filter",query.filter);
  if(query.page>1)params.set("page",String(query.page));
  if(query.order==="OLDEST")params.set("order","OLDEST");
  if(query.q?.trim())params.set("q",query.q.trim());
  if(query.publication && query.publication!=="ALL")params.set("publication",query.publication);
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

/** Publication privacy belongs to the persisted gradePublished bit. */
export function facultyFilterSubmissionPublication<T extends {gradePublished:boolean}>(
 rows:readonly T[],mode:"ALL"|"PUBLISHED"|"PRIVATE",
):T[]{
 return rows.filter(row=>mode==="ALL"||(mode==="PUBLISHED"?row.gradePublished:!row.gradePublished));
}

export function facultySubmissionReportEmptyState(query:{
 filter:FacultySubmissionFilter;q:string;publication:"ALL"|"PUBLISHED"|"PRIVATE";
},sourceCount:number){
 if(sourceCount===0)return {
  title:"No submissions yet",
  description:"Learners have not submitted work for this assignment in your authorized Section.",
 };
 if(query.q)return {
  title:"No learner names match",
  description:"Clear the name search or change the selected submission filters.",
 };
 if(query.publication==="PUBLISHED")return {
  title:"No published grades match",
  description:"Learner-visible grades may not have been released for these submissions.",
 };
 if(query.publication==="PRIVATE")return {
  title:"No private grades match",
  description:"No matching submission currently has an unpublished grade.",
 };
 if(query.filter==="LATE")return {
  title:"No late submissions match",
  description:"No recorded submission was after the persisted assignment due time.",
 };
 if(query.filter==="UNGRADED")return {
  title:"No submissions need grading",
  description:"All matching persisted work has a recorded grade, or there are no matching rows.",
 };
 if(query.filter==="GRADED")return {
  title:"No graded submissions match",
  description:"No matching persisted submissions have a recorded grade.",
 };
 return {title:"No matching submissions",description:"No persisted submissions match the selected filters."};
}

/**
 * The existing server-owned CSV supports only the saved grade/timing filter.
 * Avoid claiming that this page's name, privacy and ordering controls affect it.
 */
export function facultySubmissionCsvScopeNote(query:{
 q:string;publication:"ALL"|"PUBLISHED"|"PRIVATE";order:"NEWEST"|"OLDEST";
}):string {
 const extras=Boolean(query.q.trim())||query.publication!=="ALL"||query.order!=="NEWEST";
 return extras
 ? "CSV includes the authorized Section and selected grading/timing filter; name search, grade visibility and date ordering apply to this page only."
 : "CSV includes the authorized Section and selected grading/timing filter, not just this page.";
}
