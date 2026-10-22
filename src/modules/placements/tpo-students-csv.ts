import type { TpoStudentRow } from "./tpo-students-model";
import {tpoStudentDisplayLabel} from "./tpo-student-display-label";

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
    /^[\p{Z}\p{Cf}\p{Cc}\p{M}]*[=+\-@]/u.test(raw);

  const safe = formulaLike
    ? `'${raw}`
    : raw;

  return `"${safe.replace(/"/g, '""')}"`;
}

const STUDENT_CSV_HEADERS = [
  // Old GridWorkspace exports the current student view's leading columns first.
  "Student","Roll number","Batch","Branch","Stage","After college",
  "Profile verification","Best so far","Applications","Offers",
  "Registration number","Email","Program","Placement registration",
  "Participation","Readiness evidence","CGPA","10th %","12th %",
  "Diploma %","UG %","Passing year","Gap years","Marks verified",
  "Lateral entry","Active backlogs","Past backlogs","Journey",
  "Active applications","Offers awaiting answer","Accepted offers",
  "Verified external offers","Placed (provisional)",
  "Waiting verification sections","Verified sections",
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
      row.cohortName,
      row.branchName,
      tpoStudentDisplayLabel(row.journeyState),
      afterCollege[row.membershipId]??"",
      row.verification.status,
      tpoStudentDisplayLabel(row.bestSoFar),
      row.applicationCount,
      row.offerCount,
      row.registrationNumber,
      row.email,
      row.programName,
      row.registrationChoice,
      row.participationStatus,
      tpoStudentDisplayLabel(row.readinessSignal),
      row.cgpa,row.tenthPct,row.twelfthPct,row.diplomaPct,row.ugPct,
      row.passingYear,row.gapYears,row.marksVerified==null?"":row.marksVerified?"Yes":"No",
      row.isLateralEntry==null?"":row.isLateralEntry?"Yes":"No",
      row.activeBacklogs,row.pastBacklogs,tpoStudentDisplayLabel(row.journeyState),
      row.activeApplicationCount,row.offersAwaitingAnswer,row.acceptedOfferCount,
      row.verifiedExternalOfferCount,row.placed?"Yes":"No",
      row.verification.waitingSections.join("; "),
      row.verification.verifiedSections.join("; "),
    ].map(tpoStudentCsvCell).join(","),
  );

  return [header, ...body].join("\r\n") + "\r\n";
}
