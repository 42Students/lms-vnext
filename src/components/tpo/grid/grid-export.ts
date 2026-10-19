/** Clipboard-only TSV serializer. CSV/XLSX downloads remain server-authorized. */
export type GridClipboardCell = string | number | null | undefined;

export function safeGridClipboardCell(value: GridClipboardCell): string {
  const oneLine = String(value ?? "").replaceAll(/[\r\n\t]+/g, " ");
  return /^[\s\uFEFF]*[=+\-@]/u.test(oneLine) ? "'" + oneLine : oneLine;
}

export function gridClipboardTsv<Row>(
  columns: readonly { label: string; read: (row: Row) => GridClipboardCell }[],
  rows: readonly Row[],
  includeHeader = false,
): string {
  const cells = (row: Row) => columns.map(column => safeGridClipboardCell(column.read(row))).join("\t");
  const lines = rows.map(cells);
  if (includeHeader) lines.unshift(columns.map(column => safeGridClipboardCell(column.label)).join("\t"));
  return lines.join("\r\n");
}
