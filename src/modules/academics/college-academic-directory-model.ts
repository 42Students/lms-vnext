import { z } from "zod";

export const COLLEGE_ACADEMIC_PAGE_SIZE = 25;
export const COLLEGE_ACADEMIC_AUTOCOMPLETE_LIMIT = 15;
export const academicPageSizeOptions=[10,25,50,100] as const;
export const academicDirectoryPageSizeStorageKey="admin-semesters-page-size";
/** Read browser preference ONLY in client hydration, not a server render.
 * Returns 25 for corrupt/disallowed preferences; remains bounded by Zod.
 */
export function readAcademicPageSizePreference(storage?:Pick<Storage,"getItem">|null):number {
  let value:string|null=null;
  try{value=storage?.getItem(academicDirectoryPageSizeStorageKey)??null;}catch{return 25;}
  const number=Number(value);
  return academicPageSizeOptions.some(size=>size===number)?number:COLLEGE_ACADEMIC_PAGE_SIZE;
}

// Browser query numbers must be decimal digits. z.coerce.number() would
// silently accept exponent, hexadecimal, and whitespace forms.
const directoryDecimal=(min:number,max:number)=>z.union([
  z.number().int().min(min).max(max),
  z.string().regex(/^[0-9]+$/).transform(Number)
   .pipe(z.number().int().min(min).max(max)),
]);

const common = {
  q: z.string().trim().max(100).default(""),
  programId: z.string().uuid().optional(),
  page: directoryDecimal(1,1000).default(1),
  pageSize: directoryDecimal(10,100).refine(n => [10,25,50,100].includes(n)).default(COLLEGE_ACADEMIC_PAGE_SIZE),
};

export const collegeSemesterDirectoryBaseSchema = z.object({
  ...common,
  termNumber: directoryDecimal(1,24).optional(),
  minimumCredits: directoryDecimal(0,500).optional(),
  maximumCredits: directoryDecimal(0,500).optional(),
  creditState: z.enum(["ALL", "CONFIGURED", "UNSET"]).optional(),
  programStatus: z.enum(["ALL", "ACTIVE", "ARCHIVED"]).optional(),
  mappingState: z.enum(["ALL","MAPPED","UNMAPPED"]).optional(),
  status: z.enum(["ALL", "ACTIVE", "INACTIVE"]).default("ALL"),
}).strict();

export function withCollegeSemesterCreditCheck<T extends typeof collegeSemesterDirectoryBaseSchema>(schema:T) {
  return schema.refine(q => q.minimumCredits === undefined || q.maximumCredits === undefined || q.minimumCredits <= q.maximumCredits,
    {path:["maximumCredits"],message:"Maximum credits must be at least the minimum"})
    .refine(q => q.creditState !== "UNSET" || (q.minimumCredits === undefined && q.maximumCredits === undefined),
      {path:["creditState"],message:"Unconfigured semester credits cannot be combined with credit bounds"});
}

export const collegeSemesterDirectorySchema = collegeSemesterDirectoryBaseSchema
  .refine(q => q.minimumCredits === undefined || q.maximumCredits === undefined || q.minimumCredits <= q.maximumCredits,
    {path:["maximumCredits"],message:"Maximum credits must be at least the minimum"})
  .refine(q => q.creditState !== "UNSET" || (q.minimumCredits === undefined && q.maximumCredits === undefined),
    {path:["creditState"],message:"Unconfigured semester credits cannot be combined with credit bounds"});

export const collegeBatchDirectoryBaseSchema = z.object({
  ...common,
  yearStart: directoryDecimal(1900,9998).optional(),
  currentTerm: directoryDecimal(1,24).optional(),
  progression: z.enum(["ALL","RECORDED","MISSING"]).default("ALL"),
  programStatus: z.enum(["ALL","ACTIVE","ARCHIVED"]).optional(),
  expectedEndState: z.enum(["ALL","SET","UNSET"]).optional(),
  academicYearState: z.enum(["ALL","RECORDED","UNRECORDED"]).optional(),
  activeLearnerState: z.enum(["ALL","HAS_ACTIVE","NONE_ACTIVE"]).optional(),
  activeClassState: z.enum(["ALL","HAS_ACTIVE","NONE_ACTIVE"]).optional(),
  startOnOrAfter: z.iso.date().optional(),
  startOnOrBefore: z.iso.date().optional(),
  status: z.enum(["ALL", "PLANNED", "ACTIVE", "INACTIVE", "COMPLETED", "ARCHIVED"]).default("ALL"),
}).strict();

