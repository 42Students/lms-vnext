// "Paste roll numbers": results often arrive as a list in a message or an email, not as a spreadsheet.

/** Roll numbers out of pasted text: split on spaces, commas, semicolons and line breaks; upper-cased; no duplicates; order kept. A leading list number like "1." or "2)" is dropped. */
export function parseRolls(text) {
  const seen = new Set();
  const out = [];
  String(text || "").split(/[\s,;]+/).forEach((raw) => {
    const t = raw.trim().replace(/^\d{1,3}[).]$/, "").toUpperCase();
    if (!t || seen.has(t)) return;
    seen.add(t); out.push(t);
  });
  return out;
}

/** Match pasted rolls against applicants: { matched: [applicant], unmatched: [roll] }. Roll numbers compare case-insensitively. */
export function matchRolls(rolls, applicants) {
  const byRoll = new Map();
  (applicants || []).forEach((a) => { if (a.rollNumber) byRoll.set(String(a.rollNumber).trim().toUpperCase(), a); });
  const matched = []; const unmatched = [];
  rolls.forEach((r) => { const a = byRoll.get(r); if (a) matched.push(a); else unmatched.push(r); });
  return { matched, unmatched };
}

/**
 * Rows for the results import: the decisions made in the table (applicationId -> outcome) as { roll, outcome } rows.
 * Applicants with no roll number go by their application id (the server resolves it), so nobody is silently dropped.
 */
export function buildResultRows(decisions, applicants) {
  const byApp = new Map((applicants || []).map((a) => [String(a.applicationId), a]));
  const rows = [];
  Object.entries(decisions || {}).forEach(([appId, outcome]) => {
    if (!outcome) return;
    const a = byApp.get(String(appId));
    if (!a) return;
    rows.push(a.rollNumber ? { roll: a.rollNumber, outcome } : { applicationId: a.applicationId, outcome });
  });
  return rows;
}
