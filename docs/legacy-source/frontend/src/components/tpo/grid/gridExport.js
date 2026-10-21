// Export and copy for the TPO grids: what is on screen (or the selection), in the columns shown, as the grid shows them.
import { downloadCsv } from "@/components/tpo/tpoFiles";
import { dj } from "@/components/tpo/dj";

/** A server date: [2026, 10, 7] or [2026, 10, 7, 23, 2, 6] (a LocalDate / LocalDateTime), or "2026-10-07T23:02:06". */
const isDateArray = (v) => Array.isArray(v) && v.length >= 3 && v.length <= 7 && v.every(Number.isInteger) && v[0] >= 1900 && v[0] <= 2200 && v[1] >= 1 && v[1] <= 12;
const ISO = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?)?$/;
/** A date as people read it in a sheet: "7 Oct 2026" or "7 Oct 2026, 11:02 PM" (India time). Raw numbers used to reach Excel. */
export function dateText(v) {
  if (isDateArray(v)) return v.length === 3 ? dj(`${v[0]}-${String(v[1]).padStart(2, "0")}-${String(v[2]).padStart(2, "0")}`).format("D MMM YYYY") : dj(v).format("D MMM YYYY, h:mm A");
  if (typeof v === "string" && ISO.test(v)) return v.length === 10 ? dj(v).format("D MMM YYYY") : dj(v.endsWith("Z") ? v : `${v}Z`).format("D MMM YYYY, h:mm A");
  return null;
}

/** A plain value for a cell: numbers stay numbers, booleans read Yes/No, lists are joined, objects become their label. */
export function plainValue(v) {
  if (v === null || v === undefined) return "";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "number") return Number.isFinite(v) ? v : "";
  const asDate = dateText(v);
  if (asDate) return asDate;
  if (Array.isArray(v)) return v.map(plainValue).filter((x) => x !== "").join(", ");
  if (v instanceof Date) return v;
  if (typeof v === "object") return plainValue(v.label ?? v.name ?? v.title ?? "");
  return String(v);
}

/**
 * The table to export: { header: [titles], rows: [[values]] }. columns: [{ title, value(row) }].
 * Values go through plainValue so a sheet never holds "[object Object]".
 */
export function tableOf(columns, rows) {
  return { header: columns.map((c) => c.title), rows: (rows || []).map((r) => columns.map((c) => plainValue(c.value(r)))) };
}

const safeName = (name) => String(name || "export").replace(/[\\/:*?"<>|]+/g, "-").replace(/\.(xlsx|csv)$/i, "").slice(0, 80) || "export";

/**
 * A real Excel file (.xlsx), header row in bold. The writer loads only when someone exports. note: an optional first line, e.g.
 * how a saved view's list was made ("Saved view: TCS shortlist · CGPA: 7+ · Branch: CSE · 8 Oct 2026"), then a blank row.
 */
export async function exportXlsx(name, columns, rows, note) {
  const { header, rows: body } = tableOf(columns, rows);
  const mod = await import("write-excel-file/browser");
  const write = mod.default || mod;
  const sheet = [
    ...(note ? [[{ value: String(note), fontStyle: "italic" }], []] : []),
    header.map((h) => ({ value: String(h), fontWeight: "bold" })),
    ...body.map((r) => r.map((v) => (v === "" ? null : { value: v }))),
  ];
  await write(sheet).toFile(`${safeName(name)}.xlsx`);
}

export function exportCsv(name, columns, rows) {
  downloadCsv(safeName(name), columns.map((c) => ({ title: c.title, value: (r) => plainValue(c.value(r)) })), rows);
}

/**
 * Tab-separated text, the way Excel and Google Sheets paste it. A tab or line break inside a value becomes a space.
 * BE-0053: text that starts like a formula (= + - @) is pasted as text, the same rule as the CSV download; numbers stay numbers.
 */
export function toTsv(header, rows) {
  const cell = (v) => {
    const s = String(v instanceof Date ? v.toLocaleString() : v ?? "").replace(/[\t\r\n]+/g, " ");
    return typeof v !== "number" && /^\s*[=+\-@]/.test(s) ? `'${s}` : s;
  };
  return [header, ...rows].filter(Boolean).map((r) => r.map(cell).join("\t")).join("\n");
}

/** Copies text; the old textarea route covers browsers without clipboard access. Resolves to true when copied. */
export async function copyText(text) {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); return true; }
  } catch (_) { /* fall back below */ }
  try {
    const ta = document.createElement("textarea");
    ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch (_) { return false; }
}
