// Shared, strict CSV parser for learner/faculty onboarding. Do not split physical lines:
// RFC 4180 allows quoted fields to contain commas, CRLF and escaped double-quotes.
export function parseCsvRecords(input) {
  const text = String(input ?? "").replace(/^\uFEFF/, "");
  const records = [];
  let fields = [];
  let field = "";
  let inQuotes = false;
  let afterQuote = false;
  const endField = () => { fields.push(field.trim()); field = ""; afterQuote = false; };
  const endRecord = () => {
    endField();
    if (fields.some((value) => value !== "")) records.push(fields);
    fields = [];
  };
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 1; }
        else { inQuotes = false; afterQuote = true; }
      } else { field += ch; }
      continue;
    }
    if (afterQuote && ch !== ',' && ch !== '\r' && ch !== '\n' && ch !== ' ' && ch !== '\t') {
      throw new Error(`Unexpected character after quoted field in record ${records.length + 1}`);
    }
    if (ch === '"') {
      if (field.trim() !== "" || afterQuote) throw new Error(`Unexpected quote in record ${records.length + 1}`);
      field = "";
      inQuotes = true;
    } else if (ch === ',') { endField(); }
    else if (ch === '\r' || ch === '\n') {
      if (ch === '\r' && text[i + 1] === '\n') i += 1;
      endRecord();
    } else if (!afterQuote) { field += ch; }
  }
  if (inQuotes) throw new Error("Unclosed quoted field in CSV");
  if (field !== "" || fields.length > 0 || afterQuote) endRecord();
  return records;
}

/** Kept for existing importers; a single physical line is one record. */
export function splitCSVLine(line) {
  const rows = parseCsvRecords(line);
  return rows[0] || [];
}

/** Strict CSV import with clear, source-aligned row errors. */
export function parseAdminBulkCsv(text, requiredColumns, rowMapper, maxRows) {
  let records;
  try { records = parseCsvRecords(text); }
  catch (error) { return { rows: [], error: error.message || "Malformed CSV" }; }
  if (records.length < 2) return { rows: [], error: "CSV must have a header row and at least one data row." };
  const headers = records[0].map((h) => h.trim());
  const lowerHeaders = headers.map((h) => h.toLowerCase());
  if (lowerHeaders.length !== new Set(lowerHeaders).size) {
    return { rows: [], error: "CSV contains duplicate column headings." };
  }
  const missing = requiredColumns.filter((col) => !lowerHeaders.includes(col.toLowerCase()));
  if (missing.length) return { rows: [], error: `Required columns missing: ${missing.join(", ")}. Found: ${headers.join(", ")}` };
  if (records.length - 1 > maxRows) {
    return { rows: [], error: `Maximum ${maxRows} rows allowed. File has ${records.length - 1}.` };
  }
  const rows = [];
  for (let i = 1; i < records.length; i += 1) {
    const parts = records[i];
    if (parts.length !== headers.length) {
      return { rows: [], error: `CSV record ${i + 1} has ${parts.length} columns; expected ${headers.length}.` };
    }
    const get = (columnName) => {
      const idx = lowerHeaders.indexOf(columnName.toLowerCase());
      return idx < 0 ? "" : (parts[idx] ?? "").trim();
    };
    rows.push(rowMapper(get));
  }
  return { rows, error: null };
}
