/** Spreadsheet-safe CSV encoding for authorized, visible Projects admin pages.
 * Quoting alone does not neutralize formulas: spreadsheet engines can ignore
 * whitespace, zero-width and bidi control characters preceding =, +, - or @.
 */
export type ProjectAdminCsvValue = string | number | null | undefined;

export function projectAdminCsvCell(value: ProjectAdminCsvValue): string {
  const original = String(value ?? "");
  const visible = original.replace(/^[\s\u200B-\u200F\u2060\u2066-\u2069\uFEFF\u202A-\u202E]*/u, "");
  const guarded = /^[=+@-]/u.test(visible) ? "'" + original : original;
  return '"' + guarded.replaceAll('"', '""') + '"';
}

/** Preserve commas, embedded newlines, quotation marks and UTF-8 Excel BOM. */
export function projectAdminCsv(rows: readonly (readonly ProjectAdminCsvValue[])[]): string {
  return "\uFEFF" + rows.map(row => row.map(projectAdminCsvCell).join(",")).join("\r\n") + "\r\n";
}
