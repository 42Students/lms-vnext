/**
 * UI/UX audit, buy-signal extra "Compliance Preflight for NAAC/NIRF export" (2026-10-01): the
 * accreditation export used to download whatever rows came back with no check at all - a missing
 * CGPA, package or joining status just silently became a blank cell in the file NAAC/NIRF actually
 * reads, discovered only if/when the accreditation body itself flags it. This validates on data
 * already fetched for the report (no new call) before the download happens.
 */
// What NAAC 5.2.1 asks for each placed student: programme, employer with contact details, pay package (and the batch it counts in).
const REQUIRED = [
  { key: "packageLpa", label: "Package (CTC)" },
  { key: "employer", label: "Employer" },
  { key: "employerContact", label: "Employer contact" },
  { key: "joiningStatus", label: "Joining status" },
  { key: "rollNumber", label: "Roll number" },
  { key: "programme", label: "Programme" },
  { key: "batch", label: "Batch" },
];

const isMissing = (v) => v === null || v === undefined || v === "";

export function buildAccreditationPreflight(rows) {
  const missingByField = [];
  let incompleteCount = 0;
  const counts = {};
  (rows || []).forEach((r) => {
    let rowIncomplete = false;
    REQUIRED.forEach(({ key, label }) => {
      if (isMissing(r[key])) {
        counts[label] = (counts[label] || 0) + 1;
        rowIncomplete = true;
      }
    });
    if (rowIncomplete) incompleteCount++;
  });
  REQUIRED.forEach(({ label }) => { if (counts[label]) missingByField.push({ label, count: counts[label] }); });
  return { total: (rows || []).length, incompleteCount, missingByField };
}
