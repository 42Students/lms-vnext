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
export const collegeClassBaseQuerySchema = collegeStructureQuerySchema.extend({
  className: z.string().trim().min(1).max(255).optional(),
  programCode: z.string().trim().min(1).max(64).optional(),
  periodLifecycle: z.enum(["ALL","PLANNED","ACTIVE","CLOSED"]).default("ALL"),
  cohortStatus: z.enum(["ALL","PLANNED","ACTIVE","COMPLETED","ARCHIVED"]).optional(),
  programStatus: z.enum(["ALL","ACTIVE","ARCHIVED"]).optional(),
  cohortCode: z.string().trim().min(1).max(64).optional(),
  classCode: z.string().trim().min(1).max(64).optional(),
  periodCode: z.string().trim().min(1).max(64).optional(),

  capacityState: z.enum(["ALL","CONFIGURED","UNSET"]).default("ALL"),
  minimumCapacity: z.coerce.number().int().min(1).max(100000).optional(),
  maximumCapacity: z.coerce.number().int().min(1).max(100000).optional(),
});

export function withCollegeClassCapacityCheck<T extends z.ZodType<{minimumCapacity?:number;maximumCapacity?:number;capacityState:"ALL"|"CONFIGURED"|"UNSET"}>>(schema:T){
  return schema.refine(q=>q.minimumCapacity===undefined||q.maximumCapacity===undefined||q.minimumCapacity<=q.maximumCapacity,
    {path:["maximumCapacity"],message:"Maximum class capacity must not be below minimum"})
    .refine(q=>q.capacityState!=="UNSET"||(q.minimumCapacity===undefined&&q.maximumCapacity===undefined),
      {path:["capacityState"],message:"Unconfigured class capacity cannot be combined with numeric capacity bounds"});
}
export const collegeClassQuerySchema=withCollegeClassCapacityCheck(collegeClassBaseQuerySchema);
export type CollegeClassQuery = z.infer<typeof collegeClassQuerySchema>;
export const collegeElectiveBaseQuerySchema = collegeStructureQuerySchema.extend({
  periodState: z.enum(["ALL","LINKED","UNLINKED"]).optional(),
  choiceMode: z.enum(["ALL","FLEXIBLE","FIXED"]).optional(),
  offeringState: z.enum(["ALL","HAS_ACTIVE","NONE_ACTIVE"]).optional(),
  academicYearState: z.enum(["ALL","RECORDED","MISSING"]).optional(),
  periodCode: z.string().trim().min(1).max(64).optional(),
  semesterNumber: z.coerce.number().int().min(1).max(24).optional(),
  programStatus: z.enum(["ALL","ACTIVE","ARCHIVED"]).optional(),
  minimumCredits: z.coerce.number().int().min(1).max(500).optional(),
  maximumCredits: z.coerce.number().int().min(1).max(500).optional(),
});

export function withCollegeElectiveCreditsCheck<T extends z.ZodType<{ minimumCredits?: number; maximumCredits?: number }>>(schema:T) {
  return schema.refine(q => q.minimumCredits === undefined || q.maximumCredits === undefined || q.minimumCredits <= q.maximumCredits,
    {path:["maximumCredits"],message:"Maximum elective credits must not be below minimum"});
}
export const collegeElectiveQuerySchema = withCollegeElectiveCreditsCheck(collegeElectiveBaseQuerySchema);
export type CollegeElectiveQuery = z.infer<typeof collegeElectiveQuerySchema>;

export function readCollegeStructureParams(
  values: Record<string, string | string[] | undefined>,
): Record<string, string> | null {
  const result: Record<string, string> = {};
  for (const key of ["q", "programId", "status", "cohortCode", "capacityState", "minimumCapacity", "maximumCapacity", "semesterNumber", "minimumCredits", "maximumCredits", "cohortStatus", "programStatus", "periodState", "periodCode", "classCode", "choiceMode", "offeringState", "academicYearState", "periodLifecycle", "programCode", "className", "page"] as const) {
    const value = values[key];
    if (Array.isArray(value)) return null;
    if (typeof value === "string" && !((key === "programCode" || key === "className" || key === "programId" || key === "cohortCode" || key === "classCode" || key === "periodCode" || key === "minimumCapacity" || key === "maximumCapacity" || key === "semesterNumber" || key === "minimumCredits" || key === "maximumCredits") && !value)) {
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
  if (kind === "CLASSES" && "cohortCode" in query && query.cohortCode)
    params.set("cohortCode",query.cohortCode);
  if (kind === "CLASSES" && "capacityState" in query && query.capacityState !== "ALL")
    params.set("capacityState",query.capacityState);
  if (kind === "CLASSES" && "minimumCapacity" in query && query.minimumCapacity !== undefined)
    params.set("minimumCapacity", String(query.minimumCapacity));
  if (kind === "CLASSES" && "maximumCapacity" in query && query.maximumCapacity !== undefined)
    params.set("maximumCapacity",String(query.maximumCapacity));
  if (kind === "ELECTIVES" && "semesterNumber" in query && query.semesterNumber !== undefined)
    params.set("semesterNumber", String(query.semesterNumber));
  if (kind === "ELECTIVES" && "minimumCredits" in query && query.minimumCredits !== undefined)
    params.set("minimumCredits",String(query.minimumCredits));
  if (kind === "ELECTIVES" && "maximumCredits" in query && query.maximumCredits !== undefined)
    params.set("maximumCredits",String(query.maximumCredits));
  if ("cohortStatus" in query && query.cohortStatus && query.cohortStatus !== "ALL") params.set("cohortStatus",query.cohortStatus);
  if ("programStatus" in query && query.programStatus && query.programStatus !== "ALL") params.set("programStatus",query.programStatus);
  if ("periodState" in query && query.periodState && query.periodState !== "ALL") params.set("periodState",query.periodState);
  if ("periodCode" in query && query.periodCode) params.set("periodCode",query.periodCode);
  if ("classCode" in query && query.classCode) params.set("classCode",query.classCode);
  if ("choiceMode" in query && query.choiceMode && query.choiceMode !== "ALL") params.set("choiceMode",query.choiceMode);
  if ("offeringState" in query && query.offeringState && query.offeringState !== "ALL") params.set("offeringState",query.offeringState);
  if ("academicYearState" in query && query.academicYearState && query.academicYearState !== "ALL") params.set("academicYearState",query.academicYearState);
  if ("periodCode" in query && query.periodCode) params.set("periodCode",query.periodCode);
  if (kind === "CLASSES" && "periodLifecycle" in query && query.periodLifecycle !== "ALL") params.set("periodLifecycle",query.periodLifecycle);
  if (kind === "CLASSES" && "programCode" in query && query.programCode) params.set("programCode",query.programCode);
  if (kind === "CLASSES" && "className" in query && query.className) params.set("className",query.className);
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
