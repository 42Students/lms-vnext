import { z } from "zod";
import { phoneE164Schema, personDisplayNameSchema, personEmailSchema } from "./validation";

export const studentCsvRequestSchema = z.object({
  action: z.enum(["PREVIEW", "IMPORT"]),
  csv: z.string().min(1).max(100000),
  confirm: z.boolean().optional(),
}).strict().superRefine((v, ctx) => {
  if (v.action === "IMPORT" && v.confirm !== true) {
    ctx.addIssue({ code: "custom", path: ["confirm"], message: "Explicit confirmation required" });
  }
});

const csvRowSchema = z.object({
  displayName: personDisplayNameSchema,
  phoneE164: phoneE164Schema,
  email: z.union([personEmailSchema, z.literal("")]).transform(v => v || undefined),
  programId: z.string().uuid(),
  cohortId: z.string().uuid(),
}).strict();

export type StudentCsvRow = z.infer<typeof csvRowSchema>;
export type StudentCsvResult = { row: number; status: "VALID" | "INVALID" | "IMPORTED" | "FAILED" | "PARTIAL"; detail: string; membershipId?: string; enrollmentId?: string };
export const STUDENT_CSV_COLUMNS = ["displayName","phoneE164","email","programId","cohortId"] as const;
export const MAX_STUDENT_CSV_ROWS = 100;

/** Strict CSV tokenizer: quoted commas, escaped double quotes and CRLF only. */
export function tokenizeStudentCsv(input: string): string[][] {
  const result: string[][] = [];
  let fields: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (ch === '"') {
      if (quoted && input[i + 1] === '"') { field += '"'; i++; }
      else if (quoted) quoted = false;
      else if (field === "") quoted = true;
      else throw Error("INVALID_CSV_QUOTE");
    } else if (ch === "," && !quoted) {
      fields.push(field); field = "";
    } else if ((ch === "\n" || ch === "\r") && !quoted) {
      if (ch === "\r" && input[i + 1] === "\n") i++;
      fields.push(field); field = "";
      if (fields.some(v => v.trim() !== "")) result.push(fields);
      fields = [];
    } else { field += ch; }
  }
  if (quoted) throw Error("UNTERMINATED_CSV_QUOTE");
  fields.push(field);
  if (fields.some(v => v.trim() !== "")) result.push(fields);
  return result;
}

export function parseStudentCsv(raw: string): {
  entries: Array<{ row: number; data?: StudentCsvRow; errors: string[] }>;
  structuralErrors: string[];
} {
  let rows: string[][];
  try { rows = tokenizeStudentCsv(raw.replace(/^\uFEFF/, "")); }
  catch { return { entries: [], structuralErrors: ["INVALID_CSV_FORMAT"] }; }
  if (!rows.length || rows[0].join(",") !== STUDENT_CSV_COLUMNS.join(",")) {
    return { entries: [], structuralErrors: ["INVALID_CSV_HEADER"] };
  }
  if (rows.length - 1 > MAX_STUDENT_CSV_ROWS) {
    return { entries: [], structuralErrors: ["ROW_LIMIT_EXCEEDED"] };
  }
  const seenPhones = new Set<string>();
  const seenEmails = new Set<string>();
  const entries = rows.slice(1).map((cells, index) => {
    const row = index + 2;
    if (cells.length !== 5) return { row, errors: ["COLUMN_COUNT_MISMATCH"] };
    const parsed = csvRowSchema.safeParse(Object.fromEntries(
      STUDENT_CSV_COLUMNS.map((key, i) => [key, cells[i]?.trim() ?? ""]),
    ));
    if (!parsed.success) {
      return { row, errors: parsed.error.issues.map(issue => issue.path.join(".") + ": " + issue.message) };
    }
    const data = parsed.data;
    const errors: string[] = [];
    if (seenPhones.has(data.phoneE164)) errors.push("DUPLICATE_PHONE_IN_FILE");
    seenPhones.add(data.phoneE164);
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
