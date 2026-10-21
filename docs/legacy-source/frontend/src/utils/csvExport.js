// Shared client-side CSV export, lifted from HiringDashboard.js's report export (the one place
// in the app that already did this well) so every admin list page exports the same way instead
// of reinventing escaping/download logic per page.

export function escapeCsvCell(v) {
  if (v === null || v === undefined) return "";
  let s = String(v);
  // Formula-injection hardening: a cell starting with =, +, -, or @ is interpreted as a formula
  // by Excel/Sheets when the CSV is opened. Prefix with a leading apostrophe so it round-trips
  // as literal text instead of executing in the opening admin's spreadsheet app.
  if (/^[=+\-@]/.test(s)) {
    s = `'${s}`;
  }
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * For callers whose rows are already a curated, ordered set of plain fields (no separate
 * display-label mapping needed) — turns each row's own keys into a {label, key} columns list.
 */
export function columnsFromRows(rows) {
  return rows && rows[0] ? Object.keys(rows[0]).map((key) => ({ key, label: key })) : [];
}

/**
 * @param {string} filename e.g. "attendance-2026-08.csv"
 * @param {{label: string, key: string}[]} columns
 * @param {object[]} rows
 */
export function exportRowsToCsv(filename, columns, rows) {
  const lines = [];
  lines.push(columns.map((c) => escapeCsvCell(c.label)).join(","));
  (rows || []).forEach((row) => {
    lines.push(columns.map((c) => escapeCsvCell(row[c.key])).join(","));
  });
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