export function withCollegeBatchFilterCheck<T extends typeof collegeBatchDirectoryBaseSchema>(schema:T){
 return schema.refine(q=>q.startOnOrAfter===undefined||q.startOnOrBefore===undefined||q.startOnOrAfter<=q.startOnOrBefore,
  {path:["startOnOrBefore"],message:"Batch start-date end limit must not precede start limit"}).refine(q=>q.progression!=="MISSING"||q.currentTerm===undefined,
  {path:["currentTerm"],message:"A missing progression record cannot have a recorded current term"}).refine(q=>q.academicYearState!=="UNRECORDED"||q.yearStart===undefined,
  {path:["yearStart"],message:"An unrecorded academic year cannot match a year-start filter"}).refine(q=>q.progression!=="MISSING"||q.yearStart===undefined,
  {path:["yearStart"],message:"A missing progression record cannot match a recorded academic year"});
}
export const collegeBatchDirectorySchema = collegeBatchDirectoryBaseSchema
  .refine(q=>q.startOnOrAfter===undefined||q.startOnOrBefore===undefined||q.startOnOrAfter<=q.startOnOrBefore,
    {path:["startOnOrBefore"],message:"Batch start-date end limit must not precede start limit"})
  .refine(q=>q.progression!=="MISSING"||q.currentTerm===undefined,
    {path:["currentTerm"],message:"A missing progression record cannot have a recorded current term"})
  .refine(q=>q.academicYearState!=="UNRECORDED"||q.yearStart===undefined,
    {path:["yearStart"],message:"An unrecorded academic year cannot match a year-start filter"})
  .refine(q=>q.progression!=="MISSING"||q.yearStart===undefined,
    {path:["yearStart"],message:"A missing progression record cannot match a recorded academic year"});

export type CollegeSemesterDirectoryQuery = z.infer<typeof collegeSemesterDirectorySchema>;
export type CollegeBatchDirectoryQuery = z.infer<typeof collegeBatchDirectorySchema>;
export type CollegeDirectoryKind = "SEMESTERS" | "BATCHES";

export function academicDirectoryHref(
  kind: CollegeDirectoryKind,
  query: CollegeSemesterDirectoryQuery | CollegeBatchDirectoryQuery,
): string {
  const base = kind === "SEMESTERS" ? "/college/semesters" : "/college/batches";
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.programId) params.set("programId", query.programId);
  if ("termNumber" in query && query.termNumber !== undefined) params.set("termNumber", String(query.termNumber));
  if ("minimumCredits" in query && query.minimumCredits !== undefined) params.set("minimumCredits", String(query.minimumCredits));
  if ("maximumCredits" in query && query.maximumCredits !== undefined) params.set("maximumCredits", String(query.maximumCredits));
  if ("creditState" in query && query.creditState && query.creditState !== "ALL") params.set("creditState", query.creditState);
  if ("yearStart" in query && query.yearStart !== undefined) params.set("yearStart", String(query.yearStart));
  if ("currentTerm" in query && query.currentTerm !== undefined) params.set("currentTerm",String(query.currentTerm));
  if ("progression" in query && query.progression !== "ALL") params.set("progression",query.progression);
  if (query.status !== "ALL") params.set("status", query.status);
  if ("programStatus" in query && query.programStatus && query.programStatus !== "ALL") params.set("programStatus", query.programStatus);
  if ("mappingState" in query && query.mappingState && query.mappingState !== "ALL") params.set("mappingState",query.mappingState);
  if ("expectedEndState" in query && query.expectedEndState && query.expectedEndState !== "ALL") params.set("expectedEndState",query.expectedEndState);
  if ("academicYearState" in query && query.academicYearState && query.academicYearState !== "ALL") params.set("academicYearState",query.academicYearState);
  if ("startOnOrAfter" in query && query.startOnOrAfter) params.set("startOnOrAfter",query.startOnOrAfter);
  if ("startOnOrBefore" in query && query.startOnOrBefore) params.set("startOnOrBefore",query.startOnOrBefore);
  if ("activeClassState" in query && query.activeClassState && query.activeClassState !== "ALL") params.set("activeClassState",query.activeClassState);
  if ("activeLearnerState" in query && query.activeLearnerState && query.activeLearnerState !== "ALL") params.set("activeLearnerState",query.activeLearnerState);
  if (query.page !== 1) params.set("page", String(query.page));
  if (query.pageSize !== COLLEGE_ACADEMIC_PAGE_SIZE) params.set("pageSize", String(query.pageSize));
  return params.size ? base + "?" + params.toString() : base;
}

export function academicDirectoryPageCount(total: number, pageSize = COLLEGE_ACADEMIC_PAGE_SIZE): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

export function academicDirectorySearchParams(
  params: Record<string, string | string[] | undefined>,
): Record<string, string> | null {
  const result: Record<string, string> = {};
  const allowed=["q", "programId", "termNumber", "minimumCredits", "maximumCredits", "yearStart","creditState",  "currentTerm", "progression", "status", "programStatus", "mappingState", "expectedEndState", "academicYearState", "startOnOrAfter", "startOnOrBefore", "activeClassState", "activeLearnerState", "page", "pageSize"] as const;
  if (Object.keys(params).some(key=>!(allowed as readonly string[]).includes(key)))return null;
  for (const key of allowed) {
    const value = params[key];
    if (Array.isArray(value)) return null;
    if (typeof value === "string" && (key !== "startOnOrAfter" || value !== "") && (key !== "startOnOrBefore" || value !== "") && (key !== "programId" && key !== "termNumber" && key !== "minimumCredits" && key !== "maximumCredits" && key !== "yearStart" && key !== "currentTerm" || value !== "")) {
      result[key] = value;
    }
  }
  return result;
}

export function batchProgressLabel(
  state: { currentTermNumber: number; currentAcademicYearStart: number | null } | null,
): string {
  if (!state) return "No progression state recorded";
  const term = "Term " + state.currentTermNumber;
  return state.currentAcademicYearStart === null
    ? term + " · academic year not recorded"
    : term + " · " + state.currentAcademicYearStart + "–" + (state.currentAcademicYearStart + 1);
}
