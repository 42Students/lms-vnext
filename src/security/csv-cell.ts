/** RFC 4180-style CSV field escaping for untrusted exported labels.
 *
 * Spreadsheet applications may treat cells as formulas when the first visible
 * character is =, +, -, or @. Whitespace-only guards miss Unicode format
 * controls, invisible combining marks, and non-ASCII separators.
 *
 * Preserve the original text. Prefix an apostrophe only when the first
 * significant code point is a formula operator, then double all CSV quotes.
 * This is a pure utility; callers still need object/tenant authorization,
 * capped exports, no-store responses, and correct content headers.
 */
export function spreadsheetCsvCell(value: string | number | null | undefined): string {
  const raw = String(value ?? "");
  // Cover control/format categories and every combining-mark category.
  // Keep invisible prefixes in the exported value for audit fidelity.
  const visible = raw.replace(/^[\s\p{Cc}\p{Cf}\p{Mn}\p{Mc}\p{Me}]*/u, "");
  const protectedText = /^[=+@-]/u.test(visible) ? "'" + raw : raw;
  return '"' + protectedText.replaceAll('"', '""') + '"';
}
