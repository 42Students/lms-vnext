import type { SharedApplicant } from "./hr-job-applicants-model";

export const HR_APPLICANT_EXPORT_CAP = 200;
const HEADER = [
  "Application ID", "Applicant", "Role", "Application status",
  "Screening", "Submitted (IST)", "Contact",
] as const;

function csvCell(raw: string) {
  const text = (/^\s*[=+\-@]/u.test(raw) || /^[\t\r\n]/u.test(raw)) ? "'" + raw : raw;
  return '"' + text.replaceAll('"', '""') + '"';
}

export function buildHrApplicantCsv(rows: readonly SharedApplicant[], total: number) {
  const safeRows = rows.slice(0, HR_APPLICANT_EXPORT_CAP);
  const csv = [HEADER.map(csvCell).join(",")];
  for (const row of safeRows) {
    csv.push([
      row.id, row.name ?? "Candidate", row.role, row.status, row.screening,
      new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Kolkata", day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit", hour12: false,
      }).format(row.submittedAt),
      "Masked",
    ].map(csvCell).join(","));
  }
  const omitted = Math.max(0, total - safeRows.length);
  if (omitted > 0) {
    csv.push(["", "Export capped", String(omitted) + " additional authorized applicants",
      "", "", "", ""].map(csvCell).join(","));
  }
  return { csv: "\uFEFF" + csv.join("\r\n") + "\r\n", omitted, exported: safeRows.length };
}
