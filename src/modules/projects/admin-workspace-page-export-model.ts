import {collegeWorkspaceStatusLabel} from "./college-workspace-status-label";
import {projectAdminCsv,projectAdminCsvCell} from "./project-admin-csv-model";

export type VisibleWorkspaceExportRow = {
  title: string;
  mentorName: string | null;
  status: string;
  riskReasons?: readonly string[];
  progressPercent: number;
  memberCount: number;
  updatedAt: Date;
};

const headings = ["Workspace","Mentor","Status","Progress %","Members","Last changed (IST)"] as const;

/** Spreadsheet-safe CSV escaping for user-authored project workspace names. */
export function projectWorkspaceCsvCell(value: string | number | null): string {
  return projectAdminCsvCell(value);
}

/** Export *only* the already scoped visible results, never re-query the tenant. */
export function projectWorkspacePageCsv(
  items: readonly VisibleWorkspaceExportRow[],
): string {
  const date = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "short",
  });
  const rows = items.map(item => [
    item.title,
    item.mentorName ?? "Unassigned",
    collegeWorkspaceStatusLabel(item.status,item.riskReasons),
    item.progressPercent,
    item.memberCount,
    Number.isFinite(item.updatedAt.getTime()) ? date.format(item.updatedAt) : "Date unavailable",
  ]);
  return projectAdminCsv([headings,...rows]);
}
