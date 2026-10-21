import { z } from "zod";
import { phoneE164Schema, personDisplayNameSchema, personEmailSchema } from "./validation";

const structuredStudentRowSchema = z.object({
  displayName: z.string().trim().optional(),
  firstName: z.string().trim().optional(),
  lastName: z.string().trim().optional(),
  phoneE164: z.string().trim().optional(),
  mobileNumber: z.string().trim().optional(),
  email: z.string().trim().optional(),
  rollNumber: z.string().trim().optional(),
  programId: z.string().uuid().optional(),
  cohortId: z.string().uuid().optional(),
  sectionId: z.string().uuid().optional(),
}).strict();

/** Legacy bulk JSON can be submitted without a temporary CSV file. The
 * caller must resolve numeric legacy class/program IDs to scoped UUIDs first;
 * we never infer a tenant academic mapping from a number. */
function structuredStudentRowsAsCsv(
  entries: z.infer<typeof structuredStudentRowSchema>[],
  defaults: { programId?: string; cohortId?: string; sectionId?: string },
): string {
  const quote = (value: string) => '"' + value.replaceAll('"', '""') + '"';
  return [
    STUDENT_CSV_COLUMNS.join(","),
    ...entries.map(entry => [
      entry.displayName || [entry.firstName, entry.lastName].filter(Boolean).join(" "),
      entry.phoneE164 || entry.mobileNumber || "",
      entry.email || "",
      entry.programId || defaults.programId || "",
      entry.cohortId || defaults.cohortId || "",
    ].map(value => quote(value)).join(",")),
  ].join("\r\n");
}

export const studentCsvRequestSchema = z.object({
  action: z.enum(["PREVIEW", "IMPORT"]),
  csv: z.string().min(1).max(1000000).optional(),
  students: z.array(structuredStudentRowSchema).min(1).max(500).optional(),
  confirm: z.boolean().optional(),
  programId: z.string().uuid().optional(),
  cohortId: z.string().uuid().optional(),
  sectionId: z.string().uuid().optional(),
}).strict().superRefine((v, ctx) => {
  if (Boolean(v.csv) === Boolean(v.students?.length)) {
    ctx.addIssue({ code: "custom", path: ["csv"], message: "Provide either CSV or structured student records" });
  }
  if (v.action === "IMPORT" && v.confirm !== true) {
    ctx.addIssue({ code: "custom", path: ["confirm"], message: "Explicit confirmation required" });
  }
}).transform(v => ({ ...v, csv: v.csv ?? structuredStudentRowsAsCsv(v.students ?? [], v) }));

const csvRowSchema = z.object({
  displayName: personDisplayNameSchema,
  phoneE164: phoneE164Schema,
  email: z.union([personEmailSchema, z.literal("")]).transform(v => v || undefined),
  programId: z.string().uuid(),
  cohortId: z.string().uuid(),
  sectionId: z.string().uuid().optional(),
  rollNumber: z.string().trim().max(128).optional(),
}).strict();

export type StudentCsvRow = z.infer<typeof csvRowSchema>;
export type StudentCsvResult = { row: number; status: "VALID" | "INVALID" | "IMPORTED" | "FAILED" | "PARTIAL"; detail: string; membershipId?: string; enrollmentId?: string };
export const STUDENT_CSV_COLUMNS = ["displayName","phoneE164","email","programId","cohortId"] as const;
export const MAX_STUDENT_CSV_ROWS = 500;
export const LEGACY_STUDENT_CSV_COLUMNS = ["First Name","Last Name","Roll Number","Mobile Number","Email"] as const;
const PRIOR_STUDENT_CSV_COLUMNS = ["First Name","Last Name","Mobile Number","Email","Roll Number"] as const;
export const PICKER_STUDENT_CSV_COLUMNS = ["displayName","phoneE164","email","rollNumber"] as const;

/** Strict CSV tokenizer: quoted commas, escaped double quotes and CRLF only. */
export function tokenizeStudentCsv(input: string): string[][] {
  const result: string[][] = [];
  let fields: string[] = [];
  let field = "";
  let quoted = false;
  let afterQuote = false;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (ch === '"') {
      if (quoted && input[i + 1] === '"') { field += '"'; i++; }
      else if (quoted) { quoted = false; afterQuote = true; }
      else if (field === "" && !afterQuote) quoted = true;
      else throw Error("INVALID_CSV_QUOTE");
    } else if (ch === "," && !quoted) {
      fields.push(field); field = ""; afterQuote = false;
    } else if ((ch === "\n" || ch === "\r") && !quoted) {
      if (ch === "\r" && input[i + 1] === "\n") i++;
      fields.push(field); field = "";
      if (fields.some(v => v.trim() !== "")) result.push(fields);
      fields = []; afterQuote = false;
    } else {
      if (afterQuote) throw Error("INVALID_CSV_AFTER_QUOTE: Unexpected character after quoted field in record " + (result.length + 1) + ".");
      field += ch;
    }
  }
  if (quoted) throw Error("UNTERMINATED_CSV_QUOTE");
  fields.push(field);
  if (fields.some(v => v.trim() !== "")) result.push(fields);
  return result;
}

