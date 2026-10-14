import { z } from "zod";

export const COLLEGE_STRUCTURE_PAGE_SIZE = 25;
export type CollegeStructureKind = "CLASSES" | "ELECTIVES";

export const collegeStructureQuerySchema = z.object({
  q: z.string().trim().max(100).default(""),
  programId: z.string().uuid().optional(),
  status: z.enum(["ALL", "ACTIVE", "ARCHIVED"]).default("ACTIVE"),
  page: z.coerce.number().int().min(1).max(1000).default(1),
}).strict();
export type CollegeStructureQuery = z.infer<typeof collegeStructureQuerySchema>;
export const collegeClassQuerySchema = collegeStructureQuerySchema.extend({
  minimumCapacity: z.coerce.number().int().min(1).max(100000).optional(),
});
export type CollegeClassQuery = z.infer<typeof collegeClassQuerySchema>;
export const collegeElectiveQuerySchema = collegeStructureQuerySchema.extend({
  semesterNumber: z.coerce.number().int().min(1).max(24).optional(),
  minimumCredits: z.coerce.number().int().min(1).max(500).optional(),
});
export type CollegeElectiveQuery = z.infer<typeof collegeElectiveQuerySchema>;

export function readCollegeStructureParams(
  values: Record<string, string | string[] | undefined>,
): Record<string, string> | null {
  const result: Record<string, string> = {};
  for (const key of ["q", "programId", "status", "minimumCapacity", "semesterNumber", "minimumCredits", "page"] as const) {
    const value = values[key];
    if (Array.isArray(value)) return null;
    if (typeof value === "string" && !((key === "programId" || key === "minimumCapacity" || key === "semesterNumber" || key === "minimumCredits") && !value)) {
      result[key] = value;
    }
  }
  return result;
}

export function collegeStructureHref(kind: CollegeStructureKind, query: CollegeStructureQuery | CollegeClassQuery | CollegeElectiveQuery) {
  const path = kind === "CLASSES" ? "/college/classes" : "/college/electives";
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.programId) params.set("programId", query.programId);
  if (query.status !== "ACTIVE") params.set("status", query.status);
  if (kind === "CLASSES" && "minimumCapacity" in query && query.minimumCapacity !== undefined)
    params.set("minimumCapacity", String(query.minimumCapacity));
  if (kind === "ELECTIVES" && "semesterNumber" in query && query.semesterNumber !== undefined)
    params.set("semesterNumber", String(query.semesterNumber));
  if (kind === "ELECTIVES" && "minimumCredits" in query && query.minimumCredits !== undefined)
    params.set("minimumCredits",String(query.minimumCredits));
  if (query.page > 1) params.set("page", String(query.page));
  return params.size ? path + "?" + params.toString() : path;
}

export function collegeStructureTotalPages(total: number) {
  return Math.max(1, Math.ceil(total / COLLEGE_STRUCTURE_PAGE_SIZE));
}

export function classCapacityLabel(capacity: number | null) {
  return capacity === null ? "Not configured" : String(capacity);
}

export function electiveSelectionLabel(minPick: number, maxPick: number) {
  return minPick === maxPick
    ? `Select ${minPick}`
    : `Select ${minPick}–${maxPick}`;
}
