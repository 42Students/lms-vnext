/**
 * GR-63: preview all rows before database writes, then apply via ONE real
 * db.transaction; the caller supplies its own tenant/permission checks.
 * Usage:
 *   const preview = previewImport(rows, validate);
 *   const result = await applyImportAtomically(preview,
 *       records => db.transaction(async tx => insertAll(tx, records)));
 * Always give users a per-row error CSV. Never call once per row.
 */
import { FRIENDLY_MESSAGES } from "@/lib/friendly-error";

export type ImportIssue = { row: number; field: string; message: string };
export type ImportPreview<T> = {
  records: T[];
  issues: ImportIssue[];
  valid: boolean;
  count: number;
};

export function previewImport<T>(
  rows: readonly T[],
  validate: (row: T, rowNumber: number) => readonly ImportIssue[],
): ImportPreview<T> {
  const issues: ImportIssue[] = [];
  rows.forEach((row, index) => {
    const reported = validate(row, index + 1);
    for (const issue of reported) {
      issues.push({
        row: Number.isInteger(issue.row) && issue.row > 0 ? issue.row : index + 1,
        field: /^[\w.\[\]-]{1,100}$/.test(issue.field) ? issue.field : "row",
        message: "Please check this field and try again.",
      });
    }
  });
  return { records: [...rows], issues, valid: issues.length === 0, count: rows.length };
}

export async function applyImportAtomically<T, Result>(
  preview: ImportPreview<T>,
  transaction: (allRows: readonly T[]) => Promise<Result>,
): Promise<Result> {
  if (!preview.valid || preview.issues.length > 0) {
    throw new Error(FRIENDLY_MESSAGES.invalid);
  }
  // The adapter MUST be a single db.transaction to ensure rollback on error.
  return transaction(preview.records);
}

function csvCell(value: string | number): string {
  return `"${String(value).replaceAll('"', '""')}"`;
}

export function importIssuesCsv(issues: readonly ImportIssue[]): string {
  return "Row,Field,Message\r\n" + issues.map(
    issue => [issue.row, issue.field, issue.message].map(csvCell).join(","),
  ).join("\r\n");
}