export function parseStudentCsv(raw: string, defaults: {programId?: string;cohortId?: string;sectionId?: string} = {}): {
  entries: Array<{ row: number; data?: StudentCsvRow; errors: string[] }>;
  structuralErrors: string[];
} {
  let rows: string[][];
  try { rows = tokenizeStudentCsv(raw.replace(/^\uFEFF/, "")); }
  catch (error) {
    const reason = error instanceof Error ? error.message : "";
    return { entries: [], structuralErrors: [reason.startsWith("INVALID_CSV_AFTER_QUOTE:") ? reason : "INVALID_CSV_FORMAT"] };
  }
  const header = rows[0]?.map(value => value.trim()) ?? [];
  const legacy = header.join(",") === LEGACY_STUDENT_CSV_COLUMNS.join(",");
  const prior = header.join(",") === PRIOR_STUDENT_CSV_COLUMNS.join(",");
  const picker = header.join(",") === PICKER_STUDENT_CSV_COLUMNS.join(",");
  const canonical = header.join(",") === STUDENT_CSV_COLUMNS.join(",");
  if (!legacy && !prior && !picker && !canonical) {
    return { entries: [], structuralErrors: ["INVALID_CSV_HEADER"] };
  }
  if ((legacy || prior || picker) && (!defaults.programId || !defaults.cohortId)) {
    return { entries: [], structuralErrors: ["CHOOSE_PROGRAM_AND_BATCH"] };
  }
  if (rows.length - 1 > MAX_STUDENT_CSV_ROWS) {
    return { entries: [], structuralErrors: ["ROW_LIMIT_EXCEEDED"] };
  }
  const seenPhones = new Set<string>();
  const seenEmails = new Set<string>();
  const seenRollNumbers = new Set<string>();
  const entries = rows.slice(1).map((cells, index) => {
    const row = index + 2;
    if (cells.length !== (picker ? 4 : 5)) return { row, errors: ["COLUMN_COUNT_MISMATCH"] };
    const record = canonical ? { ...Object.fromEntries(STUDENT_CSV_COLUMNS.map(
      (key, i) => [key, cells[i]?.trim() ?? ""])), sectionId: defaults.sectionId } : (legacy || prior) ? {
        displayName: [cells[0],cells[1]].map(v=>v?.trim()).filter(Boolean).join(" "),
        phoneE164: (cells[legacy ? 3 : 2]?.trim() ?? "").replace(/^([0-9]{10})$/, "+91$1"),
        email: cells[legacy ? 4 : 3]?.trim() ?? "",
        rollNumber: cells[legacy ? 2 : 4]?.trim() ?? "",
        programId: defaults.programId, cohortId: defaults.cohortId,
        sectionId: defaults.sectionId,
      } : {
        displayName: cells[0]?.trim() ?? "",
        phoneE164: cells[1]?.trim() ?? "",
        email: cells[2]?.trim() ?? "",
        rollNumber: cells[3]?.trim() ?? "",
        programId: defaults.programId, cohortId: defaults.cohortId,
        sectionId: defaults.sectionId,
      };
    const parsed = csvRowSchema.safeParse(record);
    if (!parsed.success) {
      return { row, errors: parsed.error.issues.map(issue => issue.path.join(".") + ": " + issue.message) };
    }
    const data = parsed.data;
    const errors: string[] = [];
    if (seenPhones.has(data.phoneE164)) errors.push("DUPLICATE_PHONE_IN_FILE");
    seenPhones.add(data.phoneE164);
    // Roll numbers are unique per uploaded cohort, including case/whitespace variants.
    // Rejecting duplicates before identity provisioning prevents duplicate roster rows.
    if (data.rollNumber?.trim()) {
      const rollKey = [data.cohortId, data.rollNumber.trim().toLocaleLowerCase("en-IN")].join(":");
      if (seenRollNumbers.has(rollKey)) errors.push("DUPLICATE_ROLL_NUMBER_IN_FILE");
      seenRollNumbers.add(rollKey);
    }
    if (data.email) {
      // Email identity matching is case-insensitive; rejecting case variants in
      // the same upload avoids a partial import across separate identity calls.
      const canonicalEmail = data.email.toLowerCase();
      if (seenEmails.has(canonicalEmail)) errors.push("DUPLICATE_EMAIL_IN_FILE");
      seenEmails.add(canonicalEmail);
    }
    return { row, data, errors };
  });
  return { entries, structuralErrors: rows.length < 2 ? ["NO_ROWS"] : [] };
}

/** Escape CSV fields and neutralize spreadsheet formulas, including leading whitespace. */
export function neutralStudentCsvCell(value: unknown): string {
  let string = String(value ?? "");
  if (/^\s*[=+\-@\t\r]/.test(string)) string = "'" + string;
  return '"' + string.replaceAll('"','""') + '"';
}
export function studentImportReportCsv(rows: readonly StudentCsvResult[]): string {
  return ["row,status,detail,membershipId,enrollmentId",
    ...rows.map(r => [r.row,r.status,r.detail,r.membershipId ?? "",r.enrollmentId ?? ""]
      .map(neutralStudentCsvCell).join(","))].join("\r\n");
}
