import type { TpoStudentRow } from "./tpo-students-model";

/**
 * Escape CSV delimiters, quotes, newlines and spreadsheet
 * formula prefixes, including formula-like content after
 * leading whitespace/control characters.
 *
 * Always quote cells. Never concatenate an unescaped
 * student-controlled name/email into CSV output.
 */
export function tpoStudentCsvCell(
  value: string | number | boolean | null | undefined,
): string {
  const raw = String(value ?? "")
    .replace(/\r\n?/g, "\n")
    .replace(
      /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,
      "",
    );

  const formulaLike =
    /^[\s﻿​]*[=+\-@]/u.test(raw);

  const safe = formulaLike
    ? `'${raw}`
    : raw;

  return `"${safe.replace(/"/g, '""')}"`;
}

const STUDENT_CSV_HEADERS = [
  "Student",
  "Roll number",
  "Registration number",
  "Email",
  "Branch",
  "Program",
  "Batch",
  "Placement registration",
  "Participation",
  "Readiness evidence",
  "CGPA",
  "Active backlogs",
  "Past backlogs",
  "Journey",
  "After college",
  "Best so far",
  "Applications",
  "Active applications",
  "Offers",
  "Accepted offers",
  "Verified external offers",
  "Placed (provisional)",
] as const;

/**
 * Exports exactly the authorized rows supplied by the caller.
 * Callers must not pass unscreened database objects or private
 * eligibility reasons. This helper does no database access.
 */
export function exportTpoStudentsCsv(
  rows: readonly TpoStudentRow[],
): string {
  const header = STUDENT_CSV_HEADERS
    .map(tpoStudentCsvCell)
    .join(",");

  const body = rows.map((row) =>
    [
      row.displayName,
      row.rollNumber,
      row.registrationNumber,
      row.email,
      row.branchName,
      row.programName,
      row.cohortName,
      row.registrationChoice,
      row.participationStatus,
      row.readinessSignal,
      row.cgpa,
      row.activeBacklogs,
      row.pastBacklogs,
      row.journeyState,
      row.afterCollegeOutcome ?? "NOT_DECIDED",
      row.bestSoFar,
      row.applicationCount,
      row.activeApplicationCount,
      row.offerCount,
      row.acceptedOfferCount,
      row.verifiedExternalOfferCount,
      row.placed ? "Yes" : "No",
    ].map(tpoStudentCsvCell).join(","),
  );

  return [header, ...body].join("\r\n") + "\r\n";
}
