/** Spreadsheet-safe CSV encoding for authorized, visible Projects admin pages.
 * Quoting alone does not neutralize formulas: spreadsheet engines can ignore
 * whitespace, Unicode format controls or combining marks before =, +, - or @.
 */
export type ProjectAdminCsvValue = string | number | null | undefined;

export function projectAdminCsvCell(value: ProjectAdminCsvValue): string {
  // NUL and non-text C0 controls are not meaningful CSV content and can be
  // discarded by importers before formula detection. Remove them first so
  // hostile invisible prefixes cannot bypass the quote-prefix guard.
  const original = String(value ?? "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
  const visible = original.replace(/^[\p{Cc}\p{Cf}\p{M}\p{Zs}\p{Zl}\p{Zp}]*/u, "");
  // Persisted numeric values (including negative totals) are data, not formulas.
  // A user-supplied string such as "-1" still requires neutralization.
  const guarded = typeof value === "number" ? original : /^[=+@-]/u.test(visible) ? "'" + original : original;
  return '"' + guarded.replaceAll('"', '""') + '"';
}

/** Preserve commas, embedded newlines, quotation marks and UTF-8 Excel BOM. */
export function projectAdminCsv(rows: readonly (readonly ProjectAdminCsvValue[])[]): string {
  return "\uFEFF" + rows.map(row => row.map(projectAdminCsvCell).join(",")).join("\r\n") + "\r\n";
}
