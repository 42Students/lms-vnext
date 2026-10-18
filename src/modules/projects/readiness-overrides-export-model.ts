/** Guard spreadsheet formula characters even when hidden behind whitespace,
 * bidirectional or zero-width characters. The UTF-8 BOM belongs to the export
 * stream, not the individual cell. Quote and escape every value. */
export function projectReadinessOverrideCsvCell(value: string): string {
  // Spreadsheet importers may discard combining/enclosing marks and C0
  // controls as well as bidi or zero-width format characters.
  const visible = value.replace(/^[\p{Cc}\p{Cf}\p{M}\p{Zs}\p{Zl}\p{Zp}]*/u, "");
  const safe = /^[=+@-]/u.test(visible) ? "'" + value : value;
  return '"' + safe.replace(/"/g, '""') + '"';
}
