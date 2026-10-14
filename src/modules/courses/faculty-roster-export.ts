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
  const input = raw ?? "";
  // Excel/Sheets can execute data beginning with formula operators, even
  // after whitespace. Quoting a CSV field alone does NOT neutralize formulas.
  const guarded = /^[\s\uFEFF]*[=+@-]/u.test(input) ? "'" + input : input;
  return '"' + guarded.replaceAll('"', '""') + '"';
}

export function facultyRosterCsv(rows: readonly FacultyRosterCsvLearner[]) {
  const headers = "Student,Roll number,Email,Phone";
  const lines = rows.map((row) =>
    [
      row.displayName?.trim() || row.email?.trim() ||
        "Learner " + row.membershipId.slice(0, 8),
      row.rollNumber, row.email, row.phoneE164,
    ].map(csvField).join(","),
  );
  return [headers, ...lines].join("\r\n") + "\r\n";
}

export function facultyRosterFileName(sectionName: string) {
  const slug = sectionName.normalize("NFKD").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
    .slice(0, 48) || "section";
  return "faculty-roster-" + slug + ".csv";
}
