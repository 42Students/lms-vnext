import { collegeClassBaseQuerySchema,withCollegeClassCapacityCheck } from "./college-structure-directory-model";
import { escapeActivityCsvCell } from "@/modules/activity/college-activity-export-model";

/** All filtered classes are exported using server-authored pages. */
export const CLASSES_EXPORT_CAP = Number.MAX_SAFE_INTEGER;
export const collegeClassesExportSchema = withCollegeClassCapacityCheck(collegeClassBaseQuerySchema.omit({ page: true }));

export type ClassExportRow = {
  id: string; name: string; linkedProgramId: string | null;
  cohortId: string; periodStart?: string | null; periodEnd?: string | null; minSize: number | null; capacity: number | null;
};

export function classesExportHref(raw: { q: string; programId?: string; cohortCode?: string; classCode?: string; periodCode?: string; capacityState?:"ALL"|"CONFIGURED"|"UNSET"; minimumCapacity?: number; maximumCapacity?: number; periodLifecycle?:"ALL"|"PLANNED"|"ACTIVE"|"CLOSED"; programCode?:string; className?:string; cohortName?:string; schedulePresence?:"ALL"|"HAS_EVENTS"|"NO_EVENTS"; facultyCoverage?:"ALL"|"HAS_FACULTY"|"NO_FACULTY"; deliveryPresence?:"ALL"|"HAS_DELIVERIES"|"NO_DELIVERIES"; periodStartsOnOrAfter?:string; periodEndsOnOrBefore?:string; departmentCode?:string; status: "ALL" | "ACTIVE" | "ARCHIVED"; cohortStatus?: "ALL"|"PLANNED"|"ACTIVE"|"COMPLETED"|"ARCHIVED"; programStatus?: "ALL"|"ACTIVE"|"ARCHIVED"; }) {
  const params = new URLSearchParams();
  if (raw.q) params.set("q", raw.q);
  if (raw.programId) params.set("programId", raw.programId);
  if (raw.cohortCode) params.set("cohortCode", raw.cohortCode);
  if (raw.classCode) params.set("classCode",raw.classCode);
  if (raw.periodCode) params.set("periodCode",raw.periodCode);
  if (raw.capacityState && raw.capacityState !== "ALL") params.set("capacityState",raw.capacityState);
  if (raw.minimumCapacity !== undefined) params.set("minimumCapacity", String(raw.minimumCapacity));
  if (raw.maximumCapacity !== undefined) params.set("maximumCapacity",String(raw.maximumCapacity));
  if (raw.status !== "ALL") params.set("status", raw.status);
  if(raw.cohortStatus&&raw.cohortStatus!=="ALL")params.set("cohortStatus",raw.cohortStatus);
  if(raw.programStatus&&raw.programStatus!=="ALL")params.set("programStatus",raw.programStatus);
  if(raw.periodLifecycle && raw.periodLifecycle!=="ALL")params.set("periodLifecycle",raw.periodLifecycle);
  if(raw.programCode)params.set("programCode",raw.programCode);
  if(raw.className)params.set("className",raw.className);
  if(raw.cohortName)params.set("cohortName",raw.cohortName);
  if(raw.schedulePresence&&raw.schedulePresence!=="ALL")params.set("schedulePresence",raw.schedulePresence);
  if(raw.facultyCoverage&&raw.facultyCoverage!=="ALL")params.set("facultyCoverage",raw.facultyCoverage);
  if(raw.deliveryPresence&&raw.deliveryPresence!=="ALL")params.set("deliveryPresence",raw.deliveryPresence);
  if(raw.periodStartsOnOrAfter)params.set("periodStartsOnOrAfter",raw.periodStartsOnOrAfter);
  if(raw.periodEndsOnOrBefore)params.set("periodEndsOnOrBefore",raw.periodEndsOnOrBefore);
  if(raw.departmentCode)params.set("departmentCode",raw.departmentCode);
  return "/api/academics/college-classes-export" + (params.size ? "?" + params.toString() : "");
}

export function renderCollegeClassesCsv(rows: readonly ClassExportRow[], _truncated = false) {
  const headers = ["ID", "Class/Section Name", "Program ID", "Batch ID", "Start Date", "End Date", "Minimum Students", "Maximum Students"];
  const lines = [headers.map(escapeActivityCsvCell).join(",")];
  for (const row of rows) lines.push([
    row.id, row.name, row.linkedProgramId ?? "", row.cohortId,
    row.periodStart ?? "", row.periodEnd ?? "",
    row.minSize === null ? "" : String(row.minSize),
    row.capacity === null ? "" : String(row.capacity),
  ].map(escapeActivityCsvCell).join(","));
  return "\ufeff" + lines.join("\r\n");
}

export function readClassesExportParams(params: URLSearchParams) {
  const result: Record<string, string> = {};
  for (const key of params.keys()) {
    if (params.getAll(key).length !== 1) return null;
    const value = params.get(key);
    if (value) result[key] = value;
  }
  return result;
}
