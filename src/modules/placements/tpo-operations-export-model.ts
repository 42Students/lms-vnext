import { placementReportCsv } from "./report-model";
import type { TpoRoundRosterRow } from "./tpo-round-drive-day-model";

export type RoundAttendanceExport = {
  companyName: string;
  job: { title: string };
  round: { name: string; status: string; scheduledAt: Date | null };
  rows: readonly TpoRoundRosterRow[];
};

/** Uses the same authorized, progression-filtered roster as the TPO round page. */
export function tpoRoundAttendanceCsv(data: RoundAttendanceExport): string {
  return placementReportCsv(
    [
      "Company", "Drive", "Round", "Round status",
      "Scheduled at (UTC)", "Learner", "Roll number",
      "Attendance", "Application status", "Result status", "Result outcome",
    ],
    data.rows.map((row) => [
      data.companyName, data.job.title, data.round.name, data.round.status,
      data.round.scheduledAt?.toISOString() ?? "",
      row.displayName, row.rollNumber, row.attendance, row.applicationStatus,
      row.resultStatus, row.resultStatus === "APPLIED" ? row.resultOutcome : null,
    ]),
  );
}

export type TpoCompanyContactFact = {
  id: string;
  leadName: string;
  type: string;
  outcome: string | null;
  createdAt: Date;
};

export type TpoCompanyContactRow = {
  id: string;
  contactName: string;
  type: string;
  outcome: string;
  occurredAtIso: string;
};

export function projectTpoCompanyContactRows(
  facts: readonly TpoCompanyContactFact[],
): TpoCompanyContactRow[] {
  return facts.map((fact) => ({
    id: fact.id,
    contactName: fact.leadName.trim() || "Unnamed contact",
    type: fact.type,
    outcome: fact.outcome?.trim() || "Not recorded",
    occurredAtIso: fact.createdAt.toISOString(),
  }));
}
