import { collegeClassBaseQuerySchema,withCollegeClassCapacityCheck } from "./college-structure-directory-model";
import { buildCollegeDirectoryCsv } from "./college-directory-export-model";

/** All filtered classes are exported using server-authored pages. */
export const CLASSES_EXPORT_CAP = 1000;
export const collegeClassesExportSchema = withCollegeClassCapacityCheck(collegeClassBaseQuerySchema.omit({ page: true, pageSize: true }));

export type ClassExportRow = {
  id: string; name: string; linkedProgramId: string | null;
  cohortId: string; periodStart?: string | null; periodEnd?: string | null; minSize: number | null; capacity: number | null;
};

export function classesExportHref(raw: { q: string; programId?: string | undefined; cohortCode?: string | undefined; classCode?: string | undefined; periodCode?: string | undefined; capacityState?:"ALL"|"CONFIGURED"|"UNSET" | undefined; minimumCapacity?: number | undefined; maximumCapacity?: number | undefined; periodLifecycle?:"ALL"|"PLANNED"|"ACTIVE"|"CLOSED" | undefined; programCode?:string | undefined; className?:string | undefined; cohortName?:string | undefined; schedulePresence?:"ALL"|"HAS_EVENTS"|"NO_EVENTS" | undefined; facultyCoverage?:"ALL"|"HAS_FACULTY"|"NO_FACULTY" | undefined; deliveryPresence?:"ALL"|"HAS_DELIVERIES"|"NO_DELIVERIES" | undefined; periodStartsOnOrAfter?:string | undefined; periodEndsOnOrBefore?:string | undefined; departmentCode?:string | undefined; status: "ALL" | "ACTIVE" | "ARCHIVED"; cohortStatus?: "ALL"|"PLANNED"|"ACTIVE"|"COMPLETED"|"ARCHIVED" | undefined; programStatus?: "ALL"|"ACTIVE"|"ARCHIVED" | undefined; }) {
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

/** Preserve the existing legacy columns; a bounded export tells people when
 * additional filtered classes are omitted instead of silently truncating. */
export function renderCollegeClassesCsv(rows: readonly ClassExportRow[], truncated = false) {
  const headers = ["ID", "Class/Section Name", "Program ID", "Batch ID", "Start Date", "End Date", "Minimum Students", "Maximum Students"];
  const items = rows.slice(0, CLASSES_EXPORT_CAP).map(row => [
    row.id ?? "", row.name ?? "", row.linkedProgramId ?? "", row.cohortId ?? "",
    row.periodStart ?? "", row.periodEnd ?? "",
    row.minSize == null ? "" : String(row.minSize),
    row.capacity == null ? "" : String(row.capacity),
  ]);
  return buildCollegeDirectoryCsv(headers, items,
    truncated || rows.length > CLASSES_EXPORT_CAP, CLASSES_EXPORT_CAP);
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
