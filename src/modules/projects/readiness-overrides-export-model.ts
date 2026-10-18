/** Guard spreadsheet formula characters even when hidden behind whitespace,
 * bidirectional or zero-width characters. The UTF-8 BOM belongs to the export
 * stream, not the individual cell. Quote and escape every value. */
export function projectReadinessOverrideCsvCell(value: string): string {
  const visible = value.replace(/^[\s\u200B-\u200F\u2060\u2066-\u2069\uFEFF\u202A-\u202E]*/u, "");
  const safe = /^[=+@-]/u.test(visible) ? "'" + value : value;
  return '"' + safe.replace(/"/g, '""') + '"';
}
