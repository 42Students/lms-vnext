import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "docs/planning/database-parity-pass5-probe-manifest.json"), "utf8"));
const filename = process.argv[2];
if (!filename) {
  console.error("Usage: node scripts/db-parity-pass5-evaluate.mjs /path/to/disposable-postgres-witness.jsonl");
  process.exit(2);
}
const expected = new Set(manifest.probes.map(p => p.id));
const seen = new Map();
const errors = [];
const lines = fs.readFileSync(filename, "utf8").split(/\r?\n/).filter(s => s.trim());
for (const line of lines) {
  try {
    const row = JSON.parse(line);
    if (!expected.has(row.check_id)) { errors.push("Unknown check_id: " + row.check_id); continue; }
    if (seen.has(row.check_id)) { errors.push("Duplicate check_id: " + row.check_id); continue; }
    if (!Number.isSafeInteger(Number(row.violations)) || Number(row.violations) < 0) {
      errors.push("Invalid count for " + row.check_id); continue;
    }
    seen.set(row.check_id, Number(row.violations));
  } catch { errors.push("Invalid JSON witness line"); }
}
const missing = [...expected].filter(id => !seen.has(id));
const failures = [...seen].filter(([, n]) => n > 0).map(([id, violations]) => ({ id, violations }));
const report = {
  witnessSource: filename,
  expectedProbeCount: expected.size,
  observedProbeCount: seen.size,
  missing,
  failures,
  errors,
  observedIntegrity: !failures.length && !missing.length && !errors.length
    ? "NO_CURRENT_ROW_MISMATCHES_OBSERVED"
    : "INVALID_OR_INCOMPLETE",
  databaseParityVerified: false,
  releaseReady: false,
  note: "These are read-only witnesses, not negative-write or concurrency tests. An empty database also passes every witness. No parity certification is possible from this report."
};
console.log(JSON.stringify(report, null, 2));
if (failures.length || missing.length || errors.length) process.exitCode = 2;
