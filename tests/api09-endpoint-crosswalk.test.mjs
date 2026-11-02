// API-09-P01: Operations, notifications and outbound endpoint crosswalk gate.
// Source-only — no database needed. Verifies all 45 legacy endpoints are classified.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const crosswalkPath = path.join(root, "docs/planning/api-crosswalk-api09.json");

let crosswalk;

test("API-09 crosswalk file exists and is valid JSON", () => {
  assert.ok(fs.existsSync(crosswalkPath), "api-crosswalk-api09.json must exist");
  crosswalk = JSON.parse(fs.readFileSync(crosswalkPath, "utf8"));
  assert.equal(crosswalk.milestoneId, "API-09");
  assert.ok(Array.isArray(crosswalk.endpoints), "endpoints must be an array");
});

test("API-09 all 45 legacy endpoints have a disposition", () => {
  crosswalk = crosswalk || JSON.parse(fs.readFileSync(crosswalkPath, "utf8"));
  const VALID = new Set(["MAPPED", "REDESIGNED", "RETIRED", "MISSING"]);
  const bad = crosswalk.endpoints.filter(e => !VALID.has(e.disposition));
  assert.equal(bad.length, 0,
    `Endpoints with invalid disposition: ${bad.map(e => e.legacyPath).join(", ")}`);
  assert.equal(crosswalk.endpoints.length, 45,
    `Expected 45 endpoints, got ${crosswalk.endpoints.length}`);
});

test("API-09 no endpoint has disposition OPEN", () => {
  crosswalk = crosswalk || JSON.parse(fs.readFileSync(crosswalkPath, "utf8"));
  const open = crosswalk.endpoints.filter(e => e.disposition === "OPEN");
  assert.equal(open.length, 0,
    `Endpoints still OPEN (unclassified): ${open.map(e => e.legacyPath).join(", ")}`);
});

test("API-09 every MAPPED endpoint vNextPath exists as a real file", () => {
  crosswalk = crosswalk || JSON.parse(fs.readFileSync(crosswalkPath, "utf8"));
  const mapped = crosswalk.endpoints.filter(e => e.disposition === "MAPPED");
  for (const ep of mapped) {
    assert.ok(ep.vNextPath, `MAPPED endpoint ${ep.legacyPath} missing vNextPath`);
    const full = path.join(root, ep.vNextPath);
    assert.ok(fs.existsSync(full),
      `MAPPED endpoint ${ep.legacyPath} vNextPath does not exist: ${ep.vNextPath}`);
  }
});

test("API-09 every REDESIGNED endpoint has vNextPath and notes", () => {
  crosswalk = crosswalk || JSON.parse(fs.readFileSync(crosswalkPath, "utf8"));
  const redesigned = crosswalk.endpoints.filter(e => e.disposition === "REDESIGNED");
  for (const ep of redesigned) {
    assert.ok(ep.vNextPath, `REDESIGNED ${ep.legacyPath} missing vNextPath`);
    assert.ok(ep.notes && ep.notes.length > 0, `REDESIGNED ${ep.legacyPath} missing notes`);
    const full = path.join(root, ep.vNextPath);
    assert.ok(fs.existsSync(full),
      `REDESIGNED ${ep.legacyPath} vNextPath does not exist: ${ep.vNextPath}`);
  }
});

test("API-09 missing endpoint count matches summary", () => {
  crosswalk = crosswalk || JSON.parse(fs.readFileSync(crosswalkPath, "utf8"));
  const actualMissing = crosswalk.endpoints.filter(e => e.disposition === "MISSING").length;
  assert.equal(actualMissing, crosswalk.summary.missing,
    `summary.missing=${crosswalk.summary.missing} but actual missing count=${actualMissing}`);
});

test("API-09 summary counts are self-consistent", () => {
  crosswalk = crosswalk || JSON.parse(fs.readFileSync(crosswalkPath, "utf8"));
  const { total, mapped, redesigned, retired, missing } = crosswalk.summary;
  assert.equal(mapped + redesigned + retired + missing, total,
    `Summary counts do not add up: ${mapped}+${redesigned}+${retired}+${missing} != ${total}`);
  assert.equal(total, 45, "Total must be 45");
});

test("API-09 frozen legacy SHA matches expected value", () => {
  crosswalk = crosswalk || JSON.parse(fs.readFileSync(crosswalkPath, "utf8"));
  assert.equal(crosswalk.frozenLegacySha, "21bad59d4dfaf2fa11fdeaf9353327ce105697d5",
    "frozenLegacySha must match canonical frozen legacy backend SHA");
});

test("API-09 MISSING endpoints have gap documentation", () => {
  crosswalk = crosswalk || JSON.parse(fs.readFileSync(crosswalkPath, "utf8"));
  const missing = crosswalk.endpoints.filter(e => e.disposition === "MISSING");
  for (const ep of missing) {
    assert.ok(ep.notes && ep.notes.length > 0,
      `MISSING endpoint ${ep.legacyPath} must have notes explaining the gap`);
    assert.equal(ep.vNextPath, null,
      `MISSING endpoint ${ep.legacyPath} must have null vNextPath`);
  }
  assert.ok(Array.isArray(crosswalk.missingGapNotes) && crosswalk.missingGapNotes.length > 0,
    "crosswalk must have missingGapNotes array documenting gap clusters");
});
