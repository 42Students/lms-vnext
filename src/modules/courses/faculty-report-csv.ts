import { z } from "zod";

const csvRowSchema = z.object({
  name: z.string().max(500),
  email: z.string().nullable(),
  status: z.enum(["SUBMITTED", "NOT_SUBMITTED", "ATTEMPTED", "NOT_ATTEMPTED"]),
  score: z.string().nullable(),
  percent: z.number().min(0).max(100).nullable(),
  submittedAt: z.string().nullable(),
  note: z.string(),
}).strict();

export const facultyReportCsvSchema = z.object({
  kind: z.enum(["assignment", "quiz"]),
  title: z.string().max(500),
  sectionName: z.string().max(500),
  rows: z.array(csvRowSchema),
}).strict();

export type FacultyReportCsvInput = z.infer<typeof facultyReportCsvSchema>;

/** Spreadsheet imports may evaluate formulas even when a CSV cell is quoted. */
export function neutralizeFacultyCsvCell(value: string | number | null) {
  const text = value === null ? "" : String(value);
  return /^[\s\uFEFF\u200B\u200E\u200F]*[=+@-]/u.test(text) ? "'" + text : text;
}

function cell(value: string | number | null) {
  return '"' + neutralizeFacultyCsvCell(value).replaceAll('"', '""') + '"';
}

/** Serialize only rows provided by the server-authorized Section report. */
export function facultyReportCsv(input: FacultyReportCsvInput) {
  const checked = facultyReportCsvSchema.parse(input);
  const headings = ["Learner", "Email", "Response", "Score", "Percent", "Submitted at (UTC)", "Details"];
  const records = checked.rows.map(row => [
    row.name, row.email, row.status, row.score, row.percent,
    row.submittedAt, row.note,
  ].map(cell).join(","));
  return [headings.map(cell).join(","), ...records].join("\r\n") + "\r\n";
}

export function facultyReportCsvFilename(kind: "assignment" | "quiz", title: string, section: string) {
  const slug = (title + "-" + section).normalize("NFKD").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 65) || "report";
  return "faculty-" + kind + "-report-" + slug + ".csv";
}
