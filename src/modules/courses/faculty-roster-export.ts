import { capFacultyReportCsvRows, facultyCsvLearnerLabel, neutralizeFacultyCsvCell } from "./faculty-report-csv";

/** Rows are already authorized by the exact Faculty teaching-delivery reader.
 * This pure serializer never fetches broader college or learner records. */
export type FacultyRosterCsvLearner = {
  displayName: string | null;
  rollNumber: string | null;
  email: string | null;
  phoneE164: string | null;
  membershipId: string;
};

function csvField(raw: string | null) {
  return '"' + neutralizeFacultyCsvCell(raw).replaceAll('"', '""') + '"';
}

export function facultyRosterCsv(rows: readonly FacultyRosterCsvLearner[]) {
  const bounded = capFacultyReportCsvRows(rows);
  const headers = "Student,Roll number";
  const lines = bounded.rows.map((row) =>
    [facultyCsvLearnerLabel(row.displayName), row.rollNumber].map(csvField).join(","),
  );
  if (bounded.omittedRows > 0) {
    lines.push(["NOTICE: " + bounded.omittedRows +
      " learner rows omitted by the 500-row export cap.", ""].map(csvField).join(","));
  }
  return [headers, ...lines].join("\r\n") + "\r\n";
}

export function facultyRosterFileName(sectionName: string) {
  const slug = sectionName.normalize("NFKD").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
    .slice(0, 48) || "section";
  return "faculty-roster-" + slug + ".csv";
}
