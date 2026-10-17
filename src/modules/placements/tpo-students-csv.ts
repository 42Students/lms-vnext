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
  "10th %","12th %","Diploma %","UG %","Passing year","Gap years",
  "Marks verified","Lateral entry","Stage","After college",
  "Active backlogs",
  "Past backlogs",
  "Journey",
  "Best so far",
  "Applications",
  "Active applications",
  "Offers",
  "Offers awaiting answer",
  "Accepted offers",
  "Verified external offers",
  "Placed (provisional)",
  "Profile verification",
  "Waiting verification sections",
  "Verified sections",
] as const;

/**
 * Exports exactly the authorized rows supplied by the caller.
 * Callers must not pass unscreened database objects or private
 * eligibility reasons. This helper does no database access.
 */
export function exportTpoStudentsCsv(
  rows: readonly TpoStudentRow[],
  afterCollege:Readonly<Record<string,string>> = {},
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
      row.tenthPct,row.twelfthPct,row.diplomaPct,row.ugPct,
      row.passingYear,row.gapYears,row.marksVerified?"Yes":"No",
      row.isLateralEntry==null?"":row.isLateralEntry?"Yes":"No",
      row.journeyState,afterCollege[row.membershipId]??"",
      row.activeBacklogs,
      row.pastBacklogs,
      row.journeyState,
      row.bestSoFar,
      row.applicationCount,
      row.activeApplicationCount,
      row.offerCount,
      row.offersAwaitingAnswer,
      row.acceptedOfferCount,
      row.verifiedExternalOfferCount,
      row.placed ? "Yes" : "No",
      row.verification.status,
      row.verification.waitingSections.join("; "),
      row.verification.verifiedSections.join("; "),
    ].map(tpoStudentCsvCell).join(","),
  );

  return [header, ...body].join("\r\n") + "\r\n";
}
