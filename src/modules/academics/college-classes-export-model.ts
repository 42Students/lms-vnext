import { collegeClassBaseQuerySchema,withCollegeClassCapacityCheck } from "./college-structure-directory-model";
import { escapeActivityCsvCell } from "@/modules/activity/college-activity-export-model";

export const CLASSES_EXPORT_CAP = 1000;
export const collegeClassesExportSchema = withCollegeClassCapacityCheck(collegeClassBaseQuerySchema.omit({ page: true }));

export type ClassExportRow = {
  name: string; code: string; programName: string; cohortName: string;
  periodName: string; capacity: number | null; activeLearners: number; status: string;
};

export function classesExportHref(raw: { q: string; programId?: string; cohortCode?: string; classCode?: string; periodCode?: string; capacityState?:"ALL"|"CONFIGURED"|"UNSET"; minimumCapacity?: number; maximumCapacity?: number; periodLifecycle?:"ALL"|"PLANNED"|"ACTIVE"|"CLOSED"; programCode?:string; className?:string; status: "ALL" | "ACTIVE" | "ARCHIVED"; cohortStatus?: "ALL"|"PLANNED"|"ACTIVE"|"COMPLETED"|"ARCHIVED"; programStatus?: "ALL"|"ACTIVE"|"ARCHIVED"; }) {
  const params = new URLSearchParams();
  if (raw.q) params.set("q", raw.q);
  if (raw.programId) params.set("programId", raw.programId);
  if (raw.cohortCode) params.set("cohortCode", raw.cohortCode);
  if (raw.classCode) params.set("classCode",raw.classCode);
  if (raw.periodCode) params.set("periodCode",raw.periodCode);
  if (raw.capacityState && raw.capacityState !== "ALL") params.set("capacityState",raw.capacityState);
  if (raw.minimumCapacity !== undefined) params.set("minimumCapacity", String(raw.minimumCapacity));
  if (raw.maximumCapacity !== undefined) params.set("maximumCapacity",String(raw.maximumCapacity));
  if (raw.status !== "ACTIVE") params.set("status", raw.status);
  if(raw.cohortStatus&&raw.cohortStatus!=="ALL")params.set("cohortStatus",raw.cohortStatus);
  if(raw.programStatus&&raw.programStatus!=="ALL")params.set("programStatus",raw.programStatus);
  if(raw.periodLifecycle && raw.periodLifecycle!=="ALL")params.set("periodLifecycle",raw.periodLifecycle);
  if(raw.programCode)params.set("programCode",raw.programCode);
  if(raw.className)params.set("className",raw.className);
  return "/api/academics/college-classes-export" + (params.size ? "?" + params.toString() : "");
}

export function renderCollegeClassesCsv(rows: readonly ClassExportRow[], truncated: boolean) {
  const headers = ["Class", "Code", "Program", "Batch", "Academic period", "Configured capacity",
    "Active learner enrollments", "Status"];
  const lines = [headers.map(escapeActivityCsvCell).join(",")];
  for (const row of rows) lines.push([
    row.name, row.code, row.programName, row.cohortName, row.periodName,
    row.capacity === null ? "" : String(row.capacity),
    String(row.activeLearners), row.status,
  ].map(escapeActivityCsvCell).join(","));
  if (truncated) lines.push([
    "EXPORT TRUNCATED", "", "", "", "",
    "", "", "Only first 1,000 matching classes exported; narrow your filters.",
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
