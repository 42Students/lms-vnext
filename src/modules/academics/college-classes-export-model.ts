import { collegeClassQuerySchema } from "./college-structure-directory-model";
import { escapeActivityCsvCell } from "@/modules/activity/college-activity-export-model";

export const CLASSES_EXPORT_CAP = 1000;
export const collegeClassesExportSchema = collegeClassQuerySchema.omit({ page: true });

export type ClassExportRow = {
  name: string; code: string; programName: string; cohortName: string;
  periodName: string; capacity: number | null; activeLearners: number; status: string;
};

export function classesExportHref(raw: { q: string; programId?: string; minimumCapacity?: number; maximumCapacity?: number; status: "ALL" | "ACTIVE" | "ARCHIVED" }) {
  const params = new URLSearchParams();
  if (raw.q) params.set("q", raw.q);
  if (raw.programId) params.set("programId", raw.programId);
  if (raw.minimumCapacity !== undefined) params.set("minimumCapacity", String(raw.minimumCapacity));
  if (raw.maximumCapacity !== undefined) params.set("maximumCapacity",String(raw.maximumCapacity));
  if (raw.status !== "ACTIVE") params.set("status", raw.status);
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
