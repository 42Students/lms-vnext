/** Browser report exports cannot trust data supplied by employers, campuses or candidates. */
export type ReportCell = string | number | null;

function asText(value: ReportCell): string {
  return value === null ? "" : String(value);
}

function neutralizeFormula(value: ReportCell): string {
  const text = asText(value);
  // Numbers are numeric data, not a formula expression. Preserve negative totals.
  if (typeof value !== "string") return text;
  // Leading control/format/space Unicode may be discarded by spreadsheets
  // before interpreting the following =, +, -, or @ as a formula.
  return /^[\p{Cc}\p{Cf}\p{Zs}\p{Zl}\p{Zp}]*[=+\-@]/u.test(text)
    ? "'" + text
    : text;
}

export function safeReportCsvCell(value: ReportCell): string {
  return '"' + neutralizeFormula(value).replaceAll('"', '""') + '"';
}

/** Plain-text clipboard output cannot allow a cell to insert rows/columns. */
export function safeReportTsvCell(value: ReportCell): string {
  return neutralizeFormula(value).replace(/[\t\r\n\u2028\u2029]+/g, " ");
}

export function reportTableCsv(
  headings: readonly string[],
  rows: readonly (readonly ReportCell[])[],
): string {
  return [headings, ...rows]
    .map(row => row.map(safeReportCsvCell).join(","))
    .join("\r\n") + "\r\n";
}

export function reportTableTsv(
  headings: readonly string[],
  rows: readonly (readonly ReportCell[])[],
): string {
  return [headings, ...rows]
    .map(row => row.map(safeReportTsvCell).join("\t"))
    .join("\n");
}

export function safeReportDownloadName(title: string): string {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "").slice(0, 80);
  return "report-" + (slug || "export") + ".csv";
}
