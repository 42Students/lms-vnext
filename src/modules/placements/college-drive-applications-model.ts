import { z } from "zod";

export const driveApplicationsQuerySchema = z.object({
  q: z.string().trim().max(100).default(""),
  status: z.enum(["ALL","SUBMITTED","WITHDRAWN"]).default("ALL"),
  source: z.enum(["ALL","INTERNAL","EXTERNAL"]).default("ALL"),
  stage: z.enum(["ALL","APPLIED","SHORTLISTED","ASSESSMENT","INTERVIEW","WAITLISTED","OFFERED","HIRED","REJECTED","WITHDRAWN"]).default("ALL"),
  departmentId: z.string().uuid().optional(),
  programId: z.string().uuid().optional(),
  cohortId: z.string().uuid().optional(),
  appliedFrom: z.iso.date().optional(),
  appliedTo: z.iso.date().optional(),
  minScore:z.coerce.number().int().min(0).max(100).optional(),
  maxScore:z.coerce.number().int().min(0).max(100).optional(),
  skills:z.string().trim().max(100).default(""),
  screening: z.enum(["ALL","PENDING","HOLD","SHORTLISTED","REJECTED","UNRECORDED"]).default("ALL"),
  // Scoped attention deep links must filter the actual affected candidates,
  // not just show every application in the broad pipeline stage.
  attention:z.enum(["ALL","STALE_APPLICATIONS","INTERVIEW_UNSCHEDULED","OFFERED_NO_LETTER"]).default("ALL"),
  sort:z.enum(["AGE_ASC","AGE_DESC","SCORE_ASC","SCORE_DESC","SUBMITTED_DESC"]).default("SCORE_DESC"),
  page: z.coerce.number().int().min(1).max(1000).default(1),
  size:z.coerce.number().int().refine(value=>[10,20,50,100].includes(value),{
    message:"Choose 10, 20, 50 or 100 applications per page",
  }).default(20),
}).strict();
// Programmatic legacy links may omit page size. Parsed URLs always fill it.
export type DriveApplicationsQuery = Omit<z.infer<typeof driveApplicationsQuerySchema>,"size"|"sort"|"attention"> & {
 size?:number;sort?:z.infer<typeof driveApplicationsQuerySchema>["sort"];
 attention?:z.infer<typeof driveApplicationsQuerySchema>["attention"];
};
/** Legacy admin table used 10 rows; the drive register defaults to 20
 * with an explicit 10/20/50/100 choice. Export/bulk caps are independent. */
export const DRIVE_APPLICATIONS_PAGE_SIZE = 20;
export const DRIVE_APPLICATION_PAGE_SIZE_OPTIONS=[10,20,50,100] as const;
export const DRIVE_APPLICATION_EXPORT_CAP = 1000;
export const DRIVE_APPLICATION_BULK_CAP = 3000;

export function driveApplicationsParams(raw: Record<string,string|string[]|undefined>) {
  const input: Record<string,string> = {};
  for (const key of ["q","status","stage","source","departmentId","programId","cohortId","screening","attention","appliedFrom","appliedTo","minScore","maxScore","skills","page","size","sort"] as const) {
    const value = raw[key];
    // The legacy page tolerates malformed optional filters, but identifiers
    // must fail closed rather than silently broadening an academic scope.
    // Repeated selectors are ambiguous even for optional facets: dropping
    // one would broaden an export or return the wrong candidates.
    if (Array.isArray(value)) return null;
    if (typeof value === "string" && value !== "") input[key] = value;
  }
  const allowed: Record<string,readonly string[]> = {
    status:["ALL","SUBMITTED","WITHDRAWN"],
    source:["ALL","INTERNAL","EXTERNAL"],
    stage:["ALL","APPLIED","SHORTLISTED","ASSESSMENT","INTERVIEW","WAITLISTED","OFFERED","HIRED","REJECTED","WITHDRAWN"],
    screening:["ALL","PENDING","HOLD","SHORTLISTED","REJECTED","UNRECORDED"],
    attention:["ALL","STALE_APPLICATIONS","INTERVIEW_UNSCHEDULED","OFFERED_NO_LETTER"],
    sort:["AGE_ASC","AGE_DESC","SCORE_ASC","SCORE_DESC","SUBMITTED_DESC"],
  };
  for (const key of ["status","stage","source","screening","attention","sort"] as const) {
    const selected = input[key];
    const choices = allowed[key];
    if (selected && choices && !choices.includes(selected)) delete input[key];
  }
  if (input["page"] && !/^[1-9]\d{0,3}$/.test(input["page"])) delete input["page"];
  // Old table deep links used ?pageSize and some API clients used ?limit.
  // Conflicting or repeated choices are invalid instead of silently widening
  // a filtered export or changing how many learners are selected in bulk.
  for(const alias of ["pageSize","limit"]){
    const supplied=raw[alias];
    if(Array.isArray(supplied))return null;
    if(typeof supplied==="string"&&supplied!==""){
      if(input["size"]&&input["size"]!==supplied)return null;
      input["size"]=supplied;
    }
  }
  // Legacy callers use appliedAfter/appliedBefore. Resolve their aliases to
  // the canonical IST-inclusive filter names without silently widening scope
  // when both spellings disagree or contain repeated values.
  for (const [legacy, canonical] of [["appliedAfter", "appliedFrom"], ["appliedBefore", "appliedTo"]] as const) {
    const alternate = raw[legacy];
    if (Array.isArray(alternate)) return null;
    if (typeof alternate === "string" && alternate !== "") {
      if (input[canonical] && input[canonical] !== alternate) return null;
      input[canonical] = alternate;
    }
  }
  const result = driveApplicationsQuerySchema.safeParse(input);
  if(!result.success || (result.data.appliedFrom && result.data.appliedTo &&
     result.data.appliedFrom>result.data.appliedTo) ||
    (result.data.minScore!==undefined&&result.data.maxScore!==undefined&&result.data.minScore>result.data.maxScore))return null;
  return result.data;
}
/** Parse the exported view without silently dropping its screening, skills,
 * stage, attention or cohort constraints. A repeated selector is ambiguous;
 * even a syntactically valid first value must not widen a private export.
 */
