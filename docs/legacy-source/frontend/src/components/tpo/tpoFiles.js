// File helpers shared by every TPO import and export (TPO V1 - Locked.docx §1 "Import with preview", "Table: export").
// The browser reads the spreadsheet; the backend only ever receives plain rows.

/** Header aliases -> the field names the backend expects. Matching ignores case, spaces and punctuation. */
export const HEADER_ALIASES = {
  applicantId: ["applicantid", "applicationid", "42lmsid", "42lmsapplicantid", "publicref", "applicant"],
  companyId: ["companyid", "companyreference", "companyref", "candidateid", "externalref", "referenceid"],
  email: ["email", "emailid", "mail", "contactmail", "workemail"],
  roll: ["roll", "rollno", "rollnumber", "regno", "registrationnumber", "regdno", "usn"],
  phone: ["phone", "mobile", "mobileno", "phonenumber", "contact", "contactnumber"],
  name: ["name", "fullname", "studentname", "candidatename", "personname"],
  outcome: ["outcome", "result", "status", "decision"],
  reasonCategory: ["reason", "reasoncategory", "category"],
  waitlistRank: ["rank", "waitlistrank", "waitlist"],
  score: ["score", "marks", "percentage"],
  comment: ["comment", "comments", "remarks", "note"],
  roleOption: ["role", "roleoption", "designation", "track", "profile"],
  ctcLpa: ["ctc", "ctclpa", "package", "packagelpa", "salary"],
  kind: ["kind", "offertype", "type"],
  company: ["company", "companyname", "organisation", "organization"],
  designation: ["designation", "title", "jobtitle", "position"],
  source: ["source", "leadsource", "foundvia", "channel", "howfound", "wherefound"],
  cgpa: ["cgpa", "gpa"],
  tenthPct: ["tenth", "10th", "tenthpct", "tenthpercentage", "sslc", "10thpercentage"],
  twelfthPct: ["twelfth", "12th", "twelfthpct", "twelfthpercentage", "12thpercentage"],
  diplomaPct: ["diploma", "diplomapct", "diplomapercentage"],
  ugPct: ["ug", "ugpct", "ugpercentage"],
  gapYears: ["gap", "gapyears", "educationgap"],
  passingYear: ["passingyear", "yearofpassing", "graduationyear"],
  gender: ["gender", "sex"],
  batch: ["batch", "passoutyear", "batchyear"],
};

const squash = (s) => String(s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

function fieldFor(header) {
  const key = squash(header);
  if (!key) return null;
  for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
    if (field.toLowerCase() === key || aliases.includes(key)) return field;
  }
  return null;
}

/** Turns an array of arrays (first row = headers) into row objects, dropping empty rows and unknown columns. */
export function rowsFromMatrix(matrix, allowed) {
  if (!Array.isArray(matrix) || matrix.length < 2) return { rows: [], ignored: [] };
  const headers = matrix[0].map(fieldFor);
  const ignored = matrix[0].filter((h, i) => h && !headers[i]).map(String);
  const rows = [];
  for (let r = 1; r < matrix.length; r++) {
    const obj = {};
    let any = false;
    matrix[r].forEach((cell, i) => {
      const f = headers[i];
      if (!f || (allowed && !allowed.includes(f))) return;
      if (cell === null || cell === undefined || String(cell).trim() === "") return;
      obj[f] = cell instanceof Date ? cell.toISOString().slice(0, 10) : typeof cell === "number" ? cell : String(cell).trim();
      any = true;
    });
    if (any) rows.push(obj);
  }
  return { rows, ignored };
}

/** Minimal CSV reader (quotes, commas, newlines) so a .csv from Excel works without an extra library. */
export function parseCsv(text) {
  const out = [];
  let row = [];
  let cell = "";
  let quoted = false;
  const src = String(text).replace(/^﻿/, "");
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some((x) => x !== "")) out.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some((x) => x !== "")) out.push(row);
  return out;
}

/** Reads an .xlsx or .csv File into row objects. `allowed` limits which fields are kept. */
export async function readRowsFromFile(file, allowed) {
  if (!file) throw new Error("Choose a file first");
  const name = String(file.name || "").toLowerCase();
  let matrix;
  if (name.endsWith(".csv")) {
    matrix = parseCsv(await file.text());
  } else if (name.endsWith(".xlsx")) {
    const mod = await import("read-excel-file/browser");
    matrix = await mod.readSheet(file);
  } else {
    throw new Error("Upload an .xlsx or .csv file");
  }
  const { rows, ignored } = rowsFromMatrix(matrix, allowed);
  if (rows.length === 0) throw new Error("No rows found. The first row must be the column headings.");
  if (rows.length > 5000) throw new Error("That file has more than 5000 rows. Split it and upload in parts.");
  return { rows, ignored };
}

const csvCell = (v) => {
  if (v === null || v === undefined) return "";
  let s = String(v);
  // Spreadsheet formula injection: a value that starts like a formula is written as text.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Downloads rows as a CSV that Excel opens directly. columns = [{ title, value: (row) => any }] */
export function downloadCsv(filename, columns, rows) {
  const lines = [columns.map((c) => csvCell(c.title)).join(",")];
  rows.forEach((r) => lines.push(columns.map((c) => csvCell(c.value(r))).join(",")));
  const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** A blank template the TPO can fill in: headings only, plus one example row. */
export function downloadTemplate(filename, headings, example) {
  downloadCsv(filename, headings.map((h, i) => ({ title: h, value: (r) => r[i] })), [example]);
}

export const fullName = (o) => `${o?.firstName || ""} ${o?.lastName || ""}`.trim();
