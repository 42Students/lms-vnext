import { z } from "zod";

export const tpoGridQuerySchema = z.object({
  search: z.string().trim().max(120).default(""),
  page: z.coerce.number().int().min(1).max(10000).default(1),
  columns: z.string().max(800).optional(),
  filters: z.record(z.string(), z.string().max(120)).default({}),
}).strict();

export type TpoGridColumn<Row> = {
  key: string; label: string; read: (row: Row) => string | number | null | undefined;
  exportOnly?: boolean; editable?: boolean;
};
export function chosenTpoGridColumns<Row>(columns: readonly TpoGridColumn<Row>[], selected: readonly string[]) {
  const chosen = new Set(selected);
  return columns.filter((column) => !column.exportOnly && (chosen.size === 0 || chosen.has(column.key)));
}
export function tpoGridExportColumns<Row>(columns: readonly TpoGridColumn<Row>[]) {
  return columns;
}
export function parseTpoGridColumns(raw: string | undefined, allowed: readonly string[]) {
  if (!raw) return [];
  const permitted = new Set(allowed);
  return [...new Set(raw.split(",").map((part) => part.trim()))].filter((name) => permitted.has(name));
}
export function updateTpoGridQuery(query: URLSearchParams, changes: Record<string, string | null>) {
  const result = new URLSearchParams(query);
  for (const [key, value] of Object.entries(changes)) {
    if (value === null || value === "") result.delete(key);
    else result.set(key, value);
  }
  if (!Object.hasOwn(changes, "page")) result.delete("page");
  return result;
}
export function csvSafeGridCell(raw: string | number | null | undefined) {
  const text = String(raw ?? "");
  const neutral = /^[\s\u0000-\u001f]*[=+@\-]/u.test(text) ? "'" + text : text;
  return '"' + neutral.replaceAll('"', '""') + '"';
}
export function exportTpoGridCsv<Row>(columns: readonly TpoGridColumn<Row>[], rows: readonly Row[]) {
  const header = columns.map((column) => csvSafeGridCell(column.label)).join(",");
  return [header, ...rows.map((row) => columns.map((column) => csvSafeGridCell(column.read(row))).join(","))].join("\r\n");
}

/** Per-column text filters operate only on the records explicitly supplied to the grid. */
export function filterTpoGridRows<Row>(
  rows: readonly Row[],
  columns: readonly TpoGridColumn<Row>[],
  filters: Readonly<Record<string,string>>,
) {
  const byKey=new Map(columns.filter(col=>!col.exportOnly).map(col=>[col.key,col] as const));
  const active=Object.entries(filters).flatMap(([key,value])=>{
    const column=byKey.get(key);
    const match=value.trim().toLocaleLowerCase();
    return column&&match? [{column,match}]:[];
  });
  return rows.filter(row=>active.every(({column,match})=>
    String(column.read(row)??"").toLocaleLowerCase().includes(match)));
}
