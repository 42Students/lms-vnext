// API-05-P01: Assignments, quizzes, grading and attendance endpoint crosswalk gate.
// Source-only — no database required.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const crosswalkPath = path.join(root, "docs/planning/api-crosswalk-api05.json");

let crosswalk;
test("API-05 crosswalk file exists and is valid JSON", () => {
  assert.ok(fs.existsSync(crosswalkPath), "api-crosswalk-api05.json must exist");
  crosswalk = JSON.parse(fs.readFileSync(crosswalkPath, "utf8"));
  assert.equal(crosswalk.milestoneId, "API-05");
  assert.ok(Array.isArray(crosswalk.endpoints));
});

test("API-05 all 37 legacy endpoints have a disposition", () => {
  crosswalk = crosswalk ?? JSON.parse(fs.readFileSync(crosswalkPath, "utf8"));
  const total = crosswalk.summary.total;
  assert.equal(total, 37, `Expected 37 total endpoints, got ${total}`);
  assert.equal(crosswalk.endpoints.length, 37, `Expected 37 endpoint entries, got ${crosswalk.endpoints.length}`);
  const open = crosswalk.endpoints.filter(e => !e.disposition || e.disposition === "OPEN");
  assert.equal(open.length, 0, `${open.length} endpoints still have disposition OPEN: ${open.map(e => e.legacyPath).join(", ")}`);
});

test("API-05 disposition counts match summary", () => {
  crosswalk = crosswalk ?? JSON.parse(fs.readFileSync(crosswalkPath, "utf8"));
  const counts = { mapped: 0, redesigned: 0, retired: 0, missing: 0 };
  for (const e of crosswalk.endpoints) {
    const d = e.disposition.toLowerCase();
    if (counts[d] !== undefined) counts[d]++;
  }
  assert.equal(counts.mapped, crosswalk.summary.mapped, `mapped count mismatch`);
  assert.equal(counts.redesigned, crosswalk.summary.redesigned, `redesigned count mismatch`);
  assert.equal(counts.retired, crosswalk.summary.retired, `retired count mismatch`);
  assert.equal(counts.missing, crosswalk.summary.missing, `missing count mismatch`);
});

test("API-05 every MAPPED endpoint vNextPath exists as a real file", () => {
  crosswalk = crosswalk ?? JSON.parse(fs.readFileSync(crosswalkPath, "utf8"));
  const mapped = crosswalk.endpoints.filter(e => e.disposition === "MAPPED");
  for (const e of mapped) {
    assert.ok(e.vNextPath, `MAPPED endpoint ${e.legacyPath} missing vNextPath`);
    const abs = path.join(root, e.vNextPath);
    assert.ok(fs.existsSync(abs), `MAPPED vNextPath does not exist on disk: ${e.vNextPath}`);
  }
});

test("API-05 every REDESIGNED endpoint has vNextPath and notes", () => {
  crosswalk = crosswalk ?? JSON.parse(fs.readFileSync(crosswalkPath, "utf8"));
  const redesigned = crosswalk.endpoints.filter(e => e.disposition === "REDESIGNED");
  for (const e of redesigned) {
    assert.ok(e.vNextPath, `REDESIGNED ${e.legacyPath} missing vNextPath`);
    assert.ok(e.notes && e.notes.length > 0, `REDESIGNED ${e.legacyPath} missing notes`);
    const abs = path.join(root, e.vNextPath);
    assert.ok(fs.existsSync(abs), `REDESIGNED vNextPath does not exist on disk: ${e.vNextPath}`);
  }
});

test("API-05 every MISSING endpoint has notes explaining the gap", () => {
  crosswalk = crosswalk ?? JSON.parse(fs.readFileSync(crosswalkPath, "utf8"));
  const missing = crosswalk.endpoints.filter(e => e.disposition === "MISSING");
  assert.ok(missing.length > 0, "Expected at least one MISSING endpoint");
  for (const e of missing) {
    assert.ok(e.notes && e.notes.length > 0, `MISSING ${e.legacyPath} must have notes explaining the gap`);
    assert.equal(e.vNextPath, null, `MISSING ${e.legacyPath} should have null vNextPath`);
  }
  assert.equal(missing.length, crosswalk.summary.missing, "MISSING count must match summary");
});

test("API-05 frozen legacy SHA matches expected value", () => {
  crosswalk = crosswalk ?? JSON.parse(fs.readFileSync(crosswalkPath, "utf8"));
  assert.equal(
    crosswalk.frozenLegacySha,
    "21bad59d4dfaf2fa11fdeaf9353327ce105697d5",
    "Frozen legacy SHA must match canonical value"
  );
});

test("API-05 tenant-scoped endpoints are identified", () => {
  crosswalk = crosswalk ?? JSON.parse(fs.readFileSync(crosswalkPath, "utf8"));
  const withTenantFlag = crosswalk.endpoints.filter(e => typeof e.tenantScoped === "boolean");
  assert.equal(withTenantFlag.length, crosswalk.endpoints.length, "Every endpoint must have tenantScoped flag");
  const tenantScoped = crosswalk.endpoints.filter(e => e.tenantScoped === true);
  assert.ok(tenantScoped.length > 0, "At least some endpoints must be tenant-scoped");
});

test("API-05 attendance bulk gap cluster is documented in missingGapNotes", () => {
  crosswalk = crosswalk ?? JSON.parse(fs.readFileSync(crosswalkPath, "utf8"));
  const notes = (crosswalk.missingGapNotes || []).join(" ");
  assert.ok(
    notes.includes("bulk") || notes.includes("Bulk"),
    "missingGapNotes must document the attendance bulk import/validate gap cluster"
  );
});