export function driveApplicationsExportParams(search: URLSearchParams):
  {ok:true;query:NonNullable<ReturnType<typeof driveApplicationsParams>>}|
  {ok:false;status:400|422;message:string} {
  if(["minScore","maxScore","scoreFrom","scoreTo"].some(key=>search.has(key)))
    return {ok:false,status:422,message:"Score filtering is not available for this drive."};
  const allowed=new Set([
    "q","status","screening","source","stage","departmentId","programId",
    "cohortId","appliedFrom","appliedTo","appliedAfter","appliedBefore",
    "skills","attention","sort","page","size","pageSize","limit",
  ]);
  const raw:Record<string,string|string[]|undefined>={};
  for(const [key,value] of search){
    if(!allowed.has(key)||raw[key]!==undefined)
      return {ok:false,status:400,message:"Invalid export filters"};
    raw[key]=value;
  }
  const query=driveApplicationsParams(raw);
  if(!query)return {ok:false,status:400,message:"Invalid export filters"};
  // The interactive directory tolerates old malformed optional filters, but
  // exports must not turn an invalid supplied stage into an unrestricted CSV.
  for(const key of ["status","source","stage","screening","attention","sort"] as const){
    if(raw[key]!==undefined&&raw[key]!==query[key])
      return {ok:false,status:400,message:"Invalid export filters"};
  }
  if(raw["page"]!==undefined&&String(query.page)!==raw["page"])
    return {ok:false,status:400,message:"Invalid export filters"};
  return {ok:true,query};
}

export function driveApplicationsHref(jobId: string, query: DriveApplicationsQuery, exportCsv = false) {
  const params = new URLSearchParams();
  if (query.q) params.set("q",query.q);
  if (query.status !== "ALL") params.set("status",query.status);
  if (query.source !== "ALL") params.set("source",query.source);
  if (query.stage !== "ALL") params.set("stage",query.stage);
  if (query.departmentId) params.set("departmentId",query.departmentId);
  if (query.programId) params.set("programId",query.programId);
  if (query.cohortId) params.set("cohortId",query.cohortId);
  if (query.appliedFrom) params.set("appliedFrom",query.appliedFrom);
  if (query.appliedTo) params.set("appliedTo",query.appliedTo);
  if(query.minScore!==undefined)params.set("minScore",String(query.minScore));
  if(query.maxScore!==undefined)params.set("maxScore",String(query.maxScore));
  if(query.skills)params.set("skills",query.skills);
  if (query.screening !== "ALL") params.set("screening",query.screening);
  if (query.attention && query.attention!=="ALL") params.set("attention",query.attention);
  if(query.sort&&query.sort!=="SCORE_DESC")params.set("sort",query.sort);
  if (!exportCsv && query.page > 1) params.set("page",String(query.page));
  if(!exportCsv&&query.size!==undefined&&query.size!==DRIVE_APPLICATIONS_PAGE_SIZE)
    params.set("size",String(query.size));
  const suffix = exportCsv ? "/export" : "";
  return "/college/placements/jobs/" + encodeURIComponent(jobId) + "/applications" + suffix +
    (params.size ? "?" + params.toString() : "");
}
