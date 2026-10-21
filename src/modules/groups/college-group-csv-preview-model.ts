import { z } from "zod";

export const GROUP_IMPORT_MAX_ROWS = 2000;
export const GROUP_IMPORT_MAX_CHARACTERS = 524288;
export const collegeGroupCsvPreviewSchema = z.object({
  groupId: z.string().uuid(),
  csv: z.string().min(1).max(GROUP_IMPORT_MAX_CHARACTERS),
}).strict();

export type GroupImportRow = {
  rowNumber: number;
  email: string;
  status: "READY" | "INVALID_EMAIL" | "DUPLICATE_CSV" | "NOT_FOUND" |
    "ALREADY_MEMBER" | "PREVIOUSLY_REMOVED" | "CAPACITY_FULL" | "COLUMN_COUNT";
};

export function parseMemberEmailCsv(csv: string): Array<{ rowNumber: number; value: string; validColumns: boolean }> {
  const body = csv.charCodeAt(0) === 0xfeff ? csv.slice(1) : csv;
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let quoted = false;
  for (let i = 0; i < body.length; i += 1) {
    const ch = body[i];
    if (quoted) {
      if (ch === '"' && body[i + 1] === '"') { field += '"'; i += 1; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') {
      if (field.length !== 0) throw new Error("INVALID_CSV_QUOTE");
      quoted = true;
    } else if (ch === ",") {
      row.push(field); field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && body[i + 1] === "\n") i += 1;
      row.push(field); field = "";
      rows.push(row); row = [];
      if (rows.length > GROUP_IMPORT_MAX_ROWS + 1) throw new Error("CSV_ROW_LIMIT");
    } else {
      field += ch;
    }
  }
  if (quoted) throw new Error("UNTERMINATED_CSV_QUOTE");
  if (field.length > 0 || row.length > 0) {
    row.push(field); rows.push(row);
  }
  if (rows.length === 0 || rows[0].length !== 1 ||
      rows[0][0].trim().toLowerCase() !== "email") throw new Error("CSV_HEADER_EMAIL_REQUIRED");
  const entries = rows.slice(1);
  if (entries.length > GROUP_IMPORT_MAX_ROWS) throw new Error("CSV_ROW_LIMIT");
  return entries.map((record, i) => ({
    rowNumber: i + 2,
    value: record[0]?.trim().toLowerCase() ?? "",
    validColumns: record.length === 1,
  }));
}

/** CSV and spreadsheet-formula neutralization for all exported user-supplied fields. */
export function neutralCsvCell(value: string | number): string {
  let text = String(value);
  if (/^[=+@-]/u.test(text.replace(/^[\s\p{Cc}\p{Cf}\p{Mn}]*/u, ""))) text = "'" + text;
  return '"' + text.replaceAll('"', '""') + '"';
}

export function groupPreviewErrorCsv(rows: readonly GroupImportRow[]): string {
  const lines = ["Row,Email,Validation"];
  for (const row of rows) {
    if (row.status === "READY") continue;
    lines.push([row.rowNumber, row.email, row.status].map(neutralCsvCell).join(","));
  }
  return "\ufeff" + lines.join("\r\n");
}
