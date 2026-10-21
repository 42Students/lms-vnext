/** Browser-safe RFC4180 CSV reader (including quoted commas, CRLF and escaped quotes).
 * Returns data rows only; validation of header aliases belongs to the caller. */
export function parseTpoImportCsvRecords(source: string, maxRecords = 5001): string[][] {
  if (source.length > 1_500_000) throw new Error("Import exceeds the 1.5 MB limit.");
  const rows: string[][] = [];
  let row: string[] = [], field = "", quoted = false, closed = false;
  const text = source.replace(/^\uFEFF/, "");
  function pushField() { row.push(field); field = ""; closed = false; }
  function pushRow() {
    pushField();
    if (row.some(value => value.trim() !== "")) rows.push(row);
    if (rows.length > maxRecords) throw new Error("Maximum 5000 student records.");
    row = [];
  }
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') { quoted = false; closed = true; }
      else field += ch;
      continue;
    }
    if (ch === '"' && !field && !closed) { quoted = true; continue; }
    if (ch === '"' || (closed && ch !== "," && ch !== "\n" && ch !== "\r")) {
      throw new Error("Invalid quotation at CSV character " + (i + 1));
    }
    if (ch === ",") { pushField(); continue; }
    if (ch === "\r" || ch === "\n") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      pushRow(); continue;
    }
    field += ch;
  }
  if (quoted) throw new Error("Unclosed quoted field in CSV");
  if (row.length || field) pushRow();
  return rows;
}
