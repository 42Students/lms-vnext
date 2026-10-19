/**
 * Legacy spreadsheet/download filename suffix: "name - D MMM YYYY".
 * Dates are shown in the LMS's Asia/Kolkata timezone, independent of the server.
 * The caller owns the resource label and exported column schema.
 */
const exportedDay = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Kolkata",
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function gridExportFilename(
  name: string,
  extension: "csv" | "xlsx",
  now: Date = new Date(),
): string {
  const safeName = name
    .replace(/[\\/":*?<>|\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim() || "Export";
  const parts = exportedDay.formatToParts(now);
  const read = (kind: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === kind)?.value ?? "";
  return `${safeName} - ${read("day")} ${read("month")} ${read("year")}.${extension}`;
}
