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
  rows: z.array(csvRowSchema).max(500),
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
  const headings = ["Learner", "Response", "Score", "Percent", "Submitted at (IST)", "Details"];
  const records = checked.rows.map(row => [
    row.name, row.status, row.score, row.percent,
    row.submittedAt ? facultyCsvIstTimestamp(row.submittedAt) : null, row.note,
  ].map(cell).join(","));
  return [headings.map(cell).join(","), ...records].join("\r\n") + "\r\n";
}

export function facultyReportCsvFilename(kind: "assignment" | "quiz", title: string, section: string) {
  const slug = (title + "-" + section).normalize("NFKD").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 65) || "report";
  return "faculty-" + kind + "-report-" + slug + ".csv";
}

/** Convert absolute database instants to IST calendar/display convention. */
export function facultyCsvIstTimestamp(iso:string){
 const value=new Date(iso);
 if(!Number.isFinite(value.getTime()))throw new Error("INVALID_CSV_TIMESTAMP");
 const parts=new Intl.DateTimeFormat("en-GB",{
  timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit",
  hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23",
 }).formatToParts(value);
 const field=(part:string)=>parts.find(row=>row.type===part)?.value??"";
 return field("year")+"-"+field("month")+"-"+field("day")+" "+
  field("hour")+":"+field("minute")+":"+field("second")+" IST";
}
export const FACULTY_REPORT_CSV_MAX_ROWS=500;
export function capFacultyReportCsvRows<T>(rows:readonly T[]){
 return {rows:rows.slice(0,FACULTY_REPORT_CSV_MAX_ROWS),
  omittedRows:Math.max(0,rows.length-FACULTY_REPORT_CSV_MAX_ROWS)};
}

/** Contact fields must never become a fallback name in Faculty CSV exports. */
export function facultyCsvLearnerLabel(displayName: string | null | undefined) {
  return displayName?.trim() || "Learner (name unavailable)";
}
