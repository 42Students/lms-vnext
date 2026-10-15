import { z } from "zod";

export const COLLEGE_ACADEMIC_PAGE_SIZE = 25;

const common = {
  q: z.string().trim().max(100).default(""),
  programId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).max(1000).default(1),
};

export const collegeSemesterDirectoryBaseSchema = z.object({
  ...common,
  termNumber: z.coerce.number().int().min(1).max(24).optional(),
  minimumCredits: z.coerce.number().int().min(0).max(500).optional(),
  maximumCredits: z.coerce.number().int().min(0).max(500).optional(),
  creditState: z.enum(["ALL", "CONFIGURED", "UNSET"]).optional(),
  programStatus: z.enum(["ALL", "ACTIVE", "ARCHIVED"]).optional(),
  mappingState: z.enum(["ALL","MAPPED","UNMAPPED"]).optional(),
  status: z.enum(["ALL", "ACTIVE", "INACTIVE"]).default("ALL"),
}).strict();

export function withCollegeSemesterCreditCheck<T extends z.ZodType<{ minimumCredits?: number; maximumCredits?: number }>>(schema:T) {
  return schema.refine(q => q.minimumCredits === undefined || q.maximumCredits === undefined || q.minimumCredits <= q.maximumCredits,
    {path:["maximumCredits"],message:"Maximum credits must be at least the minimum"});
}

export const collegeSemesterDirectorySchema = withCollegeSemesterCreditCheck(collegeSemesterDirectoryBaseSchema);

export const collegeBatchDirectorySchema = z.object({
  ...common,
  yearStart: z.coerce.number().int().min(1900).max(9998).optional(),
  currentTerm: z.coerce.number().int().min(1).max(24).optional(),
  progression: z.enum(["ALL","RECORDED","MISSING"]).default("ALL"),
  programStatus: z.enum(["ALL","ACTIVE","ARCHIVED"]).optional(),
  expectedEndState: z.enum(["ALL","SET","UNSET"]).optional(),
  academicYearState: z.enum(["ALL","RECORDED","UNRECORDED"]).optional(),
  activeClassState: z.enum(["ALL","HAS_ACTIVE","NONE_ACTIVE"]).optional(),
  startOnOrAfter: z.iso.date().optional(),
  startOnOrBefore: z.iso.date().optional(),
  status: z.enum(["ALL", "PLANNED", "ACTIVE", "COMPLETED", "ARCHIVED"]).default("ALL"),
}).strict();

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
  if (query.page !== 1) params.set("page", String(query.page));
  return params.size ? base + "?" + params.toString() : base;
}

export function academicDirectoryPageCount(total: number): number {
  return Math.max(1, Math.ceil(total / COLLEGE_ACADEMIC_PAGE_SIZE));
}

export function academicDirectorySearchParams(
  params: Record<string, string | string[] | undefined>,
): Record<string, string> | null {
  const result: Record<string, string> = {};
  for (const key of ["q", "programId", "termNumber", "minimumCredits", "maximumCredits", "yearStart","creditState",  "currentTerm", "progression", "status", "programStatus", "mappingState", "expectedEndState", "academicYearState", "startOnOrAfter", "startOnOrBefore", "activeClassState", "page"] as const) {
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
