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
  tooltip?: (row: Row) => string | undefined;
  filter?:{urlKey:string;options:readonly {value:string;label:string}[]};
};
export function chosenTpoGridColumns<Row>(columns: readonly TpoGridColumn<Row>[], selected: readonly string[]) {
  const chosen = new Set(selected);
  const visible=columns.filter(column=>!column.exportOnly&&(chosen.size===0||chosen.has(column.key)));
  if(chosen.size===0)return visible;
  const order=new Map(selected.map((key,index)=>[key,index]));
  return visible.sort((left,right)=>(order.get(left.key)??999)-(order.get(right.key)??999));
}
export function tpoGridExportColumns<Row>(columns: readonly TpoGridColumn<Row>[]) {
  return columns;
}
export function parseTpoGridColumns(raw: string | undefined, allowed: readonly string[]) {
  if (!raw) return [];
  const permitted = new Set(allowed);
  return [...new Set(raw.split(",").map((part) => part.trim()))].filter((name) => permitted.has(name));
}
/** URL preferences may only name on-screen, non-sensitive columns. */
export const TPO_STUDENT_VISIBLE_KEYS = ["student","number","branch","batch","stage","afterCollege","profile","offersAwaiting","cgpa","backlogs","readiness","registration","participation","best","applications","offers","journey"] as const;
export const TPO_APPLICATION_VISIBLE_KEYS = ["student","role","stage","application","channel","eligibility","submitted","screening"] as const;
export function validTpoColumnPreference(raw:string|undefined,allowed:readonly string[]):boolean {
  if(raw===undefined||raw==="")return true;
  if(raw.length>800)return false;
  const keys=raw.split(",").map(key=>key.trim());
  const valid=new Set(allowed);
  return keys.length>0&&keys.every(key=>valid.has(key))&&new Set(keys).size===keys.length;
}
export function updateTpoGridQuery(query: URLSearchParams, changes: Record<string, string | null>, resetPage = true) {
  const result = new URLSearchParams(query);
  for (const [key, value] of Object.entries(changes)) {
    if (value === null || value === "") result.delete(key);
    else result.set(key, value);
  }
  if (resetPage && !Object.hasOwn(changes, "page")) result.delete("page");
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

/** Table cells distinguish absent values from numeric zero. */
export function displayTpoGridCell(value:string|number|null|undefined):string|number {
 return value===null||value===undefined||(typeof value==="string"&&value.trim()==="")?"—":value;
}
