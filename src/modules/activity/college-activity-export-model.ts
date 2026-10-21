import { z } from "zod";
import { ACTIVITY_IMPORTANCE, ACTIVITY_MODULES } from "./taxonomy";
import {collegeActivityItem} from "./college-activity-presentation";

export const COLLEGE_ACTIVITY_EXPORT_CAP = 1000;
/** College-admin activity exports deliberately do not expose IP addresses. */
export const COLLEGE_ACTIVITY_IP_POLICY="REDACTED" as const;
export const collegeActivityExportQuerySchema = z.object({
  view: z.enum(["IMPORTANT", "EVERYTHING"]).optional(),
  category: z.enum(["ACADEMIC_SETUP", "PEOPLE_ACCESS", "TEACHING", "PROJECTS"]).optional(),
  module: z.enum(ACTIVITY_MODULES).optional(),
  importance: z.enum(ACTIVITY_IMPORTANCE).optional(),
  actorUserId: z.string().uuid().optional(),
  actorName: z.string().trim().min(1).max(100).optional(),
  eventType: z.string().trim().min(1).max(120).optional(),
  q: z.string().trim().min(1).max(100).optional(),
  subjectType: z.string().trim().min(1).max(80).optional(),
  subjectId: z.string().trim().min(1).max(500).optional(),
  from: z.string().min(1).max(40).optional(),
  to: z.string().min(1).max(40).optional(),
}).strict();
export type CollegeActivityExportQuery = z.infer<typeof collegeActivityExportQuerySchema>;
export type ActivityExportRow = {
  id: string; occurredAt: Date; module: string; importance: string; eventType: string;
  subjectType: string; subjectId: string; subjectLabel: string | null; summary: string;
  actorName: string | null; actorEmail: string | null;
};

export function escapeActivityCsvCell(value: string): string {
  const neutral = /^[\s]*[=+@\-\t\r]/.test(value) ? "'" + value : value;
  return '"' + neutral.replaceAll('"', '""') + '"';
}

export function buildCollegeActivityCsv(
  rows: readonly ActivityExportRow[],
  truncated: boolean,
): string {
  // Legacy read-only feed columns. Never synthesize or disclose client IP data.
  const columns=["Time","Who","What","Item","Action key","IP"];
  const timestamp=new Intl.DateTimeFormat("en-IN",{
    dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata",
  });
  const lines=[columns.map(escapeActivityCsvCell).join(",")];
  for(const row of rows){
    lines.push([
      timestamp.format(row.occurredAt)+" IST",
      row.actorName?.trim()||row.actorEmail?.trim()||"System",
      row.summary,
      collegeActivityItem(row),
      row.eventType,
      "Redacted",
    ].map(escapeActivityCsvCell).join(","));
  }
  if(truncated){
    lines.push([
      "EXPORT TRUNCATED",
      "",
      `Only the latest ${COLLEGE_ACTIVITY_EXPORT_CAP} matching events were exported. Narrow the filters for older activity.`,
      "","","",
    ].map(escapeActivityCsvCell).join(","));
  }
  return "\ufeff" + lines.join("\r\n");
}

export function readCollegeActivityExportParams(params: URLSearchParams): Record<string, string> | null {
  const out: Record<string, string> = {};
  for (const key of params.keys()) {
    if (params.getAll(key).length !== 1) return null;
    const value = params.get(key) ?? "";
    if (value) out[key] = value;
  }
  return out;
}
