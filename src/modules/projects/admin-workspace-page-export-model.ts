import {collegeWorkspaceStatusLabel} from "./college-workspace-status-label";
import {projectAdminCsv,projectAdminCsvCell} from "./project-admin-csv-model";

export type VisibleWorkspaceExportRow = {
  title: string;
  mentorName: string | null;
  templateId?: string | null;
  status: string;
  riskReasons?: readonly string[];
  progressPercent: number;
  memberCount: number;
  updatedAt: Date;
};

const headings = ["Workspace","Status","Progress","Mentor","Template ID"] as const;

/** Spreadsheet-safe CSV escaping for user-authored project workspace names. */
export function projectWorkspaceCsvCell(value: string | number | null): string {
  return projectAdminCsvCell(value);
}

/** Export *only* the already scoped visible results, never re-query the tenant. */
export function projectWorkspacePageCsv(
  items: readonly VisibleWorkspaceExportRow[],
): string {
  const rows = items.map(item => [
    item.title,
    collegeWorkspaceStatusLabel(item.status,item.riskReasons),
    item.progressPercent,
    item.mentorName ?? "Unassigned",
    item.templateId ?? "Not available",
  ]);
  return projectAdminCsv([headings,...rows]);
}
