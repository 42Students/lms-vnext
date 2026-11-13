import { spreadsheetCsvCell } from "@/security/csv-cell";
import type { SharedApplicant } from "./hr-job-applicants-model";

import { DEFAULT_TIME_ZONE } from "@/config/locale";
export const HR_APPLICANT_EXPORT_CAP = 200;
const HEADER = [
  "Application ID", "Applicant", "Role", "Application status",
  "Screening", "Submitted (IST)", "Contact",
] as const;

function csvCell(raw: string) {
 return spreadsheetCsvCell(raw);
}

export function buildHrApplicantCsv(rows: readonly SharedApplicant[], total: number) {
  const safeRows = rows.slice(0, HR_APPLICANT_EXPORT_CAP);
  const csv = [HEADER.map(csvCell).join(",")];
  const dateFormat = new Intl.DateTimeFormat("en-GB", {
    timeZone: DEFAULT_TIME_ZONE, day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
  for (const row of safeRows) {
    const submitted = Number.isFinite(row.submittedAt.getTime())
      ? dateFormat.format(row.submittedAt) : "Date unavailable";
    csv.push([
      row.id, row.name ?? "Candidate", row.role, row.status, row.screening,
      submitted, "Masked",
    ].map(csvCell).join(","));
  }
  const authorizedTotal=Number.isSafeInteger(total)&&total>=0?total:safeRows.length;
  const omitted = Math.max(0, authorizedTotal - safeRows.length);
  if (omitted > 0) {
    csv.push(["", "Export capped", String(omitted) + " additional authorized applicants",
      "", "", "", ""].map(csvCell).join(","));
  }
  return { csv: "\uFEFF" + csv.join("\r\n") + "\r\n", omitted, exported: safeRows.length };
}
