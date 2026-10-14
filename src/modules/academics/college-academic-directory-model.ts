import { z } from "zod";

export const COLLEGE_ACADEMIC_PAGE_SIZE = 25;

const common = {
  q: z.string().trim().max(100).default(""),
  programId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).max(1000).default(1),
};

export const collegeSemesterDirectorySchema = z.object({
  ...common,
  termNumber: z.coerce.number().int().min(1).max(24).optional(),
  status: z.enum(["ALL", "ACTIVE", "INACTIVE"]).default("ALL"),
}).strict();

export const collegeBatchDirectorySchema = z.object({
  ...common,
  yearStart: z.coerce.number().int().min(1900).max(9998).optional(),
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
  if ("yearStart" in query && query.yearStart !== undefined) params.set("yearStart", String(query.yearStart));
  if (query.status !== "ALL") params.set("status", query.status);
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
  for (const key of ["q", "programId", "termNumber", "yearStart", "status", "page"] as const) {
    const value = params[key];
    if (Array.isArray(value)) return null;
    if (typeof value === "string" && (key !== "programId" && key !== "termNumber" && key !== "yearStart" || value !== "")) {
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
