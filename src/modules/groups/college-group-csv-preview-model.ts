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
    "ALREADY_MEMBER" | "PREVIOUSLY_REMOVED" | "GROUP_NOT_ACTIVE" | "CAPACITY_FULL" | "COLUMN_COUNT";
};

/** Never render server exception text or internal validation codes as UI copy. */
export function groupCsvPreviewErrorMessage(code: string): string {
  const messages: Readonly<Record<string, string>> = {
    CSV_HEADER_EMAIL_REQUIRED: "The first CSV row must be a single column named Email.",
    INVALID_CSV_QUOTE: "This CSV has malformed quotation marks. Check the affected row.",
    UNTERMINATED_CSV_QUOTE: "A quoted CSV field is missing its closing quotation mark.",
    CSV_ROW_LIMIT: "This file exceeds the limit of 2,000 learner rows.",
    GROUP_NOT_FOUND: "This study group is unavailable. Return to the group list and try again.",
    UNAUTHORIZED: "You do not have permission to import learners into this group.",
    FORBIDDEN: "You do not have permission to import learners into this group.",
  };
  return messages[code] ?? "The import could not be completed. Check your file and try again.";
}

/** Plain-language explanations of validation rows for the dry-run UI. */
export function groupCsvValidationLabel(status: GroupImportRow["status"]): string {
  const labels: Record<GroupImportRow["status"], string> = {
    READY: "Ready to add",
    INVALID_EMAIL: "Invalid email address",
    DUPLICATE_CSV: "Duplicate email in this file",
    NOT_FOUND: "No active learner found in this college",
    ALREADY_MEMBER: "Already belongs to this group",
    PREVIOUSLY_REMOVED: "Previously removed from this group",
    GROUP_NOT_ACTIVE: "Activate the group before importing",
    CAPACITY_FULL: "Group capacity is full",
    COLUMN_COUNT: "Expected one email column",
  };
  return labels[status];
}

export function parseMemberEmailCsv(csv: string): Array<{ rowNumber: number; value: string; validColumns: boolean }> {
  const body = csv.charCodeAt(0) === 0xfeff ? csv.slice(1) : csv;
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let quoted = false;
  let closedQuote = false;
  for (let i = 0; i < body.length; i += 1) {
    const ch = body[i];
    if (quoted) {
      if (ch === '"' && body[i + 1] === '"') { field += '"'; i += 1; }
      else if (ch === '"') { quoted = false; closedQuote = true; }
      else field += ch;
    } else if (ch === '"') {
      if (field.length !== 0 || closedQuote) throw new Error("INVALID_CSV_QUOTE");
      quoted = true;
    } else if (ch === ",") {
      row.push(field); field = ""; closedQuote = false;
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && body[i + 1] === "\n") i += 1;
      row.push(field); field = ""; closedQuote = false;
      rows.push(row); row = [];
      if (rows.length > GROUP_IMPORT_MAX_ROWS + 1) throw new Error("CSV_ROW_LIMIT");
    } else {
      // A quoted field must end at a delimiter. Never silently accept
      // malformed input like "alice@example.com"oops as an email.
      if (closedQuote) throw new Error("INVALID_CSV_QUOTE");
      field += ch;
    }
  }
  if (quoted) throw new Error("UNTERMINATED_CSV_QUOTE");
  if (field.length > 0 || row.length > 0 || closedQuote) {
    row.push(field); rows.push(row);
  }
  const header = rows[0];
  if (!header || header.length !== 1 ||
      header[0]?.trim().toLowerCase() !== "email") throw new Error("CSV_HEADER_EMAIL_REQUIRED");
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
