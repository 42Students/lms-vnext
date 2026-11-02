// API-04-P01: Courses, content, resources and learner progress endpoint crosswalk gate.
// Source-only — no database required.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const crosswalkPath = path.join(root, "docs/planning/api-crosswalk-api04.json");
const FROZEN_SHA = "21bad59d4dfaf2fa11fdeaf9353327ce105697d5";
const EXPECTED_TOTAL = 67;

let crosswalk;
test("API-04 crosswalk file exists and is valid JSON", () => {
  assert.ok(fs.existsSync(crosswalkPath), "api-crosswalk-api04.json must exist");
  crosswalk = JSON.parse(fs.readFileSync(crosswalkPath, "utf8"));
  assert.equal(crosswalk.milestoneId, "API-04");
  assert.ok(Array.isArray(crosswalk.endpoints), "endpoints must be an array");
});

test("API-04 all 67 legacy endpoints have a disposition", () => {
  crosswalk = crosswalk ?? JSON.parse(fs.readFileSync(crosswalkPath, "utf8"));
  assert.equal(crosswalk.endpoints.length, EXPECTED_TOTAL,
    `Expected ${EXPECTED_TOTAL} endpoints, got ${crosswalk.endpoints.length}`);
  const noDisposition = crosswalk.endpoints.filter(e => !e.disposition);
  assert.equal(noDisposition.length, 0,
    `Endpoints missing disposition: ${noDisposition.map(e=>e.legacyPath).join(", ")}`);
});

test("API-04 no endpoint has disposition OPEN (all classified)", () => {
  crosswalk = crosswalk ?? JSON.parse(fs.readFileSync(crosswalkPath, "utf8"));
  const open = crosswalk.endpoints.filter(e => e.disposition === "OPEN");
  assert.equal(open.length, 0,
    `Endpoints still OPEN: ${open.map(e=>e.legacyPath).join(", ")}`);
});

test("API-04 every MAPPED endpoint vNextPath exists as a real file", () => {
  crosswalk = crosswalk ?? JSON.parse(fs.readFileSync(crosswalkPath, "utf8"));
  const mapped = crosswalk.endpoints.filter(e => e.disposition === "MAPPED");
  assert.ok(mapped.length > 0, "Expected at least one MAPPED endpoint");
  for (const ep of mapped) {
    assert.ok(ep.vNextPath, `MAPPED endpoint ${ep.legacyPath} missing vNextPath`);
    const absPath = path.join(root, ep.vNextPath);
    assert.ok(fs.existsSync(absPath),
      `MAPPED endpoint ${ep.legacyPath} vNextPath does not exist: ${ep.vNextPath}`);
  }
});

test("API-04 every REDESIGNED endpoint has notes explaining the redesign", () => {
  crosswalk = crosswalk ?? JSON.parse(fs.readFileSync(crosswalkPath, "utf8"));
  const redesigned = crosswalk.endpoints.filter(e => e.disposition === "REDESIGNED");
  assert.ok(redesigned.length > 0, "Expected REDESIGNED endpoints");
  for (const ep of redesigned) {
    assert.ok(ep.notes && ep.notes.length > 0,
      `REDESIGNED endpoint ${ep.legacyPath} missing notes`);
    assert.ok(ep.vNextPath, `REDESIGNED endpoint ${ep.legacyPath} missing vNextPath`);
  }
});

test("API-04 missing endpoint count matches summary", () => {
  crosswalk = crosswalk ?? JSON.parse(fs.readFileSync(crosswalkPath, "utf8"));
  const actualMissing = crosswalk.endpoints.filter(e => e.disposition === "MISSING").length;
  assert.equal(actualMissing, crosswalk.summary.missing,
    `Missing count mismatch: summary says ${crosswalk.summary.missing}, actual ${actualMissing}`);
  assert.ok(actualMissing > 0, "Some endpoints should be MISSING — do not hide gaps");
});

test("API-04 summary totals are consistent", () => {
  crosswalk = crosswalk ?? JSON.parse(fs.readFileSync(crosswalkPath, "utf8"));
  const { mapped, redesigned, retired, missing, total } = crosswalk.summary;
  assert.equal(mapped + redesigned + retired + missing, total,
    "Summary counts must add up to total");
  assert.equal(total, EXPECTED_TOTAL, `Total must be ${EXPECTED_TOTAL}`);
});

test("API-04 frozen legacy SHA matches expected value", () => {
  crosswalk = crosswalk ?? JSON.parse(fs.readFileSync(crosswalkPath, "utf8"));
  assert.equal(crosswalk.frozenLegacySha, FROZEN_SHA,
    "frozenLegacySha must match canonical frozen legacy backend SHA");
});

test("API-04 tenant-scoped endpoints are identified", () => {
  crosswalk = crosswalk ?? JSON.parse(fs.readFileSync(crosswalkPath, "utf8"));
  const tenantScoped = crosswalk.endpoints.filter(e => e.tenantScoped === true);
  assert.ok(tenantScoped.length > 0, "Courses are tenant-scoped — at least one must be marked tenantScoped:true");
});

test("API-04 bulk import gaps are explicitly documented in missingGapNotes", () => {
  crosswalk = crosswalk ?? JSON.parse(fs.readFileSync(crosswalkPath, "utf8"));
  assert.ok(Array.isArray(crosswalk.missingGapNotes) && crosswalk.missingGapNotes.length > 0,
    "missingGapNotes must document known gap clusters");
  const bulkNote = crosswalk.missingGapNotes.some(n => n.toLowerCase().includes("bulk"));
  assert.ok(bulkNote, "Bulk import gap must be documented in missingGapNotes");
});
