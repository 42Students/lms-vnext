import { csvSafeGridCell } from "./tpo-grid-model";
type ExportStudent = {
  membershipId: string; name: string; decision: string; source: string;
  reason: string | null; ambiguous: boolean;
};
const columns = ["Student","Eligibility","Decision source","Review needed","Ineligible reason","Membership reference"] as const;
export function exportTpoBatchStudentsCsv(rows: readonly ExportStudent[]) {
  return [
    columns.map(csvSafeGridCell).join(","),
    ...rows.map(row => [
      row.name, row.ambiguous ? "UNASSESSABLE" : row.decision,
      row.source, row.ambiguous ? "Yes" : "No",
      row.reason ?? "", row.membershipId,
    ].map(csvSafeGridCell).join(",")),
  ].join("\r\n") + "\r\n";
}
