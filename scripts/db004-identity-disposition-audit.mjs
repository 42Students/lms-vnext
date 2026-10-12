/**
 * DB-004: source-only validation of the complete 312-field identity/tenant
 * target-disposition candidate ledger. NEVER interpret exit 0 as PostgreSQL
 * migration replay, role/tenant auth acceptance, or database phase success.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

export const SOURCE_ONLY_PASS = "SOURCE_ONLY_NOT_PG_VERIFIED";

export function inspectDb004(source, ledger) {
  const issues = [];
  const seen = new Set();
  const sourceRows = new Map();
  if (!Array.isArray(source?.rows) || !Array.isArray(ledger?.rows)) {
    return { passed: false, issues: ["Missing source or disposition rows"], totals: {} };
  }
  for (const item of source.rows) {
    const id = String(item.legacyTable) + "." + String(item.legacyColumn);
    if (sourceRows.has(id)) issues.push("Source duplicates " + id);
    sourceRows.set(id, item);
  }
  if (source.rows.length !== 312) issues.push("Expected exactly 312 legacy source rows");
  if (ledger.rows.length !== 312) issues.push("Expected exactly 312 disposition rows");
  for (const row of ledger.rows) {
    if (seen.has(row.legacyField)) issues.push("Duplicate decision " + row.legacyField);
    seen.add(row.legacyField);
    const old = sourceRows.get(row.legacyField);
    if (!old) { issues.push("Unexpected row " + row.legacyField); continue; }
    if (old.postV150Active !== row.sourceStatus || old.sourceType !== row.sourceType) {
      issues.push("Altered source evidence " + row.legacyField);
    }
    if (!row.ownerTask || !/^DB-0(04|05|07|12)$/.test(row.ownerTask)) {
      issues.push("Missing/ineligible owner " + row.legacyField);
    }
    if (typeof row.priorTargetPresent !== "boolean") issues.push("Missing original-target flag " + row.legacyField);
    if (!row.proposalRule || typeof row.proposalRule !== "string") issues.push("Unreviewed field " + row.legacyField);
    if (row.proposedTarget !== null && (!row.proposedTarget || typeof row.proposedTarget !== "string")) {
      issues.push("Invalid target proposal " + row.legacyField);
    }
    if (row.liveRuntimeVerified !== false || row.approvedRetirement !== false) {
      issues.push("False verification/retirement approval " + row.legacyField);
    }
    if (row.proposedTarget === null && row.priorTargetPresent === false &&
        !/REVIEW|REQUIRES|REQUIRED|OPEN|PENDING|RETIRED|RETIREMENT|UNRESOLVED|DECISION/.test(row.proposalRule)) {
      issues.push("No target and no explicit decision gate " + row.legacyField);
    }
  }
  for (const id of sourceRows.keys()) if (!seen.has(id)) issues.push("Undispositioned " + id);
  const byField = new Map(ledger.rows.map(r => [r.legacyField, r]));
  for (const id of ["user.password", "auth_handoff_token.access_token",
                    "auth_handoff_token.refresh_token", "login_user.password"]) {
    const row = byField.get(id);
    if (!row || row.proposedTarget !== null) issues.push("Credential mirrored or unaccounted " + id);
  }
  for (const id of ["faculty.token_version", "learner.token_version", "recruiter.token_version"]) {
    const row = byField.get(id);
    if (!row?.proposedTarget?.includes("provider revocation")) issues.push("Revocation job lost " + id);
  }
  const oldGapRows = ledger.rows.filter(r => !r.priorTargetPresent);
  const withProposals = oldGapRows.filter(r => r.proposedTarget !== null);
  const undecided = ledger.rows.filter(r => r.proposedTarget === null);
  const totals = {
    legacyFields: sourceRows.size,
    fieldDispositions: ledger.rows.length,
    priorNoTarget: oldGapRows.length,
    newUnverifiedProposals: withProposals.length,
    noPersistedTargetDecision: undecided.length,
    liveRuntimeVerified: ledger.rows.filter(r => r.liveRuntimeVerified).length,
    approvedRetirement: ledger.rows.filter(r => r.approvedRetirement).length
  };
  if (totals.priorNoTarget !== 137) issues.push("Original 137-gap denominator drift");
  if (totals.newUnverifiedProposals !== 123 || totals.noPersistedTargetDecision !== 14) {
    issues.push("Proposals/decision denominator drift; revise explicit baseline after human review");
  }
  return { passed: issues.length === 0, status: issues.length ? "SOURCE_AUDIT_FAILED" : SOURCE_ONLY_PASS,
    issues, totals, postgresExecuted: false, databasePhaseCertified: false };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const source = JSON.parse(readFileSync(resolve(root, "docs/planning/db01-chat02-312-field-source-triage.json"), "utf8"));
  const ledger = JSON.parse(readFileSync(resolve(root, "docs/planning/db004-312-source-target-disposition-proposals.json"), "utf8"));
  const result = inspectDb004(source, ledger);
  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
  if (!result.passed) process.exitCode = 1;
}
